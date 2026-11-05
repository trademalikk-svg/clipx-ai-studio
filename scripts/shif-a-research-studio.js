(function(){
"use strict";
const $=id=>document.getElementById(id),STORAGE_KEY="shifA.researchStudio.workspace.v1";
let sources=[],last=null;
const fieldIds=["topic","language","question","scope","audience","findings","gaps","conclusion"];
const sourceTypes=["Official / Government","Academic / Research","Primary data","News / Journalism","Industry report","Other"];
const qualityValues=[...document.querySelectorAll(".quality")].map(x=>x.value);
function saveWorkspace(){
 try{
  localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,fields:Object.fromEntries(fieldIds.map(id=>[id,$(id).value])),sources,qualityChecks:[...document.querySelectorAll(".quality:checked")].map(x=>x.value),last,output:$("reportOutput").textContent,savedAt:new Date().toISOString()}));
 }catch(e){$("reportStatus").textContent="इस browser में draft save नहीं हो सका। TXT/JSON export backup रखें।";}
}
function restoreWorkspace(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;
  const d=JSON.parse(raw);if(!d||d.version!==1||!d.fields||typeof d.fields!=="object"||!Array.isArray(d.sources)||d.sources.length>50)return;
  const limits={topic:180,question:1500,scope:300,audience:180,findings:4000,gaps:2000,conclusion:2500};
  for(const [id,max] of Object.entries(limits)){if(typeof d.fields[id]==="string")$(id).value=d.fields[id].slice(0,max);}
  if(["Hindi","English","Hindi + English"].includes(d.fields.language))$("language").value=d.fields.language;
  sources=d.sources.filter(s=>s&&typeof s==="object"&&typeof s.title==="string"&&typeof s.url==="string"&&typeof s.note==="string"&&sourceTypes.includes(s.type)).slice(0,50).map(s=>{
   try{const u=new URL(s.url);if(!["http:","https:"].includes(u.protocol))return null;return {title:s.title.slice(0,180),url:u.href,type:s.type,note:s.note.slice(0,1200)};}catch(e){return null;}
  }).filter(Boolean);
  document.querySelectorAll(".quality").forEach(x=>{x.checked=Array.isArray(d.qualityChecks)&&d.qualityChecks.includes(x.value)&&qualityValues.includes(x.value);});
  if(d.last&&d.last.schemaVersion==="1.0"&&Array.isArray(d.last.sources)&&typeof d.output==="string"){last=d.last;$("reportOutput").textContent=d.output.slice(0,30000);}
  renderSources();$("reportStatus").textContent="पिछला research draft इस browser से restore हुआ।";
 }catch(e){try{localStorage.removeItem(STORAGE_KEY);}catch(_){}}
}
function renderSources(){
 const root=$("sourceList");root.replaceChildren();
 if(!sources.length){const p=document.createElement("p");p.className="muted";p.textContent="अभी कोई source नहीं जोड़ा गया।";root.append(p);return;}
 sources.forEach((s,i)=>{const card=document.createElement("article");card.className="source";const head=document.createElement("div");head.className="source-head";const title=document.createElement("strong");title.textContent=(i+1)+". "+s.title;const del=document.createElement("button");del.type="button";del.className="remove";del.textContent="Remove";del.addEventListener("click",()=>{sources.splice(i,1);renderSources();saveWorkspace();});head.append(title,del);const type=document.createElement("p");type.className="muted";type.textContent=s.type;const link=document.createElement("a");link.href=s.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent=s.url;const note=document.createElement("p");note.textContent=s.note||"No notes added.";card.append(head,type,link,note);root.append(card);});
}
$("addSource").addEventListener("click",()=>{
 const url=$("sourceUrl").value.trim(),title=$("sourceTitle").value.trim();let parsed;
 try{parsed=new URL(url);}catch(e){}
 if(!parsed||!["https:","http:"].includes(parsed.protocol)){$("sourceStatus").textContent="Valid http:// या https:// URL दर्ज करें।";return;}
 if(!title){$("sourceStatus").textContent="Source title दर्ज करें।";return;}
 if(sources.length>=50){$("sourceStatus").textContent="अधिकतम 50 sources जोड़े जा सकते हैं।";return;}
 sources.push({title:title.slice(0,180),url:parsed.href,type:$("sourceType").value,note:$("sourceNote").value.trim().slice(0,1200)});
 $("sourceUrl").value="";$("sourceTitle").value="";$("sourceNote").value="";renderSources();saveWorkspace();$("sourceStatus").textContent="Source जोड़ा गया। Link खोलकर details verify करना न भूलें।";
});
function collect(){return {schemaVersion:"1.0",topic:$("topic").value.trim(),language:$("language").value,question:$("question").value.trim(),scope:$("scope").value.trim(),audience:$("audience").value.trim(),sources:sources.map((s,i)=>({...s,number:i+1})),qualityChecks:[...document.querySelectorAll(".quality:checked")].map(x=>x.value),findings:$("findings").value.trim(),gaps:$("gaps").value.trim(),conclusion:$("conclusion").value.trim(),verificationNote:"Sources and claims were not automatically fetched or verified by this workspace.",createdAt:new Date().toISOString()};}
function build(){
 last=collect();const r=last;
 const lines=["# Research report: "+(r.topic||"Untitled topic"),"Language: "+r.language,"Scope: "+(r.scope||"Not specified"),"Audience: "+(r.audience||"Not specified"),"","## Research question",r.question||"(Not provided)","","## Sources",...(r.sources.length?r.sources.map(s=>s.number+". "+s.title+" ["+s.type+"]\n   "+s.url+"\n   Notes: "+(s.note||"None")):["No sources added."]),"","## Evidence quality checks",...(r.qualityChecks.length?r.qualityChecks.map(x=>"- "+x):["No checks marked."]),"","## Key findings",r.findings||"(Not provided)","","## Gaps / unanswered questions",r.gaps||"(Not provided)","","## Working conclusion",r.conclusion||"(Not provided)","","NOTE: This workspace does not fetch or verify sources. Independently check every source, date and claim before relying on this report."];
 $("reportOutput").textContent=lines.join("\n");$("reportStatus").textContent="Research report तैयार है। यह आपके दर्ज किए गए notes पर आधारित है।";saveWorkspace();
}
$("buildReport").addEventListener("click",build);
$("resetAll").addEventListener("click",()=>{
 if(!confirm("इस browser workspace के सभी research notes हटाएँ?"))return;
 sources=[];fieldIds.forEach(id=>$(id).value="");$("sourceUrl").value="";$("sourceTitle").value="";$("sourceNote").value="";$("language").selectedIndex=0;$("sourceType").selectedIndex=0;document.querySelectorAll(".quality").forEach(x=>x.checked=false);last=null;renderSources();$("reportOutput").textContent="आपकी research report यहाँ दिखाई देगी।";$("reportStatus").textContent="Workspace reset हो गया।";$("exportStatus").textContent="";try{localStorage.removeItem(STORAGE_KEY);}catch(e){}
});
document.querySelectorAll(fieldIds.map(id=>"#"+id).join(",")+",.quality").forEach(el=>{el.addEventListener("input",saveWorkspace);el.addEventListener("change",saveWorkspace);});
$("copyReport").addEventListener("click",async()=>{if(!last)build();try{await navigator.clipboard.writeText($("reportOutput").textContent);$("exportStatus").textContent="Report copied.";}catch(e){const range=document.createRange();range.selectNodeContents($("reportOutput"));const sel=getSelection();sel.removeAllRanges();sel.addRange(range);$("exportStatus").textContent="Text select कर दिया है; अब Copy चुनें।";}});
function download(name,data,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);$("exportStatus").textContent=name+" डाउनलोड शुरू हुआ।";}
$("downloadReport").addEventListener("click",()=>{if(!last)build();download("shif-a-research-report.txt",$("reportOutput").textContent,"text/plain;charset=utf-8");});
$("downloadData").addEventListener("click",()=>{if(!last)build();download("shif-a-research-data.json",JSON.stringify(last,null,2),"application/json");});
restoreWorkspace();renderSources();
})();