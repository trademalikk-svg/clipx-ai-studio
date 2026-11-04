(function(){
 "use strict";
 const tools=[
  {id:"clipx-video",name:"ClipX Video Studio",category:"Video",description:"Browser-based video preview, trim, split, captions and Shorts tools.",status:"available",href:"index.html#upload"},
  {id:"video-prompts",name:"Video Prompt Builder",category:"Video",description:"Create structured Hindi and English prompts for video tools.",status:"available",href:"index.html#promptStudio"},
  {id:"creator-kit",name:"Titles & Hashtags",category:"Writing",description:"Draft creator titles, descriptions and hashtags.",status:"available",href:"index.html#freeCreatorKit"},
  {id:"thumbnail-tools",name:"Thumbnail Creator",category:"Design",description:"Browser-based thumbnail and creator design utilities.",status:"limited",href:"creator-tools.html"},
  {id:"image-studio",name:"AI Image Studio",category:"Image",description:"Image generation and editing engines are not connected yet.",status:"coming-soon"},
  {id:"voice-studio",name:"AI Voice Studio",category:"Voice",description:"Text-to-speech and audio generation engines are not connected yet.",status:"coming-soon"},
  {id:"ai-chat",name:"AI Chat & Research",category:"Chat & Research",description:"Model-backed assistant and research tools are planned.",status:"coming-soon"},
  {id:"writing-studio",name:"AI Writing Studio",category:"Writing",description:"Model-backed writing and document workflows are planned.",status:"coming-soon"},
  {id:"coding-studio",name:"AI Coding Studio",category:"Coding",description:"Code generation and debugging engines are not connected yet.",status:"coming-soon"},
  {id:"agents-studio",name:"AI Agents Studio",category:"Agents",description:"Custom task agents and tool permissions are planned.",status:"coming-soon"},
  {id:"automation-studio",name:"AI Automation Studio",category:"Automation",description:"Multi-step workflows and scheduled automation are planned.",status:"coming-soon"},
  {id:"document-studio",name:"Documents & PDF",category:"Documents",description:"Document understanding and PDF workflows are planned.",status:"coming-soon"},
  {id:"business-studio",name:"AI Business Tools",category:"Business",description:"Business and marketing assistants are planned.",status:"coming-soon"},
  {id:"education-studio",name:"AI Education",category:"Education",description:"Learning and study tools are planned.",status:"coming-soon"},
  {id:"productivity-studio",name:"AI Productivity",category:"Productivity",description:"Personal productivity and task tools are planned.",status:"coming-soon"}
 ];
 const grid=document.getElementById("toolGrid"),search=document.getElementById("toolSearch"),filter=document.getElementById("categoryFilter");
 [...new Set(tools.map(t=>t.category))].sort().forEach(category=>{const o=document.createElement("option");o.value=category;o.textContent=category;filter.appendChild(o);});
 function render(){
  const q=search.value.trim().toLowerCase(),cat=filter.value;
  const matches=tools.filter(t=>(cat==="all"||t.category===cat)&&[t.name,t.category,t.description].join(" ").toLowerCase().includes(q));
  grid.replaceChildren();
  matches.forEach(t=>{
   const card=document.createElement("article");card.className="tool";
   const h=document.createElement("h2");h.textContent=t.name;
   const p=document.createElement("p");p.textContent=t.description;
   const meta=document.createElement("div");meta.className="meta";
   const state=document.createElement("span");state.className="state "+t.status;state.textContent=t.status.replace("-"," ");
   meta.appendChild(state);
   if(t.href){const a=document.createElement("a");a.className="launch";a.href=t.href;a.textContent="Open tool →";meta.appendChild(a);}
   card.append(h,p,meta);grid.appendChild(card);
  });
  document.getElementById("toolCount").textContent=matches.length+" tools shown · "+tools.filter(t=>t.status==="available"||t.status==="limited").length+" currently available/limited";
  document.getElementById("emptyState").hidden=matches.length!==0;
 }
 search.addEventListener("input",render);filter.addEventListener("change",render);render();
})();