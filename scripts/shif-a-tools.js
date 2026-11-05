(function(){
 "use strict";
 const tools=[
  {id:"clipx-video",name:"ClipX Video Studio",category:"Video",description:"Browser-based video preview, trim, split, captions and Shorts tools.",status:"available",href:"index.html#upload"},
  {id:"video-prompts",name:"Video Prompt Builder",category:"Video",description:"Create structured Hindi and English prompts for video tools.",status:"available",href:"index.html#promptStudio"},
  {id:"creator-kit",name:"Titles & Hashtags",category:"Writing",description:"Draft creator titles, descriptions and hashtags.",status:"available",href:"index.html#freeCreatorKit"},
  {id:"thumbnail-tools",name:"Thumbnail Creator",category:"Design",description:"Browser-based thumbnail and creator design utilities.",status:"available",href:"creator-tools.html"},
  {id:"browser-utilities",name:"Free Browser Utilities",category:"Productivity",description:"Local text analyzer, case converter, Shorts caption formatter, JSON validator and image resizer. Runs on your device without an AI API.",status:"available",href:"browser-tools.html"},
  {id:"image-studio",name:"Image Studio",category:"Image",description:"Free browser-based image editor with local crop, resize and export. AI image generation is not connected yet.",status:"available",href:"image-studio.html"},
  {id:"voice-studio",name:"Voice Studio",category:"Voice",description:"Browser/device text-to-speech and local audio controls. AI voice generation is not connected yet.",status:"available",href:"voice-studio.html"},
  {id:"ai-chat",name:"Research Workspace",category:"Chat & Research",description:"Organize research questions, source links, evidence-quality checks, findings and conclusions; export TXT/JSON. Live AI chat, automatic web search and source verification are not connected.",status:"available",href:"research-studio.html"},
  {id:"model-connector",name:"AI Model Connector",category:"AI & Integrations",description:"Provider readiness and secure backend integration checklist. No model provider is connected yet and no API keys are collected in the browser.",status:"available",href:"model-connector.html"},
  {id:"chat-studio",name:"AI Chat Studio",category:"Chat & Research",description:"Authenticated chat interface using the shared Cloudflare-first AI gateway; provider credential is not configured, so live model replies are pending.",status:"limited",href:"chat-studio.html"},
  {id:"writing-studio",name:"Writing Studio",category:"Writing",description:"Local Hindi and English writing templates plus optional Cloudflare AI assistance; verified login and Cloudflare provider setup required.",status:"limited",href:"writing-studio.html"},
  {id:"coding-studio",name:"AI Coding Studio",category:"Coding",description:"Local website and Android starter templates, code editor and source export; optional Cloudflare AI code review requires provider setup. AI code generation and APK compilation are not connected.",status:"limited",href:"coding-studio.html"},
  {id:"agents-studio",name:"Agent Workflow Designer",category:"Agents",description:"Create workflow blueprints and request optional Cloudflare AI review; no autonomous execution or external tools.",status:"limited",href:"agents-studio.html"},
  {id:"automation-studio",name:"Automation Workflow Designer",category:"Automation",description:"Design workflows and request optional Cloudflare AI review; scheduling and external actions are not connected.",status:"limited",href:"automation-studio.html"},
  {id:"document-studio",name:"Documents & PDF Studio",category:"Documents",description:"Local document editor with optional Cloudflare AI writing assistance; verified login and provider setup required.",status:"limited",href:"documents-studio.html"},
  {id:"business-studio",name:"Business Toolkit",category:"Business",description:"Local business templates plus optional Cloudflare AI drafting assistance; verified login and provider setup required.",status:"limited",href:"business-tools.html"},
  {id:"education-studio",name:"Study Studio",category:"Education",description:"Local study planner, flashcards and notes quiz plus optional Cloudflare AI explanations; verified login and provider setup required.",status:"limited",href:"education-studio.html"},
  {id:"productivity-studio",name:"Productivity Studio",category:"Productivity",description:"Free local task manager, daily planner, quick notes and focus timer. Data stays in this browser unless cleared.",status:"available",href:"productivity-studio.html"},

  {id:"ai-image-studio",name:"AI Image Studio",category:"Image",description:"AI image generation provider is not connected yet.",status:"coming-soon"},
  {id:"ai-voice-studio",name:"AI Voice Studio",category:"Voice",description:"AI voice generation provider is not connected yet.",status:"coming-soon"},
  {id:"ai-chat-research",name:"AI Chat & Research",category:"Chat & Research",description:"Live web research and source verification are not connected yet.",status:"coming-soon"},
  {id:"ai-agents-studio",name:"AI Agents Studio",category:"Agents",description:"Autonomous agent execution and external tool permissions are not connected yet.",status:"coming-soon"},
  {id:"ai-automation-studio",name:"AI Automation Studio",category:"Automation",description:"Scheduled automation and external actions are not connected yet.",status:"coming-soon"},
  {id:"word-count",name:"Word & Character Counter",category:"Text",description:"Count words, characters and sentences locally.",status:"available",href:"tool-lab.html?tool=word-count"},
  {id:"case-converter",name:"Text Case Converter",category:"Text",description:"Convert text case in your browser.",status:"available",href:"tool-lab.html?tool=case-converter"},
  {id:"remove-duplicates",name:"Duplicate Line Remover",category:"Text",description:"Remove repeated lines.",status:"available",href:"tool-lab.html?tool=remove-duplicates"},
  {id:"sort-lines",name:"Line Sorter",category:"Text",description:"Sort lines alphabetically.",status:"available",href:"tool-lab.html?tool=sort-lines"},
  {id:"clean-whitespace",name:"Whitespace Cleaner",category:"Text",description:"Trim extra whitespace and blank lines.",status:"available",href:"tool-lab.html?tool=clean-whitespace"},
  {id:"slug-maker",name:"URL Slug Maker",category:"SEO",description:"Create URL-friendly slugs.",status:"available",href:"tool-lab.html?tool=slug-maker"},
  {id:"hashtag-format",name:"Hashtag Formatter",category:"Social",description:"Format keyword hashtags.",status:"available",href:"tool-lab.html?tool=hashtag-format"},
  {id:"caption-breaker",name:"Caption Line Breaker",category:"Social",description:"Break long captions into readable chunks.",status:"available",href:"tool-lab.html?tool=caption-breaker"},
  {id:"bio-limit",name:"Social Bio Length Checker",category:"Social",description:"Check bio character length.",status:"available",href:"tool-lab.html?tool=bio-limit"},
  {id:"title-case",name:"Title Case Generator",category:"Writing",description:"Format headline capitalization.",status:"available",href:"tool-lab.html?tool=title-case"},
  {id:"keyword-groups",name:"Keyword Grouper",category:"SEO",description:"Group keywords by first word.",status:"available",href:"tool-lab.html?tool=keyword-groups"},
  {id:"csv-json",name:"CSV to JSON Converter",category:"Data",description:"Convert simple CSV rows into JSON.",status:"available",href:"tool-lab.html?tool=csv-json"},
  {id:"json-format",name:"JSON Formatter & Validator",category:"Data",description:"Validate and format JSON.",status:"available",href:"tool-lab.html?tool=json-format"},
  {id:"url-inspector",name:"URL Inspector",category:"Browser",description:"Inspect URL components.",status:"available",href:"tool-lab.html?tool=url-inspector"},
  {id:"base64",name:"Base64 Encoder / Decoder",category:"Browser",description:"Encode or decode plain text.",status:"available",href:"tool-lab.html?tool=base64"},
  {id:"html-escape",name:"HTML Escaper",category:"Coding",description:"Escape HTML special characters.",status:"available",href:"tool-lab.html?tool=html-escape"},
  {id:"regex-check",name:"Regex Tester",category:"Coding",description:"Test JavaScript regular expressions.",status:"available",href:"tool-lab.html?tool=regex-check"},
  {id:"reading-time",name:"Reading Time Estimator",category:"Writing",description:"Estimate reading time.",status:"available",href:"tool-lab.html?tool=reading-time"},
  {id:"text-diff",name:"Text Difference Checker",category:"Text",description:"Compare lines in two text blocks.",status:"available",href:"tool-lab.html?tool=text-diff"},
  {id:"number-lines",name:"Line Numbering Tool",category:"Text",description:"Add line numbers to text.",status:"available",href:"tool-lab.html?tool=number-lines"},
  {id:"filename-clean",name:"Filename Cleaner",category:"Files",description:"Clean unsafe filename characters.",status:"available",href:"tool-lab.html?tool=filename-clean"},
  {id:"image-info",name:"Image Dimensions Inspector",category:"Image",description:"Read image dimensions and file details.",status:"available",href:"tool-lab.html?tool=image-info"},
 ];
 const grid=document.getElementById("toolGrid"),search=document.getElementById("toolSearch"),filter=document.getElementById("categoryFilter"),statusFilter=document.getElementById("statusFilter");
 [...new Set(tools.map(t=>t.category))].sort().forEach(category=>{const o=document.createElement("option");o.value=category;o.textContent=category;filter.appendChild(o);});
 function render(){
  const q=search.value.trim().toLowerCase(),cat=filter.value,status=statusFilter.value;
  const matches=tools.filter(t=>(cat==="all"||t.category===cat)&&(status==="all"||t.status===status)&&[t.name,t.category,t.description].join(" ").toLowerCase().includes(q));
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
  const totals=tools.reduce((counts,t)=>{counts[t.status]=(counts[t.status]||0)+1;return counts;},{available:0,limited:0,"coming-soon":0});
  document.getElementById("toolCount").textContent=matches.length+" shown · "+totals.available+" available · "+totals.limited+" limited · "+totals["coming-soon"]+" coming soon";
  document.getElementById("emptyState").hidden=matches.length!==0;
 }
 search.addEventListener("input",render);filter.addEventListener("change",render);statusFilter.addEventListener("change",render);render();
})();