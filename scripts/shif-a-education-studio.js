(function(){
"use strict";
const $=id=>document.getElementById(id);
let plans=[],cards=[],cardIndex=0,showBack=false,quiz=[];
const STORAGE_KEY="shif-a-study-v1",MAX_SAVED_ITEMS=500;
function saveStudyData(){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify({plans,cards}));return true;}
 catch(error){$("planStatus").textContent="इस browser में local save उपलब्ध नहीं है; plan download कर लें।";return false;}
}
function restoreStudyData(){
 try{
  const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return;
  const data=JSON.parse(raw);if(!data||typeof data!=="object")throw Error("Invalid saved data");
  if(Array.isArray(data.plans))plans=data.plans.filter(p=>p&&typeof p.subject==="string"&&typeof p.task==="string"&&Number.isInteger(p.minutes)&&p.minutes>=5&&p.minutes<=600).slice(0,MAX_SAVED_ITEMS).map(p=>({subject:p.subject.slice(0,100),task:p.task.slice(0,3000),minutes:p.minutes,priority:["High","Medium","Low"].includes(p.priority)?p.priority:"Medium",date:typeof p.date==="string"?p.date.slice(0,10):"",done:p.done===true}));
  if(Array.isArray(data.cards))cards=data.cards.filter(card=>card&&typeof card.question==="string"&&typeof card.answer==="string"&&card.question.trim()&&card.answer.trim()).slice(0,MAX_SAVED_ITEMS).map(card=>({question:card.question.slice(0,500),answer:card.answer.slice(0,1000)}));
 }catch(error){plans=[];cards=[];try{localStorage.removeItem(STORAGE_KEY);}catch{}$("planStatus").textContent="पुराना saved data पढ़ा नहीं जा सका; नई checklist बना सकते हैं।";}
}
restoreStudyData();
const safeDownload=(name,text)=>{const blob=new Blob([text],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);};
function setTab(tab){
 ["planner","cards","quiz"].forEach(x=>{$(x+"Panel").classList.toggle("hidden",x!==tab);document.querySelector('[data-tab="'+x+'"]').setAttribute("aria-pressed",String(x===tab));});
}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));
function renderPlans(){
 const box=$("planList");box.replaceChildren();
 if(!plans.length){box.textContent="अभी कोई task नहीं जोड़ा गया।";return;}
 const title=document.createElement("strong");title.textContent="Study checklist · "+plans.filter(p=>p.done).length+"/"+plans.length+" complete";box.appendChild(title);
 plans.forEach((p,i)=>{const row=document.createElement("label");row.className="checkrow";const cb=document.createElement("input");cb.type="checkbox";cb.checked=p.done;cb.addEventListener("change",()=>{plans[i].done=cb.checked;saveStudyData();renderPlans();});const span=document.createElement("span");span.textContent=p.subject+" · "+p.task+" ("+p.minutes+" min · "+p.priority+")";row.append(cb,span);box.appendChild(row);});
}
$("addPlan").addEventListener("click",()=>{
 const subject=$("subject").value.trim(),tasks=$("tasks").value.split(/\n+/).map(x=>x.trim()).filter(Boolean),minutes=Number($("minutes").value);
 if(!subject){$("planStatus").textContent="पहले subject भरें।";return;}
 if(!tasks.length){$("planStatus").textContent="कम-से-कम एक task लिखें।";return;}
 if(!Number.isInteger(minutes)||minutes<5||minutes>600){$("planStatus").textContent="Minutes 5 से 600 के बीच पूर्ण संख्या होनी चाहिए।";return;}
 tasks.forEach(task=>plans.push({subject,task,minutes,priority:$("priority").value,date:$("studyDate").value,done:false}));
 saveStudyData();renderPlans();$("planStatus").textContent=tasks.length+" tasks checklist में जुड़ गए।";$("tasks").value="";
});
$("exportPlan").addEventListener("click",()=>{if(!plans.length){$("planStatus").textContent="पहले checklist में tasks जोड़ें।";return;}safeDownload("shif-a-study-plan.txt",plans.map(p=>(p.done?"[x] ":"[ ] ")+p.subject+" — "+p.task+" — "+p.minutes+" min — "+p.priority+(p.date?" — "+p.date:"")).join("\n"));$("planStatus").textContent="Study plan download started.";});
function renderCard(){
 if(!cards.length){$("flashSide").textContent="Front · Question";$("flashText").textContent="पहला flashcard जोड़ें।";$("flashCount").textContent="0 cards";return;}
 const c=cards[cardIndex];$("flashSide").textContent=showBack?"Back · Answer":"Front · Question";$("flashText").textContent=showBack?c.answer:c.question;$("flashCount").textContent="Card "+(cardIndex+1)+" of "+cards.length;$("flipFlash").textContent=showBack?"Show question":"Show answer";
}
$("addFlash").addEventListener("click",()=>{const question=$("flashQuestion").value.trim(),answer=$("flashAnswer").value.trim();if(!question||!answer){$("flashStatus").textContent="Question और answer दोनों भरें।";return;}cards.push({question,answer});saveStudyData();cardIndex=cards.length-1;showBack=false;renderCard();$("flashQuestion").value="";$("flashAnswer").value="";$("flashStatus").textContent="Flashcard added.";});
$("flipFlash").addEventListener("click",()=>{if(!cards.length)return;showBack=!showBack;renderCard();});
$("prevFlash").addEventListener("click",()=>{if(!cards.length)return;cardIndex=(cardIndex-1+cards.length)%cards.length;showBack=false;renderCard();});
$("nextFlash").addEventListener("click",()=>{if(!cards.length)return;cardIndex=(cardIndex+1)%cards.length;showBack=false;renderCard();});
$("exportFlash").addEventListener("click",()=>{if(!cards.length){$("flashStatus").textContent="पहले flashcards बनाएँ।";return;}safeDownload("shif-a-flashcards.txt",cards.map((c,i)=>(i+1)+". Q: "+c.question+"\n   A: "+c.answer).join("\n\n"));$("flashStatus").textContent="Flashcards download started.";});
function renderQuiz(){
 const area=$("quizArea");area.replaceChildren();
 if(!quiz.length){area.textContent="Notes डालकर quiz बनाएँ।";return;}
 quiz.forEach((q,i)=>{
  const wrap=document.createElement("div");wrap.className="card";
  const p=document.createElement("p");p.textContent=(i+1)+". "+q.question;wrap.appendChild(p);
  q.options.forEach((opt,j)=>{const label=document.createElement("label");label.className="checkrow";const radio=document.createElement("input");radio.type="radio";radio.name="quiz-"+i;radio.value=String(j);const span=document.createElement("span");span.textContent=opt;label.append(radio,span);wrap.appendChild(label);});
  const result=document.createElement("p");result.className="status";result.id="quiz-result-"+i;wrap.appendChild(result);
  area.appendChild(wrap);
 });
 const btn=document.createElement("button");btn.type="button";btn.textContent="Check answers";btn.addEventListener("click",()=>{
  let score=0;quiz.forEach((q,i)=>{const selected=document.querySelector('input[name="quiz-'+i+'"]:checked');const correct=selected&&Number(selected.value)===q.answerIndex;if(correct)score++;$("quiz-result-"+i).textContent=correct?"Correct":"Review your notes and try again.";});
  $("quizStatus").textContent="Your practice score: "+score+" / "+quiz.length+".";
 });area.appendChild(btn);
}
$("makeQuiz").addEventListener("click",()=>{
 const lines=$("quizNotes").value.split(/\n+/).map(x=>x.trim()).filter(x=>x.length>=8);
 if(lines.length<2){$("quizStatus").textContent="कम-से-कम 2 meaningful note lines डालें।";return;}
 quiz=lines.slice(0,10).map((line,i)=>{
  const parts=line.split(/[—:।]/).map(x=>x.trim()).filter(Boolean);
  const answer=parts.length>1?parts.slice(1).join(" — "):line;
  const question=parts.length>1?parts[0]+" किससे संबंधित है?":"इस note में कौन-सा तथ्य बताया गया है?";
  const distractors=lines.filter((_,j)=>j!==i).map(x=>{const p=x.split(/[—:।]/).map(y=>y.trim()).filter(Boolean);return p.length>1?p.slice(1).join(" — "):x;});
  const options=[answer,...distractors.slice(0,3)].sort(()=>0.5-Math.random());
  return {question,options,answerIndex:options.indexOf(answer)};
 });
 $("quizStatus").textContent=quiz.length+" practice questions created from your notes. This is a simple revision aid.";renderQuiz();
});
renderPlans();renderCard();setTab("planner");
})();