(function(){
"use strict";
const SUPABASE_URL="https://qmoxfzgiwamblpouxitn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_dsVQ5-5VuIG5n_m0qqNjqw__i5sogpL";
const $=id=>document.getElementById(id);
const status=$("securityStatus");
const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{experimental:{passkey:true}}});
function say(message,warning){status.textContent=message;status.className=warning?"status warning":"status";}
function recoverySay(message,warning){const node=$("recoveryStatus");if(node){node.textContent=message;node.className=warning?"status warning":"status";}}
async function getOwnerAccess(){
 const {data:{session},error}=await client.auth.getSession();
 if(error)throw error;
 if(!session)return {owner:false,session:null};
 const response=await fetch(SUPABASE_URL+"/functions/v1/shif-a-access",{method:"GET",headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:"Bearer "+session.access_token}});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(payload.error||"Server access check failed.");
 return {owner:payload.role==="owner",session};
}
async function render(){
 try{
  const access=await getOwnerAccess();
  $("signedOut").classList.toggle("hidden",access.owner);
  $("ownerControls").classList.toggle("hidden",!access.owner);
  say(access.owner?"Verified Owner session active.":"Owner passkey sign-in के लिए तैयार।");
 }catch(error){$("signedOut").classList.remove("hidden");$("ownerControls").classList.add("hidden");say("Owner status verify नहीं हो सका: "+error.message,true);}
}
$("directLogin").addEventListener("click",async()=>{
 const button=$("directLogin");button.disabled=true;say("Device authenticator खुल रहा है…");
 let authenticated=false;
 try{
  const {data,error}=await client.auth.signInWithPasskey();
  if(error)throw error;
  if(!data.session)throw new Error("Supabase session नहीं मिली।");
  authenticated=true;
  const access=await getOwnerAccess();
  if(!access.owner)throw new Error("यह passkey किसी Owner account से संबंधित नहीं है।");
  say("Owner Direct Passkey Login सफल।");
  await render();
 }catch(error){
  if(authenticated){try{await client.auth.signOut();}catch(signOutError){say("Owner verification विफल हुई और automatic sign out की पुष्टि नहीं हो सकी। कृपया तुरंत Sign out करें।",true);return;}}
  say(error.message||"Passkey login असफल रहा।",true);
  await render();
 }finally{button.disabled=false;}
});
$("registerPasskey").addEventListener("click",async()=>{
 const button=$("registerPasskey");button.disabled=true;
 try{
  const access=await getOwnerAccess();
  if(!access.owner)throw new Error("Passkey registration is restricted to the Owner account");
  const {data,error}=await client.auth.registerPasskey();
  if(error)throw error;
  say("Passkey इस account में register हो गई।");
  await listPasskeys();
 }catch(error){say(error.message||"Passkey registration असफल रही।",true);}
 finally{button.disabled=false;}
});
async function listPasskeys(){
 const access=await getOwnerAccess();
 if(!access.owner)throw new Error("Owner verification required.");
 const {data,error}=await client.auth.passkey.list();
 if(error)throw error;
 const box=$("passkeyList");box.replaceChildren();
 if(!data||!data.length){box.textContent="अभी कोई passkey registered नहीं है।";return;}
 const list=document.createElement("ul");
 data.forEach(item=>{const li=document.createElement("li");li.textContent=(item.friendly_name||"Passkey")+" · "+new Date(item.created_at).toLocaleString("hi-IN");list.append(li);});
 box.append(list);
}
$("listPasskeys").addEventListener("click",async()=>{try{await listPasskeys();say("Passkey list server से प्राप्त हुई।");}catch(error){say(error.message,true);}});
$("signOut").addEventListener("click",async()=>{const {error}=await client.auth.signOut();if(error)say(error.message,true);else{say("Sign out हो गया।");await render();}});

$("sendPasswordReset").addEventListener("click",async()=>{
 const button=$("sendPasswordReset");const email=$("recoveryEmail").value.trim().toLowerCase();
 if(!email||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){recoverySay("कृपया valid verified email दर्ज करें।",true);return;}
 button.disabled=true;
 try{
  const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:"https://trademalikk-svg.github.io/clipx-ai-studio/owner-security.html"});
  if(error)throw error;
  recoverySay("यदि इस email से account मौजूद है, तो password reset instructions भेज दी गई हैं। Inbox और spam folder देखें।");
 }catch(error){recoverySay("अभी request पूरी नहीं हो सकी। कुछ देर बाद दोबारा कोशिश करें।",true);}
 finally{button.disabled=false;}
});
client.auth.onAuthStateChange((event)=>{
 if(event==="PASSWORD_RECOVERY"){$("newPasswordPanel").classList.remove("hidden");recoverySay("Verified recovery link स्वीकार हो गया। अब नया password सेट करें।");}
});
$("saveNewOwnerPassword").addEventListener("click",async()=>{
 const first=$("newOwnerPassword").value,second=$("confirmOwnerPassword").value,button=$("saveNewOwnerPassword");
 if(first.length<10||first.length>128){recoverySay("Password कम से कम 10 characters का होना चाहिए।",true);return;}
 if(first!==second){recoverySay("दोनों password एक जैसे नहीं हैं।",true);return;}
 button.disabled=true;
 try{
  const {error}=await client.auth.updateUser({password:first});
  if(error)throw error;
  $("newOwnerPassword").value="";$("confirmOwnerPassword").value="";
  $("newPasswordPanel").classList.add("hidden");
  recoverySay("Password सफलतापूर्वक update हो गया। अब नए password से login करें।");
 }catch(error){recoverySay("Password update नहीं हो सका। Recovery link की validity जाँचें या नया link मँगाएँ।",true);}
 finally{button.disabled=false;}
});
render();
})();