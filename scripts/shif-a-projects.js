(function(){
 "use strict";
 const SUPABASE_URL="https://qmoxfzgiwamblpouxitn.supabase.co";
 const SUPABASE_KEY="sb_publishable_dsVQ5-5VuIG5n_m0qqNjqw__i5sogpL";
 const $=id=>document.getElementById(id);
 let client=null, session=null;
 function getClient(){
  if(client)return client;
  if(!window.supabase||typeof window.supabase.createClient!=="function")throw new Error("Supabase library load नहीं हुई।");
  client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);return client;
 }
 function setStatus(message,isError){const el=$("projectStatus");if(el){el.textContent=message;el.style.color=isError?"#ffb3b3":"#f0d18e";}}
 function safeText(tag,cls,value){const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=String(value??"");return el;}
 function renderProjects(rows){
  const list=$("projectList");if(!list)return;list.replaceChildren();
  if(!rows.length){list.appendChild(safeText("p","","अभी कोई project नहीं है। ऊपर से पहला project बनाएँ।"));return;}
  rows.forEach(project=>{const card=safeText("article","saved-project","");card.append(safeText("h3","",project.name),safeText("p","muted",project.description||"कोई description नहीं"),safeText("small","",project.category+" · Updated "+new Date(project.updated_at).toLocaleString()));list.appendChild(card);});
 }
 async function loadProjects(){const {data,error}=await getClient().from("shif_a_projects").select("id,name,description,category,created_at,updated_at").order("updated_at",{ascending:false}).limit(50);if(error)throw error;renderProjects(data||[]);}
 async function init(){
  const form=$("projectForm");if(!form)return;
  try{
   if(!window.ShifAAuth)throw new Error("Account module load नहीं हुआ।");
   const result=await window.ShifAAuth.requireSession();if(result.error)throw result.error;session=result.session;
   if(!session){setStatus("Project save करने के लिए पहले login करें। आपका form data server पर नहीं भेजा गया।",true);form.querySelector("button").disabled=true;return;}
   setStatus("Signed in. Private project storage check हो रहा है।");
   try{await loadProjects();setStatus("आपके private projects load हो गए।");}
   catch(error){setStatus("Database migration अभी लागू नहीं है। Migration लागू होने के बाद project saving चालू होगी। कोई data save नहीं हुआ।",true);}
  }catch(error){setStatus("Account verify नहीं हो सका: "+(error.message||"Unknown error"),true);}
  form.addEventListener("submit",async event=>{
   event.preventDefault();const button=form.querySelector("button");
   if(!session){setStatus("पहले login करें।",true);return;}
   const name=$("projectTitle").value.trim(),description=$("projectDescription").value.trim(),category=$("projectCategory").value;
   if(name.length<2||name.length>100){setStatus("Project name 2 से 100 characters का होना चाहिए।",true);return;}
   button.disabled=true;button.textContent="Saving…";
   try{const {error}=await getClient().from("shif_a_projects").insert({name,description,category});if(error)throw error;form.reset();await loadProjects();setStatus("Project सुरक्षित रूप से save हो गया।");}
   catch(error){setStatus("Save नहीं हुआ: "+(error.message||"Database migration लागू नहीं है।"),true);}
   finally{button.disabled=false;button.textContent="Create Project";}
  });
 }
 window.ShifAProjects=Object.freeze({loadProjects,renderProjects});
 document.addEventListener("DOMContentLoaded",init);
})();