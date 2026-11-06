(function(){
 "use strict";
 const body=document.body;
 const pageTool=body&&body.dataset.shifaTool;
 if(!pageTool)return;
 const params=new URLSearchParams(window.location.search);
 const toolId=pageTool==="dynamic-tool"?(params.get("tool")||"") : pageTool;
 const authBoxSelector="#authBox";
 let authorized=false;
 function showGate(title,message){
  if(document.getElementById("shifaAccessGate"))return;
  const panel=document.createElement("section");
  panel.id="shifaAccessGate";
  panel.setAttribute("role","alert");
  panel.style.cssText="position:fixed;z-index:99999;inset:0;display:grid;place-items:center;padding:20px;background:#030b19f2;color:#f4f9ff;font:16px Arial,sans-serif";
  const card=document.createElement("div");
  card.style.cssText="width:min(520px,100%);padding:24px;border:1px solid #287ab3;border-radius:16px;background:#0a2442;box-shadow:0 20px 70px #0009";
  const heading=document.createElement("h1");heading.textContent=title;
  const detail=document.createElement("p");detail.textContent=message;detail.style.cssText="line-height:1.6;color:#b9cde0";
  const link=document.createElement("a");link.href="index.html#authBox";link.textContent="Login / Sign up";link.style.cssText="display:inline-block;padding:11px 15px;border-radius:9px;background:#087fe8;color:white;text-decoration:none;font-weight:bold";
  card.append(heading,detail,link);panel.appendChild(card);document.body.appendChild(panel);
 }
 function isAuthControl(target){return Boolean(target&&target.closest&&target.closest(authBoxSelector));}
 function blockInteraction(event){
  if(authorized||isAuthControl(event.target))return;
  event.preventDefault();event.stopImmediatePropagation();
  showGate("Access restricted","इस tool को इस्तेमाल करने के लिए Login और Admin द्वारा दी गई अनुमति जरूरी है।");
 }
 document.addEventListener("click",blockInteraction,true);
 document.addEventListener("submit",blockInteraction,true);
 document.addEventListener("keydown",event=>{
  if(authorized||isAuthControl(event.target))return;
  if(event.key==="Enter"&&event.target&&/^(INPUT|TEXTAREA|BUTTON)$/.test(event.target.tagName))blockInteraction(event);
 },true);
 async function verify(){
  if(!window.ShifAAuth){showGate("Login required","Authentication service load नहीं हुई। Page refresh करें।");return;}
  const result=await window.ShifAAuth.requireSession();
  if(result.error||!result.session||!result.user){showGate("Login required","कोई भी tool बिना Login के इस्तेमाल नहीं किया जा सकता।");return;}
  let access;
  try{access=await window.ShifAAuth.getAccessProfile(result.session);}
  catch(error){showGate("Access verification failed","Server permission verify नहीं कर सका। सुरक्षा के लिए access बंद रखा गया है।");return;}
  const enabled=Array.isArray(access.enabledTools)?access.enabledTools:[];
  const allowed=access.role==="owner"||(!!toolId&&(enabled.includes("*")||enabled.includes(toolId)));
  if(!allowed){showGate("Access denied","इस tool की अनुमति Admin/Owner ने आपके account को नहीं दी है। Admin से access माँगें।");return;}
  authorized=true;
  document.dispatchEvent(new CustomEvent("shifa:access-granted",{detail:{toolId,role:access.role,unlimitedPlatformCredits:access.unlimitedPlatformCredits===true}}));
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",verify,{once:true});else verify();
})();