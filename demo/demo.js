(function(){
"use strict";
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js");
addEventListener("DOMContentLoaded",()=>requestAnimationFrame(()=>document.body.classList.add("loaded")));
/* Nav solide au scroll */
const nav=document.getElementById("nav");
if(nav && !nav.classList.contains("solid")){
  addEventListener("scroll",()=>nav.classList.toggle("solid",scrollY>40),{passive:true});
}
/* Révélations */
const rv=document.querySelectorAll(".rv");
if(reduced){rv.forEach(el=>el.classList.add("in"));}
else{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}}),{threshold:.15,rootMargin:"0px 0px -6% 0px"});
  rv.forEach(el=>io.observe(el));}
/* Compteurs */
document.querySelectorAll("[data-count]").forEach(el=>{
  new IntersectionObserver((es,io)=>{es.forEach(en=>{if(!en.isIntersecting)return;io.disconnect();
    const t=parseFloat(el.dataset.count),suf=el.dataset.suffix||"";
    if(reduced){el.textContent=t.toLocaleString("fr-FR")+suf;return;}
    const t0=performance.now();(function k(now){const p=Math.min(1,(now-t0)/1500),e=1-Math.pow(1-p,3);
      el.textContent=Math.round(t*e).toLocaleString("fr-FR")+suf;if(p<1)requestAnimationFrame(k);})(t0);
  });},{threshold:.6}).observe(el);
});
/* Mécanique HANA */
const m=document.getElementById("mech");
if(m){m.addEventListener("click",()=>{document.body.classList.toggle("mech");
  m.textContent=document.body.classList.contains("mech")?"Masquer la mécanique":"Voir la mécanique HANA";});}
})();
