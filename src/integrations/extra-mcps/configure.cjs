'use strict';
// Optional network-backed launch recipes. Never replace existing servers.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const recipes={
 fetch:{command:'uvx',args:['mcp-server-fetch==2026.11.18']},
 excel:{command:'uvx',args:['excel-mcp-server==2.3.3','stdio']},
 markitdown:{command:'uvx',args:['markitdown-mcp==0.0.1a8']},
 playwright:{command:'npx',args:['-y','@playwright/mcp@0.0.86']},
 node_repl:{command:'npx',args:['-y','node-code-sandbox-mcp@1.3.0']},
};
function configure(configRoot,apply=false){
 const file=path.join(configRoot,'mcp_config.json');
 const config=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')):{};
 if(!config||typeof config!=='object'||Array.isArray(config)||(config.mcpServers!==undefined&&(!config.mcpServers||typeof config.mcpServers!=='object'||Array.isArray(config.mcpServers))))throw Error('Invalid MCP config; preserved without changes.');
 config.mcpServers||={};const added=[],preserved=[];
 for(const [name,entry] of Object.entries(recipes)){
  if(Object.hasOwn(config.mcpServers,name))preserved.push(name);
  else{config.mcpServers[name]=entry;added.push(name);}
 }
 let backup;
 if(apply&&added.length){
  fs.mkdirSync(configRoot,{recursive:true});
  if(fs.existsSync(file)){backup=file+'.extras-backup-'+crypto.randomUUID();fs.copyFileSync(file,backup);}
  const tmp=file+'.'+crypto.randomUUID()+'.tmp';fs.writeFileSync(tmp,JSON.stringify(config,null,2));fs.renameSync(tmp,file);
 }
 return {applied:apply,added,preserved,backup,requirements:['uvx for Python servers','npx for JavaScript servers','Internet on first launch','Docker daemon for node_repl','Supported Playwright browser'],note:'Configuration only; no packages installed or tool calls tested.'};
}
if(require.main===module){try{console.log(JSON.stringify(configure(path.join(os.homedir(),'.gemini/config'),process.argv.includes('--apply')),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={configure};
