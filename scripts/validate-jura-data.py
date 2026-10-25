"""Check reproducibility, every source property, and independent REFRAME controls.

--online refreshes the eight control responses without modifying the reference file.
Source PDFs/timetables are preserved as links; this does not validate all their URLs.
"""
import argparse
from contextlib import closing
from datetime import datetime, timezone
import io
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
from urllib.request import urlopen
from zipfile import ZipFile

from pyproj import Geod

ROOT = Path(__file__).resolve().parents[1]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--online', action='store_true')
    args = parser.parse_args()
    subprocess.run([sys.executable, str(ROOT / 'scripts/prepare-jura-data.py'), '--check'], check=True)
    config = json.loads((ROOT / 'data/sources-jura.json').read_text(encoding='utf-8'))
    controls = json.loads((ROOT / 'data/jura-control-points.json').read_text(encoding='utf-8'))
    manifest = json.loads((ROOT / 'data/jura/manifest.json').read_text(encoding='utf-8'))
    outputs, report = {}, {'checkedAt': datetime.now(timezone.utc).isoformat(),
                          'reproducibility': True, 'onlineControls': args.online,
                          'propertiesCompared': 0, 'layers': [], 'controls': []}
    for source in config['sources']:
        with ZipFile(io.BytesIO((ROOT / f".vite/p2/source/{source['id']}.zip").read_bytes())) as archive:
            members = [p for p in archive.namelist() if Path(p).name == 'donnees.gpkg']
            require(len(members) == 1, 'Missing source database')
            with tempfile.TemporaryDirectory(dir=ROOT / '.vite/p2') as temp:
                dbfile = Path(temp) / 'source.gpkg'
                dbfile.write_bytes(archive.read(members[0]))
                with closing(sqlite3.connect(dbfile.as_uri() + '?mode=ro', uri=True)) as db:
                    db.row_factory = sqlite3.Row
                    for layer in source['layers']:
                        collection = json.loads((ROOT / 'data/jura' / layer['file']).read_text(encoding='utf-8'))
                        require(collection['type'] == 'FeatureCollection' and 'crs' not in collection,
                                'Not RFC7946 collection')
                        actual = {f['id']: f for f in collection['features']}
                        require(len(actual) == layer['count'] == len(collection['features']), 'Count/ID mismatch')
                        outputs[layer['file']] = actual
                        for row in db.execute('SELECT * FROM "' + layer['table'] + '" ORDER BY id'):
                            props = dict(row)
                            props.pop('geom')
                            feature = actual[f"{layer['table']}:{props['id']}"]
                            require(feature['properties'] == props, f"Source properties modified: {feature['id']}")
                            require((feature['geometry'] is None) == (props['id'] in layer.get('unplacedIds', [])),
                                    'Unplaced record mismatch')
                            report['propertiesCompared'] += len(props)
                        report['layers'].append({'file': layer['file'], 'records': len(actual),
                                                 'located': sum(f['geometry'] is not None for f in actual.values()),
                                                 'names': sum(bool(str(f['properties'].get(layer['nameField']) or '').strip()) for f in actual.values())})
    geod = Geod(ellps='WGS84')
    require(len(controls['points']) == 8, 'Expected eight independent controls')
    for control in controls['points']:
        feature = outputs[control['file']][control['featureId']]
        require(control['name'] in feature['properties'].values(), 'Control identity changed')
        point = feature['geometry']['coordinates'][0]
        reference = control['referenceWgs84']
        if args.online:
            with urlopen(control['referenceUrl'], timeout=30) as response:
                result = json.load(response)
            reference = [float(result['easting']), float(result['northing'])]
        distance = geod.inv(point[0], point[1], reference[0], reference[1])[2]
        require(distance <= controls['maxDifferenceMetres'], f"Independent displacement: {control['name']} {distance} m")
        report['controls'].append({'featureId': control['featureId'], 'name': control['name'],
                                   'differenceMetres': round(distance, 6)})
    report['maxControlDifferenceMetres'] = max(p['differenceMetres'] for p in report['controls'])
    report['conversionAccuracyMetres'] = manifest['conversion']['accuracyMetres']
    (ROOT / '.vite/p2-validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for layer in report['layers']:
        print(f"{layer['file']}: {layer['records']} records, {layer['located']} located, {layer['names']} named")
    print(f"{report['propertiesCompared']} source properties unchanged; eight REFRAME controls, "
          f"maximum difference {report['maxControlDifferenceMetres']} m")


if __name__ == '__main__':
    main()
