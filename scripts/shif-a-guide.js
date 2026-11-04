(function(){
 "use strict";
 const input=document.getElementById("guideSearch");
 if(!input)return;
 const topics=[...document.querySelectorAll(".topic")];
 input.addEventListener("input",()=>{
  const query=input.value.trim().toLocaleLowerCase();
  topics.forEach(topic=>topic.classList.toggle("hidden-topic",!!query&&!topic.textContent.toLocaleLowerCase().includes(query)));
 });
})();