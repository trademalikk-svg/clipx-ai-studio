(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 function text(id,value){const el=$(id);if(el)el.textContent=value;}
 async function boot(){
  const status=$("dashboardStatus");
  if(!window.ShifAAuth){text("dashboardStatus","Account service load नहीं हुई। Page refresh करें।");return;}
  const result=await window.ShifAAuth.requireSession();
  if(result.error){text("dashboardStatus","Login status जाँचा नहीं जा सका: "+result.error.message);return;}
  if(!result.user){$("loginPrompt").hidden=false;$("dashboardContent").hidden=true;text("dashboardStatus","Dashboard देखने के लिए पहले ClipX account में Login करें।");return;}
  const user=result.user;
  const access=window.ShifAAuth.getDisplayAccess(user);
  text("dashboardStatus","आपका SHIF-A AI workspace तैयार है।");
  text("accountEmail",user.email||"Signed-in account");
  text("accountRole",access.role==="unassigned"?"Access role अभी configure नहीं है":access.role.toUpperCase());
  text("accessSummary",access.unlimitedPlatformCredits?"Platform credit deductions लागू नहीं होंगे। Provider quotas और device limits फिर भी लागू रहेंगे।":"Customer access policy server पर configure होने के बाद यहाँ दिखाई जाएगी।");
  text("toolAccess",access.access.length?access.access.join(", "):access.role==="owner"?"All enabled tools":access.role==="invited"?"Invited tool access not yet assigned":"Tool access details not connected yet");
  $("dashboardContent").hidden=false;
  $("loginPrompt").hidden=true;
  const ownerPanel=$("ownerPanel");
  if(ownerPanel)ownerPanel.hidden=access.role!=="owner";
  const invitePanel=$("invitePanel");
  if(invitePanel)invitePanel.hidden=access.role!=="owner";
  $("signOutButton").addEventListener("click",async()=>{
   $("signOutButton").disabled=true;
   const out=await window.ShifAAuth.signOut();
   if(!out.ok){text("dashboardStatus","Logout नहीं हुआ: "+out.error.message);$("signOutButton").disabled=false;return;}
   window.location.reload();
  });
 }
 document.addEventListener("DOMContentLoaded",boot);
})();