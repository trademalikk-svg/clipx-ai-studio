(function(){
 "use strict";
 const tools=[
  {id:"clipx-video",name:"ClipX Video Studio",category:"Video",description:"Browser-based video preview, trim, split, captions and Shorts tools.",status:"available",href:"index.html#upload"},
  {id:"video-prompts",name:"Video Prompt Builder",category:"Video",description:"Create structured Hindi and English prompts for video tools.",status:"available",href:"index.html#promptStudio"},
  {id:"creator-kit",name:"Titles & Hashtags",category:"Writing",description:"Draft creator titles, descriptions and hashtags.",status:"available",href:"index.html#freeCreatorKit"},
  {id:"thumbnail-tools",name:"Thumbnail Creator",category:"Design",description:"Browser-based thumbnail and creator design utilities.",status:"limited",href:"creator-tools.html"},
  {id:"browser-utilities",name:"Free Browser Utilities",category:"Productivity",description:"Local text analyzer, case converter, Shorts caption formatter, JSON validator and image resizer. Runs on your device without an AI API.",status:"available",href:"browser-tools.html"},
  {id:"image-studio",name:"AI Image Studio",category:"Image",description:"Image generation and editing engines are not connected yet.",status:"coming-soon"},
  {id:"voice-studio",name:"AI Voice Studio",category:"Voice",description:"Text-to-speech and audio generation engines are not connected yet.",status:"coming-soon"},
  {id:"ai-chat",name:"AI Chat & Research",category:"Chat & Research",description:"Model-backed assistant and research tools are planned.",status:"coming-soon"},
  {id:"writing-studio",name:"Writing Studio",category:"Writing",description:"Free browser-based Hindi and English writing templates for video scripts, hooks, descriptions, social posts and calls to action. No AI API is connected.",status:"available",href:"writing-studio.html"},
  {id:"coding-studio",name:"AI Coding Studio",category:"Coding",description:"Free local website and Android starter templates, code editor, website preview and source bundle export. AI generation and APK compilation are not connected.",status:"limited",href:"coding-studio.html"},
  {id:"agents-studio",name:"Agent Workflow Designer",category:"Agents",description:"Create reusable agent role, objective, instructions, workflow steps and permission-boundary blueprints. Export JSON/TXT; model execution and external tools are not connected.",status:"limited",href:"agents-studio.html"},
  {id:"automation-studio",name:"AI Automation Studio",category:"Automation",description:"Multi-step workflows and scheduled automation are planned.",status:"coming-soon"},
  {id:"document-studio",name:"Documents & PDF Studio",category:"Documents",description:"Create and format documents in your browser, download TXT files and print/save documents as PDF. No upload or AI API required.",status:"available",href:"documents-studio.html"},
  {id:"business-studio",name:"Business Toolkit",category:"Business",description:"Free local templates for business profiles, product listings, customer replies, marketing plans and quotation estimates. No AI API or data upload.",status:"available",href:"business-tools.html"},
  {id:"education-studio",name:"Study Studio",category:"Education",description:"Free browser-based study planner, user-made flashcards, practice quiz from your own notes and progress checklist. No AI API or data upload.",status:"available",href:"education-studio.html"},
  {id:"productivity-studio",name:"Productivity Studio",category:"Productivity",description:"Free local task manager, daily planner, quick notes and focus timer. Data stays in this browser unless cleared.",status:"available",href:"productivity-studio.html"}
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