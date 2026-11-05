(function(){
"use strict";
const $=id=>document.getElementById(id);
const STORAGE_KEY="shifA.agentsStudio.workspace.v1";
let current=null;
function collect(){
 const permissions=[...document.querySelectorAll('input[name="perm"]:checked')].map(x=>x.value);
 const steps=$("agentSteps").value.split(/\r?\n/).map(s=>s.replace(/^\s*\d+[.)-]?\s*/,"").trim()).filter(Boolean);
 return {schemaVersion:"1.0",type:"agent-workflow-blueprint",name:$("agentName").value.trim()||"Untitled Agent",role:$("agentRole").value,objective:$("agentGoal").value.trim(),instructions:$("agentInstructions").value.trim(),steps,boundaries:$("agentLimits").value.trim(),permissions,execution:{status:"not-connected",note:"Blueprint only. No model, external tools or autonomous execution are connected."},createdAt:new Date().toISOString()};
}
function saveWorkspace(){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,fields:{agentName:$("agentName").value,agentRole:$("agentRole").value,agentGoal:$("agentGoal").value,agentInstructions:$("agentInstructions").value,agentSteps:$("agentSteps").value,agentLimits:$("agentLimits").value},permissions:[...document.querySelectorAll('input[name="perm"]:checked')].map(x=>x.value),current,output:$("blueprint").textContent,savedAt:new Date().toISOString()}));}catch(e){$("formStatus").textContent="इस browser में draft save नहीं हो सका।";}
}
function restoreWorkspace(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;
  const data=JSON.parse(raw);if(!data||data.version!==1||!data.fields||typeof data.fields!=="object")return;
  const limits={agentName:70,agentGoal:1500,agentInstructions:3000,agentSteps:2500,agentLimits:1500};
  for(const [id,max] of Object.entries(limits)){const value=data.fields[id];if(typeof value==="string")$(id).value=value.slice(0,max);}
  if(["General assistant","Research assistant","Content planner","Coding assistant","Business assistant","Study coach","Customer support assistant"].includes(data.fields.agentRole))$("agentRole").value=data.fields.agentRole;
  const allowed=[...document.querySelectorAll('input[name="perm"]')].map(x=>x.value);
  document.querySelectorAll('input[name="perm"]').forEach(x=>x.checked=Array.isArray(data.permissions)&&data.permissions.includes(x.value)&&allowed.includes(x.value));
  if(data.current&&data.current.type==="agent-workflow-blueprint"&&Array.isArray(data.current.steps)&&Array.isArray(data.current.permissions)){current=data.current;$("blueprint").textContent=typeof data.output==="string"?data.output:"आपका workflow blueprint यहाँ दिखाई देगा।";}
  $("formStatus").textContent="पिछला draft इस browser से restore हुआ।";
 }catch(e){try{localStorage.removeItem(STORAGE_KEY);}catch(_){}}
}
function render(){
 current=collect();
 const lines=["# "+current.name,"Role: "+current.role,"","## Objective",current.objective||"(Not provided)","","## Instructions",current.instructions||"(Not provided)","","## Workflow steps",...(current.steps.length?current.steps.map((s,i)=>(i+1)+". "+s):["(No steps provided)"]),"","## Tool permissions",...(current.permissions.length?current.permissions.map(p=>"- "+p):["- None selected"]),"","## Boundaries / approvals",current.boundaries||"(Not provided)","","Execution: NOT CONNECTED — this is a reusable blueprint, not a running AI agent."];
 $("blueprint").textContent=lines.join("\n");
 $("formStatus").textContent="Blueprint तैयार है। नीचे से copy या export करें।";saveWorkspace();
}
$("buildBlueprint").addEventListener("click",render);
$("resetForm").addEventListener("click",()=>{ $("agentName").value="My Task Agent";$("agentRole").selectedIndex=0;["agentGoal","agentInstructions","agentSteps","agentLimits"].forEach(id=>$(id).value="");document.querySelectorAll('input[name="perm"]').forEach(x=>x.checked=false);$("blueprint").textContent="आपका workflow blueprint यहाँ दिखाई देगा। पहले ऊपर agent profile भरें।";$("formStatus").textContent="Form reset हो गया।";$("outputStatus").textContent="";current=null;try{localStorage.removeItem(STORAGE_KEY);}catch(e){}});
document.querySelectorAll("#agentName,#agentRole,#agentGoal,#agentInstructions,#agentSteps,#agentLimits,input[name='perm']").forEach(el=>{el.addEventListener("input",saveWorkspace);el.addEventListener("change",saveWorkspace);});
$("copyBlueprint").addEventListener("click",async()=>{if(!current)render();try{await navigator.clipboard.writeText($("blueprint").textContent);$("outputStatus").textContent="Blueprint copied.";}catch(e){const range=document.createRange();range.selectNodeContents($("blueprint"));const sel=getSelection();sel.removeAllRanges();sel.addRange(range);$("outputStatus").textContent="Text select कर दिया है; अब Copy चुनें।";}});
function download(name,data,type){const blob=new Blob([data],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);$("outputStatus").textContent=name+" डाउनलोड शुरू हुआ।";}
$("downloadJson").addEventListener("click",()=>{if(!current)render();download("shif-a-agent-blueprint.json",JSON.stringify(current,null,2),"application/json");});
$("downloadText").addEventListener("click",()=>{if(!current)render();download("shif-a-agent-blueprint.txt",$("blueprint").textContent,"text/plain;charset=utf-8");});
restoreWorkspace();
})();