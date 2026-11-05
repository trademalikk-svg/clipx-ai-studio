(function(){
 "use strict";
 const tools=[
  {id:"clipx-video",name:"ClipX Video Studio",category:"Video",description:"Browser video editing, preview, trim, clip export and segment planning; cloud AI video generation is not connected yet.",status:"available",href:"index.html#upload"},
  {id:"video-prompts",name:"Video Prompt Builder",category:"Video",description:"Create structured Hindi and English prompts for video tools.",status:"limited",href:"index.html#promptStudio"},
  {id:"creator-kit",name:"Titles & Hashtags",category:"Writing",description:"Draft creator titles, descriptions and hashtags.",status:"limited",href:"index.html#freeCreatorKit"},
  {id:"thumbnail-tools",name:"Thumbnail Creator",category:"Design",description:"Browser-based thumbnail and creator design utilities.",status:"limited",href:"creator-tools.html"},
  {id:"image-studio",name:"Image Studio",category:"Image",description:"Cloud AI image generation interface is planned for phone and desktop; AI generation is not connected yet. Local image preview, resize and conversion are available.",status:"limited",href:"media-studio.html#image-studio"},
  {id:"voice-studio",name:"Voice Studio",category:"Voice",description:"Use device speech voices and record audio locally. Hosted AI voice generation is not connected.",status:"limited",href:"media-studio.html#voice-studio"},
  {id:"ai-chat",name:"AI Chat & Research",category:"Chat & Research",description:"Connect a free local Ollama model or another OpenAI-compatible endpoint. Provider usage and device limits apply.",status:"limited",href:"chat.html"},
  {id:"writing-studio",name:"AI Writing Studio",category:"Writing",description:"Model-backed writing and document workflows are planned.",status:"limited",href:"tool-studio.html?tool=writing-studio"},
  {id:"coding-studio",name:"AI Coding Studio",category:"Coding",description:"Free local website and Android starter templates, code editor, website preview and source bundle export. AI generation and APK compilation are not connected.",status:"limited",href:"coding-studio.html"},
  {id:"agents-studio",name:"AI Agents Studio",category:"Agents",description:"Custom task agents and tool permissions are planned.",status:"coming-soon"},
  {id:"automation-studio",name:"AI Automation Studio",category:"Automation",description:"Multi-step workflows and scheduled automation are planned.",status:"coming-soon"},
  {id:"document-studio",name:"Documents & PDF",category:"Documents",description:"Document understanding and PDF workflows are planned.",status:"coming-soon"},
  {id:"business-studio",name:"AI Business Tools",category:"Business",description:"Business and marketing assistants are planned.",status:"coming-soon"},
  {id:"education-studio",name:"AI Education",category:"Education",description:"Learning and study tools are planned.",status:"limited",href:"tool-studio.html?tool=education-studio"},
  {id:"productivity-studio",name:"AI Productivity",category:"Productivity",description:"Personal productivity and task tools are planned.",status:"limited",href:"tool-studio.html?tool=productivity-studio"}
,
  {id:"translation-studio",name:"AI Translator",category:"Language",description:"Context-aware translation workflows.",status:"limited",href:"tool-studio.html?tool=translation-studio"},
  {id:"transcription-studio",name:"Audio Transcription",category:"Voice",description:"Convert audio into editable text.",status:"coming-soon"},
  {id:"meeting-notes",name:"Meeting Notes Assistant",category:"Productivity",description:"Summarize meetings and extract action items.",status:"limited",href:"tool-studio.html?tool=meeting-notes"},
  {id:"presentation-studio",name:"Presentation Builder",category:"Documents",description:"Create structured slide outlines and content.",status:"limited",href:"tool-studio.html?tool=presentation-studio"},
  {id:"spreadsheet-assistant",name:"Spreadsheet Assistant",category:"Business",description:"Clean and analyse spreadsheet data.",status:"limited",href:"tool-studio.html?tool=spreadsheet-assistant"},
  {id:"data-analyst",name:"AI Data Analyst",category:"Business",description:"Explore datasets and explain trends.",status:"limited",href:"tool-studio.html?tool=data-analyst"},
  {id:"seo-studio",name:"SEO Assistant",category:"Marketing",description:"Plan keywords and on-page SEO improvements.",status:"limited",href:"tool-studio.html?tool=seo-studio"},
  {id:"social-media-studio",name:"Social Media Planner",category:"Marketing",description:"Build content calendars and post drafts.",status:"limited",href:"tool-studio.html?tool=social-media-studio"},
  {id:"ad-copy-studio",name:"Ad Copy Generator",category:"Marketing",description:"Draft campaign copy for review.",status:"limited",href:"tool-studio.html?tool=ad-copy-studio"},
  {id:"brand-kit",name:"Brand Identity Assistant",category:"Design",description:"Develop brand positioning and visual direction.",status:"limited",href:"tool-studio.html?tool=brand-kit"},
  {id:"logo-concepts",name:"Logo Concept Studio",category:"Design",description:"Prepare logo concepts and generation briefs.",status:"coming-soon"},
  {id:"image-upscale",name:"Image Enhancement",category:"Image",description:"Image cleanup and resizing workflows.",status:"coming-soon"},
  {id:"background-removal",name:"Background Remover",category:"Image",description:"Remove or replace image backgrounds.",status:"coming-soon"},
  {id:"voice-cleanup",name:"Audio Cleanup",category:"Voice",description:"Prepare cleaner voice recordings.",status:"coming-soon"},
  {id:"music-assistant",name:"Music & Sound Planner",category:"Voice",description:"Create sound design briefs and music plans.",status:"coming-soon"},
  {id:"subtitle-studio",name:"Subtitle & Caption Studio",category:"Video",description:"Generate and format video subtitles.",status:"coming-soon"},
  {id:"video-script",name:"Video Script Writer",category:"Video",description:"Write scene-by-scene video scripts.",status:"limited",href:"tool-studio.html?tool=video-script"},
  {id:"video-summary",name:"Video Summarizer",category:"Video",description:"Summarize videos and extract key moments.",status:"coming-soon"},
  {id:"video-dubbing",name:"Video Dubbing",category:"Video",description:"Plan translated voice tracks and dubbing.",status:"coming-soon"},
  {id:"web-research",name:"Web Research Assistant",category:"Chat & Research",description:"Organize sourced research from approved sources.",status:"limited",href:"tool-studio.html?tool=web-research"},
  {id:"fact-checker",name:"Fact Check Assistant",category:"Chat & Research",description:"Review claims against cited sources.",status:"limited",href:"tool-studio.html?tool=fact-checker"},
  {id:"code-reviewer",name:"Code Review Assistant",category:"Coding",description:"Inspect code for correctness and maintainability.",status:"limited",href:"tool-studio.html?tool=code-reviewer"},
  {id:"api-builder",name:"API & Integration Builder",category:"Coding",description:"Design API contracts and integration scaffolds.",status:"limited",href:"tool-studio.html?tool=api-builder"},
  {id:"workflow-builder",name:"Workflow Designer",category:"Automation",description:"Design workflows with approval gates.",status:"limited",href:"tool-studio.html?tool=workflow-builder"},
  {id:"email-assistant",name:"Email & Reply Assistant",category:"Writing",description:"Draft structured email replies and follow-ups.",status:"limited",href:"tool-studio.html?tool=email-assistant"}
 ];
 window.ShifATools=Object.freeze(tools.map(tool=>Object.freeze({...tool})));
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