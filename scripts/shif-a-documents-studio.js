(function(){
"use strict";
const $=id=>document.getElementById(id);
const STORAGE_KEY="shifA.documentsStudio.draft.v1";
const LIBRARY_KEY="shifA.documentsStudio.library.v1";
const MAX_LIBRARY_ITEMS=30;
const MAX_PDF_BYTES=20971520;
const MAX_PDF_PAGES=100;
const MAX_IMPORTED_CHARS=30000;
const MAX_PDF_INPUT_FILES=10;
const MAX_PDF_TOTAL_BYTES=52428800;
const MAX_MERGED_PAGES=300;
function downloadPdfBytes(bytes,filename){
 const blob=new Blob([bytes],{type:"application/pdf"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function safePdfName(value){return (value||"document").replace(/\.pdf$/i,"").replace(/[^\p{L}\p{N}-]+/gu,"-").replace(/^-|-$/g,"").slice(0,60)||"document";}
function parsePageRanges(value,pageCount){
 const chunks=value.split(",").map(part=>part.trim()).filter(Boolean);
 if(!chunks.length)throw new Error("कम-से-कम एक page range दें।");
 const ranges=chunks.map(part=>{
  const match=part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if(!match)throw new Error("Page range सही लिखें, जैसे 1-3,5");
  const start=Number(match[1]),end=Number(match[2]||match[1]);
  if(start<1||end<start||end>pageCount)throw new Error("Page range PDF के कुल pages के भीतर होना चाहिए।");
  return {start,end};
 });
 return ranges;
}
async function mergePdfFiles(){
 const files=Array.from($("pdfMergeInput").files||[]);
 if(files.length<2){$("pdfToolsStatus").textContent="Merge के लिए कम-से-कम 2 PDF चुनें।";return;}
 if(files.length>MAX_PDF_INPUT_FILES){$("pdfToolsStatus").textContent="एक बार में अधिकतम 10 PDF चुन सकते हैं।";return;}
 if(files.some(file=>file.size>MAX_PDF_BYTES)||files.reduce((sum,file)=>sum+file.size,0)>MAX_PDF_TOTAL_BYTES){$("pdfToolsStatus").textContent="हर PDF 20 MB तक और सभी PDFs मिलाकर 50 MB तक होनी चाहिए।";return;}
 if(!window.PDFLib){$("pdfToolsStatus").textContent="PDF editor library load नहीं हुई। Internet connection जाँचें।";return;}
 $("mergePdfBtn").disabled=true;$("pdfToolsStatus").textContent="PDF files merge हो रही हैं…";
 try{
  const merged=await PDFLib.PDFDocument.create();let totalPages=0;
  for(const file of files){
   if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf"))throw new Error("सभी selected files PDF होनी चाहिए।");
   const source=await PDFLib.PDFDocument.load(await file.arrayBuffer());
   totalPages+=source.getPageCount();
   if(totalPages>MAX_MERGED_PAGES)throw new Error("Merged PDF में अधिकतम 300 pages हो सकते हैं।");
   const copied=await merged.copyPages(source,source.getPageIndices());copied.forEach(page=>merged.addPage(page));
  }
  const bytes=await merged.save();downloadPdfBytes(bytes,"shif-a-merged-document.pdf");
  $("pdfToolsStatus").textContent=files.length+" PDFs merge हो गईं ("+totalPages+" pages)। Download शुरू हुआ।";
 }catch(error){$("pdfToolsStatus").textContent=error.message||"PDF merge नहीं हो सकी। File damaged या password-protected हो सकती है।";}
 finally{$("mergePdfBtn").disabled=false;}
}
async function splitPdfFile(){
 const file=$("pdfSplitInput").files&&$("pdfSplitInput").files[0];
 if(!file){$("pdfToolsStatus").textContent="Split करने के लिए PDF चुनें।";return;}
 if(file.size>MAX_PDF_BYTES){$("pdfToolsStatus").textContent="PDF 20 MB से छोटी होनी चाहिए।";return;}
 if(!window.PDFLib){$("pdfToolsStatus").textContent="PDF editor library load नहीं हुई। Internet connection जाँचें।";return;}
 $("splitPdfBtn").disabled=true;$("pdfToolsStatus").textContent="PDF pages अलग किए जा रहे हैं…";
 try{
  if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf"))throw new Error("कृपया PDF file चुनें।");
  const source=await PDFLib.PDFDocument.load(await file.arrayBuffer());
  const pageCount=source.getPageCount();
  if(pageCount>MAX_PDF_PAGES)throw new Error("Split के लिए अधिकतम 100 pages वाली PDF चुनें।");
  const ranges=parsePageRanges($("pdfPageRanges").value,pageCount);
  for(let index=0;index<ranges.length;index++){
   const range=ranges[index],output=await PDFLib.PDFDocument.create();
   const indices=Array.from({length:range.end-range.start+1},(_,offset)=>range.start-1+offset);
   const pages=await output.copyPages(source,indices);pages.forEach(page=>output.addPage(page));
   const suffix=ranges.length>1?"-part-"+(index+1):"-pages-"+range.start+"-"+range.end;
   downloadPdfBytes(await output.save(),safePdfName(file.name)+suffix+".pdf");
  }
  $("pdfToolsStatus").textContent=ranges.length+" PDF part(s) download के लिए तैयार हैं। Browser multiple downloads की permission माँग सकता है।";
 }catch(error){$("pdfToolsStatus").textContent=error.message||"PDF split नहीं हो सकी।";}
 finally{$("splitPdfBtn").disabled=false;}
}
async function importPdfFile(file){
 if(!file)return;
 if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf")){$("docStatus").textContent="कृपया PDF file चुनें।";$("pdfImportInput").value="";return;}
 if(file.size>MAX_PDF_BYTES){$("docStatus").textContent="PDF 20 MB से छोटी होनी चाहिए।";$("pdfImportInput").value="";return;}
 if(!window.pdfjsLib){$("docStatus").textContent="PDF reader load नहीं हुआ। Internet connection जाँचकर page reload करें।";$("pdfImportInput").value="";return;}
 $("docStatus").textContent="PDF से text निकाला जा रहा है…";
 try{
  const bytes=await file.arrayBuffer();
  const pdf=await window.pdfjsLib.getDocument({data:bytes}).promise;
  if(pdf.numPages>MAX_PDF_PAGES){$("docStatus").textContent="इस tool में अधिकतम 100 pages वाली PDF import कर सकते हैं।";$("pdfImportInput").value="";return;}
  const pages=[];let total=0;
  for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++){
   const page=await pdf.getPage(pageNumber);
   const content=await page.getTextContent();
   const text=content.items.filter(item=>typeof item.str==="string").map(item=>item.str).join(" ").trim();
   if(text){const section=(pageNumber>1?"\n\n":"")+"--- Page "+pageNumber+" ---\n"+text;const remaining=MAX_IMPORTED_CHARS-total;if(remaining<=0)break;pages.push(section.slice(0,remaining));total+=Math.min(section.length,remaining);}
   if(total>=MAX_IMPORTED_CHARS)break;
  }
  const extracted=pages.join("\n").slice(0,MAX_IMPORTED_CHARS);
  if(!extracted){$("docStatus").textContent="इस PDF में selectable text नहीं मिला। Scanned PDF के लिए OCR अभी उपलब्ध नहीं है।";$("pdfImportInput").value="";return;}
  $("docTitle").value=file.name.replace(/\.pdf$/i,"").slice(0,120);
  $("docBody").value=extracted;
  updateStats();updatePreview();saveDraft();
  $("docStatus").textContent="PDF text import हो गया। "+pdf.numPages+" pages जाँचे गए; content editor में आ गया है।";
 }catch(error){$("docStatus").textContent="PDF पढ़ी नहीं जा सकी। File password-protected, damaged या unsupported हो सकती है।";}
 $("pdfImportInput").value="";
}
function updateStats(){const value=$("docBody").value,words=value.trim()?value.trim().split(/\s+/u).length:0;$("docStats").textContent=words+" words · "+value.length+" characters";}
function updatePreview(){
 const title=$("docTitle").value.trim()||"Untitled Document";
 const author=$("docAuthor").value.trim();
 $("previewTitle").textContent=title;
 $("previewMeta").textContent=author?"Prepared by: "+author:"";
 $("previewBody").textContent=$("docBody").value||"";
 $("previewBody").style.fontSize=$("docSize").value+"px";
 $("previewBody").style.lineHeight=$("docLine").value;
 $("docStatus").textContent="Preview updated.";
}
function saveDraft(){
 try{
  const draft={version:1,title:$("docTitle").value,author:$("docAuthor").value,body:$("docBody").value,fontSize:$("docSize").value,lineSpacing:$("docLine").value,savedAt:new Date().toISOString()};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(draft));
  $("docStatus").textContent="Draft इस browser में अपने-आप save हो गया।";
 }catch(error){$("docStatus").textContent="Local save उपलब्ध नहीं है। TXT download से backup रखें।";}
}
function readLibrary(){
 try{
  const raw=localStorage.getItem(LIBRARY_KEY);
  if(!raw)return [];
  const items=JSON.parse(raw);
  if(!Array.isArray(items))return [];
  return items.filter(item=>item&&typeof item.id==="string"&&typeof item.title==="string"&&typeof item.author==="string"&&typeof item.body==="string"&&item.title.length<=120&&item.author.length<=100&&item.body.length<=30000&&["14","16","18","20"].includes(item.fontSize)&&["1.4","1.65","1.9"].includes(item.lineSpacing)).slice(0,MAX_LIBRARY_ITEMS);
 }catch(error){return [];}
}
function renderLibrary(){
 const root=$("documentLibrary");
 root.replaceChildren();
 const items=readLibrary();
 if(!items.length){const empty=document.createElement("p");empty.className="muted";empty.textContent="अभी कोई saved document नहीं है।";root.appendChild(empty);return;}
 items.forEach(item=>{
  const card=document.createElement("div");card.className="library-item";
  const info=document.createElement("div");
  const heading=document.createElement("strong");heading.textContent=item.title||"Untitled Document";
  const meta=document.createElement("p");meta.className="muted";meta.textContent=(item.author?"Prepared by: "+item.author+" · ":"")+new Date(item.updatedAt||item.createdAt||Date.now()).toLocaleString();
  info.append(heading,meta);
  const actions=document.createElement("div");actions.className="actions";
  [["open","Open"],["delete","Delete"]].forEach(([action,label])=>{const button=document.createElement("button");button.type="button";button.className=action==="delete"?"secondary":"";
   button.dataset.action=action;button.dataset.id=item.id;button.textContent=label;actions.appendChild(button);});
  card.append(info,actions);root.appendChild(card);
 });
}
function saveToLibrary(){
 const title=$("docTitle").value.trim()||"Untitled Document";
 const items=readLibrary();
 const item={id:Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8),title,author:$("docAuthor").value,body:$("docBody").value,fontSize:$("docSize").value,lineSpacing:$("docLine").value,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
 try{localStorage.setItem(LIBRARY_KEY,JSON.stringify([item,...items].slice(0,MAX_LIBRARY_ITEMS)));renderLibrary();$("docStatus").textContent="Document Saved Library में save हो गया।";}
 catch(error){$("docStatus").textContent="Library में save नहीं हो सका। Browser storage की जगह कम हो सकती है।";}
}
function openLibraryDocument(id){
 const item=readLibrary().find(entry=>entry.id===id);if(!item)return;
 $("docTitle").value=item.title;$("docAuthor").value=item.author;$("docBody").value=item.body;
 $("docSize").value=item.fontSize;$("docLine").value=item.lineSpacing;
 updateStats();updatePreview();saveDraft();$("docStatus").textContent="Saved document editor में खुल गया।";
}
function deleteLibraryDocument(id){
 const items=readLibrary();const next=items.filter(item=>item.id!==id);
 try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(next));renderLibrary();$("docStatus").textContent="Saved document library से delete हो गया.";}
 catch(error){$("docStatus").textContent="Saved document delete नहीं हो सका।";}
}
function restoreDraft(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);
  if(!raw)return false;
  const draft=JSON.parse(raw);
  if(!draft||draft.version!==1||typeof draft.title!=="string"||typeof draft.author!=="string"||typeof draft.body!=="string"||draft.title.length>120||draft.author.length>100||draft.body.length>30000||!["14","16","18","20"].includes(draft.fontSize)||!["1.4","1.65","1.9"].includes(draft.lineSpacing))return false;
  $("docTitle").value=draft.title;$("docAuthor").value=draft.author;$("docBody").value=draft.body;
  $("docSize").value=draft.fontSize;$("docLine").value=draft.lineSpacing;
  updateStats();updatePreview();
  $("docStatus").textContent="पिछला document draft इसी browser से restore हो गया।";
  return true;
 }catch(error){$("docStatus").textContent="Saved draft पढ़ा नहीं जा सका। TXT backup उपलब्ध हो तो उससे restore करें.";return false;}
}
["docBody","docTitle","docAuthor"].forEach(id=>$(id).addEventListener("input",()=>{updateStats();updatePreview();saveDraft();}));
["docSize","docLine"].forEach(id=>$(id).addEventListener("change",()=>{updatePreview();saveDraft();}));
$("updatePreviewBtn").addEventListener("click",updatePreview);
$("saveLibraryBtn").addEventListener("click",saveToLibrary);
$("pdfImportInput").addEventListener("change",event=>importPdfFile(event.target.files&&event.target.files[0]));
$("mergePdfBtn").addEventListener("click",mergePdfFiles);
$("splitPdfBtn").addEventListener("click",splitPdfFile);
$("documentLibrary").addEventListener("click",event=>{const button=event.target.closest("button[data-action][data-id]");if(!button)return;if(button.dataset.action==="open")openLibraryDocument(button.dataset.id);if(button.dataset.action==="delete")deleteLibraryDocument(button.dataset.id);});
$("printPdfBtn").addEventListener("click",()=>{updatePreview();window.print();$("docStatus").textContent="Print dialog opened. Destination में Save as PDF चुनें।";});
$("downloadTxtBtn").addEventListener("click",()=>{
 const title=$("docTitle").value.trim()||"shif-a-document";
 const author=$("docAuthor").value.trim();
 const content=(title+"\n"+(author?"Prepared by: "+author+"\n":"")+"\n"+$("docBody").value).trim()+"\n";
 const blob=new Blob([content],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=title.replace(/[^\p{L}\p{N}-]+/gu,"-").replace(/^-|-$/g,"").slice(0,60)||"shif-a-document";
 a.download+=".txt";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 $("docStatus").textContent="TXT download started.";
});
$("clearDocBtn").addEventListener("click",()=>{
 $("docTitle").value="";$("docAuthor").value="";$("docBody").value="";
 $("docSize").value="16";$("docLine").value="1.65";
 try{localStorage.removeItem(STORAGE_KEY);}catch(error){}
 updateStats();updatePreview();$("docStatus").textContent="Document और browser में save draft दोनों clear कर दिए गए।";
});
renderLibrary();
if(!restoreDraft()){updateStats();updatePreview();}
})();