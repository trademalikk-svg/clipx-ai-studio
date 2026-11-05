(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 function text(id,value){const el=$(id);if(el)el.textContent=value;}
 async function boot(){
  if(!window.ShifAAuth){text("dashboardStatus","Account service load नहीं हुई। Page refresh करें।");return;}
  const result=await window.ShifAAuth.requireSession();
  if(result.error){text("dashboardStatus","Login status जाँचा नहीं जा सका: "+result.error.message);return;}
  if(!result.user||!result.session){$("loginPrompt").hidden=false;$("dashboardContent").hidden=true;text("dashboardStatus","Dashboard देखने के लिए पहले ClipX account में Login करें।");return;}

  const user=result.user;
  let access={role:"unassigned",enabledTools:[],unlimitedPlatformCredits:false};
  try{
   access=await window.ShifAAuth.getAccessProfile(result.session);
  }catch(error){
   text("dashboardStatus","Server access profile अभी उपलब्ध नहीं है। Privileged controls बंद रखे गए हैं।");
  }
  const role=["owner","invited","customer"].includes(access.role)?access.role:"unassigned";
  text("accountEmail",user.email||"Signed-in account");
  text("accountRole",role==="unassigned"?"Access role अभी configure नहीं है":role.toUpperCase());
  text("accessSummary",access.unlimitedPlatformCredits===true
   ?"Platform credit deductions लागू नहीं होंगे। Provider quotas और device limits फिर भी लागू रहेंगे।"
   :"Customer access policy server पर configure होने के बाद यहाँ दिखाई जाएगी।");
  const enabled=Array.isArray(access.enabledTools)?access.enabledTools:[];
  text("toolAccess",enabled.length?enabled.join(", "):(role==="owner"||role==="invited")?"All enabled platform tools":"Tool access details not connected yet");
  $("dashboardContent").hidden=false;
  $("loginPrompt").hidden=true;
  const ownerPanel=$("ownerPanel");
  if(ownerPanel)ownerPanel.hidden=role!=="owner";
  const invitePanel=$("invitePanel");
  if(invitePanel)invitePanel.hidden=role!=="owner";
  $("signOutButton").addEventListener("click",async()=>{
   $("signOutButton").disabled=true;
   const out=await window.ShifAAuth.signOut();
   if(!out.ok){text("dashboardStatus","Logout नहीं हुआ: "+out.error.message);$("signOutButton").disabled=false;return;}
   window.location.reload();
  });
 }
 document.addEventListener("DOMContentLoaded",boot);
})();