/* AGVI-BEGIN */
(() => {
  'use strict';
  const electron = require('electron');
  const dictionary = /* AGVI-DICTIONARY */;
  const bundle = /* AGVI-RUNTIME */;
  if (electron.app.__agviInstalled) return;
  electron.app.__agviInstalled = true;
  if (!electron.app.isReady() && !electron.app.commandLine.hasSwitch('lang')) electron.app.commandLine.appendSwitch('lang', 'vi');
  const fs = require('fs'), path = require('path'), cp = require('child_process');
  function status(phase,extra={}) { try { fs.writeFileSync(path.join(bundle,'runtime-status.json'),JSON.stringify({phase,...extra,at:new Date().toISOString()})); } catch {} }
  if(typeof electron.ipcMain.on==='function')electron.ipcMain.on('agvi:renderer-ready-v2',()=>status('renderer-ready'));
  let worker = null, nextId = 0, cooldown = 0;
  function releaseWorker() {
    if (pending.size || !worker) return;
    const child = worker; worker = null;
    child.stdin.end(); child.kill();
    status('idle-model-stopped');
  }
  const pending = new Map();
  function failAll() {
    for (const item of pending.values()) { clearTimeout(item.timer); item.resolve([]); }
    pending.clear();
  }
  function startWorker() {
    if (worker && !worker.killed) return worker;
    if (Date.now() < cooldown) return null;
    const executable = path.join(bundle, 'runtime', 'python.exe');
    if (!fs.existsSync(executable) || !fs.existsSync(path.join(bundle, 'model', 'model.bin'))) { status('missing-runtime');return null; }
    const child = cp.spawn(executable, ['-I', '-u', path.join(bundle, 'translator.py')], {
      cwd: bundle, windowsHide: true, stdio: ['pipe','pipe','pipe'],
      env: { ...process.env, OMP_NUM_THREADS: '2', CT2_VERBOSE: '0', PYTHONIOENCODING: 'utf-8' }
    });
    worker = child; let buffer = '';
    status('worker-started');
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      buffer += chunk;
      if (buffer.length > 200000) { buffer = ''; failAll(); return; }
      let end;
      while ((end = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0,end); buffer = buffer.slice(end+1);
        try {
          const result = JSON.parse(line), item = pending.get(result.id);
          if (item) { pending.delete(result.id); clearTimeout(item.timer);status(result.error?'worker-error':'translated',{count:Array.isArray(result.translations)?result.translations.length:0}); item.resolve(Array.isArray(result.translations) ? result.translations : []); releaseWorker(); }
        } catch {}
      }
    });
    child.stderr.on('data', () => {}); // Never log UI text or account data.
    const stop = () => { if (worker === child) { worker = null; cooldown = Date.now()+60000; failAll(); } };
    child.on('error', stop); child.on('exit', stop);
    return child;
  }
  function request(texts) {
    if (pending.size >= 8) return Promise.resolve([]);
    const child = startWorker(); if (!child) return Promise.resolve([]);
    return new Promise(resolve => {
      const id = ++nextId;
      const timer = setTimeout(() => { pending.delete(id); resolve([]); if(worker===child){worker=null;child.kill();failAll();} }, 30000);
      pending.set(id, { resolve, timer });
      child.stdin.write(JSON.stringify({id,texts})+'\n',error=>{if(error){const item=pending.get(id);if(item){pending.delete(id);clearTimeout(timer);resolve([]);releaseWorker();}}});
    });
  }
  electron.ipcMain.handle('agvi:translate-ui-v2', (event, texts) => {
    try {
      const url = new URL(event.senderFrame.url);
      const hubOrigin=new URL(require('./authBootstrap').getActiveLsBaseUrl()).origin;
      if (url.origin!==hubOrigin || !['127.0.0.1','localhost','[::1]'].includes(url.hostname) || !['https:','http:'].includes(url.protocol)) {status('rejected-origin');return [];}
      if(event.senderFrame.parent || event.senderFrame!==event.sender.mainFrame){status('rejected-frame');return [];}
      const prefs = event.sender.getLastWebPreferences();
      let preload = prefs.preload || prefs.preloadURL || '';
      if(typeof preload!=='string')preload=preload.href||'';
      if(preload.startsWith('file:'))preload=require('url').fileURLToPath(preload);
      const expected=path.join(__dirname,'preload.js');
      // Recent Electron builds redact preload fields. Require the authenticated hub origin and
      // top-level frame above; additionally verify the exact preload whenever it is reported.
      if ((preload && path.resolve(preload).toLowerCase()!==path.resolve(expected).toLowerCase()) || prefs.nodeIntegration===true || prefs.contextIsolation===false) {status('rejected-preload');return [];}
    } catch { status('rejected-sender');return []; }
    if (!Array.isArray(texts) || texts.length>24 || !texts.every(x=>typeof x==='string' && x.length<=600)) return [];
    return request(texts);
  });
  electron.app.on('will-quit', () => { if (worker) { worker.stdin.end(); worker.kill(); } failAll(); });
  const translate = value => typeof value==='string' ? (dictionary[value.trim()] || value) : value;
  for (const name of ['showMessageBox','showMessageBoxSync','showOpenDialog','showOpenDialogSync','showSaveDialog','showSaveDialogSync']) {
    const original = electron.dialog[name]; if(typeof original!=='function') continue;
    electron.dialog[name] = function(...args) {
      const index=args.length>1?1:0;
      if(args[index] && typeof args[index]==='object') {
        const options={...args[index]};
        for(const key of ['title','message','detail','buttonLabel','checkboxLabel']) if(typeof options[key]==='string') options[key]=translate(options[key]);
        if(Array.isArray(options.buttons)) options.buttons=options.buttons.map(translate);
        args[index]=options;
      }
      return Reflect.apply(original,this,args);
    };
  }
})();
/* AGVI-END */
