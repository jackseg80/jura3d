import {
  BoundingSphere, Cartesian2, Cartesian3, Cartesian4, Cartographic, CustomShader,
  HeadingPitchRange, Math as CesiumMath, Matrix4, Rectangle, ShadowMode,
  Transforms, UniformType, sampleTerrainMostDetailed,
} from 'cesium';

export const VISUAL_BOUNDS = [7.3405, 47.3628, 7.3485, 47.3672];
export const VISUAL_VIEWS = {
  overview: { label: 'Vue d’ensemble', heading: 10, pitch: -38, range: 950 },
  close: { label: 'Vue rapprochée', heading: 10, pitch: -30, range: 480 },
  reverse: { label: 'Perspective opposée', heading: 190, pitch: -38, range: 700 },
};
const center = { longitude: 7.344, latitude: 47.3648 };

// A material treatment, never a reconstruction of actual paint or architecture.
// Coordinates are converted on the CPU from eye space into a small ENU frame:
// this avoids subtracting two imprecise Earth-sized floats in the fragment shader.
const fragmentShaderText = `
void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
    vec3 local = (u_eyeToLocal * vec4(fsInput.attributes.positionEC, 1.0)).xyz;
    vec2 edge = min(local.xy - u_bounds.xy, u_bounds.zw - local.xy);
    float weight = smoothstep(0.0, 28.0, min(edge.x, edge.y));
    if (weight <= 0.0) return;
    vec3 source = material.diffuse;
    // The existing yellow feature highlight has blue=0 after CPU color blending.
    // Keep it intact rather than recoloring the selected building as plaster.
    if (source.b < 0.08) return;
    float roof = smoothstep(1.25, 1.8, source.r / max(0.02, max(source.g, source.b)));
    // Broad, low-contrast variations, without invented storeys, windows or ornaments.
    float variation = sin(local.x * 0.073 + sin(local.y * 0.053)) * 0.025;
    vec3 plaster = vec3(0.78, 0.735, 0.635) + variation;
    vec3 tile = vec3(0.49, 0.245, 0.155) + variation * 0.65;
    vec3 color = mix(plaster, tile, roof);
    if (u_matter > 0.5) {
        float distanceFade = 1.0 - smoothstep(180.0, 850.0, length(fsInput.attributes.positionEC));
        float filterFade = 1.0 - smoothstep(0.25, 1.2, length(fwidth(local.xy)));
        float grain = sin(local.x * 2.1 + sin(local.y * 1.7)) * sin(local.z * 2.4);
        color += grain * 0.012 * distanceFade * filterFade;
    }
    material.diffuse = mix(source, color, weight);
    material.roughness = mix(material.roughness, 0.9, weight);
    material.specular = mix(material.specular, vec3(0.025), weight);
}
`;

