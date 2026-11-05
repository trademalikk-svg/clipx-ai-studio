(function(){
"use strict";
const $=id=>document.getElementById(id);
const ids=["imageFile","imagePreview","imageInfo","imageStatus","widthInput","heightInput","ratioLock","formatInput","rotationInput","brightnessInput","contrastInput","saturationInput","cropInput","downloadBtn","resetBtn","rotateLeftBtn","rotateRightBtn"];
if(ids.some(id=>!$(id)))return;
let original=null,objectUrl=null;
const controls=["widthInput","heightInput","ratioLock","formatInput","rotationInput","brightnessInput","contrastInput","saturationInput","cropInput"];
function setStatus(message){$("imageStatus").textContent=message;}
function setEnabled(enabled){["downloadBtn","resetBtn","rotateLeftBtn","rotateRightBtn"].forEach(id=>$(id).disabled=!enabled);}
function ratio(){return original?original.width/original.height:1;}
function updateRangeLabels(){["brightness","contrast","saturation"].forEach(name=>$(name+"Value").textContent=$(name+"Input").value);}
function resetValues(){if(!original)return;$("widthInput").value=original.width;$("heightInput").value=original.height;$("ratioLock").value="locked";$("formatInput").value="image/png";$("rotationInput").value="0";["brightness","contrast","saturation"].forEach(name=>$(name+"Input").value=100);$("cropInput").value="none";updateRangeLabels();render();}
function loadFile(file){
 if(!file){return;}
 if(!/^image\/(png|jpeg|webp)$/.test(file.type)){setStatus("केवल PNG, JPEG या WebP चुनें।");return;}
 if(file.size>15*1024*1024){setStatus("Image 15 MB से छोटी होनी चाहिए।");return;}
 const url=URL.createObjectURL(file),img=new Image();
 img.onload=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=url;original=img;$("imageInfo").textContent=img.naturalWidth+" × "+img.naturalHeight+" px · "+(file.size/1024).toFixed(1)+" KB";$("imagePreview").classList.remove("empty");$("widthInput").value=img.naturalWidth;$("heightInput").value=img.naturalHeight;setEnabled(true);setStatus("Image आपके browser में load हो गई।");render();};
 img.onerror=()=>{URL.revokeObjectURL(url);setStatus("Image open नहीं हो सकी। दूसरी file चुनें।");};
 img.src=url;
}
function cropRect(w,h,preset){
 const ratios={square:1,portrait:4/5,story:9/16,landscape:16/9};
 const target=ratios[preset];if(!target)return{x:0,y:0,w,h};
 if(w/h>target){const nw=h*target;return{x:(w-nw)/2,y:0,w:nw,h};}
 const nh=w/target;return{x:0,y:(h-nh)/2,w,h:nh};
}
function render(){
 if(!original)return;
 const w=Number($("widthInput").value),h=Number($("heightInput").value);
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>6000||h>6000){setStatus("Width और height 1 से 6000 px के बीच रखें।");return;}
 const rotation=Number($("rotationInput").value),sw=rotation%180?original.naturalHeight:original.naturalWidth,sh=rotation%180?original.naturalWidth:original.naturalHeight;
 const rect=cropRect(sw,sh,$("cropInput").value),canvas=document.createElement("canvas");
 canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d");
 if(!ctx){setStatus("Canvas उपलब्ध नहीं है।");return;}
 ctx.filter="brightness("+$("brightnessInput").value+"%) contrast("+$("contrastInput").value+"%) saturate("+$("saturationInput").value+"%)";
 ctx.translate(w/2,h/2);ctx.rotate(rotation*Math.PI/180);
 const scaleX=w/rect.w,scaleY=h/rect.h;
 ctx.drawImage(original,-original.naturalWidth/2,-original.naturalHeight/2,original.naturalWidth,original.naturalHeight);
 ctx.setTransform(1,0,0,1,0,0);
 const preview=$("imagePreview");preview.replaceChildren();
 const out=document.createElement("img");out.alt="Edited image preview";out.src=canvas.toDataURL("image/jpeg",.82);preview.appendChild(out);
 preview.dataset.canvasReady="true";
 // Store the rendered canvas for export; preview is only a lightweight JPEG.
 window.__shifAImageCanvas=canvas;
 setStatus("Preview updated · "+w+" × "+h+" px");
}
function renderCropCorrect(){
 if(!original)return;
 const w=Number($("widthInput").value),h=Number($("heightInput").value),rotation=Number($("rotationInput").value);
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>6000||h>6000){setStatus("Width और height 1 से 6000 px के बीच रखें।");return;}
 const rotated=document.createElement("canvas"),rctx=rotated.getContext("2d");
 const rw=rotation%180?original.naturalHeight:original.naturalWidth,rh=rotation%180?original.naturalWidth:original.naturalHeight;
 rotated.width=rw;rotated.height=rh;rctx.translate(rw/2,rh/2);rctx.rotate(rotation*Math.PI/180);rctx.drawImage(original,-original.naturalWidth/2,-original.naturalHeight/2);
 const crop=cropRect(rw,rh,$("cropInput").value),canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext("2d");ctx.filter="brightness("+$("brightnessInput").value+"%) contrast("+$("contrastInput").value+"%) saturate("+$("saturationInput").value+"%)";
 ctx.drawImage(rotated,crop.x,crop.y,crop.w,crop.h,0,0,w,h);
 const preview=$("imagePreview");preview.replaceChildren();const img=document.createElement("img");img.alt="Edited image preview";img.src=canvas.toDataURL("image/jpeg",.82);preview.appendChild(img);window.__shifAImageCanvas=canvas;setStatus("Preview updated · "+w+" × "+h+" px");
}
function applyAspect(source){
 if(!original||$("ratioLock").value!=="locked")return;
 const active=source==="widthInput"?"heightInput":"widthInput",r=ratio();
 if(source==="widthInput")$(active).value=Math.max(1,Math.round(Number($(source).value)/r));
 else $(active).value=Math.max(1,Math.round(Number($(source).value)*r));
}
$("imageFile").addEventListener("change",e=>loadFile(e.target.files[0]));
$("widthInput").addEventListener("input",()=>{applyAspect("widthInput");renderCropCorrect();});
$("heightInput").addEventListener("input",()=>{applyAspect("heightInput");renderCropCorrect();});
controls.filter(id=>!["widthInput","heightInput","ratioLock","formatInput"].includes(id)).forEach(id=>$(id).addEventListener("input",()=>{updateRangeLabels();renderCropCorrect();}));
$("ratioLock").addEventListener("change",()=>setStatus($("ratioLock").value==="locked"?"Aspect ratio locked.":"Free resize enabled."));
$("rotateLeftBtn").addEventListener("click",()=>{$("rotationInput").value=String((Number($("rotationInput").value)+270)%360);renderCropCorrect();});
$("rotateRightBtn").addEventListener("click",()=>{$("rotationInput").value=String((Number($("rotationInput").value)+90)%360);renderCropCorrect();});
$("resetBtn").addEventListener("click",resetValues);
$("downloadBtn").addEventListener("click",()=>{const canvas=window.__shifAImageCanvas;if(!canvas){setStatus("पहले image load करें।");return;}const type=$("formatInput").value;canvas.toBlob(blob=>{if(!blob){setStatus("Image export नहीं हो सका।");return;}const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="shif-a-edited."+(type==="image/jpeg"?"jpg":type==="image/webp"?"webp":"png");document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);setStatus("Edited image download शुरू हुआ।");},type,.92);});
updateRangeLabels();setEnabled(false);
window.addEventListener("beforeunload",()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);});
})();