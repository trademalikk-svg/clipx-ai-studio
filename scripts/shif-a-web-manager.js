(function(){
"use strict";
const $=id=>document.getElementById(id);
let authorized=false,logLines=[];
function log(message){const line=new Date().toLocaleTimeString()+"  "+message;logLines.unshift(line);logLines=logLines.slice(0,80);$("activityLog").textContent=logLines.join("\n");}
function network(){const online=navigator.onLine;$("networkState").textContent=online?"Network: Online":"Network: Offline";$("networkState").className="status "+(online?"good":"warn");$("modeMetric").textContent=online?"Hybrid":"Offline";}
function setStatus(id,msg,kind){const e=$(id);e.textContent=msg;e.className="status "+(kind||"");}
async function verifyOwner(){
 try{
  if(!window.ShifAAuth)throw Error("Account module unavailable.");
  const {session,user,error}=await window.ShifAAuth.requireSession();
  if(error)throw error;if(!session||!user)throw Error("Sign in required.");
  const profile=await window.ShifAAuth.getAccessProfile(session);
  if(profile.role!=="owner")throw Error("Owner role required. Current role: "+(profile.role||"unassigned"));
  authorized=true;$("locked").classList.add("hidden");$("manager").classList.remove("hidden");$("authState").textContent="Verified Owner";$("roleMetric").textContent="Owner";log("Owner session verified. Local control plane unlocked.");return;
 }catch(e){$("authState").textContent="Locked";$("lockMessage").textContent=e.message+" Offline reload cannot re-verify access; sign in online first.";log("Access denied: "+e.message);}
}
function guard(){if(!authorized)throw Error("Owner verification required.");}
async function checkLocal(){
 guard();const base=$("ollamaUrl").value.trim().replace(/\/$/,"");if(!/^https?:\/\//i.test(base))throw Error("Enter a valid local HTTP(S) URL.");
 setStatus("localResult","Checking Ollama local runtime…","warn");
 try{const res=await fetch(base+"/api/tags",{method:"GET",cache:"no-store"});if(!res.ok)throw Error("HTTP "+res.status);const data=await res.json();const models=Array.isArray(data.models)?data.models.map(m=>m.name).filter(Boolean):[];setStatus("localResult",models.length?"Connected · Models: "+models.join(", "):"Connected · No local models found. Install a model on your own machine.","good");$("localState").textContent=models.length?"Local AI: Connected":"Local AI: No model";log("Local Ollama check completed; "+models.length+" model(s) reported.");}
 catch(e){setStatus("localResult","Local AI unavailable: "+e.message+" · Check that Ollama is running and allows this page's origin.","warn");$("localState").textContent="Local AI: Offline";log("Local AI check failed: "+e.message);}
}
async function scanRegistry(){
 guard();const tools=window.ShifATools;if(!Array.isArray(tools))throw Error("Tool registry is not loaded.");
 const ids=new Set(),duplicates=[],invalid=[];for(const t of tools){if(!t.id||ids.has(t.id))duplicates.push(t.id||"(missing id)");ids.add(t.id);if(!t.name||!t.category||!t.status)invalid.push(t.id||"(unknown)");}
 const available=tools.filter(t=>t.status==="available"||t.status==="limited").length;
 const message="Tools: "+tools.length+" · Available/limited: "+available+" · Duplicate IDs: "+duplicates.length+" · Invalid entries: "+invalid.length;
 setStatus("scanResult",message,duplicates.length||invalid.length?"warn":"good");log("Tool registry scan: "+message);
}
async function scanWorkspace(){
 guard();const paths=["workspace.html","projects.html","chat.html","coding-studio.html","ai-tools.html","user-guide.html","scripts/shif-a-tools.js","scripts/shif-a-chat.js"];let ok=0,fail=[];
 for(const path of paths){try{const r=await fetch(path,{method:"HEAD",cache:"no-store"});if(r.ok)ok++;else fail.push(path+" ("+r.status+")");}catch(e){fail.push(path+" (not cached / offline)");}}
 setStatus("scanResult","Local workspace page checks: "+ok+"/"+paths.length+" reachable"+(fail.length?" · "+fail.join(", "):""),fail.length?"warn":"good");log("Workspace scan: "+ok+"/"+paths.length+" local paths reachable.");
}
window.addEventListener("online",network);window.addEventListener("offline",network);
document.addEventListener("DOMContentLoaded",async()=>{
 network();$("checkLocal").addEventListener("click",()=>checkLocal().catch(e=>setStatus("localResult",e.message,"bad")));
 $("scanTools").addEventListener("click",()=>{try{scanRegistry();}catch(e){setStatus("scanResult",e.message,"bad");}});
 $("refreshScan").addEventListener("click",()=>scanWorkspace().catch(e=>setStatus("scanResult",e.message,"bad")));
 $("clearLog").addEventListener("click",()=>{logLines=[];$("activityLog").textContent="Local activity cleared.";});
 await verifyOwner();
});
})();