import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import {createRequire}from'node:module';import {pathToFileURL}from'node:url';
import {Client}from'@modelcontextprotocol/sdk/client/index.js';import{StdioClientTransport}from'@modelcontextprotocol/sdk/client/stdio.js';
const require=createRequire(import.meta.url),{mergeAutocad,verify}=require('../src/payload/install-integrations.cjs');
const bundle=path.resolve(process.env.AGVI_TEST_BUNDLE||'build/payload');
const testRoot=fs.mkdtempSync(path.join(os.tmpdir(),'agvi-integrations-')),config=path.join(testRoot,'config');fs.mkdirSync(config);
const file=path.join(config,'mcp_config.json');fs.writeFileSync(file,JSON.stringify({extra:'preserve',mcpServers:{unrelated:{command:'unchanged'}}}));
assert.equal(mergeAutocad(bundle,config).preserved,false);let saved=JSON.parse(fs.readFileSync(file));assert.equal(saved.extra,'preserve');assert.equal(saved.mcpServers.unrelated.command,'unchanged');assert.equal(saved.mcpServers.autocad.env.AUTOCAD_MCP_BACKEND,'auto');
saved.mcpServers.autocad={command:'user-custom-cad',env:{READ_ONLY:'true'}};fs.writeFileSync(file,JSON.stringify(saved));assert.equal(mergeAutocad(bundle,config).preserved,true);assert.equal(JSON.parse(fs.readFileSync(file)).mcpServers.autocad.command,'user-custom-cad');
fs.writeFileSync(file,'{"mcpServers":[]}');assert.throws(()=>mergeAutocad(bundle,config),/không hợp lệ/);assert.equal(fs.readFileSync(file,'utf8'),'{"mcpServers":[]}');
verify(bundle);
const transport=new StdioClientTransport({command:path.join(bundle,'runtime/python.exe'),args:['-I',path.join(bundle,'integrations/autocad/launch.py')],env:{...process.env,AUTOCAD_MCP_BACKEND:'ezdxf',ACADMCP_STATE_DIR:path.join(testRoot,'cad-state')},stderr:'pipe'});
const client=new Client({name:'bundled-cad-test',version:'2.2.0'},{capabilities:{}});
try{await client.connect(transport);const{tools}=await client.listTools();assert.ok(tools.some(t=>t.name==='call_tool'));
 async function call(name,args={}){const r=await client.callTool({name:'call_tool',arguments:{name,arguments:args}},undefined,{timeout:60000});assert.ok(!r.isError,JSON.stringify(r.content));return r;}
 const status=await call('system_status');assert.equal(status.structuredContent.backend,'ezdxf');
 await call('drawing_new');await call('entity_create_rectangle',{x1:0,y1:0,x2:100,y2:60});await call('entity_create_circle',{cx:50,cy:30,radius:12});await call('drawing_save',{path:path.join(testRoot,'bundled-test.dxf')});
 const info=await client.callTool({name:'drawing_info',arguments:{}});assert.equal(info.structuredContent.entity_count,2);
 const shot=await call('view_screenshot',{max_px:800});const img=shot.content.find(x=>x.type==='image');assert.ok(img);fs.writeFileSync('build/bundled-cad-test.png',Buffer.from(img.data,'base64'));
}finally{await client.close()}
// Use the upstream install API with a separate test profile, never the real home.
const {quickInstall}=await import(pathToFileURL(path.join(bundle,'integrations/computer-use/quick-install.mjs')).href);
const privateRoot=fs.mkdtempSync(path.join(process.env.LOCALAPPDATA,'AgviIntegrationTest-'));const home=path.join(privateRoot,'home'),target=path.join(privateRoot,'computer-use');fs.mkdirSync(home);
const profile=path.join(home,'.gemini/config');fs.mkdirSync(profile,{recursive:true});
const hostSettings={model:'preserve-test-model',permissions:{defaultMode:'ask'},sidecars:{unrelated:{enabled:false}}};
fs.writeFileSync(path.join(profile,'config.json'),JSON.stringify(hostSettings));
fs.writeFileSync(path.join(profile,'mcp_config.json'),JSON.stringify({mcpServers:{autocad:{command:'preserve-cad'},unrelated:{command:'preserve-other'}}}));
const cuBundle=path.join(bundle,'integrations/computer-use/bundle');
const first=await quickInstall({bundle:cuBundle,home,target});assert.equal(first.ok,true);assert.equal(first.sidecar_enabled,true);
const pointer=path.join(home,'.gemini/config/skills/computer-use/deployment.json');assert.ok(fs.existsSync(pointer));const original=JSON.parse(fs.readFileSync(pointer));
const second=await quickInstall({bundle:cuBundle,home,target});assert.equal(second.already_installed,true);assert.equal(JSON.parse(fs.readFileSync(pointer)).permission_mode,original.permission_mode);
assert.ok(fs.existsSync(path.join(home,'.gemini/config/sidecars/antigravity-computer-use/sidecar.json')));
const kept=JSON.parse(fs.readFileSync(path.join(profile,'config.json')));assert.equal(kept.model,hostSettings.model);assert.deepEqual(kept.permissions,hostSettings.permissions);assert.deepEqual(kept.sidecars.unrelated,hostSettings.sidecars.unrelated);
const keptMcp=JSON.parse(fs.readFileSync(path.join(profile,'mcp_config.json')));assert.equal(keptMcp.mcpServers.autocad.command,'preserve-cad');assert.equal(keptMcp.mcpServers.unrelated.command,'preserve-other');
console.log('PASS bundled CAD handshake/create/save/render; config preservation; sealed Computer Use install/reuse into isolated profile; existing permission mode preserved.');
