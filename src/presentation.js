// A lighter entry for a demonstration; all map actions use the existing controls.
export function configurePresentation({ territory, parameters, root = document }) {
  if (territory.id !== 'jura' || parameters.get('presentation') !== '1') return;

  root.body.classList.add('presentation-mode');
  root.title = 'Jura 3D — démonstration';
  root.querySelector('#settings').open = false;
  const fps = root.querySelector('#fps');
  fps.checked = false;
  fps.dispatchEvent(new Event('change'));

  const home = root.querySelector('#site-home');
  if (home) {
    home.href = new URL('presentation/', home.href).href;
    home.textContent = '← Présentation du projet';
  }
  const badge = root.createElement('p');
  badge.className = 'presentation-badge';
  badge.textContent = 'Prototype indépendant · démonstration';
  root.querySelector('.controls-heading').append(badge);

  const guide = root.createElement('section');
  guide.className = 'presentation-guide';
  guide.setAttribute('aria-label', 'Parcours découverte');
  guide.innerHTML = `<p>Parcours découverte</p>
    <div class="presentation-actions" role="group" aria-label="Découvrir en trois étapes">
      <button type="button" data-presentation="territory">1 · Explorer</button>
      <button type="button" data-presentation="heritage">2 · Patrimoine</button>
      <button type="button" data-presentation="transport">3 · Bus</button>
    </div>
    <p class="help" id="presentation-hint" role="status">Choisissez une localité, puis un lieu ou un arrêt. Les documents et horaires officiels s’ouvrent par leurs liens.</p>`;
  root.querySelector('.destinations').before(guide);

  const hint = guide.querySelector('#presentation-hint');
  guide.addEventListener('click', event => {
    const action = event.target.closest('[data-presentation]')?.dataset.presentation;
    if (!action) return;
    root.querySelector('#clear-selection').click();
    for (const id of ['settings', 'visual-settings', 'heritage-settings', 'transport-settings']) {
      const section = root.querySelector(`#${id}`);
      if (section) section.open = false;
    }
    if (action === 'territory') {
      hint.textContent = 'Explorez Delémont, Porrentruy, Saignelégier ou Saint-Ursanne avec les boutons de localité.';
      const destinations = root.querySelector('.destinations');
      destinations.scrollIntoView({ block: 'nearest' });
      destinations.querySelector('button').focus({ preventScroll: true });
      return;
    }
    const section = root.querySelector(`#${action}-settings`);
    section.open = true;
    const toggle = root.querySelector(`#${action}`);
    if (!toggle.checked) {
      toggle.checked = true;
      toggle.dispatchEvent(new Event('change'));
    }
    hint.textContent = action === 'heritage'
      ? 'Choisissez un lieu, ouvrez sa fiche, puis suivez le lien vers le document officiel.'
      : 'Choisissez un arrêt ou un tracé pour consulter ses informations et les liens horaires. Aucun véhicule ni retard en direct.';
    section.scrollIntoView({ block: 'start' });
    section.querySelector('summary').focus({ preventScroll: true });
  });
}
