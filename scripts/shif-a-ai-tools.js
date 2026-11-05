(function(){
"use strict";
const SUPABASE_URL="https://qmoxfzgiwamblpouxitn.supabase.co";
const SUPABASE_KEY="sb_publishable_dsVQ5-5VuIG5n_m0qqNjqw__i5sogpL";
const GATEWAY=SUPABASE_URL+"/functions/v1/shif-a-model-gateway";
const configs={
"writing-studio.html":{title:"Generate with SHIF-A AI",mode:"writing",target:"draftOutput",fields:["topic","language","format","platform","tone","audience","keywords","details"],label:"Writing Studio"},
"business-tools.html":{title:"Improve with SHIF-A AI",mode:"writing",target:"result",fields:["businessName","businessType","city","language","details","customerMessage","goal","budget","itemName","itemPrice","itemQty","taxRate"],label:"Business Toolkit"},
"coding-studio.html":{title:"Review this code with SHIF-A AI",mode:"coding",target:"codeEditor",fields:["projectMode","activeFile","codeEditor"],label:"Coding Studio"},
"research-studio.html":{title:"Analyze with SHIF-A AI",mode:"research",target:"reportOutput",fields:["topic","language","question","scope","audience","findings","gaps","conclusion"],label:"Research Workspace"},
"agents-studio.html":{title:"Refine blueprint with SHIF-A AI",mode:"writing",target:"blueprint",fields:["agentName","agentRole","agentGoal","agentInstructions","agentSteps","agentLimits"],label:"Agent Designer"},
"automation-studio.html":{title:"Review workflow with SHIF-A AI",mode:"writing",target:"flowOutput",fields:["flowName","flowTrigger","flowPurpose","flowFrequency","flowOwner","stepList","approvalMode","failureMode","dataRules"],label:"Automation Designer"},
"documents-studio.html":{title:"Improve document with SHIF-A AI",mode:"writing",target:"docBody",fields:["docTitle","docAuthor","docBody"],label:"Documents Studio"},
"education-studio.html":{title:"Explain / create practice questions with SHIF-A AI",mode:"chat",target:"quizArea",fields:["subject","quizNotes","flashQuestion","flashAnswer"],label:"Study Studio"}
};
function value(id){const el=document.getElementById(id);if(!el)return"";return ("value"in el?el.value:el.innerText||el.textContent||"").trim();}
function init(){
 const cfg=configs[location.pathname.split("/").pop()];if(!cfg)return;
 if(!window.ShifAAuth){console.warn("SHIF-A auth helper missing");return;}
 const target=document.getElementById(cfg.target);if(!target)return;
 const wrap=document.createElement("section");wrap.style.cssText="margin:14px 0;padding:12px;border:1px solid #2877a8;border-radius:10px;background:#071a31;color:#d9efff";
 const button=document.createElement("button");button.type="button";button.textContent=cfg.title;
 button.style.cssText="padding:10px 14px;border-radius:8px;border:1px solid #2386c8;background:#075a9e;color:white;font-weight:700;cursor:pointer";
 const status=document.createElement("p");status.setAttribute("role","status");status.setAttribute("aria-live","polite");status.style.cssText="font-size:12px;line-height:1.5;margin:8px 0 0;color:#a9cce6";
 const answer=document.createElement("pre");answer.hidden=true;answer.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere;margin:10px 0 0;padding:12px;border:1px solid #315a7d;border-radius:8px;background:#04101f;color:#e5f4ff;font:inherit;line-height:1.6";
 const privacy=document.createElement("small");privacy.textContent="AI request भेजने पर चुने हुए form inputs Gemini provider को भेजे जाएँगे। Password, private records या sensitive details न डालें। Login और verified email जरूरी हैं; gateway limit 10 requests/hour/account है।";
 privacy.style.cssText="display:block;margin-top:8px;color:#9db8d3;line-height:1.5";
 wrap.append(button,status,answer,privacy);target.insertAdjacentElement("afterend",wrap);
 button.addEventListener("click",async()=>{
  if(button.disabled)return;
  const parts=cfg.fields.map(id=>{const v=value(id);return v? id+":\n"+v:"";}).filter(Boolean);
  if(!parts.length){status.textContent="पहले इस tool में जानकारी भरें या draft तैयार करें।";return;}
  let prompt="You are SHIF-A AI assisting the "+cfg.label+". Work only with the information below. Do not invent missing facts. If code is supplied, review it and provide a safe, minimal patch or clear suggestions; do not claim execution or tests. For research, separate supplied evidence from assumptions and do not invent citations. Return a useful, structured response in Hindi unless the input clearly requests English.\n\n"+parts.join("\n\n");
  if(prompt.length>3900){status.textContent="Input 3,900 characters से अधिक है। कृपया कम text भेजें।";return;}
  button.disabled=true;answer.hidden=true;status.textContent="Login और email verification जाँच रहे हैं…";
  try{
   const auth=await window.ShifAAuth.getSession();
   if(auth.error||!auth.session){status.textContent="पहले SHIF-A account में login करें।";return;}
   if(!auth.user||!auth.user.email_confirmed_at){status.textContent="पहले account का email verify करें।";return;}
   status.textContent="Secure SHIF-A AI Gateway से अनुरोध भेजा जा रहा है…";
   const response=await fetch(GATEWAY,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+auth.session.access_token},body:JSON.stringify({message:prompt,model:"@cf/qwen/qwen3-30b-a3b-fp8",mode:cfg.mode})});
   const data=await response.json().catch(()=>({}));
   if(!response.ok){status.textContent=data.message||(response.status===429?"इस account की hourly limit पूरी हो गई है।":"AI service अभी जवाब नहीं दे सकी।");return;}
   if(typeof data.answer!=="string"||!data.answer.trim()){status.textContent="Model ने कोई text response नहीं दिया।";return;}
   answer.textContent=data.answer;answer.hidden=false;status.textContent="Cloudflare AI response तैयार है। इसे review करके ही अपने draft में लागू करें।";
  }catch(e){status.textContent="Network या Gateway उपलब्ध नहीं है। बाद में कोशिश करें।";}
  finally{button.disabled=false;}
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();