(function(){
"use strict";
const $=id=>document.getElementById(id);
const supported=new Set(["video-prompts","creator-kit","ai-chat","writing-studio","translation-studio","meeting-notes","presentation-studio","seo-studio","social-media-studio","ad-copy-studio","brand-kit","video-script","web-research","fact-checker","code-reviewer","api-builder","workflow-builder","email-assistant","data-analyst","spreadsheet-assistant","education-studio","productivity-studio"]);
const guides={
"video-prompts":"Create a detailed video-generation prompt with subject, scene, camera, lighting, motion, style, duration and aspect ratio. Ask for Hindi or English if unspecified.",
"creator-kit":"Create platform-ready titles, descriptions, captions and relevant hashtags. Avoid false claims and keyword stuffing.",
"ai-chat":"Answer the user's question clearly. State uncertainty and distinguish facts from assumptions.",
"writing-studio":"Write a clear, structured draft matching the requested audience, language and tone.",
"translation-studio":"Translate faithfully, preserve meaning and tone, and explain ambiguous phrases separately.",
"meeting-notes":"Organize supplied notes into summary, decisions, action items, owners and open questions. Do not invent missing details.",
"presentation-studio":"Create a slide-by-slide outline with concise titles, key points and speaker notes.",
"seo-studio":"Suggest search intent, primary/secondary keywords, title, meta description and practical on-page improvements. Do not promise rankings.",
"social-media-studio":"Create a realistic content plan with platform, topic, hook, format, caption and CTA.",
"ad-copy-studio":"Draft several truthful ad-copy options with audience, headline, body and CTA. Do not invent offers.",
"brand-kit":"Develop brand positioning, audience, voice, messaging pillars and visual direction.",
"video-script":"Create a structured script with hook, scenes, narration, on-screen text and closing CTA.",
"web-research":"Analyze only information supplied by the user. Clearly mark claims needing external verification; this local tool does not browse the web.",
"fact-checker":"Break supplied text into checkable claims, identify evidence needed and label each claim unverified unless sources are provided.",
"code-reviewer":"Review supplied code for bugs, security risks and maintainability. Give findings with severity and suggested fixes.",
"api-builder":"Design an API contract with endpoints, methods, request/response examples, validation and error cases.",
"workflow-builder":"Design a workflow with triggers, steps, approvals, failure handling and audit events.",
"email-assistant":"Draft a concise email based on the user's supplied facts; do not invent recipient addresses or commitments.",
"data-analyst":"Analyze only pasted data. Show calculation assumptions and do not fabricate missing rows or metrics.",
"spreadsheet-assistant":"Explain formulas and spreadsheet transformations using the user's supplied columns and examples.",
"education-studio":"Explain the supplied learning topic at the requested level with examples and a short recap.",
"productivity-studio":"Turn the supplied task into a prioritized, realistic action plan."
};
let controller=null;
const examples={
"video-prompts":"Create a 30-second vertical 9:16 video prompt about [topic]. Include scene-by-scene visuals, camera movement, lighting, mood and negative prompts.",
"creator-kit":"Platform: YouTube Shorts. Topic: [topic]. Audience: [audience]. Create 5 titles, a description, caption and relevant hashtags.",
"ai-chat":"Explain [question/topic] with a short answer, key details and one practical example.",
"writing-studio":"Write a [format] about [topic] for [audience]. Tone: [tone]. Include a clear structure.",
"translation-studio":"Translate the following text into [target language]. Preserve meaning, names and tone: [paste text].",
"meeting-notes":"Turn these meeting notes into summary, decisions, action items, owners and open questions: [paste notes].",
"presentation-studio":"Create an 8-slide presentation outline about [topic] for [audience]. Include slide titles and speaker notes.",
"seo-studio":"Website/page: [URL or description]. Audience: [audience]. Suggest search intent, keywords, title, meta description and on-page improvements.",
"social-media-studio":"Create a 7-day content plan for [brand/topic] on [platform]. Audience: [audience].",
"ad-copy-studio":"Product/service: [details]. Audience: [audience]. Create 3 truthful ad variations with headline, body and CTA.",
"brand-kit":"Brand name: [name]. Industry: [industry]. Audience: [audience]. Develop positioning, brand voice and visual direction.",
"video-script":"Write a [duration] video script about [topic] for [platform]. Include hook, scenes, voiceover and CTA.",
"web-research":"Research question: [question]. Here are the source excerpts I have: [paste source text]. Summarize evidence and gaps.",
"fact-checker":"Check these claims using only the sources I provide. Claims: [paste]. Sources: [paste URLs or excerpts].",
"code-reviewer":"Review this code for bugs, security issues and maintainability. Explain severity and fixes: [paste code].",
"api-builder":"Design an API for [use case]. Include endpoints, methods, schemas, validation and error responses.",
"workflow-builder":"Design a workflow for [goal]. Include trigger, steps, approvals, failure handling and audit log.",
"email-assistant":"Draft an email to [recipient role] about [purpose]. Tone: [tone]. Facts to include: [facts].",
"data-analyst":"Analyze this dataset and explain key trends. Data and column meanings: [paste data].",
"spreadsheet-assistant":"I use [Excel/Sheets]. Help with this task: [task]. Columns and sample rows: [paste].",
"education-studio":"Teach me [topic] at [level]. Explain concepts with examples and a short recap.",
"productivity-studio":"Help plan this goal: [goal]. Deadline: [date]. Available time/resources: [details]."
};
function getTool(id){return (window.ShifATools||[]).find(t=>t.id===id);}
function fillTool(id){const t=getTool(id);if(!t||!supported.has(id)){ $("toolTitle").textContent="This tool needs a dedicated media or file engine";$("toolDescription").textContent="This runner currently supports text-based tasks only. Image, audio, video processing and file conversion require separate engines.";return;}
$("toolTitle").textContent=t.name;$("toolDescription").textContent=t.description; $("toolSelect").value=id;}
function endpoint(){const base=$("baseUrl").value.trim().replace(/\/+$/,"");const u=new URL(base);if(!["http:","https:"].includes(u.protocol))throw Error("Use an HTTP or HTTPS endpoint.");const model=$("model").value.trim();if(!model)throw Error("Model name is required.");return{url:base.endsWith("/v1")?base:base+"/v1",model,key:$("apiKey").value.trim()};}
async function test(){try{const c=endpoint();$("connectionStatus").textContent="Checking…";const h={};if(c.key)h.Authorization="Bearer "+c.key;const r=await fetch(c.url+"/models",{headers:h,cache:"no-store"});if(!r.ok)throw Error("HTTP "+r.status);const d=await r.json();$("connectionStatus").textContent="Connected · "+((d.data||[]).length)+" model(s) reported.";}catch(e){$("connectionStatus").textContent="Connection failed: "+e.message;}}
async function run(){const id=$("toolSelect").value,t=getTool(id),input=$("prompt").value.trim();if(!t||!supported.has(id))throw Error("Choose a supported text tool.");if(!input)throw Error("Enter task details first.");const c=endpoint();controller=new AbortController();$("runTool").disabled=true;$("stopTool").disabled=false;$("runStatus").textContent="Generating with your configured local/provider AI…";$("output").textContent="";
const language=$("responseLanguage").value,length=$("outputLength").value;
const languageRule=language==="hi"?"Respond in Hindi.":language==="en"?"Respond in English.":"Respond in the same language as the user's input.";
const lengthRule=length==="short"?"Keep the answer concise.":length==="detailed"?"Give a detailed, well-structured answer with examples where useful.":"Use a balanced level of detail.";
const body={model:c.model,stream:true,messages:[{role:"system",content:"You are the SHIF-A AI "+t.name+". "+(guides[id]||"Help with the task accurately.")+" "+languageRule+" "+lengthRule+" Be transparent about uncertainty. Never claim to have performed external actions."},{role:"user",content:input}],temperature:0.5};
try{const headers={"Content-Type":"application/json"};if(c.key)headers.Authorization="Bearer "+c.key;const r=await fetch(c.url+"/chat/completions",{method:"POST",headers,body:JSON.stringify(body),signal:controller.signal});if(!r.ok)throw Error("AI endpoint returned HTTP "+r.status);if(!r.body)throw Error("Streaming response is unavailable.");const reader=r.body.getReader(),decoder=new TextDecoder();let buffer="",result="";
while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split("\n");buffer=lines.pop()||"";for(const line of lines){if(!line.startsWith("data:"))continue;const raw=line.slice(5).trim();if(raw==="[DONE]")continue;let packet;try{packet=JSON.parse(raw);}catch(_){continue;}const part=packet.choices?.[0]?.delta?.content||"";result+=part;$("output").textContent=result;}}
$("runStatus").textContent="Completed · "+result.length+" characters. Verify important facts before use.";
}catch(e){$("runStatus").textContent=e.name==="AbortError"?"Generation stopped.":"Error: "+e.message;}finally{controller=null;$("runTool").disabled=false;$("stopTool").disabled=true;}}
document.addEventListener("DOMContentLoaded",()=>{const select=$("toolSelect");(window.ShifATools||[]).filter(t=>supported.has(t.id)).forEach(t=>select.add(new Option(t.name,t.id)));const params=new URLSearchParams(location.search),id=params.get("tool");if(id&&supported.has(id))select.value=id;fillTool(select.value);select.addEventListener("change",()=>fillTool(select.value));$("testConnection").addEventListener("click",test);$("promptTemplate").addEventListener("click",()=>{$("prompt").value=examples[select.value]||"Describe your task, audience and expected result.";$("prompt").focus();});$("runTool").addEventListener("click",()=>run().catch(e=>$("runStatus").textContent=e.message));$("stopTool").addEventListener("click",()=>controller?.abort());$("copyOutput").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("output").textContent);$("runStatus").textContent="Output copied.";}catch(e){$("runStatus").textContent="Copy failed: "+e.message;}});});
})();