import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {installPlugin}=require('../src/payload/install-plugin.cjs');
const root=path.resolve('build/plugin');
for(const mode of ['--office','--windows']){
 const transport=new StdioClientTransport({command:process.execPath,args:[path.join(root,'server.cjs'),mode],stderr:'pipe'});
 const client=new Client({name:'plugin-test',version:'1.0.0'},{capabilities:{}});await client.connect(transport);
 try{
  const {tools}=await client.listTools();
  if(mode==='--office'){assert.equal(tools.length,3);const viewer=tools.find(t=>t.name==='office_file_viewer');assert.deepEqual(viewer._meta['com.google.antigravity/ui'].entrypoints[0].extensions,['.docx','.xlsx','.pptx']);const file={name:'test.docx',resourceUri:'antigravity-file://fixture/test.docx'};const result=await client.callTool({name:viewer.name,arguments:{file}});assert.deepEqual(result.structuredContent.file,file);const resource=await client.readResource({uri:viewer._meta.ui.resourceUri});assert.match(resource.contents[0].text,/Office Preview/);assert.ok(Buffer.byteLength(resource.contents[0].text)<10*1024*1024);}
  else {assert.equal(tools.length,7);const rejected=await client.callTool({name:'windows_click',arguments:{window:'0',x:0,y:0}});assert.ok(rejected.isError);assert.match(rejected.content[0].text,/windows_state/);const invalid=await client.callTool({name:'windows_state',arguments:{window:'0',screenshot:false}});assert.ok(invalid.isError);}
 }finally{await client.close()}
}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'agvi-plugin-'));const config=path.join(temp,'config');fs.mkdirSync(config);fs.writeFileSync(path.join(config,'import_manifest.json'),JSON.stringify({extra:'keep',imports:[{name:'unrelated',source:'test'}]}));const bundle=path.join(temp,'bundle');fs.mkdirSync(bundle);fs.cpSync(root,path.join(bundle,'plugin'),{recursive:true});installPlugin(bundle,config);installPlugin(bundle,config);const manifest=JSON.parse(fs.readFileSync(path.join(config,'import_manifest.json')));assert.equal(manifest.extra,'keep');assert.equal(manifest.imports.length,2);assert.equal(manifest.imports[0].name,'unrelated');assert.ok(fs.existsSync(path.join(config,'plugins/antigravity-vietnamese-tools/WindowsBridge.exe')));
console.log('PASS MCP handshake, viewer metadata/resources, separate Windows tools, stale-state rejection, invalid target handling, plugin install/update preserves other plugins.');