export function createVisualTrial(viewer, { getPlace, getQuality, clearSelection, visit }) {
  const section = document.createElement('details');
  section.id = 'visual-settings';
  section.innerHTML = `<summary>Essai visuel du centre</summary>
    <p class="help">Delémont · habillage illustratif des bâtiments. Les volumes réels sont conservés ; les couleurs et matières ne décrivent pas leurs façades réelles.</p>
    <div class="visual-switch" role="group" aria-label="Comparer le rendu">
      <button type="button" data-visual-mode="original" aria-pressed="true">Original</button>
      <button type="button" data-visual-mode="trial" aria-pressed="false">Essai</button>
    </div>
    <label class="checkbox"><input id="visual-matter" type="checkbox" checked> Matière discrète</label>
    <label class="checkbox"><input id="visual-cast" type="checkbox" checked> Ombres sans stries de réception</label>
    <p id="visual-status" class="help" role="status" aria-live="polite">Rendu original.</p>
    <div class="visual-views" role="group" aria-label="Vues du centre historique">
      ${Object.entries(VISUAL_VIEWS).map(([id, view]) => `<button type="button" data-visual-view="${id}">${view.label}</button>`).join('')}
    </div>
    <button type="button" id="visual-center" class="wide">Revenir au centre historique</button>
    <p class="help">Découvrir les fiches du patrimoine :</p>
    <div class="visual-visit">
      <button type="button" data-visual-visit="321">Eglise Saint-Marcel</button>
      <button type="button" data-visual-visit="322">Hôtel de ville</button>
      <button type="button" data-visual-visit="323">Château</button>
    </div>
    <p class="help">La projection seule des ombres concerne toute la vue de Delémont lorsque son centre est cadré. Le réglage initial est rétabli en quittant ce cadrage. Aucun repère patrimonial n’est associé automatiquement à un bâtiment.</p>`;
  document.querySelector('#heritage-settings').before(section);
  const badge = document.createElement('p');
  badge.className = 'visual-badge'; badge.hidden = true;
  badge.textContent = 'Essai · habillage illustratif';
  document.querySelector('.controls-heading').append(badge);
  const events = new AbortController();
  const listen = (element, type, callback) => element.addEventListener(type, callback, { signal: events.signal });
  const matter = section.querySelector('#visual-matter');
  const cast = section.querySelector('#visual-cast');
  const status = section.querySelector('#visual-status');
  const worldToLocal = Matrix4.inverseTransformation(Transforms.eastNorthUpToFixedFrame(
    Cartesian3.fromDegrees(center.longitude, center.latitude)), new Matrix4());
  const southwest = Matrix4.multiplyByPoint(worldToLocal, Cartesian3.fromDegrees(VISUAL_BOUNDS[0], VISUAL_BOUNDS[1]), new Cartesian3());
  const northeast = Matrix4.multiplyByPoint(worldToLocal, Cartesian3.fromDegrees(VISUAL_BOUNDS[2], VISUAL_BOUNDS[3]), new Cartesian3());
  const rectangle = Rectangle.fromDegrees(...VISUAL_BOUNDS);
  const eyeToLocal = new Matrix4();
  const lastView = new Matrix4();
  let buildings, shader, enabled = false, localView = false, destroyed = false;
  let originalShadows = ShadowMode.ENABLED;
  const originalFog = viewer.scene.fog.visualDensityScalar;
  let flightGeneration = 0, centerHeight, flying = false, viewId = null, failure = null;
  let effectiveMatter = false, effectiveCast = false;

  function update(force = false) {
    if (destroyed) return;
    if (enabled && getPlace() !== 'delemont') { setEnabled(false); return; }
    const quality = getQuality();
    const rich = ['high', 'ultra'].includes(quality);
    effectiveMatter = enabled && matter.checked && quality !== 'low';
    matter.disabled = quality === 'low'; cast.disabled = !rich;
    if (enabled && (force || !Matrix4.equals(lastView, viewer.camera.viewMatrix))) {
      Matrix4.clone(viewer.camera.viewMatrix, lastView);
      Matrix4.multiply(worldToLocal, viewer.camera.inverseViewMatrix, eyeToLocal);
      shader?.setUniform('u_eyeToLocal', eyeToLocal);
      const canvas = viewer.scene.canvas;
      const hit = viewer.scene.globe.pick(viewer.camera.getPickRay(new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2)), viewer.scene);
      localView = !!hit && viewer.camera.positionCartographic.height < 6000
        && Rectangle.contains(rectangle, Cartographic.fromCartesian(hit));
    }
    shader?.setUniform('u_matter', effectiveMatter ? 1 : 0);
    effectiveCast = enabled && localView && rich && cast.checked && viewer.shadows;
    if (buildings && !buildings.isDestroyed()) buildings.shadows = effectiveCast ? ShadowMode.CAST_ONLY : originalShadows;
    section.hidden = getPlace() !== 'delemont';
    badge.hidden = !enabled;
    const message = failure ?? (!enabled ? 'Rendu original.' : `Essai · ${quality === 'low' ? 'palette seule (Faible)' : effectiveMatter ? 'palette et matière' : 'palette seule'}${effectiveCast ? ' · ombres projetées seules' : ''}${!localView ? ' · réglage des ombres suspendu hors cadrage central' : ''}.`);
    if (status.textContent !== message) status.textContent = message;
  }

  function detach() {
    if (buildings && !buildings.isDestroyed()) {
      buildings.customShader = undefined;
      buildings.shadows = originalShadows;
    }
    if (shader && !shader.isDestroyed()) shader.destroy();
    shader = undefined;
  }

  function setEnabled(value) {
    if (destroyed) return;
    enabled = !!value && getPlace() === 'delemont'; failure = null;
    if (enabled && !shader) {
      try {
        shader = new CustomShader({ uniforms: {
          u_eyeToLocal: { type: UniformType.MAT4, value: eyeToLocal },
          u_bounds: { type: UniformType.VEC4, value: new Cartesian4(southwest.x, southwest.y, northeast.x, northeast.y) },
          u_matter: { type: UniformType.FLOAT, value: 0 },
        }, fragmentShaderText });
      } catch (error) {
        enabled = false; failure = 'Essai indisponible sur ce navigateur. Rendu original conservé.';
        console.warn('Essai visuel', error);
      }
    }
    if (!enabled) { detach(); localView = false; }
    else if (buildings && !buildings.isDestroyed()) buildings.customShader = shader;
    section.querySelectorAll('[data-visual-mode]').forEach(button => button.setAttribute('aria-pressed', String((button.dataset.visualMode === 'trial') === enabled)));
    update(true); viewer.scene.requestRender();
  }

  async function focus(id) {
    if (destroyed || getPlace() !== 'delemont' || !VISUAL_VIEWS[id]) return;
    failure = null;
    const ticket = ++flightGeneration;
    viewer.camera.cancelFlight(); clearSelection(); flying = true; viewId = id;
    try {
      if (centerHeight === undefined) {
        const [position] = await sampleTerrainMostDetailed(viewer.terrainProvider, [Cartographic.fromDegrees(center.longitude, center.latitude)]);
        if (!Number.isFinite(position.height)) throw new Error('Altitude du centre indisponible');
        centerHeight = position.height;
      }
      if (destroyed || ticket !== flightGeneration) return;
      const view = VISUAL_VIEWS[id];
      viewer.camera.flyToBoundingSphere(new BoundingSphere(Cartesian3.fromDegrees(center.longitude, center.latitude, centerHeight), 0), {
        offset: new HeadingPitchRange(CesiumMath.toRadians(view.heading), CesiumMath.toRadians(view.pitch), view.range),
        duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.2,
        complete: () => { if (ticket === flightGeneration) { flying = false; update(true); } },
        cancel: () => { if (ticket === flightGeneration) flying = false; },
      });
    } catch (error) {
      if (destroyed || ticket !== flightGeneration) return;
      flying = false; failure = 'Cadrage indisponible. Réessayez lorsque le relief est chargé.'; update();
      console.warn('Cadrage du centre', error);
    }
  }

  section.querySelectorAll('[data-visual-mode]').forEach(button => listen(button, 'click', () => setEnabled(button.dataset.visualMode === 'trial')));
  section.querySelectorAll('[data-visual-view]').forEach(button => listen(button, 'click', () => void focus(button.dataset.visualView)));
  listen(section.querySelector('#visual-center'), 'click', () => void focus('overview'));
  section.querySelectorAll('[data-visual-visit]').forEach(button => listen(button, 'click', () => {
    const ticket = ++flightGeneration; viewer.camera.cancelFlight(); flying = false;
    void visit(`rcju_autre.occ_02_14_rbc:${button.dataset.visualVisit}`, () => !destroyed && ticket === flightGeneration);
  }));
  const cancelPendingFocus = () => { flightGeneration++; flying = false; viewer.camera.cancelFlight(); };
  for (const type of ['pointerdown', 'wheel', 'touchstart']) listen(viewer.scene.canvas, type, cancelPendingFocus);
  document.querySelectorAll('[data-camera]').forEach(button => listen(button, 'click', cancelPendingFocus));
  for (const input of [matter, cast]) listen(input, 'change', () => { update(true); viewer.scene.requestRender(); });
  const removeUpdate = viewer.scene.preRender.addEventListener(() => { if (enabled) update(); });
  const removeError = viewer.scene.renderError.addEventListener((_scene, error) => {
    if (!enabled) return;
    setEnabled(false);
    failure = 'Essai interrompu après une erreur de rendu. Original rétabli ; rechargez la page si nécessaire.';
    update();
    console.warn('Essai visuel interrompu', error);
  });
  update();
  return {
    setEnabled, focus, update: () => update(true),
    // Invoked only by the opt-in probe hook; identical path and geometry for A/B/A.
    orbit(angle) {
      if (!Number.isFinite(angle) || centerHeight === undefined || !VISUAL_VIEWS[viewId]) return;
      const view = VISUAL_VIEWS[viewId];
      viewer.camera.lookAt(Cartesian3.fromDegrees(center.longitude, center.latitude, centerHeight),
        new HeadingPitchRange(CesiumMath.toRadians(view.heading) + angle, CesiumMath.toRadians(view.pitch), view.range));
      viewer.camera.lookAtTransform(Matrix4.IDENTITY);
    },
    attach(tileset) {
      detach(); buildings = tileset;
      if (tileset) originalShadows = tileset.shadows;
      if (enabled) setEnabled(true);
    },
    navigate() { flightGeneration++; flying = false; setEnabled(false); update(); },
    snapshot: () => ({ enabled, attached: !!buildings?.customShader, bounds: VISUAL_BOUNDS,
      // Keep the historical diagnostic field for report readers; no fog is changed.
      quality: getQuality(), matter: effectiveMatter, atmosphere: false, castOnly: effectiveCast,
      localView, flying, view: viewId, centerHeight, failure,
      fog: viewer.scene.fog.visualDensityScalar, originalFog, shadowMode: buildings?.shadows }),
    destroy() {
      if (destroyed) return;
      flightGeneration++; setEnabled(false); removeUpdate(); removeError(); events.abort();
      section.remove(); badge.remove(); destroyed = true;
    },
  };
}
