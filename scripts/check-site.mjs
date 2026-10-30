import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const directory=path.resolve(process.argv[2]??'dist-site'),base=process.argv[3]??'/';
const read=name=>readFile(path.join(directory,name));
const info=JSON.parse(await read('build-info.json')),html=(await read('index.html')).toString();
assert.equal(info.kind,'territory-site');assert.equal(info.status,'ready');assert.equal(info.base,base);
assert.deepEqual(info.territories.map(t=>[t.id,t.path,t.base]),[['jura','jura/',`${base}jura/`],['basel','bale/',`${base}bale/`]]);
assert.ok(!html.includes('{{BASE}}'));assert.ok(!/<script\b/i.test(html),'accueil sans moteur 3D ou requête de données');
assert.ok(html.includes(`href="${base}site.css"`));await stat(path.join(directory,'site.css'));
assert.ok(html.includes('© swisstopo'));
const presentation=(await read('presentation/index.html')).toString();
assert.ok(!presentation.includes('{{BASE}}'));
assert.ok(!/<script\b/i.test(presentation),'présentation statique sans moteur 3D');
assert.ok(presentation.includes(`href="${base}jura/?presentation=1"`));
assert.ok(presentation.includes(`src="${base}presentation/delemont.jpg"`));
await stat(path.join(directory,'presentation/presentation.css'));
await stat(path.join(directory,'presentation/delemont.jpg'));
for(const t of info.territories){
  assert.ok(html.includes(`href="${t.base}"`));
  const directoryChild=path.join(directory,t.path),child=JSON.parse(await read(`${t.path}build-info.json`));
  assert.equal(child.revision,info.revision);assert.equal(child.source,info.source);assert.equal(child.siteHome,base);
  assert.ok((await read(`${t.path}index.html`)).toString().includes(`id="site-home" class="site-home" href="${base}"`));
  execFileSync(process.execPath,[path.join(root,'scripts/check-build.mjs'),directoryChild,t.base,t.id],{stdio:'inherit',windowsHide:true});
}
console.log(JSON.stringify({site:true,base,revision:info.revision,territories:info.territories.length,staticHome:true}));
