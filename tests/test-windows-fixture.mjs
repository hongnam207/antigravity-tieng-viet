// End-to-end product test on a disposable fixture only. Does not target user applications.
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {execFileSync,spawn} from 'node:child_process';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const compiler=path.join(process.env.WINDIR,'Microsoft.NET/Framework64/v4.0.30319/csc.exe');
const exe=path.resolve('build/WindowsFixture.exe'),record=path.resolve('build/fixture-text.txt');
execFileSync(compiler,['/nologo','/target:winexe','/platform:x64','/reference:System.Windows.Forms.dll','/out:'+exe,path.resolve('tests/WindowsFixture.cs')]);
const fixture=spawn(exe,[record],{stdio:'ignore'});const client=new Client({name:'fixture-test',version:'1'},{capabilities:{}});
try{await client.connect(new StdioClientTransport({command:process.execPath,args:[path.resolve('build/plugin/server.cjs'),'--windows']}));
const call=async(name,args={})=>{const r=await client.callTool({name,arguments:args});assert.ok(!r.isError,r.content[0]?.text);return r};
let window;for(let i=0;i<15&&!window;i++){const result=await call('windows_list');window=JSON.parse(result.content[0].text).windows.find(w=>w.pid===fixture.pid&&w.title==='AGVI automated test fixture');if(!window)await new Promise(r=>setTimeout(r,150));}assert.ok(window,'Test fixture window not found');
const state=async()=>JSON.parse((await call('windows_state',{window:window.window,screenshot:false})).content[0].text);
let s=await state();const edit=s.elements.find(e=>['ControlType.Edit','ControlType.Document'].includes(e.type));assert.ok(edit);await call('windows_click',{window:window.window,x:edit.x+10,y:edit.y+10});
await state();const value='Xin chào Việt Nam 123';await call('windows_type',{window:window.window,text:value});await new Promise(r=>setTimeout(r,200));assert.equal(fs.readFileSync(record,'utf8'),value);
await state();await call('windows_key',{window:window.window,key:'Ctrl+A'});await state();await call('windows_type',{window:window.window,text:'Đã kiểm tra'});await new Promise(r=>setTimeout(r,150));assert.equal(fs.readFileSync(record,'utf8'),'Đã kiểm tra');
s=await state();const button=s.elements.find(e=>e.name==='Fixture button');assert.ok(button);await call('windows_click',{window:window.window,x:button.x+15,y:button.y+12});await new Promise(r=>setTimeout(r,100));assert.equal(fs.readFileSync(record+'.clicked','utf8'),'ok');
const screenshot=await call('windows_state',{window:window.window,screenshot:true});assert.ok(screenshot.content.some(c=>c.type==='image'&&c.mimeType==='image/png'));
console.log('PASS native Windows end-to-end on disposable fixture: list, UI Automation, click, Vietnamese Unicode typing, Ctrl+A, replacement, button invocation, screenshot.');
}finally{await client.close();fixture.kill()}
