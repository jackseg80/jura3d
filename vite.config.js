import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateTerritory } from './src/territory.js';

const cesiumSource = 'node_modules/cesium/Build/Cesium';
const cesiumBaseUrl = 'cesiumStatic';
const base = process.env.JURA3D_BASE_PATH ?? '/';
if (base !== '/' && !/^\/(?:[a-zA-Z0-9_-]+\/)+$/.test(base)) throw new Error('JURA3D_BASE_PATH invalide');
const siteHome = process.env.JURA3D_SITE_HOME ?? null;
if (siteHome && ((siteHome !== '/' && !/^\/(?:[a-zA-Z0-9_-]+\/)+$/.test(siteHome))
  || base === siteHome || !base.startsWith(siteHome))) throw new Error('JURA3D_SITE_HOME invalide');

const territoryId = process.env.VITE_TERRITORY ?? 'jura';
if (!/^[a-z0-9-]+$/.test(territoryId)) throw new Error('VITE_TERRITORY invalide');
const territoryFile = fileURLToPath(new URL(`./src/territories/${territoryId}.js`, import.meta.url));
const { default: configuration } = await import(pathToFileURL(territoryFile).href);
const territory = validateTerritory(configuration);
const dataFiles = new Map();
for (const layer of territory.layers) {
  if (['basel-parking','basel-transit'].includes(layer.kind)) continue; // Services distants, aucun instantané livré.
  layer.files.forEach((name, index) => dataFiles.set(`${layer.base}${name}`,
    index === layer.files.length - 1 ? layer.checksSource : `data/${layer.base}${name}`));
  dataFiles.set(layer.conditions, `data/${layer.conditions}`);
}

export default defineConfig({
  base,
  resolve: { alias: { '#territory': territoryFile } },
  define: {
    CESIUM_BASE_URL: JSON.stringify(`${base}${cesiumBaseUrl}`),
  },
  plugins: [
    {
      name: 'jura3d-build-info',
      transformIndexHtml(html) {
        return html.replace('<!-- site-navigation -->', siteHome
          ? `<a id="site-home" class="site-home" href="${siteHome}">← Choisir un territoire</a>` : '');
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'build-info.json', source: JSON.stringify({
          revision: process.env.GITHUB_SHA ?? null, source: process.env.GITHUB_SHA ? 'github-actions' : 'local',
          territory: territory.id, base, siteHome,
        }, null, 2) + '\n' });
      },
    },
    viteStaticCopy({
      targets: [...['ThirdParty', 'Workers', 'Assets', 'Widgets'].map((name) => ({
        src: `${cesiumSource}/${name}`,
        dest: cesiumBaseUrl,
        rename: { stripBase: 4 },
      })),
      ...['LICENSE.md', 'ThirdParty.json'].map(name => ({ src: `node_modules/cesium/${name}`,
        dest: cesiumBaseUrl, rename: { stripBase: true } })),
      ...[...dataFiles].map(([target, src]) => ({ src, dest: target.slice(0, target.lastIndexOf('/')),
        rename: { stripBase: true, name: target.slice(target.lastIndexOf('/') + 1) } }))],
    }),
  ],
});
