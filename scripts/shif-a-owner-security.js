(function(){
"use strict";
const SUPABASE_URL="https://qmoxfzgiwamblpouxitn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_dsVQ5-5VuIG5n_m0qqNjqw__i5sogpL";
const $=id=>document.getElementById(id);
const status=$("securityStatus");
const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{experimental:{passkey:true}}});
function say(message,warning){status.textContent=message;status.className=warning?"status warning":"status";}
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
 }catch(error){say("Owner status verify नहीं हो सका: "+error.message,true);}
}
$("directLogin").addEventListener("click",async()=>{
 const button=$("directLogin");button.disabled=true;say("Device authenticator खुल रहा है…");
 try{
  const {data,error}=await client.auth.signInWithPasskey();
  if(error)throw error;
  if(!data.session)throw new Error("Supabase session नहीं मिली।");
  const access=await getOwnerAccess();
  if(!access.owner){
   await client.auth.signOut();
   throw new Error("यह passkey किसी Owner account से संबंधित नहीं है। Session बंद कर दी गई।");
  }
  say("Owner Direct Passkey Login सफल।");
  await render();
 }catch(error){say(error.message||"Passkey login असफल रहा।",true);}
 finally{button.disabled=false;}
});
$("registerPasskey").addEventListener("click",async()=>{
 const button=$("registerPasskey");button.disabled=true;
 try{
  const access=await getOwnerAccess();
  if(!access.owner)throw new Error("Passkey registration is restricted to the Owner account");
  const {data,error}=await client.auth.registerPasskey();
  if(error)throw error;
  say("Passkey इस account में register हो गई। Credential ID: "+data.id);
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
render();
})();