// Source-contract checks for SHIF-A Chat Studio.
const fs=require("fs"),assert=require("assert");
const html=fs.readFileSync("chat-studio.html","utf8"),js=fs.readFileSync("scripts/shif-a-chat-studio.js","utf8");
for(const id of ["historyList","newChatBtn","messageList","messageInput","saveMessageBtn","deleteChatBtn","exportTxtBtn","exportJsonBtn","exportAllBtn","chatStatus"])assert(html.includes('id="'+id+'"'),"Missing UI control: "+id);
for(const token of ["localStorage","shifAChatStudio.v1","messages.push({role:"user"","textContent=safeText(m.content)","URL.createObjectURL","JSON.stringify","AI engine connected नहीं है","catch(e)"])assert(js.includes(token),"Missing behavior: "+token);
assert(html.includes("AI connection अभी active नहीं है"),"AI connection status must be explicit");
assert(!js.includes('role:"assistant"'),"Must not fabricate assistant messages");
new Function(js);
console.log("PASS: Chat Studio source contract and JavaScript syntax checks");
