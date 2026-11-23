import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'build/plugin');fs.mkdirSync(out,{recursive:true});
for(const name of ['plugin.json','mcp_config.json','assets','README.md']){const src=path.join(root,'src/plugin',name);if(fs.existsSync(src))fs.cpSync(src,path.join(out,name),{recursive:true});}
await build({entryPoints:[path.join(root,'src/plugin/server.mjs')],outfile:path.join(out,'server.cjs'),bundle:true,platform:'node',format:'cjs',target:'node22',minify:true,legalComments:'eof'});
const ui=await build({entryPoints:[path.join(root,'src/plugin/ui/office.js')],bundle:true,platform:'browser',format:'iife',target:'es2022',write:false,minify:true,legalComments:'eof'});
const code=ui.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const html=fs.readFileSync(path.join(root,'src/plugin/ui/office.html'),'utf8').replace('/* OFFICE-BUNDLE */',()=>code);
if(Buffer.byteLength(html)>10*1024*1024)throw Error('HTML exceeds host limit');
fs.writeFileSync(path.join(out,'office.html'),html);
const framework=path.join(process.env.WINDIR,'Microsoft.NET/Framework64/v4.0.30319');
execFileSync(path.join(framework,'csc.exe'),['/nologo','/target:exe','/platform:x64','/optimize+','/codepage:65001','/reference:System.Drawing.dll','/reference:System.Web.Extensions.dll',...['UIAutomationClient.dll','UIAutomationTypes.dll','WindowsBase.dll'].map(n=>'/reference:'+path.join(framework,'WPF',n)),'/out:'+path.join(out,'WindowsBridge.exe'),path.join(root,'src/windows/WindowsBridge.cs')],{stdio:'inherit'});
const packages=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8')).packages;
let notices='Third-party package licenses distributed with the Office/Windows plugin.\nProject code: MIT (see repository LICENSE).\n';
for(const [dir,info]of Object.entries(packages)){if(!dir||info.dev)continue;notices+='\n===== '+dir+' '+info.version+' ('+info.license+') =====\n';const folder=path.join(root,dir);if(!fs.existsSync(folder))continue;for(const name of fs.readdirSync(folder).filter(n=>/^(license|licence|notice)(\.|$)/i.test(n))){if(fs.statSync(path.join(folder,name)).isFile())notices+=fs.readFileSync(path.join(folder,name),'utf8')+'\n';}}
fs.writeFileSync(path.join(out,'THIRD-PARTY-LICENSES.txt'),notices);
console.log('Plugin built. Office HTML bytes:',Buffer.byteLength(html));
