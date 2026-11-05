(function(){
"use strict";
const URL="https://qmoxfzgiwamblpouxitn.supabase.co";
const KEY="sb_publishable_dsVQ5-5VuIG5n_m0qqNjqw__i5sogpL";
const $=id=>document.getElementById(id);
const status=$("securityStatus");
const client=window.supabase.createClient(URL,KEY,{auth:{experimental:{passkey:true}}});
function say(message,warning){status.textContent=message;status.className=warning?"status warning":"status";}
function recoverySay(message,warning){const node=$("recoveryStatus");if(node){node.textContent=message;node.className=warning?"status warning":"status";}}
async function owner(){
 const {data:{session},error}=await client.auth.getSession();if(error)throw error;
 if(!session)return {ok:false,session:null};
 const r=await fetch(URL+"/functions/v1/shif-a-access",{headers:{apikey:KEY,Authorization:"Bearer "+session.access_token}});
 const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(p.error||"Server access check failed.");
 return {ok:p.role==="owner",session};
}
async function render(){
 try{const access=await owner();$("signedOut").classList.toggle("hidden",access.ok);$("ownerControls").classList.toggle("hidden",!access.ok);say(access.ok?"Verified Owner session active.":"Owner passkey sign-in के लिए तैयार।");}
 catch(e){$("signedOut").classList.remove("hidden");$("ownerControls").classList.add("hidden");say("Owner status verify नहीं हो सका: "+e.message,true);}
}
$("directLogin").addEventListener("click",async()=>{
 const button=$("directLogin");button.disabled=true;let signed=false;say("Device authenticator खुल रहा है…");
 try{const {data,error}=await client.auth.signInWithPasskey();if(error)throw error;if(!data.session)throw new Error("Supabase session नहीं मिली।");signed=true;const access=await owner();if(!access.ok)throw new Error("यह passkey Owner account से संबंधित नहीं है।");say("Owner Direct Passkey Login सफल।");await render();}
 catch(e){if(signed){try{await client.auth.signOut();}catch(_){say("Owner verification विफल हुई। कृपया तुरंत Sign out करें।",true);return;}}say(e.message||"Passkey login असफल रहा।",true);await render();}
 finally{button.disabled=false;}
});
$("registerPasskey").addEventListener("click",async()=>{
 const button=$("registerPasskey");button.disabled=true;
 try{const access=await owner();if(!access.ok)throw new Error("Owner verification required.");const {error}=await client.auth.registerPasskey();if(error)throw error;say("Passkey इस account में register हो गई।");await listPasskeys();}
 catch(e){say(e.message||"Passkey registration असफल रही।",true);}finally{button.disabled=false;}
});
async function listPasskeys(){
 const access=await owner();if(!access.ok)throw new Error("Owner verification required.");
 const {data,error}=await client.auth.passkey.list();if(error)throw error;
 const box=$("passkeyList");box.replaceChildren();
 const select=$("revokePasskeyId");if(select)select.replaceChildren();
 if(!data||!data.length){box.textContent="अभी कोई passkey registered नहीं है।";if(select){const o=document.createElement("option");o.value="";o.textContent="कोई passkey उपलब्ध नहीं";select.append(o);}return;}
 const ul=document.createElement("ul");
 data.forEach(item=>{
  const li=document.createElement("li");li.textContent=(item.friendly_name||"Passkey")+" · "+new Date(item.created_at).toLocaleString("hi-IN");ul.append(li);
  if(select){const option=document.createElement("option");option.value=item.id;option.textContent=(item.friendly_name||"Passkey")+" · "+new Date(item.created_at).toLocaleDateString("hi-IN");select.append(option);}
 });
 box.append(ul);
}
$("listPasskeys").addEventListener("click",async()=>{try{await listPasskeys();say("Passkey list प्राप्त हुई।");}catch(e){say(e.message,true);}});
$("signOut").addEventListener("click",async()=>{const {error}=await client.auth.signOut();if(error)say(error.message,true);else{say("Sign out हो गया।");await render();}});
$("sendPasswordReset").addEventListener("click",async()=>{
 const button=$("sendPasswordReset"),email=$("recoveryEmail").value.trim().toLowerCase();
 if(!email||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){recoverySay("कृपया valid verified email दर्ज करें।",true);return;}
 button.disabled=true;
 try{const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:"https://trademalikk-svg.github.io/clipx-ai-studio/owner-security.html"});if(error)throw error;recoverySay("यदि इस email से account मौजूद है, तो reset instructions भेज दी गई हैं। Inbox और spam folder देखें।");}
 catch(_){recoverySay("अभी request पूरी नहीं हो सकी। कुछ देर बाद दोबारा कोशिश करें।",true);}finally{button.disabled=false;}
});
client.auth.onAuthStateChange(event=>{if(event==="PASSWORD_RECOVERY"){$("newPasswordPanel").classList.remove("hidden");recoverySay("Verified recovery link स्वीकार हुआ। नया password सेट करें。");}});
$("saveNewOwnerPassword").addEventListener("click",async()=>{
 const first=$("newOwnerPassword").value,second=$("confirmOwnerPassword").value,button=$("saveNewOwnerPassword");
 if(first.length<10||first.length>128){recoverySay("Password कम से कम 10 characters का होना चाहिए।",true);return;}
 if(first!==second){recoverySay("दोनों password एक जैसे नहीं हैं।",true);return;}
 button.disabled=true;
 try{const {error}=await client.auth.updateUser({password:first});if(error)throw error;$("newOwnerPassword").value="";$("confirmOwnerPassword").value="";$("newPasswordPanel").classList.add("hidden");recoverySay("Password update हो गया। अब नए password से login करें।");}
 catch(_){recoverySay("Password update नहीं हो सका। Recovery link की validity जाँचें।",true);}finally{button.disabled=false;}
});
render();
})();