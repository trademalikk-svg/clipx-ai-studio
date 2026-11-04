(function(){
 "use strict";
 const SUPABASE_URL="https://qmoxfzgiwamblpouxitn.supabase.co";
 const SUPABASE_KEY="sb_publishable_dsVQ5-5VuIG5n_m0qqNjqw__i5sogpL";
 const EDGE_URL=SUPABASE_URL+"/functions/v1/shif-a-team-access";
 const $=id=>document.getElementById(id);
 let client=null,session=null,projects=[];
 function status(message,error){const el=$("teamStatus");if(el){el.textContent=message;el.style.color=error?"#ffb3b3":"#f0d18e";}}
 function text(tag,value){const el=document.createElement(tag);el.textContent=String(value??"");return el;}
 async function initClient(){
  if(!window.ShifAAuth)throw Error("Account module load नहीं हुआ।");
  const auth=await window.ShifAAuth.requireSession();
  if(auth.error)throw auth.error;
  session=auth.session;
  if(!session)throw Error("Team access के लिए पहले login करें।");
  if(!window.supabase?.createClient)throw Error("Supabase client load नहीं हुआ।");
  client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
 }
 async function callEdge(body){
  const response=await fetch(EDGE_URL,{method:"POST",headers:{"Content-Type":"application/json","apikey":SUPABASE_KEY,"Authorization":"Bearer "+session.access_token},body:JSON.stringify(body)});
  let result={};try{result=await response.json();}catch(_){}
  if(!response.ok)throw Error(result.error||("Team service error "+response.status));
  return result;
 }
 async function loadProjects(){
  const {data,error}=await client.from("shif_a_projects").select("id,name,user_id").order("updated_at",{ascending:false}).limit(100);
  if(error)throw error;
  projects=data||[];
  const select=$("teamProject");select.replaceChildren(new Option("Select project",""));
  projects.forEach(p=>select.add(new Option(p.name,p.id)));
  select.disabled=false;
  if(projects.length)select.value=projects[0].id;
  await loadMembers();
 }
 async function loadMembers(){
  const project=projects.find(p=>p.id===$("teamProject").value),list=$("teamMemberList");
  list.replaceChildren();
  if(!project){list.className="empty";list.textContent="पहले project चुनें।";return;}
  const owner=project.user_id===session.user.id;
  const {data,error}=await client.from("shif_a_project_members").select("user_id,role,status,created_at").eq("project_id",project.id).order("created_at",{ascending:true});
  if(error)throw error;
  if(!data?.length){list.className="empty";list.textContent="अभी कोई accepted team member नहीं है।";return;}
  list.className="";
  data.forEach(member=>{
   const row=text("div","");row.className="saved-project";
   const title=text("strong",member.role.toUpperCase()+" · "+member.status);row.append(title);
   row.append(text("p","User ID: "+member.user_id));
   if(owner&&member.status==="active"){
    const button=text("button","Revoke Access");button.type="button";button.style.marginTop="8px";
    button.addEventListener("click",async()=>{
     if(!window.confirm("इस member का project access revoke करें?"))return;
     button.disabled=true;
     try{await callEdge({action:"revoke_member",project_id:project.id,member_user_id:member.user_id});status("Member access revoke हो गया।");await loadMembers();}
     catch(e){button.disabled=false;status("Revoke नहीं हुआ: "+e.message,true);}
    });
    row.append(button);
   }
   list.append(row);
  });
 }
 async function createInvite(){
  const projectId=$("teamProject").value,email=$("teamEmail").value.trim(),role=$("teamRole").value;
  if(!projectId)throw Error("पहले project चुनें।");
  if(!email)throw Error("Invite email डालें।");
  const project=projects.find(p=>p.id===projectId);
  if(!project||project.user_id!==session.user.id)throw Error("केवल project owner invitation बना सकता है।");
  $("createTeamInvite").disabled=true;
  try{
   const result=await callEdge({action:"create_invitation",project_id:projectId,email,role});
   $("teamInviteToken").value=result.token;
   $("copyTeamInvite").disabled=false;
   status("Invitation token तैयार है। यह केवल इस बार दिखाया गया है; 7 दिन में expire होगा। इसे सुरक्षित रूप से साझा करें।");
  }finally{$("createTeamInvite").disabled=false;}
 }
 async function acceptInvite(){
  const token=$("acceptTeamToken").value.trim().toLowerCase();
  if(!/^[a-f0-9]{64}$/.test(token))throw Error("64-character valid invitation token डालें।");
  $("acceptTeamInvite").disabled=true;
  try{
   const result=await callEdge({action:"accept_invitation",token});
   $("acceptTeamToken").value="";
   status("Invitation स्वीकार हुई। Role: "+result.role+". Project list refresh हो रही है।");
   await loadProjects();
  }finally{$("acceptTeamInvite").disabled=false;}
 }
 document.addEventListener("DOMContentLoaded",async()=>{
  if(!$("teamProject"))return;
  try{await initClient();await loadProjects();status("Team access panel connected. अगर backend unavailable दिखे तो migrations और Edge Function अभी deploy नहीं हुए हैं।");}
  catch(e){status("Team access अभी चालू नहीं: "+e.message,true);}
  $("teamProject").addEventListener("change",()=>loadMembers().catch(e=>status("Members load नहीं हुए: "+e.message,true)));
  $("createTeamInvite").addEventListener("click",()=>createInvite().catch(e=>status("Invitation नहीं बनी: "+e.message,true)));
  $("acceptTeamInvite").addEventListener("click",()=>acceptInvite().catch(e=>status("Invitation accept नहीं हुई: "+e.message,true)));
  $("copyTeamInvite").addEventListener("click",async()=>{
   const token=$("teamInviteToken").value;if(!token)return;
   try{await navigator.clipboard.writeText(token);status("One-time token copy हो गया।");}
   catch(_){$("teamInviteToken").focus();$("teamInviteToken").select();status("Token select किया गया है; browser menu से Copy चुनें।");}
  });
 });
})();