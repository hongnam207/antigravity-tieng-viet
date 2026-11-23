import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const html=fs.readFileSync('build/plugin/office.html','utf8');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<iframe sandbox="allow-scripts" style="width:1100px;height:850px"></iframe>');
 await page.evaluate(html=>{window.pending={};window.ready=false;window.addEventListener('message',e=>{const m=e.data;if(m?.jsonrpc!=='2.0')return;const send=result=>e.source.postMessage({jsonrpc:'2.0',id:m.id,result},'*');if(m.method==='ui/initialize')send({protocolVersion:m.params.protocolVersion,hostInfo:{name:'race-host',version:'1'},hostCapabilities:{serverResources:{}},hostContext:{theme:'light',displayMode:'fullscreen'}});if(m.method==='ui/notifications/initialized')window.ready=true;if(m.method==='resources/read')window.pending[m.params.uri]=m.id;});document.querySelector('iframe').srcdoc=html;},html);
 await page.waitForFunction(()=>window.ready);
 const send=async name=>page.evaluate(name=>document.querySelector('iframe').contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:{structuredContent:{file:{name,resourceUri:'antigravity-file://race/'+name}},content:[]}},'*'),name);
 const reply=async name=>{await page.waitForFunction(n=>window.pending['antigravity-file://race/'+n],name);await page.evaluate(({name,blob})=>{const uri='antigravity-file://race/'+name;document.querySelector('iframe').contentWindow.postMessage({jsonrpc:'2.0',id:window.pending[uri],result:{contents:[{uri,blob,mimeType:'application/octet-stream'}]}},'*');},{name,blob:fs.readFileSync('build/'+name).toString('base64')});};
 const ui=page.frameLocator('iframe');
 // Deliver an old document after the new workbook has already rendered.
 await send('sample.docx');await page.waitForFunction(()=>window.pending['antigravity-file://race/sample.docx']);
 await send('chart-only.xlsx');await reply('chart-only.xlsx');await ui.getByText('Việt Nam',{exact:true}).waitFor();
 await reply('sample.docx');assert.equal(await ui.locator('#title').innerText(),'chart-only.xlsx');assert.equal(await ui.getByText('Xin chào Việt Nam · DOCX').count(),0);
 // Start PDF, then switch to PowerPoint before its asynchronous renderer finishes.
 await send('sample.pdf');await reply('sample.pdf');await send('reordered.pptx');await reply('reordered.pptx');await ui.getByText('Slide được xếp trước').waitFor();
 assert.equal(await ui.locator('#title').innerText(),'reordered.pptx');assert.equal(await ui.locator('canvas').count(),0);assert.equal(await ui.locator('.error').count(),0);assert.deepEqual(errors,[]);
 console.log('PASS delayed host response and PDF-to-PPTX switch: latest selected document wins, no stale content or errors.');
}finally{await browser.close()}
