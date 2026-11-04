(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const state={messages:[],busy:false,controller:null,project:null};
 function status(message,error){const el=$("connectionStatus");el.textContent=message;el.style.color=error?"#ffb3b3":"#f0d18e";}
 function config(){let raw=$("baseUrl").value.trim();while(raw.endsWith("/"))raw=raw.slice(0,-1);let url;try{url=new URL(raw);}catch(_){throw new Error("Valid API Base URL डालें।");}if(!["http:","https:"].includes(url.protocol))throw new Error("केवल HTTP/HTTPS endpoint स्वीकार है।");const model=$("modelName").value.trim();if(!model)throw new Error("Model name जरूरी है।");const base=raw.endsWith("/v1")?raw:raw+"/v1";return {url:base,model,key:$("apiKey").value};}
 function addMessage(role,content){const el=document.createElement("div");el.className="msg "+role;el.textContent=content;$("messages").appendChild(el);$("messages").scrollTop=$("messages").scrollHeight;return el;}
 function projectContext(){if(!state.project)return null;return {role:"system",content:"You are assisting with the user's SHIF-A project named: "+state.project.name+". Project category: "+state.project.category+". Project description: "+(state.project.description||"Not provided")+". Keep answers relevant to this project when applicable. Do not claim access to project files or tools unless they are explicitly provided."};}
 async function loadProjects(){const select=$("projectSelect");if(!select)return;try{if(!window.ShifAAuth)throw new Error("Account module unavailable");const auth=await window.ShifAAuth.requireSession();if(auth.error)throw auth.error;if(!auth.session){select.replaceChildren(new Option("Sign in to load private projects",""));return;}const SUPABASE_URL="https://qmoxfzgiwamblpouxitn.supabase.co",KEY="sb_publishable_dsVQ5-5VuIG5n_m0qqNjqw__i5sogpL";const client=window.supabase.createClient(SUPABASE_URL,KEY);const {data,error}=await client.from("shif_a_projects").select("id,name,description,category").order("updated_at",{ascending:false}).limit(50);if(error)throw error;select.replaceChildren(new Option("General chat (no project)",""));(data||[]).forEach(p=>{const opt=new Option(p.name,p.id);opt.dataset.name=p.name;opt.dataset.category=p.category||"general";opt.dataset.description=p.description||"";select.add(opt);});select.disabled=false;status((data||[]).length?"Private projects loaded. Select one to add its context.":"No saved projects found. Create one in Project OS.");}catch(error){select.replaceChildren(new Option("Project list unavailable",""));select.disabled=true;status("Project context unavailable: login करें और Project OS migration लागू होने की जाँच करें।",true);}}
 async function request(messages,signal,onToken){const c=config();const headers={"Content-Type":"application/json"};if(c.key)headers.Authorization="Bearer "+c.key;
  const response=await fetch(c.url+"/chat/completions",{method:"POST",headers,signal,body:JSON.stringify({model:c.model,messages,stream:true,max_tokens:2048})});
  if(!response.ok){const body=await response.text();throw new Error("Provider error "+response.status+": "+body.slice(0,500));}
  if(!response.body||!response.body.getReader)throw new Error("इस browser में streaming response उपलब्ध नहीं है।");
  const reader=response.body.getReader(),decoder=new TextDecoder();let buffer="",answer="";
  while(true){const part=await reader.read();buffer+=decoder.decode(part.value||new Uint8Array(),{stream:!part.done});const lines=buffer.split(/\r?\n/);buffer=lines.pop()||"";
   for(const line of lines){if(!line.startsWith("data:"))continue;const payload=line.slice(5).trim();if(!payload||payload==="[DONE]")continue;let data;try{data=JSON.parse(payload);}catch(_){continue;}const token=data&&data.choices&&data.choices[0]&&data.choices[0].delta&&data.choices[0].delta.content;if(typeof token==="string"&&token){answer+=token;onToken(answer);}}
   if(part.done)break;
  }
  if(!answer.trim())throw new Error("Model ने readable text response नहीं दिया।");return answer.trim();
 }
 async function test(){try{const c=config(),headers={};if(c.key)headers.Authorization="Bearer "+c.key;status("Testing model endpoint…");const response=await fetch(c.url+"/models",{method:"GET",headers});if(!response.ok)throw new Error("Provider error "+response.status+": "+(await response.text()).slice(0,300));const data=await response.json();const models=Array.isArray(data.data)?data.data.map(x=>x.id).filter(Boolean):[];status("Endpoint reachable · "+(models.length?models.slice(0,5).join(", "):"Model list unavailable; send a test prompt to verify."));}catch(e){status("Connection failed: "+e.message,true);}}
 function setBusy(busy){state.busy=busy;$("sendBtn").disabled=busy;$("sendBtn").textContent=busy?"Generating…":"Send";$("stopBtn").hidden=!busy;}
 function exportChat(){const lines=["# SHIF-A AI Chat",state.project?"Project: "+state.project.name:"General chat",""];for(const m of state.messages){lines.push("## "+(m.role==="user"?"You":"SHIF-A AI"),"",m.content,"");}const blob=new Blob([lines.join("\n")],{type:"text/markdown;charset=utf-8"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="shif-a-chat.md";document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);status("Chat export तैयार किया गया।");}
 $("projectSelect").addEventListener("change",()=>{const option=$("projectSelect").selectedOptions[0];const id=$("projectSelect").value;state.project=id?{id,name:option.dataset.name||option.textContent,category:option.dataset.category||"general",description:option.dataset.description||""}:null;status(state.project?"Project context active: "+state.project.name:"General chat selected.");});
 $("connectBtn").addEventListener("click",test);
 $("clearKeyBtn").addEventListener("click",()=>{$("apiKey").value="";status("API key cleared from this page memory.");});
 $("exportChat").addEventListener("click",exportChat);
 $("stopBtn").addEventListener("click",()=>{if(state.controller)state.controller.abort();});
 $("clearChat").addEventListener("click",()=>{if(state.busy)return;state.messages=[];$("messages").replaceChildren();addMessage("system","Conversation cleared. कोई chat history save नहीं थी।");});
 $("chatForm").addEventListener("submit",async event=>{
  event.preventDefault();if(state.busy)return;const prompt=$("prompt").value.trim();if(!prompt)return;
  try{config();}catch(e){addMessage("system",e.message);return;}
  state.messages.push({role:"user",content:prompt});if(state.messages.length>20)state.messages=state.messages.slice(-20);addMessage("user",prompt);$("prompt").value="";
  setBusy(true);const placeholder=addMessage("assistant","");state.controller=new AbortController();
  try{const context=projectContext();const payload=context?[context,...state.messages]:state.messages;const answer=await request(payload,state.controller.signal,text=>{placeholder.textContent=text;$("messages").scrollTop=$("messages").scrollHeight;});placeholder.textContent=answer;state.messages.push({role:"assistant",content:answer});if(state.messages.length>20)state.messages=state.messages.slice(-20);}
  catch(e){placeholder.textContent=e.name==="AbortError"?"Generation stopped.":"Request failed: "+e.message;placeholder.className="msg system";}
  finally{state.controller=null;setBusy(false);$("messages").scrollTop=$("messages").scrollHeight;}
 });
 window.ShifAChat=Object.freeze({clear:()=>{$("clearChat").click();},getMessageCount:()=>state.messages.length,getProject:()=>state.project});
 document.addEventListener("DOMContentLoaded",loadProjects);
})();