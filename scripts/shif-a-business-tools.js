(function(){
"use strict";
const $=id=>document.getElementById(id);
let currentTool="profile",latest="";
const WORKSPACE_KEY="shifA.businessTools.workspace.v1";\nconst LIBRARY_KEY="shifA.businessTools.library.v1";\nconst MAX_LIBRARY_ITEMS=30;\nlet restoring=false;
const fields={profile:["detailWrap"],listing:["detailWrap","itemWrap","priceWrap"],reply:["customerWrap"],plan:["goalWrap","budgetWrap"],quote:["itemWrap","priceWrap","qtyWrap","taxWrap"]};
function selectTool(tool){
 currentTool=tool;
 document.querySelectorAll("[data-tool]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.tool===tool)));
 ["detailWrap","customerWrap","goalWrap","budgetWrap","itemWrap","priceWrap","qtyWrap","taxWrap"].forEach(id=>$(id).classList.toggle("hidden",!fields[tool].includes(id)));
 const names={profile:"Business Profile",listing:"Product Listing",reply:"Customer Reply",plan:"Marketing Plan",quote:"Quotation Estimate"};
 $("formStatus").textContent=names[tool]+" selected.";
 saveWorkspace();
}
document.querySelectorAll("[data-tool]").forEach(b=>b.addEventListener("click",()=>selectTool(b.dataset.tool)));
const FIELD_IDS=["businessName","businessType","city","language","details","customerMessage","goal","budget","itemName","itemPrice","itemQty","taxRate"];
function collectFields(){const out={};FIELD_IDS.forEach(id=>out[id]=$(id).value);return out;}
function saveWorkspace(){
 if(restoring)return;
 try{localStorage.setItem(WORKSPACE_KEY,JSON.stringify({version:1,tool:currentTool,fields:collectFields(),draft:latest}));}
 catch(error){$("formStatus").textContent="Local save उपलब्ध नहीं है। Draft को Download TXT से सुरक्षित रखें।";}
}
function restoreWorkspace(){
 try{
  const raw=localStorage.getItem(WORKSPACE_KEY);if(!raw)return;
  const saved=JSON.parse(raw),f=saved&&saved.fields;
  if(!saved||saved.version!==1||!f||typeof f!=="object"||Array.isArray(f)||!Object.prototype.hasOwnProperty.call(fields,saved.tool))return;
  const limits={businessName:120,businessType:100,city:100,details:1000,customerMessage:1000,goal:180,budget:40,itemName:120};
  for(const [id,max] of Object.entries(limits)){if(typeof f[id]!=="string"||f[id].length>max)return;}
  if(!["hi","en","both"].includes(f.language))return;
  for(const id of ["itemPrice","itemQty","taxRate"]){if(typeof f[id]!=="string"||f[id].length>32)return;}
  restoring=true;FIELD_IDS.forEach(id=>{if(typeof f[id]==="string")$(id).value=f[id];});selectTool(saved.tool);
  if(typeof saved.draft==="string"&&saved.draft.length<=30000){latest=saved.draft;if(latest)$("result").textContent=latest;}
  restoring=false;
  if(latest)$("formStatus").textContent="पिछला Business Toolkit draft restore हो गया।";
 }catch(error){restoring=false;$("formStatus").textContent="Saved business workspace पढ़ा नहीं जा सका।";}
}
function readLibrary(){
 try{const raw=localStorage.getItem(LIBRARY_KEY);if(!raw)return [];const items=JSON.parse(raw);if(!Array.isArray(items))return [];return items.filter(x=>x&&typeof x.id==="string"&&typeof x.title==="string"&&typeof x.tool==="string"&&Object.prototype.hasOwnProperty.call(fields,x.tool)&&typeof x.draft==="string"&&x.draft.length<=30000&&x.fields&&typeof x.fields==="object"&&!Array.isArray(x.fields)).slice(0,MAX_LIBRARY_ITEMS);}
 catch(error){return [];}
}
function renderLibrary(){
 const root=$("savedBusinessDocs");if(!root)return;const items=readLibrary();root.replaceChildren();
 if(!items.length){const p=document.createElement("p");p.className="muted";p.textContent="अभी कोई saved document नहीं है।";root.appendChild(p);return;}
 items.forEach(item=>{const row=document.createElement("div");row.className="saved-item";const info=document.createElement("div"),title=document.createElement("strong"),meta=document.createElement("small");title.textContent=item.title;meta.textContent=item.toolLabel+" · "+new Date(item.savedAt||0).toLocaleString();info.append(title,meta);const actions=document.createElement("div");actions.className="actions";const open=document.createElement("button");open.type="button";open.className="secondary";open.textContent="Open";open.dataset.openDoc=item.id;const del=document.createElement("button");del.type="button";del.className="secondary";del.textContent="Delete";del.dataset.deleteDoc=item.id;actions.append(open,del);row.append(info,actions);root.appendChild(row);});
}
function saveToLibrary(){
 if(!latest){$("libraryStatus").textContent="पहले draft तैयार करें।";return;}
 const labels={profile:"Business Profile",listing:"Product Listing",reply:"Customer Reply",plan:"Marketing Plan",quote:"Quotation Estimate"};const items=readLibrary();
 items.unshift({id:Date.now()+"-"+Math.random().toString(36).slice(2,8),title:($("businessName").value.trim()||"Business")+" — "+labels[currentTool],tool:currentTool,toolLabel:labels[currentTool],fields:collectFields(),draft:latest,savedAt:Date.now()});
 try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(items.slice(0,MAX_LIBRARY_ITEMS)));renderLibrary();$("libraryStatus").textContent="Document Library में सेव हो गया।";}
 catch(error){$("libraryStatus").textContent="Library में जगह उपलब्ध नहीं है। पुराने drafts हटाएँ या TXT डाउनलोड करें।";}
}
function openLibraryItem(id){
 const item=readLibrary().find(x=>x.id===id);if(!item)return;restoring=true;
 FIELD_IDS.forEach(key=>{if(typeof item.fields[key]==="string")$(key).value=item.fields[key];});selectTool(item.tool);latest=item.draft;$("result").textContent=latest;restoring=false;saveWorkspace();$("formStatus").textContent="Saved document खुल गया।";$("libraryStatus").textContent="Document editor में restore हो गया।";
}
function deleteLibraryItem(id){const items=readLibrary().filter(x=>x.id!==id);try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(items));renderLibrary();$("libraryStatus").textContent="Saved document हटाया गया।";}catch(error){$("libraryStatus").textContent="Document हटाया नहीं जा सका।";}}
function build(){
 const name=$("businessName").value.trim(),type=$("businessType").value.trim(),city=$("city").value.trim(),lang=$("language").value,details=$("details").value.trim();
 const hi=lang==="hi",both=lang==="both",heading=(h,e)=>hi?h:both?h+" / "+e:e;
 const biz=name||heading("आपका व्यवसाय","Your Business"),area=city||heading("आपका सेवा क्षेत्र","your service area");
 const desc=details||heading("अपने products और services की जानकारी जोड़ें।","Add your products and services details.");
 if(currentTool==="profile")return heading("व्यवसाय परिचय","BUSINESS PROFILE")+"\n\n"+biz+"\n"+(type||"") +"\n"+area+"\n\n"+(hi?"हमारा उद्देश्य ग्राहकों को अच्छी सेवा और उपयोगी products उपलब्ध कराना है।":"We aim to provide helpful products and reliable service to our customers.")+"\n\n"+heading("हमारी सेवाएँ / Products","Our products and services")+":\n"+desc+"\n\n"+heading("संपर्क जानकारी अपने verified business details से जोड़ें।","Add your verified business contact details before publishing.");
 if(currentTool==="listing"){
  const item=$("itemName").value.trim()||heading("आपका product","Your product");
  const price=$("itemPrice").value.trim();
  return heading("PRODUCT LISTING","PRODUCT LISTING")+"\n\n"+item+"\n"+biz+" · "+area+"\n\n"+desc+"\n\n"+(price?"Price / कीमत: ₹"+Number(price).toFixed(2):"Price / कीमत: Contact for price")+"\n\n"+heading("ऑर्डर या अधिक जानकारी के लिए संपर्क करें।","Contact us to order or learn more.")+"\n\n"+heading("सभी विवरण और उपलब्धता प्रकाशित करने से पहले जाँचें।","Verify all details and availability before publishing.");
 }
 if(currentTool==="reply"){
  const msg=$("customerMessage").value.trim();
  if(!msg)throw new Error("पहले customer का सवाल या स्थिति लिखें।");
  return heading("ग्राहक के लिए जवाब","CUSTOMER REPLY")+"\n\n"+(hi?"नमस्ते! आपके संदेश के लिए धन्यवाद।":"Hello! Thank you for contacting us.")+"\n\n"+(hi?"आपके सवाल के बारे में: ":"Regarding your question: ")+msg+"\n\n"+(hi?"हम आपकी सहायता करने की पूरी कोशिश करेंगे। कृपया जरूरी जानकारी साझा करें।":"We’ll do our best to help. Please share any relevant details.")+"\n\n"+(hi?"धन्यवाद, ":"Regards, ")+biz;
 }
 if(currentTool==="plan"){
  const goal=$("goal").value.trim()||heading("स्थानीय ग्राहकों तक पहुँचना","Reach more local customers");
  const budget=$("budget").value.trim();
  return heading("30-DAY MARKETING STARTER PLAN","30-DAY MARKETING STARTER PLAN")+"\n\nBusiness: "+biz+"\nGoal: "+goal+"\nArea: "+area+"\nBudget: "+(budget||"₹0 / organic-first")+"\n\n"+(hi?"सप्ताह 1: Business profile, सही समय और संपर्क जानकारी तैयार करें।\nसप्ताह 2: तीन उपयोगी product/service posts और एक परिचय पोस्ट साझा करें।\nसप्ताह 3: ग्राहकों के सामान्य सवालों के जवाब और feedback साझा करें।\nसप्ताह 4: कौन-सी पोस्ट से वास्तविक enquiries आईं, उसका रिकॉर्ड रखें और अगला content उसी आधार पर बनाएँ।":"Week 1: Complete your business profile, hours and contact details.\nWeek 2: Publish three useful product/service posts and one introduction.\nWeek 3: Answer common customer questions and share feedback with permission.\nWeek 4: Track genuine enquiries and plan the next content based on results.")+"\n\n"+heading("हर platform के नियम और customer privacy का ध्यान रखें।","Follow platform rules and respect customer privacy.");
 }
 if(currentTool==="quote"){
  const item=$("itemName").value.trim(),price=Number($("itemPrice").value),qty=Number($("itemQty").value),tax=Number($("taxRate").value);
  if(!item)throw new Error("पहले item या service का नाम भरें।");
  if($("itemPrice").value.trim()===""||!Number.isFinite(price)||price<0)throw new Error("Valid unit price भरें।");
  if(!Number.isInteger(qty)||qty<1||qty>100000)throw new Error("Quantity 1 या उससे अधिक पूर्ण संख्या होनी चाहिए।");
  if(!Number.isFinite(tax)||tax<0||tax>100)throw new Error("Tax rate 0 से 100 के बीच रखें।");
  const subtotal=price*qty,taxAmount=subtotal*tax/100,total=subtotal+taxAmount;
  const money=n=>"₹"+n.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});
  return heading("QUOTATION ESTIMATE","QUOTATION ESTIMATE")+"\n\nBusiness: "+biz+"\nService area: "+area+"\nItem / Service: "+item+"\nUnit price: "+money(price)+"\nQuantity: "+qty+"\nSubtotal: "+money(subtotal)+"\nOptional entered tax rate: "+tax+"%\nTax estimate: "+money(taxAmount)+"\nESTIMATED TOTAL: "+money(total)+"\n\n"+heading("यह केवल सामान्य estimate है, GST tax invoice नहीं। लागू tax, नियम और business details जारी करने से पहले स्वयं verify करें।","This is a general estimate, not a GST tax invoice. Verify applicable taxes, rules and business details before issuing.");
 }
}
$("generateBtn").addEventListener("click",()=>{
 try{latest=build();$("result").textContent=latest;saveWorkspace();$("formStatus").textContent="Draft ready. Please verify details before using."; $("resultStatus").textContent="";}
 catch(e){$("formStatus").textContent=e.message;}
});
$("saveToLibraryBtn").addEventListener("click",saveToLibrary);
$("savedBusinessDocs").addEventListener("click",event=>{const open=event.target.closest("[data-open-doc]"),del=event.target.closest("[data-delete-doc]");if(open)openLibraryItem(open.dataset.openDoc);if(del)deleteLibraryItem(del.dataset.deleteDoc);});
$("copyBtn").addEventListener("click",async()=>{
 if(!latest){$("resultStatus").textContent="पहले draft तैयार करें।";return;}
 try{await navigator.clipboard.writeText(latest);$("resultStatus").textContent="Draft copied.";}
 catch{$("resultStatus").textContent="Clipboard permission नहीं मिली। Text select करके copy करें।";}
});
$("downloadBtn").addEventListener("click",()=>{
 if(!latest){$("resultStatus").textContent="पहले draft तैयार करें।";return;}
 const blob=new Blob([latest],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="shif-a-business-draft.txt";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);$("resultStatus").textContent="TXT download started.";
});
$("clearBtn").addEventListener("click",()=>{
 ["businessName","businessType","city","details","customerMessage","goal","budget","itemName","itemPrice","taxRate"].forEach(id=>$(id).value="");
 $("itemQty").value="1";latest="";$("result").textContent="Choose a tool, enter details and tap Create Draft.";
 $("formStatus").textContent="Fields cleared."; $("resultStatus").textContent="";
 try{localStorage.removeItem(WORKSPACE_KEY);}catch(error){}
});
FIELD_IDS.forEach(id=>$(id).addEventListener("input",saveWorkspace));\nrestoring=true;\nselectTool("profile");\nrestoring=false;\nrestoreWorkspace();\nrenderLibrary();
})();