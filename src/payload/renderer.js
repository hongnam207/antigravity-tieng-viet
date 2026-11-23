/* AGVI-BEGIN */
(() => {
  'use strict';
  if (globalThis.__agviInstalled || !['127.0.0.1','localhost','[::1]'].includes(location.hostname)) return;
  globalThis.__agviInstalled=true;
  const dictionary=/* AGVI-DICTIONARY */;
  const translatedValues=new Set(Object.values(dictionary).map(value=>value.replace(/\s+/g,' ').trim()));
  let ipc=null;
  try { ipc=typeof electron_1!=='undefined'?electron_1.ipcRenderer:require('electron').ipcRenderer; } catch {}
  try { if(ipc && typeof ipc.send==='function')ipc.send('agvi:renderer-ready-v2'); } catch {}
  const protectedSelector='script,style,pre,code,kbd,samp,textarea,input,[contenteditable]:not([contenteditable="false"]),.monaco-editor,.cm-editor,.prose,.markdown,.markdown-body,[data-message-id],[data-message-role],[data-testid="message-content"],[data-agvi-ignore]';
  const uiSelector='button,[role="button"],[role="menuitem"],[role="option"],[role="tab"],[role="dialog"],[role="tooltip"],[role="listbox"],label,legend,header,footer,[data-agvi-ui]';
  const normalize=text=>text.replace(/\s+/g,' ').trim();
  const cache=new Map(), waiting=new Map();
  let timer=null, busy=false;
  function protectedElement(el) {
    if(!el || el.closest(protectedSelector))return true;
    const link=el.closest('a[href]');
    return !!(link && /\/c\/[^/?]+/.test(link.getAttribute('href')||''));
  }
  function protectedAttribute(el,attribute) {
    if(['placeholder','data-placeholder'].includes(attribute))return protectedElement(el.parentElement);
    return protectedElement(el);
  }
  function eligible(text) {
    return typeof text==='string' && text.length>=2 && text.length<=600 && (text.match(/[A-Za-z]+/g)||[]).length>=2 &&
      !/[^\x00-\x7f\u2010-\u2026\u00a0\u00b7]/.test(text) &&
      !/https?:\/\/|www\.|[\w.+-]+@[\w.-]+|[A-Z]:[\\/]|[/\\][\w.-]+[/\\]|[{}<>]|\b\S+\.(exe|dll|json|js|ts|py|txt|docx|xlsx|pdf|png|md)\b/i.test(text) &&
      !translatedValues.has(text) && !/^(Gemini|Claude|GPT)(?:\b|[- ])/i.test(text) &&
      !/^[A-Z0-9_]{2,}$/.test(text) && !/^(Antigravity|Google|GitHub|MCP|WSL|Turbo|Node\.js|Google Sans)$/.test(text);
  }
  function lookup(key) {
    if(dictionary[key])return dictionary[key];
    if(translatedValues.has(key))return key;
    if(/^(Gemini|Claude|GPT)(?:\b|[- ])/i.test(key))return key;
    if(cache.has(key))return cache.get(key);
    let match;
    if((match=key.match(/^Good to see you, (.+?)\.? What's next\?$/)))return `Rất vui được gặp bạn, ${match[1]}. Bạn muốn làm gì tiếp theo?`;
    if((match=key.match(/^Hey (.+), what should we build today\?$/)))return `Chào ${match[1]}, hôm nay bạn muốn tạo gì?`;
    if((match=key.match(/^Welcome back, (.+?)\.? Where should we pick up\?$/)))return `Chào mừng ${match[1]} trở lại. Bạn muốn tiếp tục việc gì?`;
    if((match=key.match(/^You have used some of your weekly limit, it will fully refresh in (\d+) days?, (\d+) hours?\.$/)))return `Bạn đã dùng một phần hạn mức tuần. Hạn mức sẽ được cấp lại sau ${match[1]} ngày ${match[2]} giờ.`;
    if((match=key.match(/^(Remove shortcut|Shortcut) (.+) for (.+)$/)))return `${match[1]==='Remove shortcut'?'Xóa phím tắt':'Phím tắt'} ${match[2]} cho ${dictionary[match[3]]||match[3]}`;
    if((match=key.match(/^Add shortcut for (.+)$/)))return `Thêm phím tắt cho ${dictionary[match[1]]||match[1]}`;
    for(const [from,to] of [['Select model, current: ','Chọn mô hình AI, hiện tại: '],['Select project, current: ','Chọn dự án, hiện tại: '],['Agent permissions preset selector, current: ','Chọn bộ quyền cho trợ lý AI, hiện tại: '],['Conversation: ','Cuộc trò chuyện: ']]) {
      if(key.startsWith(from)){const rest=key.slice(from.length);return to+(dictionary[rest]||rest);}
    }
    return null;
  }
  function enqueue(key,node,attribute,original) {
    if(!ipc || waiting.size>=256 || !eligible(key))return;
    let tasks=waiting.get(key);
    if(!tasks){tasks=[];waiting.set(key,tasks);}
    if(tasks.length<32 && !tasks.some(task=>task.node===node && task.attribute===attribute))tasks.push({node,attribute,original});
    if(!timer && !busy)timer=setTimeout(flush,120);
  }
  async function flush() {
    timer=null;if(busy || !waiting.size)return;
    busy=true;
    const keys=Array.from(waiting.keys()).slice(0,24);
    const tasks=keys.map(key=>{const items=waiting.get(key);waiting.delete(key);return items;});
    let answers=[];
    try { answers=await ipc.invoke('agvi:translate-ui-v2',keys); } catch {}
    for(let i=0;i<keys.length;i++) {
      const answer=Array.isArray(answers)&&typeof answers[i]==='string'?answers[i]:keys[i];
      cache.set(keys[i],answer); // Negative caching prevents busy loops when the worker is unavailable.
      if(answer===keys[i])continue;
      for(const task of tasks[i]) {
        if(!task.node.isConnected)continue;
        if(task.attribute) {
          if(task.node.getAttribute(task.attribute)===task.original && !protectedAttribute(task.node,task.attribute))task.node.setAttribute(task.attribute,task.original.replace(task.original.trim(),answer));
        } else if(task.node.nodeValue===task.original && !protectedElement(task.node.parentElement))task.node.nodeValue=task.original.replace(task.original.trim(),answer);
      }
    }
    busy=false;
    if(waiting.size && !timer)timer=setTimeout(flush,40);
  }
  function textNode(node) {
    const el=node.parentElement;if(protectedElement(el))return;
    const original=node.nodeValue,key=normalize(original);if(!key)return;
    const value=lookup(key);
    if(value){if(value!==key)node.nodeValue=original.replace(original.trim(),value);return;}
    // User-created project names are buttons in the navigation, so unknown nav labels are left alone.
    if(el.closest('nav') || el.closest('[role="navigation"]'))return;
    if(el.closest(uiSelector))enqueue(key,node,null,original);
  }
  function attributes(el) {
    if(!el || ['SCRIPT','STYLE'].includes(el.tagName))return;
    for(const attribute of ['title','aria-label','placeholder','data-placeholder','alt']) {
      const original=el.getAttribute(attribute);if(!original)continue;
      const key=normalize(original),value=lookup(key);
      if(value){if(value!==key)el.setAttribute(attribute,original.replace(original.trim(),value));continue;}
      // Unknown field names, user images, and editable contents are never sent to the worker.
      if(attribute==='alt' || protectedAttribute(el,attribute) || el.closest('nav,[role="navigation"]'))continue;
      if(el.closest(uiSelector))enqueue(key,el,attribute,original);
    }
  }
  function scan(root) {
    if(root.nodeType===Node.TEXT_NODE){textNode(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE && root.nodeType!==Node.DOCUMENT_NODE)return;
    if(root.nodeType===Node.ELEMENT_NODE){attributes(root);if(protectedElement(root))return;}
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{
      acceptNode(node){if(node.nodeType===Node.ELEMENT_NODE && protectedElement(node)){attributes(node);return NodeFilter.FILTER_REJECT;}return NodeFilter.FILTER_ACCEPT;}
    });
    let node;while((node=walker.nextNode())){if(node.nodeType===Node.TEXT_NODE)textNode(node);else attributes(node);}
  }
  function start() {
    if(!document.documentElement)return;document.documentElement.lang='vi';scan(document.body||document.documentElement);
    const pending=new Set();let scheduled=false;
    const queue=node=>{pending.add(node);if(!scheduled){scheduled=true;setTimeout(()=>{scheduled=false;const batch=Array.from(pending);pending.clear();for(const item of batch)if(item.isConnected)scan(item);},30);}};
    new MutationObserver(records=>{for(const record of records){if(record.type==='attributes')attributes(record.target);else if(record.type==='characterData')queue(record.target);else for(const node of record.addedNodes)queue(node);}})
      .observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','data-placeholder','alt']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
/* AGVI-END */
