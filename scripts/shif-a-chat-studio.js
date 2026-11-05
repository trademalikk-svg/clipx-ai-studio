(function(){
"use strict";
const $=id=>document.getElementById(id),KEY="shifAChatStudio.v1";
let chats=[],activeId=null,storageAvailable=true;
const presets={
 explain:"Explain the following topic step by step in simple Hindi. Include a short example:\n\n",
 write:"Help me draft clear, original content for this purpose. Ask for missing context instead of inventing facts:\n\n",
 code:"Help me plan and review this code. Explain assumptions, edge cases and tests. Do not claim code was run unless it was actually tested:\n\n",
 summarize:"Summarize the following text into key points. Preserve important facts and uncertainties:\n\n"
};
function id(){return "chat-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);}
function setStatus(s){$("chatStatus").textContent=s;}
function persist(){
 try{localStorage.setItem(KEY,JSON.stringify(chats));storageAvailable=true;setStatus("Saved locally in this browser.");}
 catch(e){storageAvailable=false;setStatus("Browser storage unavailable or full. Export your conversations to keep a copy.");}
}
function load(){
 try{const data=JSON.parse(localStorage.getItem(KEY)||"[]");chats=Array.isArray(data)?data.filter(c=>c&&typeof c.id==="string"&&Array.isArray(c.messages)):[];}
 catch(e){chats=[];setStatus("Saved chat data could not be read. Starting with an empty workspace.");}
}
function safeText(value){return typeof value==="string"?value:"";}
function download(name,content,type){
 const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function active(){return chats.find(c=>c.id===activeId)||null;}
function renderHistory(){
 const list=$("historyList");list.replaceChildren();
 if(!chats.length){const p=document.createElement("p");p.className="empty";p.textContent="अभी कोई conversation नहीं है।";list.appendChild(p);return;}
 chats.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).forEach(c=>{
  const b=document.createElement("button");b.type="button";b.className=c.id===activeId?"active":"";
  const first=c.messages.find(m=>m.role==="user");b.textContent=safeText(c.title)||safeText(first&&first.content).slice(0,42)||"New conversation";
  b.addEventListener("click",()=>{activeId=c.id;render();});list.appendChild(b);
 });
}
function renderMessages(){
 const list=$("messageList");list.replaceChildren();const c=active();
 if(!c||!c.messages.length){const p=document.createElement("div");p.className="bubble system";p.textContent="अपना prompt लिखें। इसे conversation में save किया जाएगा, लेकिन AI engine connect होने तक उत्तर नहीं मिलेगा।";list.appendChild(p);return;}
 c.messages.forEach(m=>{const b=document.createElement("div");b.className="bubble user";const label=document.createElement("small");label.textContent="YOU · "+new Date(m.createdAt||Date.now()).toLocaleString();const body=document.createElement("div");body.textContent=safeText(m.content);b.append(label,body);list.appendChild(b);});
 const note=document.createElement("div");note.className="bubble system";note.textContent="AI engine connected नहीं है। आपके prompts सुरक्षित रूप से draft के रूप में save हैं; कोई AI reply generate नहीं हुआ।";list.appendChild(note);list.scrollTop=list.scrollHeight;
}
function render(){
 const c=active();$("chatTitle").textContent=c?(c.title||"Conversation"):"New conversation";
 $("deleteChatBtn").disabled=!c;$("exportTxtBtn").disabled=!c;$("exportJsonBtn").disabled=!c;
 renderHistory();renderMessages();
}
function newChat(){const c={id:id(),title:"New conversation",createdAt:Date.now(),updatedAt:Date.now(),messages:[]};chats.push(c);activeId=c.id;persist();render();$("messageInput").focus();}
$("newChatBtn").addEventListener("click",newChat);
$("messageInput").addEventListener("input",()=>{$("charCount").textContent=$("messageInput").value.length+" / 12000";});
$("saveMessageBtn").addEventListener("click",()=>{
 const content=$("messageInput").value.trim();if(!content){setStatus("पहले अपना prompt लिखें।");return;}
 if(content.length>12000){setStatus("Prompt 12,000 characters से छोटा रखें।");return;}
 if(!activeId||!active())newChat();
 const c=active(),now=Date.now();c.messages.push({role:"user",content,createdAt:now});c.updatedAt=now;
 if(c.title==="New conversation")c.title=content.replace(/\s+/g," ").slice(0,48)+(content.length>48?"…":"");
 $("messageInput").value="";$("charCount").textContent="0 / 12000";persist();render();
 setStatus("Prompt save हो गया। AI engine connect होने तक कोई generated reply उपलब्ध नहीं है।");
});
document.querySelectorAll("[data-preset]").forEach(button=>button.addEventListener("click",()=>{
 const prefix=presets[button.dataset.preset];$("messageInput").value=prefix;$("charCount").textContent=prefix.length+" / 12000";$("messageInput").focus();
}));
$("deleteChatBtn").addEventListener("click",()=>{
 if(!active())return;chats=chats.filter(c=>c.id!==activeId);activeId=chats.length?chats[0].id:null;persist();render();setStatus("Conversation इस browser से delete कर दी गई।");
});
$("exportTxtBtn").addEventListener("click",()=>{
 const c=active();if(!c)return;const body=(c.title||"Conversation")+"\n\n"+c.messages.map(m=>"YOU ("+new Date(m.createdAt).toLocaleString()+")\n"+m.content).join("\n\n")+"\n\n[AI engine is not connected; no assistant replies were generated.]";
 download("shif-a-chat.txt",body,"text/plain;charset=utf-8");
});
$("exportJsonBtn").addEventListener("click",()=>{const c=active();if(c)download("shif-a-chat.json",JSON.stringify(c,null,2),"application/json");});
$("exportAllBtn").addEventListener("click",()=>download("shif-a-all-chats.json",JSON.stringify(chats,null,2),"application/json"));
load();if(chats.length)activeId=chats.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0].id;render();
})();