"""P2: pinned official GeoPackages -> deterministic GeoJSON, outside public/.

Run with Python 3.12+ and scripts/requirements-data.txt. No runtime JS dependency.
Unknown snapshots, geometries, counts or missing links fail instead of losing data.
"""
import argparse
from collections import Counter
from contextlib import closing
import hashlib
import io
import json
import math
from pathlib import Path
import sqlite3
import struct
import tempfile
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from zipfile import ZipFile

import numpy
import pyproj
from pyproj import Transformer
import shapely
from shapely import from_wkb, get_coordinates, orient_polygons
from shapely.geometry import mapping, shape
from shapely.ops import transform

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "data/sources-jura.json"
CACHE = ROOT / ".vite/p2/source"
OUTPUT = ROOT / "data/jura"
TO_WEB = Transformer.from_crs(2056, 4326, always_xy=True, allow_ballpark=False)
TO_SOURCE = Transformer.from_crs(4326, 2056, always_xy=True, allow_ballpark=False)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def encode(value):
    return (json.dumps(value, ensure_ascii=False, separators=(",", ":"),
                       allow_nan=False) + "\n").encode("utf-8")


def member(archive, basename):
    matches = [p for p in archive.namelist() if Path(p).name == basename]
    require(len(matches) == 1, f"Expected one archive member {basename}: {matches}")
    return archive.read(matches[0])


def gpkg_geometry(blob):
    require(blob is not None and len(blob) >= 13 and blob[:3] == b"GP\x00",
            "Missing/unsupported GeoPackage geometry")
    flags = blob[3]
    require(not flags & 0x30, "Empty or extended GeoPackage geometry")
    sizes = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}
    envelope = (flags >> 1) & 7
    require(envelope in sizes, "Invalid GeoPackage envelope")
    srs, = struct.unpack("<i" if flags & 1 else ">i", blob[4:8])
    require(srs == 2056, f"Unexpected geometry SRS {srs}")
    # Curves are not linearized silently: Shapely rejects unsupported WKB.
    return from_wkb(blob[8 + sizes[envelope]:])


def coordinates(value):
    if isinstance(value, (tuple, list)):
        return [coordinates(v) for v in value]
    require(math.isfinite(value), "Non-finite coordinate")
    return value


def quoted(table):
    return '"' + table.replace('"', '""') + '"'


def convert_layer(db, layer):
    table = layer["table"]
    srs = db.execute("SELECT srs_id FROM gpkg_contents WHERE table_name=?", (table,)).fetchone()
    require(srs is not None and srs[0] == 2056, f"Unexpected table SRS: {table}")
    features, source_dates, missing, unplaced = [], Counter(), Counter(), []
    vertices, max_roundtrip = 0, 0
    for row in db.execute(f"SELECT * FROM {quoted(table)} ORDER BY id"):
        props = dict(row)
        original = gpkg_geometry(props.pop("geom"))
        require(original.geom_type == layer["geometry"] and not original.is_empty
                and original.is_valid and not original.has_z and not original.has_m,
                f"Unsupported/invalid geometry in {table} id={props['id']}")
        coords = get_coordinates(original)
        require(numpy.isfinite(coords).all(), "Non-finite source coordinates")
        vertices += len(coords)
        for field in layer["idFields"] + [layer["nameField"]] + layer["linkFields"]:
            require(field in props, f"Missing source field {field}")
        for field in layer["linkFields"]:
            value = props[field]
            require(isinstance(value, str) and urlsplit(value).scheme in ("http", "https")
                    and urlsplit(value).hostname, f"Missing/invalid URL: {table} {field}")
        for field, value in props.items():
            if value is None or (isinstance(value, str) and not value.strip()):
                missing[field] += 1
        source_dates[props.get("date_mise_a_jour")] += 1
        feature = {"type": "Feature", "id": f"{table}:{props['id']}",
                   "properties": props, "geometry": None}
        web = orient_polygons(transform(TO_WEB.transform, original))
        geom = {"type": web.geom_type, "coordinates": coordinates(mapping(web)["coordinates"])}
        restored = shape(geom)
        require(restored.is_valid, f"Transformation invalidated {table} id={props['id']}")
        minx, miny, maxx, maxy = restored.bounds
        if not (6.5 <= minx <= maxx <= 8 and 46.5 <= miny <= maxy <= 48):
            require(props['id'] in layer.get('unplacedIds', []),
                    f"New outlier: {table} id={props['id']}")
            # Retain the complete record, but never publish a guessed position.
            unplaced.append({"featureId": feature['id'], "reason": "source_coordinates_outside_regional_extent",
                             "sourceCrs": "EPSG:2056", "sourceGeometry": mapping(original),
                             "unusableWgs84": geom})
            features.append(feature)
            continue
        back = transform(TO_SOURCE.transform, restored)
        error = original.hausdorff_distance(back)
        max_roundtrip = max(max_roundtrip, error)
        require(error < 0.03, f"Roundtrip displacement {error} m: {table}")
        require(len(get_coordinates(restored)) == len(coords), "Vertex loss")
        # Preserve source properties verbatim, including nulls, accents, source XY,
        # category codes and URLs. IDs are namespaced, not an EGID or a guessed join.
        feature['geometry'] = geom
        features.append(feature)
    require(len(features) == layer["count"], f"Snapshot count mismatch: {table}")
    require(len({f["id"] for f in features}) == len(features), "Duplicate feature ID")
    require({int(f['featureId'].rsplit(':', 1)[1]) for f in unplaced}
            == set(layer.get('unplacedIds', [])), "Unplaced records changed")
    bounds = [shape(f["geometry"]).bounds for f in features if f['geometry'] is not None]
    bbox = [min(b[0] for b in bounds), min(b[1] for b in bounds),
            max(b[2] for b in bounds), max(b[3] for b in bounds)]
    collection = {"type": "FeatureCollection", "bbox": bbox, "features": features}
    stats = {"table": table, "count": len(features), "recordsLost": 0,
             "locatedCount": len(features) - len(unplaced), "unplaced": unplaced,
             "geometry": layer["geometry"], "vertices": vertices, "bbox": bbox,
             "maxRoundtripMetres": round(max_roundtrip, 6),
             "missingProperties": dict(sorted(missing.items())),
             "entityUpdateDates": dict(sorted(source_dates.items()))}
    return encode(collection), stats


