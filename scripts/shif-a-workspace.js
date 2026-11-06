(function(){
 "use strict";
 const tools=Array.isArray(window.ShifATools)?window.ShifATools:[];
 const byId=id=>tools.find(tool=>tool.id===id)||null;
 const $=id=>document.getElementById(id);
 const keywordMap=[
  {id:"clipx-video",words:["video","shorts","reel","clip","वीडियो","रील","शॉर्ट"]},
  {id:"video-prompts",words:["video prompt","prompt video","वीडियो प्रॉम्प्ट"]},
  {id:"creator-kit",words:["title","hashtag","caption","description","टाइटल","हैशटैग","कैप्शन"]},
  {id:"thumbnail-tools",words:["thumbnail","थंबनेल"]},
  {id:"image-studio",words:["image","photo","picture","logo","इमेज","फोटो","लोगो"]},
  {id:"voice-studio",words:["voice","audio","speech","आवाज","वॉइस","ऑडियो"]},
  {id:"ai-chat",words:["research","search","explain","question","chat","रिसर्च","खोज","समझाओ","सवाल"]},
  {id:"writing-studio",words:["write","article","blog","letter","लिखो","लेख","पत्र"]},
  {id:"coding-studio",words:["code","coding","debug","program","website","web app","android app","app builder","वेबसाइट","ऐप","कोड","प्रोग्राम"]},
  {id:"document-studio",words:["pdf","document","report","दस्तावेज","पीडीएफ","रिपोर्ट"]},
  {id:"business-studio",words:["business","marketing","seo","व्यापार","मार्केटिंग"]},
  {id:"education-studio",words:["study","learn","homework","पढ़ाई","सीखना"]},
  {id:"automation-studio",words:["automation","schedule","automate","ऑटोमेशन"]},
  {id:"agents-studio",words:["agent","workflow","एजेंट"]}
 ];
 function classifyIntent(input){
  const value=String(input||"").trim().toLocaleLowerCase();
  if(!value)return {tool:null,confidence:0,reason:"अपना काम लिखें।"};
  const scored=keywordMap.map(entry=>({tool:byId(entry.id),score:entry.words.reduce((n,word)=>n+(value.includes(word)?(word.length>5?2:1):0),0)})).filter(item=>item.tool&&item.score>0).sort((a,b)=>b.score-a.score);
  if(!scored.length)return {tool:null,confidence:0,reason:"इस अनुरोध के लिए अभी स्पष्ट tool नहीं मिला। Manual mode में विभाग चुनें।"};
  const best=scored[0],second=scored[1];
  const confidence=best.score>=3&&(!second||best.score>second.score)?0.9:best.score>=(second?second.score:0)?0.68:0.45;
  return {tool:best.tool,confidence,reason:confidence>=0.85?"आपके अनुरोध से यह विभाग सबसे उपयुक्त लगता है।":"यह शुरुआती सुझाव है; खोलने से पहले जाँच लें।"};
 }
 function getToolById(id){return byId(id);}
 function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
 function renderToolDirectory(container,list){
  if(!container)return;
  container.replaceChildren();
  (list||tools).forEach(tool=>{
   const card=node("article","tool-card"),title=node("h3","",tool.name),desc=node("p","",tool.description),foot=node("div","tool-foot"),state=node("span","status "+tool.status,tool.status==="available"?"Available":tool.status==="limited"?"Limited":"Coming Soon");
   foot.appendChild(state);
   if(tool.href){const link=node("a","tool-open","Open tool →");link.href=tool.href;foot.appendChild(link);}
   card.append(title,desc,foot);container.appendChild(card);
  });
 }
 function init(){
  const search=$("toolSearch"),grid=$("toolGrid"),mode=$("commandMode"),input=$("universalCommand"),manual=$("manualTool"),project=$("projectNotice"),result=$("commandResult"),submit=$("commandSubmit"),toggle=$("mobileNavToggle"),nav=$("primaryNav");
  if(!grid||!input||!mode)return;
  renderToolDirectory(grid,tools);
  tools.forEach(tool=>{const option=node("option","",tool.name);option.value=tool.id;manual.appendChild(option);});
  function filter(){const q=(search.value||"").trim().toLocaleLowerCase();renderToolDirectory(grid,tools.filter(t=>(t.name+" "+t.category+" "+t.description).toLocaleLowerCase().includes(q)));}
  if(search)search.addEventListener("input",filter);
  if(toggle&&nav)toggle.addEventListener("click",()=>{const open=nav.classList.toggle("is-open");toggle.setAttribute("aria-expanded",String(open));});
  mode.addEventListener("change",()=>{manual.hidden=mode.value!=="manual";project.hidden=mode.value!=="project";});
  submit.addEventListener("click",()=>{
   const prompt=input.value.trim();
   result.replaceChildren();
   if(!prompt){result.textContent="पहले अपना काम लिखें।";input.focus();return;}
   let suggestion;
   if(mode.value==="manual")suggestion={tool:byId(manual.value),confidence:1,reason:"आपने विभाग स्वयं चुना है।"};
   else if(mode.value==="project"){result.textContent="Project Mode के लिए पहले Project OS में वास्तविक project चुनना होगा। Project saving अभी connect नहीं है; कोई data save नहीं हुआ।";return;}
   else suggestion=classifyIntent(prompt);
   if(!suggestion.tool){result.textContent=suggestion.reason;return;}
   const heading=node("strong","",suggestion.tool.name+" — "+(suggestion.tool.status==="available"?"Available":suggestion.tool.status==="limited"?"Limited":"Coming Soon"));
   const detail=node("p","",suggestion.reason+" यह केवल tool recommendation है; AI task अभी execute नहीं हुआ।");
   result.append(heading,detail);
   if(suggestion.tool.href){const link=node("a","primary-button","इस Tool को खोलें");link.href=suggestion.tool.href;result.appendChild(link);}
   else{const note=node("p","notice","यह सुविधा अभी Coming Soon है। अभी कोई AI generation शुरू नहीं हुई।");result.appendChild(note);}
  });
  const authStatus=$("workspaceAccount");
  if(window.ShifAAuth&&authStatus){
   window.ShifAAuth.requireSession().then(result=>{
    if(result.error)authStatus.textContent="Account status अभी verify नहीं हो सका।";
    else authStatus.textContent=result.user?"Signed in":"Guest preview · Login for your private account";
   });
  }
 }
 window.ShifAWorkspace=Object.freeze({classifyIntent,getToolById,renderToolDirectory});
 document.addEventListener("DOMContentLoaded",init);
})();