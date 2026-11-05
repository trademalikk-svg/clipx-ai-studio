// Source-contract checks for SHIF-A Voice Studio.
const fs=require("fs"),assert=require("assert");
const html=fs.readFileSync("voice-studio.html","utf8"),js=fs.readFileSync("scripts/shif-a-voice-studio.js","utf8");
for(const id of ["speechText","voiceLanguage","voiceSelect","speechRate","speechPitch","speakBtn","pauseBtn","resumeBtn","stopBtn","audioFile","audioPlayer","playbackRate","volumeInput","loopBtn"])assert(html.includes('id="'+id+'"'),"Missing control: "+id);
for(const token of ["speechSynthesis","SpeechSynthesisUtterance","getVoices","utterance.rate","utterance.pitch","createObjectURL","50*1024*1024","playbackRate","player.loop","beforeunload"])assert(js.includes(token),"Missing behavior: "+token);
assert(html.includes("AI voice cloning")&&html.includes("audio file में export नहीं किया जाता"),"Capability limits must be disclosed");
assert(js.includes('const selectedName=voices[Number(select.value)]?.name;'),"Voice selection should preserve the selected voice by name when language filters change.");
assert(js.includes("voices.findIndex(v=>v.name===selectedName)"),"The selected voice should be restored after the voice list is rebuilt.");
new Function(js);
console.log("PASS: Voice Studio source contract and JavaScript syntax checks");
