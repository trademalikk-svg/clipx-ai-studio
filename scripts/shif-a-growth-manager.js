(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const status=$("growthStatus");
 function showError(message){status.textContent=message;status.className="status warning";}
 function renderKeywords(items){
  const q=$("keywordSearch").value.trim().toLowerCase();
  const rows=items.filter(item=>[item.keyword,item.targetPage,item.intent,item.language].join(" ").toLowerCase().includes(q));
  const body=$("keywordTable");body.replaceChildren();
  if(!rows.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=6;td.textContent="इस खोज में कोई keyword नहीं मिला।";tr.appendChild(td);body.appendChild(tr);return;}
  rows.forEach(item=>{
   const tr=document.createElement("tr");
   [item.keyword,item.language==="hi"?"Hindi":"English",item.intent,item.targetPage,item.trend,item.priority].forEach(value=>{const td=document.createElement("td");td.textContent=String(value||"—");tr.appendChild(td);});
   body.appendChild(tr);
  });
 }
 async function boot(){
  if(!window.ShifAAuth){showError("Account service load नहीं हुई। Refresh करें।");return;}
  const result=await window.ShifAAuth.requireSession();
  if(result.error||!result.user||!result.session){showError("इस Owner-only पेज के लिए verified login जरूरी है।");return;}
  let access;
  try{access=await window.ShifAAuth.getAccessProfile(result.session);}
  catch(error){showError("Server access profile verify नहीं हो सका। Access बंद रखा गया है।");return;}
  if(!access||access.role!=="owner"){showError("Access denied: केवल verified Owner इस Growth Manager को खोल सकता है।");return;}
  status.textContent="Owner access verified. Keyword data load हो रहा है…";
  try{
   const response=await fetch("data/shif-a-keywords.json",{cache:"no-store"});
   if(!response.ok)throw new Error("Keyword map file उपलब्ध नहीं है।");
   const data=await response.json();
   if(!Array.isArray(data.keywords))throw new Error("Keyword map format सही नहीं है।");
   renderKeywords(data.keywords);
   $("keywordUpdated").textContent="Keyword map updated: "+data.lastUpdated+" · "+data.keywords.length+" tracked terms";
   $("keywordSourceNote").textContent=data.note||"";
   $("growthContent").classList.remove("hidden");
   status.textContent="Owner access verified · ₹0 budget mode";
   $("keywordSearch").addEventListener("input",()=>renderKeywords(data.keywords));
  }catch(error){showError(error.message||"Keyword data load नहीं हुआ।");}
 }
 document.addEventListener("DOMContentLoaded",boot);
})();