// Les adaptateurs possèdent leurs requêtes, écouteurs et sources Cesium.
// Le registre ne lance aucun chargement et conserve l'ordre de picking déclaré.
export function createLayerCollection() {
  const layers = new Map();
  let destroyed = false;
  return {
    register(id, layer) {
      if (destroyed || layers.has(id)) throw new Error(`Couche déjà enregistrée ou registre détruit : ${id}`);
      for (const method of ['setEnabled', 'refresh', 'navigate', 'pick', 'clearSelection', 'destroy', 'snapshot']) {
        if (typeof layer[method] !== 'function') throw new Error(`Contrat de couche incomplet : ${id}.${method}`);
      }
      layers.set(id, layer); return layer;
    },
    clearSelection() { for (const layer of layers.values()) layer.clearSelection(); },
    navigate() { for (const layer of layers.values()) layer.navigate(); },
    pick(picked, position) { for (const layer of layers.values()) if (layer.pick(picked, position)) return true; return false; },
    setEnabled(id, enabled) { return layers.get(id)?.setEnabled(enabled); },
    refresh(id) { return layers.get(id)?.refresh(); },
    snapshot() { return { destroyed, layers: [...layers].map(([id, layer]) => ({ id, ...layer.snapshot() })) }; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const layer of layers.values()) layer.destroy();
      layers.clear();
    },
  };
}
