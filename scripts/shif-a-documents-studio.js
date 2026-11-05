(function(){
"use strict";
const $=id=>document.getElementById(id);
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
["docBody","docTitle","docAuthor"].forEach(id=>$(id).addEventListener("input",updateStats));
$("docSize").addEventListener("change",updatePreview);
$("docLine").addEventListener("change",updatePreview);
$("updatePreviewBtn").addEventListener("click",updatePreview);
$("printPdfBtn").addEventListener("click",()=>{updatePreview();window.print();$("docStatus").textContent="Print dialog opened. Destination में Save as PDF चुनें।";});
$("downloadTxtBtn").addEventListener("click",()=>{
 const title=$("docTitle").value.trim()||"shif-a-document";
 const author=$("docAuthor").value.trim();
 const content=(title+"\n"+(author?"Prepared by: "+author+"\n":"")+"\n"+$("docBody").value).trim()+"\n";
 const blob=new Blob([content],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download=title.replace(/[^\p{L}\p{N}-]+/gu,"-").replace(/^-|-$/g,"").slice(0,60)||"shif-a-document";
 a.download+=".txt";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 $("docStatus").textContent="TXT download started.";
});
$("clearDocBtn").addEventListener("click",()=>{
 $("docTitle").value="";$("docAuthor").value="";$("docBody").value="";updateStats();updatePreview();$("docStatus").textContent="Document cleared.";
});
updateStats();updatePreview();
})();