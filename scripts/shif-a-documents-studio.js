(function(){
"use strict";
const $=id=>document.getElementById(id);
const STORAGE_KEY="shifA.documentsStudio.draft.v1";
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
if(!restoreDraft()){updateStats();updatePreview();}
})();