(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 const state={messages:[],busy:false,controller:null};
 function status(message,error){const el=$("connectionStatus");el.textContent=message;el.style.color=error?"#ffb3b3":"#f0d18e";}
 function config(){const raw=$("baseUrl").value.trim().replace(/\/+$/,"");let url;try{url=new URL(raw);}catch(_){throw new Error("Valid API Base URL डालें।");}if(!["http:","https:"].includes(url.protocol))throw new Error("केवल HTTP/HTTPS endpoint स्वीकार है।");const model=$("modelName").value.trim();if(!model)throw new Error("Model name जरूरी है।");return {url:raw.replace(/\/v1$/,"")+"/v1",model,key:$("apiKey").value};}
 function addMessage(role,content){const el=document.createElement("div");el.className="msg "+role;el.textContent=content;$("messages").appendChild(el);$("messages").scrollTop=$("messages").scrollHeight;return el;}
 async function request(messages,signal){const c=config();const headers={"Content-Type":"application/json"};if(c.key)headers.Authorization="Bearer "+c.key;
  const response=await fetch(c.url+"/chat/completions",{method:"POST",headers,signal,body:JSON.stringify({model:c.model,messages,stream:false,max_tokens:2048})});
  if(!response.ok){const body=await response.text();throw new Error("Provider error "+response.status+": "+body.slice(0,500));}
  const data=await response.json();const answer=data&&data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content;
  if(typeof answer!=="string"||!answer.trim())throw new Error("Model ने readable text response नहीं दिया।");return answer.trim();
 }
 async function test(){try{const c=config(),headers={};if(c.key)headers.Authorization="Bearer "+c.key;status("Testing model endpoint…");const response=await fetch(c.url+"/models",{method:"GET",headers});if(!response.ok)throw new Error("Provider error "+response.status+": "+(await response.text()).slice(0,300));const data=await response.json();const models=Array.isArray(data.data)?data.data.map(x=>x.id).filter(Boolean):[];status("Endpoint reachable · "+(models.length?models.slice(0,5).join(", "):"Model list unavailable; send a test prompt to verify."));}catch(e){status("Connection failed: "+e.message,true);}}
 $("connectBtn").addEventListener("click",test);
 $("clearKeyBtn").addEventListener("click",()=>{$("apiKey").value="";status("API key cleared from this page memory.");});
 $("clearChat").addEventListener("click",()=>{state.messages=[];$("messages").replaceChildren();addMessage("system","Conversation cleared. कोई chat history save नहीं थी।");});
 $("chatForm").addEventListener("submit",async event=>{
  event.preventDefault();if(state.busy)return;const prompt=$("prompt").value.trim();if(!prompt)return;
  try{config();}catch(e){addMessage("system",e.message);return;}
  state.messages.push({role:"user",content:prompt});if(state.messages.length>20)state.messages=state.messages.slice(-20);addMessage("user",prompt);$("prompt").value="";
  state.busy=true;$("sendBtn").disabled=true;$("sendBtn").textContent="Thinking…";
  const placeholder=addMessage("assistant","Model response का इंतज़ार…");state.controller=new AbortController();
  try{const answer=await request(state.messages,state.controller.signal);placeholder.textContent=answer;state.messages.push({role:"assistant",content:answer});}
  catch(e){placeholder.textContent="Request failed: "+e.message;placeholder.className="msg system";}
  finally{state.busy=false;state.controller=null;$("sendBtn").disabled=false;$("sendBtn").textContent="Send";$("messages").scrollTop=$("messages").scrollHeight;}
 });
 window.ShifAChat=Object.freeze({clear:()=>{$("clearChat").click();},getMessageCount:()=>state.messages.length});
})();