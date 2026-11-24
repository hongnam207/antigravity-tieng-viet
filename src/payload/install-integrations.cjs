'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process');
function mergeAutocad(bundle,configRoot){
 const file=path.join(configRoot,'mcp_config.json');
 const config=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')):{};
 if(config.mcpServers!==undefined&&(!config.mcpServers||typeof config.mcpServers!=='object'||Array.isArray(config.mcpServers)))throw Error('Cấu hình MCP hiện tại không hợp lệ; không ghi đè.');
 config.mcpServers||={};
 // Migrate only the known cache-install launcher. Keep custom servers, env/cwd,
 // backend selection and policy settings; never replace arbitrary user commands.
 const existing=config.mcpServers.autocad;
 const knownUvx=existing&&typeof existing==='object'&&['uvx','uvx.exe'].includes(path.basename(existing.command||'').toLowerCase())&&Array.isArray(existing.args)&&existing.args.length===1&&/^autocad-mcp-pro(?:==1\.8\.0)?$/.test(existing.args[0]);
 if(Object.hasOwn(config.mcpServers,'autocad')&&!knownUvx)return {preserved:true};
 config.mcpServers.autocad={...(existing||{}),command:path.join(bundle,'runtime','python.exe'),args:['-I',path.join(bundle,'integrations','autocad','launch.py')],env:{AUTOCAD_MCP_BACKEND:'auto',...(existing?.env||{})}};
 fs.mkdirSync(configRoot,{recursive:true});
 if(fs.existsSync(file))fs.copyFileSync(file,file+'.agvi-backup-'+Date.now());
 const temporary=file+'.agvi-tmp';fs.writeFileSync(temporary,JSON.stringify(config,null,2));fs.renameSync(temporary,file);
 return {preserved:false,migratedFromUvx:!!knownUvx};
}
function verify(bundle){
 for(const name of ['autocad/launch.py','autocad/site/server.py','computer-use/bundle/bundle-manifest.json','computer-use/quick-install.mjs'])if(!fs.existsSync(path.join(bundle,'integrations',name)))throw Error('Thiếu thành phần tích hợp '+name);
 cp.execFileSync(path.join(bundle,'runtime','python.exe'),['-I',path.join(bundle,'integrations','autocad','launch.py'),'--verify'],{stdio:'pipe',windowsHide:true,timeout:120000});
 const helper=path.join(bundle,'integrations','computer-use','quick-install.mjs');
 const crypto=require('crypto');if(crypto.createHash('sha256').update(fs.readFileSync(helper)).digest('hex')!=='4f2548620e136c7c84ea39b348a279ab611f302c9e53aa9d03d24553d1fc0889')throw Error('Computer Use installer hash mismatch');
 // Verify the complete upstream inventory without installing or starting input.
 const source="import fs from 'node:fs';import{verifyPayload}from "+JSON.stringify(require('url').pathToFileURL(helper).href)+";const p="+JSON.stringify(path.join(bundle,'integrations','computer-use','bundle'))+";console.log(verifyPayload(p,JSON.parse(fs.readFileSync(p+'/bundle-manifest.json','utf8'))));";
 cp.execFileSync(path.join(bundle,'node.exe'),['--input-type=module','-e',source],{stdio:'pipe',windowsHide:true,timeout:120000});
 return true;
}
function install(bundle){
 verify(bundle);
 const configRoot=path.join(os.homedir(),'.gemini','config');
 const args=[path.join(bundle,'integrations','computer-use','quick-install.mjs'),'--bundle',path.join(bundle,'integrations','computer-use','bundle')];
 const raw=cp.execFileSync(path.join(bundle,'node.exe'),args,{encoding:'utf8',windowsHide:true,timeout:180000,maxBuffer:4*1024*1024});
 const computerUse=JSON.parse(raw.trim());if(!computerUse.ok)throw Error('Computer Use chưa xác minh cài thành công.');
 const autocad=mergeAutocad(bundle,configRoot);
 const result={autocad,computerUse,at:new Date().toISOString()};
 fs.writeFileSync(path.join(bundle,'integrations-status.json'),JSON.stringify(result,null,2));return result;
}
if(require.main===module){try{if(process.argv.includes('--verify')){verify(__dirname);console.log('AutoCAD and Computer Use payloads verified');}else console.log(JSON.stringify(install(__dirname)));}catch(e){console.error(e.stderr?.toString()||e.message);process.exitCode=1;}}
module.exports={mergeAutocad,verify,install};
