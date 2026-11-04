(function(){
 "use strict";
 const $=id=>document.getElementById(id);
 function renderProjectState(container,state){
  if(!container)return;
  container.replaceChildren();
  const message=document.createElement("p");
  message.textContent=state&&state.connected?"Project records are loaded from the authorized server.":"Project saving is not connected. No project has been saved.";
  container.appendChild(message);
 }
 function formatProjectActivity(event){
  const label=event&&typeof event.type==="string"?event.type:"Project activity";
  const date=event&&event.created_at?new Date(event.created_at):null;
  return date&&!Number.isNaN(date.getTime())?label+" · "+date.toLocaleString() : label;
 }
 function init(){
  const form=$("projectForm"),status=$("projectStatus");
  if(!form)return;
  form.addEventListener("submit",event=>{
   event.preventDefault();
   status.textContent="Project database/API अभी connect नहीं है। यह केवल form preview है; project save नहीं हुआ।";
  });
 }
 window.ShifAProjects=Object.freeze({renderProjectState,formatProjectActivity});
 document.addEventListener("DOMContentLoaded",init);
})();