def prepare(download=False):
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    CACHE.mkdir(parents=True, exist_ok=True)
    files, sources = {}, []
    for source in config["sources"]:
        path = CACHE / f"{source['id']}.zip"
        if download:
            request = Request(source["archiveUrl"], headers={"User-Agent": "Jura3D-P2/1.0"})
            with urlopen(request, timeout=60) as response:
                data = response.read(25_000_001)
            require(len(data) <= 25_000_000 and sha(data) == source["archiveSha256"],
                    f"New/invalid snapshot for {source['id']}; review config before replacing")
            path.write_bytes(data)
        require(path.exists(), f"Missing {path}; use --download")
        data = path.read_bytes()
        require(sha(data) == source["archiveSha256"], f"Archive hash mismatch: {path}")
        with ZipFile(io.BytesIO(data)) as archive:
            conditions = member(archive, "Conditions_utilisation_geodonnees.pdf")
            require(sha(conditions) == config["conditionsSha256"], "Conditions changed")
            files["Conditions_utilisation_geodonnees.pdf"] = conditions
            export = member(archive, "DateExport.txt").decode("utf-8-sig").strip()
            require(export.endswith("13.09.2026"), f"Export date changed: {export}")
            gpkg = member(archive, "donnees.gpkg")
            docs = {Path(p).name: sha(archive.read(p)) for p in archive.namelist()
                    if Path(p).name.startswith(("Conditions_", "Fiche_", "Modele_", "LisezMoi"))}
        with tempfile.TemporaryDirectory(dir=CACHE) as temp:
            database = Path(temp) / "donnees.gpkg"
            database.write_bytes(gpkg)
            with closing(sqlite3.connect(database.as_uri() + "?mode=ro", uri=True)) as db:
                db.row_factory = sqlite3.Row
                require(db.execute("PRAGMA quick_check").fetchone()[0] == "ok", "Broken database")
                tables = {r[0] for r in db.execute("SELECT table_name FROM gpkg_contents WHERE data_type='features'")}
                require(tables == {l["table"] for l in source["layers"]}, "Layer schema changed")
                layers = []
                for layer in source["layers"]:
                    payload, stats = convert_layer(db, layer)
                    files[layer["file"]] = payload
                    stats.update(file=layer["file"], bytes=len(payload), sha256=sha(payload))
                    layers.append(stats)
        sources.append({**{k: v for k, v in source.items() if k != "layers"},
                        "gpkgSha256": sha(gpkg), "archiveBytes": len(data),
                        "exportNote": export, "documentsSha256": docs, "layers": layers})
    manifest = {"schemaVersion": 1, "retrievedOn": config["retrievedOn"],
                "attribution": config["attribution"],
                "conditions": {"file": "Conditions_utilisation_geodonnees.pdf",
                               "sha256": config["conditionsSha256"], "issuedOn": "2019-07-01"},
                "conversion": {"sourceCrs": "EPSG:2056", "target": "RFC7946 WGS84 longitude,latitude",
                               "coordinatePrecision": "full double; no rounding", "simplification": "none",
                               "transform": TO_WEB.description, "accuracyMetres": TO_WEB.accuracy,
                               "pythonDependencies": {"pyproj": pyproj.__version__, "PROJ": pyproj.proj_version_str,
                                                      "shapely": shapely.__version__, "numpy": numpy.__version__}},
                "sources": sources}
    files["manifest.json"] = encode(manifest)
    return files, manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--download", action="store_true", help="Fetch and verify the pinned official archives")
    parser.add_argument("--check", action="store_true", help="Reconvert cached archives and compare, without replacing outputs")
    args = parser.parse_args()
    files, manifest = prepare(args.download)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, payload in files.items():
        destination = OUTPUT / name
        if args.check:
            require(destination.exists() and destination.read_bytes() == payload,
                    f"Not reproducible or changed output: {name}")
        else:
            temp = destination.with_suffix(destination.suffix + ".tmp")
            temp.write_bytes(payload)
            temp.replace(destination)
    for source in manifest["sources"]:
        for layer in source["layers"]:
            print(f"{layer['file']}: {layer['count']} features, {layer['vertices']} vertices, "
                  f"{layer['bytes']} bytes, roundtrip <= {layer['maxRoundtripMetres']} m")
    print("Reproducibility OK" if args.check else "Prepared; no layer added to the application")


if __name__ == "__main__":
    main()
