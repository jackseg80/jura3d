import {readFile,writeFile,mkdir,rm,readdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.join(root,'dist-site'); // Dossier de sortie dédié, jamais fourni par une entrée libre.
const base=process.env.JURA3D_BASE_PATH??'/';
if(base!=='/'&&!/^\/(?:[a-zA-Z0-9_-]+\/)+$/.test(base))throw new Error('JURA3D_BASE_PATH invalide');
const territories=[{id:'jura',path:'jura/'},{id:'basel',path:'bale/'}].map(t=>({...t,base:`${base}${t.path}`}));
const info={kind:'territory-site',revision:process.env.GITHUB_SHA??null,source:process.env.GITHUB_SHA?'github-actions':'local',base,territories};
const existing=await readdir(output).catch(e=>{if(e.code==='ENOENT')return[];throw e;});
if(existing.length){
  const previous=JSON.parse(await readFile(path.join(output,'build-info.json'),'utf8'));
  if(previous.kind!=='territory-site')throw new Error('dist-site existe sans marqueur du site : conserver et vérifier ce dossier.');
}
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});
// Marquer aussi une compilation interrompue pour permettre une reprise du seul dossier dédié.
await writeFile(path.join(output,'build-info.json'),JSON.stringify({...info,status:'building'},null,2)+'\n');
for(const t of territories){
  execFileSync(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build','--outDir',path.join(output,t.path),'--emptyOutDir'],{
    cwd:root,stdio:'inherit',windowsHide:true,env:{...process.env,VITE_TERRITORY:t.id,JURA3D_BASE_PATH:t.base,JURA3D_SITE_HOME:base},
  });
}
const template=await readFile(path.join(root,'site/index.html'),'utf8');
await writeFile(path.join(output,'index.html'),template.replaceAll('{{BASE}}',base));
await copyFile(path.join(root,'site/site.css'),path.join(output,'site.css'));
await mkdir(path.join(output,'presentation'),{recursive:true});
const presentation=await readFile(path.join(root,'site/presentation/index.html'),'utf8');
await writeFile(path.join(output,'presentation/index.html'),presentation.replaceAll('{{BASE}}',base));
await copyFile(path.join(root,'site/presentation/presentation.css'),path.join(output,'presentation/presentation.css'));
await copyFile(path.join(root,'docs/images/presentation-delemont-original-2026-10-30.jpg'),path.join(output,'presentation/delemont.jpg'));
await writeFile(path.join(output,'build-info.json'),JSON.stringify({...info,status:'ready'},null,2)+'\n');
execFileSync(process.execPath,[path.join(root,'scripts/check-site.mjs'),output,base],{cwd:root,stdio:'inherit',windowsHide:true});
console.log(JSON.stringify({output,base,territories:territories.map(t=>t.base),ready:true}));
