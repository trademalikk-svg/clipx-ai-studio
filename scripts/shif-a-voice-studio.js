(function(){
"use strict";
const $=id=>document.getElementById(id);
const supported=typeof window.speechSynthesis!=="undefined"&&typeof window.SpeechSynthesisUtterance!=="undefined";
let voices=[],currentAudioUrl=null;
function setSpeechStatus(message){$("speechStatus").textContent=message;}
function updateCount(){$("charCount").textContent=$("speechText").value.length+" / 5000 characters";}
function refreshVoices(){
 if(!supported){$("voiceSelect").replaceChildren(new Option("Speech synthesis not supported",""));setSpeechStatus("इस browser में Text-to-Speech उपलब्ध नहीं है। Chrome के updated version में कोशिश करें।");$("speakBtn").disabled=true;return;}
 const language=$("voiceLanguage").value,selected=$("voiceSelect").value;
 voices=window.speechSynthesis.getVoices().filter(v=>language==="all"||v.lang.toLowerCase().startsWith(language));
 const select=$("voiceSelect");select.replaceChildren();
 if(!voices.length){select.add(new Option("इस भाषा की कोई installed voice नहीं मिली",""));return;}
 voices.forEach((voice,index)=>select.add(new Option(voice.name+" ("+voice.lang+")"+(voice.default?" · Default":""),String(index))));
 const match=voices.findIndex(v=>v.name===selected);if(match>=0)select.value=String(match);
}
function updateSpeechButtons(){const active=supported&&window.speechSynthesis.speaking;$("pauseBtn").disabled=!active||window.speechSynthesis.paused;$("resumeBtn").disabled=!active||!window.speechSynthesis.paused;$("stopBtn").disabled=!active;}
$("speechText").addEventListener("input",updateCount);
$("voiceLanguage").addEventListener("change",refreshVoices);
$("speechRate").addEventListener("input",()=>$("rateValue").textContent=Number($("speechRate").value).toFixed(1)+"×");
$("speechPitch").addEventListener("input",()=>$("pitchValue").textContent=Number($("speechPitch").value).toFixed(1));
$("speakBtn").addEventListener("click",()=>{
 if(!supported){setSpeechStatus("Text-to-Speech इस browser में उपलब्ध नहीं है।");return;}
 const text=$("speechText").value.trim();if(!text){setSpeechStatus("पहले text लिखें।");return;}
 window.speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance(text),voice=voices[Number($("voiceSelect").value)];
 if(voice){utterance.voice=voice;utterance.lang=voice.lang;}else{utterance.lang=$("voiceLanguage").value==="hi"?"hi-IN":"en-US";}
 utterance.rate=Number($("speechRate").value);utterance.pitch=Number($("speechPitch").value);
 utterance.onstart=()=>{setSpeechStatus("Speech चल रही है…");updateSpeechButtons();};
 utterance.onend=()=>{setSpeechStatus("Speech पूरी हुई।");updateSpeechButtons();};
 utterance.onerror=e=>{setSpeechStatus("Speech error: "+e.error+". कोई दूसरी device voice चुनें।");updateSpeechButtons();};
 window.speechSynthesis.speak(utterance);updateSpeechButtons();
});
$("pauseBtn").addEventListener("click",()=>{if(supported)window.speechSynthesis.pause();updateSpeechButtons();setSpeechStatus("Speech paused.");});
$("resumeBtn").addEventListener("click",()=>{if(supported)window.speechSynthesis.resume();updateSpeechButtons();setSpeechStatus("Speech resumed.");});
$("stopBtn").addEventListener("click",()=>{if(supported)window.speechSynthesis.cancel();updateSpeechButtons();setSpeechStatus("Speech stopped.");});
if(supported){refreshVoices();window.speechSynthesis.addEventListener?.("voiceschanged",refreshVoices);}else refreshVoices();
$("audioFile").addEventListener("change",e=>{
 const file=e.target.files[0];if(!file)return;
 if(!file.type.startsWith("audio/")){$("audioStatus").textContent="कृपया audio file चुनें।";return;}
 if(file.size>50*1024*1024){$("audioStatus").textContent="Audio file 50 MB से छोटी होनी चाहिए।";return;}
 if(currentAudioUrl)URL.revokeObjectURL(currentAudioUrl);
 currentAudioUrl=URL.createObjectURL(file);const player=$("audioPlayer");player.src=currentAudioUrl;player.hidden=false;$("clearAudioBtn").disabled=false;
 $("audioInfo").textContent=file.name+" · "+(file.size/1024/1024).toFixed(2)+" MB";$("audioStatus").textContent="Audio device पर local preview के लिए ready है।";
});
$("playbackRate").addEventListener("input",()=>{const value=Number($("playbackRate").value);$("audioPlayer").playbackRate=value;$("playbackRateValue").textContent=value.toFixed(1)+"×";});
$("volumeInput").addEventListener("input",()=>{const value=Number($("volumeInput").value);$("audioPlayer").volume=value;$("volumeValue").textContent=Math.round(value*100)+"%";});
$("loopBtn").addEventListener("click",()=>{const player=$("audioPlayer");player.loop=!player.loop;$("loopBtn").textContent="Loop: "+(player.loop?"On":"Off");$("loopBtn").setAttribute("aria-pressed",String(player.loop));});
$("clearAudioBtn").addEventListener("click",()=>{const player=$("audioPlayer");player.pause();player.removeAttribute("src");player.load();player.hidden=true;if(currentAudioUrl)URL.revokeObjectURL(currentAudioUrl);currentAudioUrl=null;$("audioFile").value="";$("audioInfo").textContent="No audio selected.";$("audioStatus").textContent="Audio cleared.";$("clearAudioBtn").disabled=true;});
window.addEventListener("beforeunload",()=>{if(supported)window.speechSynthesis.cancel();if(currentAudioUrl)URL.revokeObjectURL(currentAudioUrl);});
updateCount();$("audioPlayer").volume=1;
})();