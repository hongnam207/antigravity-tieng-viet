'use strict';
const fs=require('fs'),path=require('path');
function installPlugin(bundle,configRoot){
 const source=path.join(bundle,'plugin');
 const manifest=JSON.parse(fs.readFileSync(path.join(source,'plugin.json'),'utf8').replace(/^\uFEFF/,''));
 if(manifest.name!=='antigravity-vietnamese-tools')throw Error('Invalid bundled plugin identity');
 for(const required of ['server.cjs','office.html','WindowsBridge.exe','mcp_config.json'])if(!fs.existsSync(path.join(source,required)))throw Error('Missing plugin file '+required);
 const target=path.join(configRoot,'plugins',manifest.name),index=path.join(configRoot,'import_manifest.json');
 let data={imports:[]};if(fs.existsSync(index))data=JSON.parse(fs.readFileSync(index,'utf8').replace(/^\uFEFF/,''));
 if(!Array.isArray(data.imports))throw Error('Invalid existing plugin manifest; unchanged');
 fs.mkdirSync(target,{recursive:true});fs.cpSync(source,target,{recursive:true,force:true});
 data.imports=data.imports.filter(x=>x.name!==manifest.name);
 data.imports.push({name:manifest.name,source:'antigravity',importedAt:new Date().toISOString(),components:['mcpServers']});
 if(fs.existsSync(index))fs.copyFileSync(index,index+'.agvi-backup-'+Date.now());
 const temp=index+'.agvi-tmp';fs.writeFileSync(temp,JSON.stringify(data,null,2));fs.renameSync(temp,index);
 return target;
}
if(require.main===module){try{const bundle=__dirname;if(process.argv.includes('--verify')){for(const f of ['plugin.json','server.cjs','office.html','WindowsBridge.exe','mcp_config.json'])if(!fs.existsSync(path.join(bundle,'plugin',f)))throw Error('Missing plugin '+f);console.log('Windows & Office payload verified');}else{const config=path.join(require('os').homedir(),'.gemini','config');console.log('Đã cài plugin Windows & Office: '+installPlugin(bundle,config));}}catch(e){console.error(e.message);process.exitCode=1}}
module.exports={installPlugin};
