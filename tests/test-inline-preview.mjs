import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import http from 'node:http';import {pathToFileURL}from 'node:url';import{createRequire}from'node:module';import{chromium}from'playwright';
const require=createRequire(import.meta.url);const {getPayload}=require('../build/payload/patcher.cjs');const payload=getPayload(),handlers=new Map();
const electron={app:{isReady:()=>true,on:()=>{}},ipcMain:{on:()=>{},handle:(n,f)=>handlers.set(n,f)},dialog:{}};
vm.runInNewContext(payload.native,{require:n=>n==='electron'?electron:n==='./authBootstrap'?{getActiveLsBaseUrl:()=> 'https://127.0.0.1:12345'}:require(n),__dirname:'C:/Application/resources/app.asar/dist',process,URL,Map,setTimeout,clearTimeout});
const preview=handlers.get('agvi:preview-file-v1');
const eventFor=uri=>{const frame={url:'https://127.0.0.1:12345/?'+new URLSearchParams({tab:'file__'+uri})};return{senderFrame:frame,sender:{mainFrame:frame,getLastWebPreferences:()=>({contextIsolation:true})}}};
const unicode=path.resolve('build/kiểm tra phần trăm %.docx');fs.copyFileSync('build/sample.docx',unicode);const encoded=pathToFileURL(unicode).href;assert.equal(preview(eventFor(encoded)).name,path.basename(unicode));assert.ok(preview(eventFor(encoded.replaceAll('%','%25'))).blob);
let selected=pathToFileURL(path.resolve('build/sample.docx')).href;
const good=preview(eventFor(selected));assert.ok(good.blob);assert.ok(good.html);assert.equal(good.name,'sample.docx');
assert.ok(preview(eventFor('file://remote-server/share/file.docx')).error);
assert.ok(preview(eventFor(pathToFileURL(path.resolve('package.json')).href)).error);
assert.ok(preview({senderFrame:{url:'https://example.com/'},sender:{}}).error);
assert.ok(preview({senderFrame:{url:'https://127.0.0.1:12345/'},sender:{}}).error);
const badFrame=eventFor(selected);badFrame.senderFrame.parent={};assert.ok(preview(badFrame).error);
const html='<html><body><section style="width:35%;float:left"><div class="prose" id="chat">User conversation remains unchanged.</div></section><section style="margin-left:40%;width:58%"><header id="breadcrumb">Current file breadcrumb<button id="refresh" aria-label="Reload"></button></header><div id="viewer" style="height:700px;display:flex;align-items:center;justify-content:center"><div><p>Preview is not available for this file type.</p><button>Download sample.docx</button></div></div></section></body></html>';
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html)});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage({viewport:{width:1400,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));let requests=0;
 await page.exposeFunction('loadPreview',()=>{requests++;return preview(eventFor(selected))});
 await page.addInitScript({content:"window.require=()=>({ipcRenderer:{send:()=>{},invoke:channel=>channel==='agvi:preview-file-v1'?window.loadPreview():Promise.resolve([])}});\n"+payload.renderer});
 await page.goto('http://127.0.0.1:'+server.address().port+'/?'+new URLSearchParams({tab:'file__'+selected}));
 const frame=page.frameLocator('iframe[title="Xem trước tài liệu"]');await frame.getByText('Xin chào Việt Nam · DOCX').waitFor();assert.equal(await page.locator('#chat').innerText(),'User conversation remains unchanged.');assert.equal(await page.locator('#breadcrumb').innerText(),'Current file breadcrumb');assert.equal(await page.locator('#viewer>div>p').count(),1);assert.ok(!(await frame.locator('#picker').isVisible()));
 for(const name of ['sample.xlsx','chart-only.xlsx','sample.pptx','sample.pdf']){const previousFrame=await page.locator('iframe[title="Xem trước tài liệu"]').elementHandle();selected=pathToFileURL(path.resolve('build',name)).href;await page.evaluate(uri=>history.pushState({},'','?'+new URLSearchParams({tab:'file__'+uri})),selected);await page.waitForFunction(el=>!el.isConnected,previousFrame);if(name.endsWith('xlsx'))await frame.getByText('Việt Nam',{exact:true}).waitFor();else if(name.endsWith('pptx'))await frame.getByText('Xin chào · PPTX').waitFor();else await frame.getByText('Trang 1 / 2',{exact:true}).waitFor();}
 const oldFrame=await page.locator('iframe[title="Xem trước tài liệu"]').elementHandle();await page.locator('#refresh').click();await page.waitForFunction(el=>!el.isConnected,oldFrame);await frame.getByText('Trang 1 / 2',{exact:true}).waitFor();
 await page.screenshot({path:'build/inline-preview.png',fullPage:true});
 assert.equal(requests,6,'Unexpected repeated file reads');assert.deepEqual(errors,[]);
 await page.evaluate(()=>history.pushState({},'','/'));await page.waitForFunction(()=>!document.querySelector('iframe[title="Xem trước tài liệu"]'));
 console.log('PASS native active-tab-only read guards; DOCX/XLSX/PPTX/PDF in original right pane with strict sandbox/CSP; Unicode paths, tab switching, original DOM preservation, no picker and no repeated reads.');
}finally{await browser.close();await new Promise(r=>server.close(r))}
