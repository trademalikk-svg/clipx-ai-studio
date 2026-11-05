(function(){
"use strict";
const configs={
"writing-studio.html":{title:"Improve with Gemini AI",mode:"writing",target:"draftOutput",fields:["topic","language","format","platform","tone","audience","keywords","details"],label:"Writing Studio"},
"business-tools.html":{title:"Improve with Gemini AI",mode:"writing",target:"result",fields:["businessName","businessType","city","language","details","customerMessage","goal","budget","itemName","itemPrice","itemQty","taxRate"],label:"Business Toolkit"},
"coding-studio.html":{title:"Review with Gemini AI",mode:"coding",target:"codeEditor",fields:["projectMode","activeFile","codeEditor"],label:"Coding Studio"},
"research-studio.html":{title:"Analyze with Gemini AI",mode:"research",target:"reportOutput",fields:["topic","language","question","scope","audience","findings","gaps","conclusion"],label:"Research Workspace"},
"agents-studio.html":{title:"Refine with Gemini AI",mode:"writing",target:"blueprint",fields:["agentName","agentRole","agentGoal","agentInstructions","agentSteps","agentLimits"],label:"Agent Designer"},
"automation-studio.html":{title:"Review with Gemini AI",mode:"writing",target:"flowOutput",fields:["flowName","flowTrigger","flowPurpose","flowFrequency","flowOwner","stepList","approvalMode","failureMode","dataRules"],label:"Automation Designer"},
"documents-studio.html":{title:"Improve with Gemini AI",mode:"writing",target:"docBody",fields:["docTitle","docAuthor","docBody"],label:"Documents Studio"},
"education-studio.html":{title:"Ask Gemini AI",mode:"chat",target:"quizArea",fields:["subject","quizNotes","flashQuestion","flashAnswer"],label:"Study Studio"}
};
function value(id){const el=document.getElementById(id);if(!el)return"";return ("value"in el?el.value:el.innerText||el.textContent||"").trim();}
function init(){
 const cfg=configs[location.pathname.split("/").pop()];if(!cfg)return;
 if(!window.ShifAAI){console.warn("SHIF-A Gemini client missing");return;}
 const target=document.getElementById(cfg.target);if(!target)return;
 const wrap=document.createElement("section");wrap.style.cssText="margin:14px 0;padding:12px;border:1px solid #2877a8;border-radius:10px;background:#071a31;color:#d9efff";
 const button=document.createElement("button");button.type="button";button.textContent=cfg.title;
 button.style.cssText="padding:10px 14px;border-radius:8px;border:1px solid #2386c8;background:#075a9e;color:white;font-weight:700;cursor:pointer";
 const status=document.createElement("p");status.setAttribute("role","status");status.setAttribute("aria-live","polite");status.style.cssText="font-size:12px;line-height:1.5;margin:8px 0 0;color:#a9cce6";
 const answer=document.createElement("pre");answer.hidden=true;answer.style.cssText="white-space:pre-wrap;overflow-wrap:anywhere;margin:10px 0 0;padding:12px;border:1px solid #315a7d;border-radius:8px;background:#04101f;color:#e5f4ff;font:inherit;line-height:1.6";
 const privacy=document.createElement("small");privacy.textContent="Gemini 3.8 Flash · चुने हुए inputs AI service को भेजे जाएँगे। Password या sensitive personal details न डालें। Login और verified email आवश्यक हैं; account पर 10 requests/hour की सीमा है।";
 privacy.style.cssText="display:block;margin-top:8px;color:#9db8d3;line-height:1.5";
 wrap.append(button,status,answer,privacy);target.insertAdjacentElement("afterend",wrap);
 button.addEventListener("click",async()=>{
  if(button.disabled)return;
  const parts=cfg.fields.map(id=>{const v=value(id);return v?id+":\n"+v:"";}).filter(Boolean);
  if(!parts.length){status.textContent="पहले इस tool में जानकारी भरें या draft तैयार करें।";return;}
  const prompt="You are SHIF-A AI assisting the "+cfg.label+". Work only with the information below. Do not invent missing facts. If code is supplied, review it and provide safe suggestions; do not claim execution or tests. For research, separate evidence from assumptions and do not invent citations. Return a useful, structured response in Hindi unless the input clearly requests English.\n\n"+parts.join("\n\n");
  if(prompt.length>3900){status.textContent="Input 3,900 characters से अधिक है। कृपया कम text भेजें।";return;}
  button.disabled=true;answer.hidden=true;status.textContent="Gemini 3.8 Flash से अनुरोध भेजा जा रहा है…";
  try{
   const result=await window.ShifAAI.request(prompt,cfg.mode);
   answer.textContent=result;answer.hidden=false;status.textContent="Gemini AI response तैयार है। इसे review करके ही लागू करें।";
  }catch(error){status.textContent=error.message||"Gemini request पूरी नहीं हुई।";}
  finally{button.disabled=false;}
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();