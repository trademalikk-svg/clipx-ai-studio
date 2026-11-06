(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 async function load(){
  const panel=$("signupAnalytics");
  const status=$("signupAnalyticsStatus");
  const total=$("signupTotal");
  const rows=$("signupDaily");
  if(!panel||!window.ShifAAuth)return;
  try{
   const auth=await window.ShifAAuth.requireSession();
   if(auth.error||!auth.session||!auth.user)throw new Error("Verified Owner login required.");
   const access=await window.ShifAAuth.getAccessProfile(auth.session);
   if(!access||access.role!=="owner")throw new Error("Owner access required.");
   const report=await window.ShifAAuth.getGrowthAnalytics(auth.session);
   total.textContent=String(report.totalVerifiedSignups??0);
   rows.replaceChildren();
   (Array.isArray(report.daily)?report.daily:[]).forEach(item=>{
    const li=document.createElement("li");
    li.textContent=String(item.date)+" — "+String(item.count);
    rows.appendChild(li);
   });
   if(!rows.children.length){const li=document.createElement("li");li.textContent="अभी कोई verified signup दर्ज नहीं है।";rows.appendChild(li);}
   status.textContent="Last 30 UTC days · Verified signups · Aggregate-only data";
  }catch(error){
   status.textContent=error&&error.message?error.message:"Analytics उपलब्ध नहीं है।";
   status.classList.add("warning");
   total.textContent="—";
  }
 }
 document.addEventListener("DOMContentLoaded",load);
})();