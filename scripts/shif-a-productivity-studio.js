(function(){
"use strict";
const $=id=>document.getElementById(id);
const KEY="shifa_productivity_v1";
let state={tasks:[],plans:{},notes:"",plannerDraft:{date:"",title:"",items:""}};
function load(){try{const v=JSON.parse(localStorage.getItem(KEY)||"{}");if(v&&typeof v==="object")state={tasks:Array.isArray(v.tasks)?v.tasks:[],plans:v.plans&&typeof v.plans==="object"?v.plans:{},notes:typeof v.notes==="string"?v.notes:"",plannerDraft:v.plannerDraft&&typeof v.plannerDraft==="object"?{date:typeof v.plannerDraft.date==="string"?v.plannerDraft.date:"",title:typeof v.plannerDraft.title==="string"?v.plannerDraft.title.slice(0,120):"",items:typeof v.plannerDraft.items==="string"?v.plannerDraft.items.slice(0,4000):""}:{date:"",title:"",items:""}};}catch{}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{$("taskStatus").textContent="Browser storage unavailable or full; export important work.";return false;}}
function download(name,content){const blob=new Blob([content],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function today(){const d=new Date(),offset=d.getTimezoneOffset();return new Date(d.getTime()-offset*60000).toISOString().slice(0,10);}
function setTab(tab){["tasks","planner","notes","focus"].forEach(x=>{$(x+"Panel").classList.toggle("hidden",x!==tab);document.querySelector('[data-tab="'+x+'"]').setAttribute("aria-pressed",String(x===tab));});}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));
function renderTasks(){
 const list=$("taskList");list.replaceChildren();
 const filter=$("taskFilter").value,shown=state.tasks.filter(t=>filter==="all"||(filter==="done"&&t.done)||(filter==="open"&&!t.done));
 if(!shown.length){list.textContent="No matching tasks.";return;}
 shown.forEach(t=>{
  const row=document.createElement("div");row.className="rowtask";
  const cb=document.createElement("input");cb.type="checkbox";cb.checked=t.done;cb.setAttribute("aria-label","Mark task complete");cb.addEventListener("change",()=>{t.done=cb.checked;persist();renderTasks();});
  const span=document.createElement("span");span.textContent=t.title+" · "+t.priority+(t.due?" · Due "+t.due:"");if(t.done)span.className="done";
  const del=document.createElement("button");del.type="button";del.className="secondary";del.textContent="Delete";del.addEventListener("click",()=>{state.tasks=state.tasks.filter(x=>x.id!==t.id);persist();renderTasks();});
  row.append(cb,span,del);list.appendChild(row);
 });
}
$("addTask").addEventListener("click",()=>{const title=$("taskTitle").value.trim();if(!title){$("taskStatus").textContent="पहले task लिखें।";return;}state.tasks.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),title,due:$("taskDue").value,priority:$("taskPriority").value,done:false});persist();$("taskTitle").value="";$("taskStatus").textContent="Task added.";renderTasks();});
$("taskFilter").addEventListener("change",renderTasks);
$("clearDone").addEventListener("click",()=>{state.tasks=state.tasks.filter(t=>!t.done);persist();renderTasks();$("taskStatus").textContent="Completed tasks cleared.";});
$("planDate").value=today();
if(state.plannerDraft.date)$("planDate").value=state.plannerDraft.date;
$("planTitle").value=state.plannerDraft.title;
$("planItems").value=state.plannerDraft.items;
function savePlannerDraft(){state.plannerDraft={date:$("planDate").value,title:$("planTitle").value.slice(0,120),items:$("planItems").value.slice(0,4000)};persist();$("planStatus").textContent="Plan draft auto-saved in this browser.";}
$("savePlan").addEventListener("click",()=>{const date=$("planDate").value,title=$("planTitle").value.trim(),items=$("planItems").value.trim();if(!date||!items){$("planStatus").textContent="Date और कम-से-कम एक plan item भरें।";return;}state.plans[date]={title,items};state.plannerDraft={date,title,items};persist();$("planStatus").textContent="Plan saved in this browser.";});
$("loadPlan").addEventListener("click",()=>{const p=state.plans[$("planDate").value];if(!p){$("planTitle").value="";$("planItems").value="";savePlannerDraft();$("planStatus").textContent="इस तारीख के लिए saved plan नहीं मिला।";return;}$("planTitle").value=p.title||"";$("planItems").value=p.items||"";savePlannerDraft();$("planStatus").textContent="Plan loaded.";});
$("downloadPlan").addEventListener("click",()=>{const p=state.plans[$("planDate").value]||{title:$("planTitle").value,items:$("planItems").value};if(!p.items){$("planStatus").textContent="पहले plan लिखें या load करें।";return;}download("shif-a-daily-plan.txt",p.title+"\nDate: "+$("planDate").value+"\n\n"+p.items);$("planStatus").textContent="Download started.";});
$("quickNotes").value=state.notes;
$("quickNotes").addEventListener("input",()=>{state.notes=$("quickNotes").value;persist();$("notesStatus").textContent="Notes auto-saved in this browser.";});
["planDate","planTitle","planItems"].forEach(id=>$(id).addEventListener("input",savePlannerDraft));
["planDate","planTitle","planItems"].forEach(id=>$(id).addEventListener("change",savePlannerDraft));
$("saveNotes").addEventListener("click",()=>{state.notes=$("quickNotes").value;persist();$("notesStatus").textContent="Notes saved in this browser.";});
$("downloadNotes").addEventListener("click",()=>{const n=$("quickNotes").value;if(!n.trim()){$("notesStatus").textContent="पहले notes लिखें।";return;}download("shif-a-quick-notes.txt",n);$("notesStatus").textContent="Download started.";});
$("clearNotes").addEventListener("click",()=>{if(!confirm("क्या आप इस browser से सभी saved quick notes हटाना चाहते हैं?"))return;state.notes="";$("quickNotes").value="";persist();$("notesStatus").textContent="Notes cleared.";});
let remaining=25*60,interval=null,running=false;
function display(){const m=Math.floor(remaining/60),s=remaining%60;$("timerDisplay").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");}
function stopTimer(){if(interval!==null){clearInterval(interval);interval=null;}running=false;}
function resetTimer(){stopTimer();remaining=Number($("focusMinutes").value)*60;display();$("timerState").textContent="Ready when you are.";}
$("focusMinutes").addEventListener("change",()=>{if(!running)resetTimer();});
$("startTimer").addEventListener("click",()=>{if(running||remaining<=0)return;running=true;$("timerState").textContent="Focus session running"+($("focusLabel").value.trim()?": "+$("focusLabel").value.trim():"")+".";
 interval=setInterval(()=>{remaining=Math.max(0,remaining-1);display();if(remaining===0){stopTimer();$("timerState").textContent="Session complete. Take a comfortable break."; }},1000);
});
$("pauseTimer").addEventListener("click",()=>{if(!running)return;stopTimer();$("timerState").textContent="Paused.";});
$("resetTimer").addEventListener("click",resetTimer);
load();renderTasks();resetTimer();setTab("tasks");
})();