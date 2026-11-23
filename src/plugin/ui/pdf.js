let loading=null,rendering=null,epoch=0;
export async function releasePdf(){epoch++;if(rendering){rendering.cancel();rendering=null;}const old=loading;loading=null;if(old)await old.destroy().catch(()=>{});}
const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
export async function pdfPreview(bytes,view,tabs,status){
 const ticket=epoch;
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
 globalThis.pdfjsWorker=await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
 if(ticket!==epoch)return;
 const task=pdfjs.getDocument({data:bytes,isEvalSupported:false,useWasm:false,enableXfa:false,isOffscreenCanvasSupported:false,disableWorkerRendering:true});loading=task;
 let doc;try{doc=await task.promise;}catch(e){if(e.name==='PasswordException')throw Error('PDF cần mật khẩu; bản preview này chưa hỗ trợ nhập mật khẩu.');throw e;}
 if(ticket!==epoch)return;
 let number=1,busy=false;const prev=node('button','Trang trước'),next=node('button','Trang sau'),label=node('span'),zoom=node('select');zoom.setAttribute('aria-label','Phóng to PDF');
 for(const [value,title]of [['fit','Vừa chiều ngang'],['0.75','75%'],['1','100%'],['1.25','125%'],['1.5','150%'],['2','200%']]){const option=node('option',title);option.value=value;zoom.append(option);}
 const canvas=node('canvas');canvas.setAttribute('aria-label','Trang PDF');const wrap=node('div');wrap.className='pdf-page';wrap.append(canvas);const details=node('details'),summary=node('summary','Văn bản trang hiện tại'),text=node('pre');details.append(summary,text);view.append(wrap,details);tabs.append(prev,label,next,zoom);
 async function paint(){if(busy||ticket!==epoch)return;busy=true;prev.disabled=next.disabled=zoom.disabled=true;
  try{const page=await doc.getPage(number);if(ticket!==epoch)return;const base=page.getViewport({scale:1});const scale=zoom.value==='fit'?Math.min(2,Math.max(0.1,(view.clientWidth-48)/base.width)):Number(zoom.value);const viewport=page.getViewport({scale});if(!Number.isFinite(viewport.width)||viewport.width<=0||viewport.width>50000||viewport.height<=0||viewport.height>50000)throw Error('Kích thước trang PDF quá lớn.');const ratio=Math.min(devicePixelRatio||1,2,4096/viewport.width,4096/viewport.height,Math.sqrt(12000000/viewport.width/viewport.height));canvas.width=Math.ceil(viewport.width*ratio);canvas.height=Math.ceil(viewport.height*ratio);canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';
   const currentRender=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:[ratio,0,0,ratio,0,0]});rendering=currentRender;await currentRender.promise;if(rendering===currentRender)rendering=null;if(ticket!==epoch)return;const content=await page.getTextContent();if(ticket!==epoch)return;text.textContent=content.items.map(x=>x.str+(x.hasEOL?'\n':' ')).join('');label.textContent=`Trang ${number} / ${doc.numPages}`;status.textContent='PDF · Chỉ xem · Không chạy JavaScript hoặc mở liên kết trong tài liệu.';page.cleanup();
  }catch(e){if(ticket===epoch&&e.name!=='RenderingCancelledException')status.textContent='Không thể hiển thị trang: '+e.message;}
  finally{busy=false;if(ticket===epoch){prev.disabled=number<=1;next.disabled=number>=doc.numPages;zoom.disabled=false;}}
 }
 prev.onclick=()=>{if(!busy&&number>1){number--;paint()}};next.onclick=()=>{if(!busy&&number<doc.numPages){number++;paint()}};zoom.onchange=paint;await paint();
}
