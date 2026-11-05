// Lightweight source-contract checks for SHIF-A Image Studio.
const fs=require("fs"),assert=require("assert");
const html=fs.readFileSync("image-studio.html","utf8");
const js=fs.readFileSync("scripts/shif-a-image-studio.js","utf8");
for(const id of ["imageFile","imagePreview","widthInput","heightInput","rotationInput","brightnessInput","contrastInput","saturationInput","cropInput","downloadBtn"]) assert(html.includes('id="'+id+'"'),"Missing UI control: "+id);
for(const token of ["15*1024*1024","image/png","image/jpeg","image/webp","cropRect","renderCropCorrect","toBlob","beforeunload"]) assert(js.includes(token),"Missing behavior: "+token);
assert(html.includes("कोई image upload या AI generation API नहीं है"),"Privacy/capability disclosure missing");
new Function(js);
console.log("PASS: Image Studio UI contract and JavaScript syntax checks");
