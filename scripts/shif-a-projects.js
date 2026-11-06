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
 async function loadProjects(){const {data,error}=await getClient().from("shif_a_projects").select("id,name,description,category,created_at,updated_at").order("updated_at",{ascending:false}).limit(50);if(error)throw error;renderProjects(data||[]);const select=$("fileProject");if(select){select.replaceChildren(new Option("Select a project",""));(data||[]).forEach(p=>select.add(new Option(p.name,p.id)));select.disabled=false;}} 
 async function loadFiles(){const projectId=$("fileProject").value,list=$("fileList");list.replaceChildren();if(!projectId){list.appendChild(safeText("p","empty","पहले project चुनें।"));return;}const {data,error}=await getClient().from("shif_a_project_files").select("id,file_name,object_path,mime_type,file_size,version,created_at").eq("project_id",projectId).order("created_at",{ascending:false}).limit(100);if(error)throw error;if(!data.length){list.appendChild(safeText("p","empty","इस project में अभी कोई file नहीं है।"));return;}data.forEach(f=>{const row=safeText("div","saved-project","");row.append(safeText("strong","",f.file_name+" · v"+f.version),safeText("p","muted",Math.ceil(f.file_size/1024)+" KB · "+f.mime_type+" · "+new Date(f.created_at).toLocaleString()));const button=safeText("button","","Download version");button.type="button";button.addEventListener("click",async()=>{try{const {data,error}=await getClient().storage.from("shif-a-project-files").createSignedUrl(f.object_path,60);if(error)throw error;const a=document.createElement("a");a.href=data.signedUrl;a.download=f.file_name;a.rel="noopener";a.click();setStatus("Download link 60 seconds के लिए बनाया गया।");}catch(e){setStatus("Download failed: "+e.message,true);}});row.append(button);list.append(row);});}
 async function uploadFile(){const projectId=$("fileProject").value,file=$("projectFile").files[0];if(!projectId)throw Error("पहले project चुनें।");if(!file)throw Error("पहले file चुनें।");const allowed=["text/plain","text/markdown","text/csv","application/pdf","application/json","application/zip","image/png","image/jpeg","image/webp"];if(!allowed.includes(file.type))throw Error("इस file type की अनुमति नहीं है। PDF, TXT, MD, CSV, JSON, ZIP और सामान्य images चुनें।");if(file.size>20*1024*1024)throw Error("एक file की अधिकतम सीमा 20 MB है।");const clean=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(0,160)||"project-file";const {data:versions,error:ve}=await getClient().from("shif_a_project_files").select("version").eq("project_id",projectId).eq("file_name",clean).order("version",{ascending:false}).limit(1);if(ve)throw ve;const version=(versions?.[0]?.version||0)+1;const path=session.user.id+"/"+projectId+"/"+crypto.randomUUID()+"-"+clean;const {error:ue}=await getClient().storage.from("shif-a-project-files").upload(path,file,{contentType:file.type,upsert:false});if(ue)throw ue;const {error:me}=await getClient().from("shif_a_project_files").insert({project_id:projectId,file_name:clean,object_path:path,mime_type:file.type,file_size:file.size,version});if(me){await getClient().storage.from("shif-a-project-files").remove([path]);throw me;}$("projectFile").value="";await loadFiles();setStatus("Private file upload हो गई · Version "+version);}

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
  $("fileProject")?.addEventListener("change",()=>loadFiles().catch(e=>setStatus("Files load नहीं हुईं: "+e.message,true)));$("uploadProjectFile")?.addEventListener("click",async()=>{try{await uploadFile();}catch(e){setStatus("Upload नहीं हुआ: "+e.message,true);}});
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
 window.ShifAProjects=Object.freeze({loadProjects,renderProjects,loadFiles,uploadFile});
 document.addEventListener("DOMContentLoaded",init);
})();