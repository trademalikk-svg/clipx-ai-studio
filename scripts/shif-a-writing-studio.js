(function(){
"use strict";
const $=id=>document.getElementById(id);
let latestDraft="";
const clean=s=>String(s||"").trim();
function listPoints(value){return clean(value).split(/[\n,;]+/).map(x=>x.trim()).filter(Boolean);}
function buildDraft(data){
 const topic=data.topic, audience=data.audience||"दर्शकों", platform=data.platform, points=listPoints(data.details), keywords=listPoints(data.keywords);
 const hi=data.language==="hi", en=data.language==="en", both=data.language==="both";
 const intro=hi?"आज हम बात करेंगे: "+topic:en?"Today, let's talk about: "+topic:"आज का विषय / Today's topic: "+topic;
 const pointText=points.length?points.map((p,i)=>(i+1)+". "+p).join("\n"):hi?"इस विषय के 2–3 सबसे जरूरी पहलू आसान भाषा में समझाएँ।":en?"Explain 2–3 key ideas in simple language.":"मुख्य बातें आसान भाषा में समझाएँ / Explain the key ideas simply.";
 const tags=keywords.length?keywords.map(k=>"#"+k.replace(/\s+/g,"")).join(" "):"#Creator #Content #"+topic.split(/\s+/).slice(0,2).join("");
 const toneHi={friendly:"दोस्तों, इसे आसान तरीके से समझते हैं।",emotional:"कभी-कभी एक छोटी-सी बात हमारी सोच बदल देती है।",informative:"आइए, इस विषय को तथ्यों और स्पष्ट उदाहरणों के साथ समझें।",professional:"इस विषय के प्रमुख पहलुओं पर संक्षेप में नज़र डालते हैं।",energetic:"तैयार हैं? चलिए सीधे मुद्दे पर आते हैं!"};
 const toneEn={friendly:"Let's break this down in a simple way.",emotional:"Sometimes one small idea can change how we see things.",informative:"Let's understand this with clear points and examples.",professional:"Here are the key points to understand.",energetic:"Ready? Let's get straight into it!"};
 const hookHi="क्या आपने कभी सोचा है कि "+topic+" आपके लिए क्यों महत्वपूर्ण हो सकता है?";
 const hookEn="Have you ever wondered why "+topic+" matters?";
 const ctaHi=["अगर यह जानकारी उपयोगी लगी, तो इसे share करें।","अपना अनुभव comment में बताइए।","ऐसे और content के लिए follow/subscribe करें।"];
 const ctaEn=["Share this if you found it useful.","Tell us your experience in the comments.","Follow or subscribe for more content like this."];
 if(data.format==="hooks")return (hi?["शुरुआती Hook ideas:","1. "+hookHi,"2. एक आम गलती जो लोग "+topic+" में करते हैं…","3. "+topic+" को समझने का आसान तरीका।"].join("\n"):en?["Opening hook ideas:","1. "+hookEn,"2. One common mistake people make about "+topic+"…","3. A simple way to understand "+topic+"."].join("\n"):["Opening hook ideas / शुरुआत के विकल्प:",hookHi,hookEn,"एक आम गलती जो लोग "+topic+" में करते हैं…"].join("\n"));
 if(data.format==="cta")return (hi?ctaHi:en?ctaEn:[...ctaHi,...ctaEn]).map((x,i)=>(i+1)+". "+x).join("\n");
 if(data.format==="script"){
  if(hi)return "शीर्षक: "+topic+"\nPlatform: "+platform+"\nAudience: "+audience+"\n\n[HOOK – पहले 3 सेकंड]\n"+hookHi+"\n\n[INTRO]\n"+toneHi[data.tone]+"\n\n[मुख्य बातें]\n"+pointText+"\n\n[ENDING]\nयाद रखें: "+topic+" को समझकर छोटे कदमों से शुरुआत करें।\n\n[CTA]\n"+ctaHi.join("\n");
  if(en)return "TITLE: "+topic+"\nPlatform: "+platform+"\nAudience: "+audience+"\n\n[HOOK – first 3 seconds]\n"+hookEn+"\n\n[INTRO]\n"+toneEn[data.tone]+"\n\n[KEY POINTS]\n"+pointText+"\n\n[ENDING]\nRemember: understand "+topic+" and start with one practical step.\n\n[CTA]\n"+ctaEn.join("\n");
  return "TITLE / शीर्षक: "+topic+"\nPlatform: "+platform+"\nAudience: "+audience+"\n\n[HOOK]\n"+hookHi+"\n"+hookEn+"\n\n[INTRO]\n"+toneHi[data.tone]+" "+toneEn[data.tone]+"\n\n[KEY POINTS / मुख्य बातें]\n"+pointText+"\n\n[CTA]\n"+ctaHi[0]+"\n"+ctaEn[0];
 }
 if(data.format==="youtube"){
  const desc=hi?"इस वीडियो में हम "+topic+" को आसान भाषा में समझेंगे। "+toneHi[data.tone]:en?"In this video, we explore "+topic+". "+toneEn[data.tone]:"इस वीडियो में "+topic+" समझेंगे। / In this video, we explore "+topic+".";
  return "VIDEO DESCRIPTION\n\n"+desc+"\n\nइस वीडियो में / In this video:\n"+pointText+"\n\nAudience: "+audience+"\nPlatform: "+platform+"\n\n"+tags+"\n\n"+(hi?ctaHi[0]:en?ctaEn[0]:ctaHi[0]+" / "+ctaEn[0]);
 }
 const post=hi?topic+"\n\n"+toneHi[data.tone]+"\n"+pointText+"\n\n"+ctaHi[0]:en?topic+"\n\n"+toneEn[data.tone]+"\n"+pointText+"\n\n"+ctaEn[0]:topic+"\n\n"+toneHi[data.tone]+" / "+toneEn[data.tone]+"\n"+pointText+"\n\n"+ctaHi[0]+" / "+ctaEn[0];
 return "SOCIAL POST · "+platform+"\n\n"+post+"\n\n"+tags;
}
$("generateBtn").addEventListener("click",()=>{
 const topic=clean($("topic").value);
 if(!topic){$("formStatus").textContent="पहले Topic / Main idea भरें।";$("topic").focus();return;}
 const data={topic,language:$("language").value,format:$("format").value,platform:$("platform").value,tone:$("tone").value,audience:clean($("audience").value),keywords:clean($("keywords").value),details:clean($("details").value)};
 latestDraft=buildDraft(data);
 $("draftOutput").textContent=latestDraft;
 $("formStatus").textContent="Draft तैयार है। Publish करने से पहले facts और wording जाँच लें।";
 $("outputStatus").textContent="";
});
$("clearBtn").addEventListener("click",()=>{["topic","audience","keywords","details"].forEach(id=>$(id).value="");latestDraft="";$("draftOutput").textContent="आपका draft यहाँ दिखाई देगा।";$("formStatus").textContent="Fields clear कर दिए गए।";$("outputStatus").textContent="";});
$("copyBtn").addEventListener("click",async()=>{if(!latestDraft){$("outputStatus").textContent="पहले draft तैयार करें।";return;}try{await navigator.clipboard.writeText(latestDraft);$("outputStatus").textContent="Draft copied."; }catch{$("outputStatus").textContent="Clipboard permission नहीं मिली। Text select करके copy करें।";}});
$("downloadBtn").addEventListener("click",()=>{if(!latestDraft){$("outputStatus").textContent="पहले draft तैयार करें।";return;}const blob=new Blob([latestDraft],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="shif-a-writing-draft.txt";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);$("outputStatus").textContent="Text file download शुरू हुआ।";});

$("generateAiBtn").addEventListener("click",async()=>{
 const topic=clean($("topic").value);
 if(!topic){$("formStatus").textContent="पहले Topic / Main idea भरें।";$("topic").focus();return;}
 if(!window.ShifAAI){$("formStatus").textContent="Gemini AI client load नहीं हुआ। Page refresh करें।";return;}
 const data={topic,language:$("language").value,format:$("format").value,platform:$("platform").value,tone:$("tone").value,audience:clean($("audience").value),keywords:clean($("keywords").value),details:clean($("details").value)};
 const prompt=[
  "Create polished, original creator content for SHIF-A Writing Studio.",
  "Topic: "+data.topic,"Language: "+data.language,"Format: "+data.format,
  "Platform: "+data.platform,"Tone: "+data.tone,"Audience: "+(data.audience||"general audience"),
  "Keywords: "+(data.keywords||"none"),"Required points: "+(data.details||"Choose relevant points without inventing factual claims."),
  "Use clear structure, a strong opening, useful substance and a suitable ending. If facts are uncertain, mark them for verification. Return only the finished draft."
 ].join("\n");
 $("generateAiBtn").disabled=true;
 $("formStatus").textContent="Gemini 3.8 Flash से draft तैयार हो रहा है…";
 try{
  latestDraft=await window.ShifAAI.request(prompt,"writing");
  $("draftOutput").textContent=latestDraft;
  $("formStatus").textContent="Gemini AI draft तैयार है। Publish करने से पहले facts जाँच लें।";
  $("outputStatus").textContent="Generated by Gemini 3.8 Flash.";
 }catch(error){$("formStatus").textContent=error.message||"Gemini request पूरी नहीं हुई।";}
 finally{$("generateAiBtn").disabled=false;}
});
})();