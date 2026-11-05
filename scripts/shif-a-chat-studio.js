(function(){
"use strict";
const $=id=>document.getElementById(id),KEY="shifAChatStudio.v1";
const SUPABASE_URL="https://qmoxfzgiwamblpouxitn.supabase.co";
const SUPABASE_KEY="sb_publishable_dsVQ5-5VuIG5n_m0qqNjqw__i5sogpL";
const GATEWAY=SUPABASE_URL+"/functions/v1/shif-a-model-gateway";
let chats=[],activeId=null,sending=false;
const presets={
 explain:"Explain the following topic step by step in simple Hindi. Include a short example:\n\n",
 write:"Help me draft clear, original content for this purpose. Ask for missing context instead of inventing facts:\n\n",
 code:"Help me plan and review this code. Explain assumptions, edge cases and tests. Do not claim code was run unless it was actually tested:\n\n",
 summarize:"Summarize the following text into key points. Preserve important facts and uncertainties:\n\n"
};
function id(){return "chat-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);}
function setStatus(s){$("chatStatus").textContent=s;}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(chats));}catch(e){setStatus("Browser storage unavailable or full. Export your chats.");}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||"[]");chats=Array.isArray(d)?d.filter(c=>c&&typeof c.id==="string"&&Array.isArray(c.messages)):[];}catch(e){chats=[];}}
function safeText(v){return typeof v==="string"?v:"";}
function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function active(){return chats.find(c=>c.id===activeId)||null;}
function renderHistory(){
 const list=$("historyList");list.replaceChildren();
 if(!chats.length){const p=document.createElement("p");p.className="empty";p.textContent="अभी कोई conversation नहीं है।";list.appendChild(p);return;}
 chats.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).forEach(c=>{const b=document.createElement("button");b.type="button";b.className=c.id===activeId?"active":"";const first=c.messages.find(m=>m.role==="user");b.textContent=safeText(c.title)||safeText(first&&first.content).slice(0,42)||"New conversation";b.addEventListener("click",()=>{activeId=c.id;render();});list.appendChild(b);});
}
function renderMessages(){
 const list=$("messageList");list.replaceChildren();const c=active();
 if(!c||!c.messages.length){const p=document.createElement("div");p.className="bubble system";p.textContent="अपना सवाल लिखें और Send to SHIF-A AI दबाएँ।";list.appendChild(p);return;}
 c.messages.forEach(m=>{const b=document.createElement("div");b.className="bubble "+(m.role==="assistant"?"assistant":"user");const label=document.createElement("small");label.textContent=(m.role==="assistant"?"SHIF-A AI":"YOU")+" · "+new Date(m.createdAt||Date.now()).toLocaleString();const body=document.createElement("div");body.textContent=safeText(m.content);b.append(label,body);list.appendChild(b);});
 list.scrollTop=list.scrollHeight;
}
function render(){const c=active();$("chatTitle").textContent=c?(c.title||"Conversation"):"New conversation";$("deleteChatBtn").disabled=!c;$("exportTxtBtn").disabled=!c;$("exportJsonBtn").disabled=!c;renderHistory();renderMessages();}
function newChat(){const c={id:id(),title:"New conversation",createdAt:Date.now(),updatedAt:Date.now(),messages:[]};chats.push(c);activeId=c.id;persist();render();$("messageInput").focus();}
function addMessage(role,content,model){const c=active();const now=Date.now();c.messages.push({role,content,model:model||null,createdAt:now});c.updatedAt=now;if(c.title==="New conversation"&&role==="user")c.title=content.replace(/\s+/g," ").slice(0,48)+(content.length>48?"…":"");persist();render();}
async function sendMessage(){
 if(sending)return;
 const content=$("messageInput").value.trim();if(!content){setStatus("पहले अपना सवाल लिखें।");return;}if(content.length>4000){setStatus("Gateway की सीमा 4,000 characters है।");return;}
 if(!window.ShifAAuth){setStatus("Login library load नहीं हुई। Page refresh करके फिर कोशिश करें।");return;}
 sending=true;$("sendMessageBtn").disabled=true;setStatus("Sign-in जाँच रहे हैं…");
 try{
  const auth=await window.ShifAAuth.getSession();
  if(auth.error||!auth.session){setStatus("SHIF-A AI इस्तेमाल करने के लिए पहले अपने account में login करें।");return;}
  if(!auth.user||!auth.user.email_confirmed_at){setStatus("पहले अपने account का email confirm करें।");return;}
  if(!activeId||!active())newChat();
  addMessage("user",content,$("modelSelect").value);
  $("messageInput").value="";$("charCount").textContent="0 / 12000";
  setStatus("SHIF-A Gateway से सुरक्षित अनुरोध भेज रहे हैं…");
  const response=await fetch(GATEWAY,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+auth.session.access_token},body:JSON.stringify({message:content,model:$("modelSelect").value,mode:$("modeSelect").value})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){
   const msg=data.message||(
    response.status===503?"Model provider अभी configured नहीं है। कोई AI जवाब generate नहीं हुआ।":
    response.status===429?"इस account की hourly request limit पूरी हो गई है। बाद में कोशिश करें.":
    response.status===401?"Login session expire हो गया है। दोबारा login करें.":"Gateway request पूरी नहीं हुई।"
   );
   setStatus(msg);return;
  }
  if(typeof data.answer!=="string"||!data.answer.trim()){setStatus("Model ने कोई text reply नहीं दिया।");return;}
  addMessage("assistant",data.answer,data.model);setStatus("SHIF-A AI ने जवाब दिया · "+data.model);
 }catch(e){setStatus("Network या gateway connection उपलब्ध नहीं है। थोड़ी देर बाद कोशिश करें.");}
 finally{sending=false;$("sendMessageBtn").disabled=false;}
}
$("newChatBtn").addEventListener("click",newChat);
$("messageInput").addEventListener("input",()=>{$("charCount").textContent=$("messageInput").value.length+" / 12000";});
$("saveMessageBtn").addEventListener("click",()=>{const content=$("messageInput").value.trim();if(!content){setStatus("पहले अपना prompt लिखें।");return;}if(!activeId||!active())newChat();addMessage("user",content);$("messageInput").value="";$("charCount").textContent="0 / 12000";setStatus("Draft इस browser में save हो गया।");});
$("sendMessageBtn").addEventListener("click",sendMessage);
$("messageInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();sendMessage();}});
document.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>{$("messageInput").value=presets[b.dataset.preset];$("charCount").textContent=$("messageInput").value.length+" / 12000";$("messageInput").focus();}));
$("deleteChatBtn").addEventListener("click",()=>{if(!active())return;chats=chats.filter(c=>c.id!==activeId);activeId=chats.length?chats[0].id:null;persist();render();setStatus("Conversation इस browser से delete कर दी गई।");});
$("exportTxtBtn").addEventListener("click",()=>{const c=active();if(!c)return;const body=(c.title||"Conversation")+"\n\n"+c.messages.map(m=>m.role.toUpperCase()+"\n"+m.content).join("\n\n");download("shif-a-chat.txt",body,"text/plain;charset=utf-8");});
$("exportJsonBtn").addEventListener("click",()=>{const c=active();if(c)download("shif-a-chat.json",JSON.stringify(c,null,2),"application/json");});
$("exportAllBtn").addEventListener("click",()=>download("shif-a-all-chats.json",JSON.stringify(chats,null,2),"application/json"));
load();if(chats.length)activeId=chats.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0].id;render();
})();