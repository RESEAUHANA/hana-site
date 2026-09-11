/* HANA — écosystème vivant */
(function(){
"use strict";
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SAUGE="#A8C4B0", EUCA="#7A9986";

/* Classes de révélation : en tête, pour qu'aucune erreur plus bas ne bloque l'affichage du contenu */
document.documentElement.classList.add("js");
const markLoaded=()=>{ const go=()=>document.body.classList.add("loaded"); requestAnimationFrame(go); setTimeout(go,400); };
if(document.readyState==="loading") addEventListener("DOMContentLoaded",markLoaded); else markLoaded();
const safe=(fn)=>{ try{ return fn(); }catch(err){ console.warn("HANA: animation ignorée", err); } };

/* ---------- Jeu de la vie, avec naissance/mort en fondu ---------- */
function Life(canvas, o){
  const ctx = canvas.getContext("2d");
  let cols=o.cols, rows=o.rows, cell, grid, age, alpha, steps=0, timer=null, visible=true, raf=null;
  const blank=v=>Array.from({length:rows},()=>new Array(cols).fill(v||0));
  function resize(){
    const r = canvas.getBoundingClientRect();
    const w = r.width>1 ? r.width : (canvas.clientWidth||innerWidth||300);
    const h = r.height>1 ? r.height : (canvas.clientHeight||Math.round(innerHeight*.88)||150);
    canvas.width=Math.max(1,Math.round(w*devicePixelRatio)); canvas.height=Math.max(1,Math.round(h*devicePixelRatio));
    if(o.fit==="width"){ cell=canvas.width/cols; rows=Math.min(600, Math.max(1, Math.ceil(canvas.height/cell)+1)); }
    else cell=Math.min(canvas.width/cols, canvas.height/rows);
    if(!isFinite(cell)||cell<=0) cell=1;
    seed();
  }
  function seed(){ grid=blank(); age=blank(); alpha=blank(); steps=0; (o.seed||(()=>{}))(set, cols, rows); }
  function set(x,y){ if(y>=0&&y<rows&&x>=0&&x<cols){ grid[y][x]=1; age[y][x]=1; } }
  function nb(x,y){ let n=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ if(!dx&&!dy)continue;
      let nx=x+dx, ny=y+dy;
      if(o.wrap){ nx=(nx+cols)%cols; ny=(ny+rows)%rows; }
      if(nx>=0&&nx<cols&&ny>=0&&ny<rows&&grid[ny][nx])n++; } return n; }
  function step(){
    const g=blank(), a=blank();
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const n=nb(x,y);
      if(grid[y][x]){ if(n===2||n===3){g[y][x]=1;a[y][x]=age[y][x]+1;} }
      else if(n===3){g[y][x]=1;a[y][x]=1;}
    }
    grid=g; age=a; steps++;
    if(o.every)o.every(steps,set,seed);
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const pad=cell*0.14;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const target=grid[y][x]?1:0;
      alpha[y][x]+= (target-alpha[y][x]) * (reduced?1:0.12);
      const al=alpha[y][x]; if(al<0.02)continue;
      ctx.globalAlpha = al * (o.dim||1);
      ctx.fillStyle = age[y][x]<=1 ? SAUGE : (age[y][x]<5 ? EUCA : "rgba(122,153,134,.6)");
      ctx.fillRect(x*cell+pad, y*cell+pad, cell-2*pad, cell-2*pad);
    }
    ctx.globalAlpha=1;
  }
  function loop(){ draw(); raf=requestAnimationFrame(loop); }
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;}).observe(canvas);
  addEventListener("resize",()=>{ if(o.fit==="width")safe(resize); });
  resize();
  if(o.fit==="width" && canvas.getBoundingClientRect().width<=1) addEventListener("load",()=>safe(resize),{once:true});
  if(reduced){ for(let i=0;i<3;i++)step(); draw(); }
  else { timer=setInterval(()=>{if(visible)step();}, o.interval||430); loop(); }
  return {set, get cols(){return cols}};
}
const glider=(set,x,y)=>[[1,0],[2,1],[0,2],[1,2],[2,2]].forEach(([dx,dy])=>set(x+dx,y+dy));

/* Hero */
const heroC=document.getElementById("life-hero");
if(heroC) safe(()=>{
  const L=Life(heroC,{cols:Math.max(30,Math.round(innerWidth/30)),rows:1,fit:"width",wrap:true,interval:430,dim:1,
    seed(set,cols,rows){ for(let i=0;i<cols*rows*0.07;i++)set(Math.floor(Math.random()*cols),Math.floor(Math.random()*rows)); glider(set,2,2); glider(set,cols-8,3); },
    every(s,set,reseed){ if(s%16===0)glider(set,Math.floor(Math.random()*8),Math.floor(Math.random()*5)); if(s%220===0)reseed(); }});
  if(!reduced){
    let last=0;
    const sow=e=>{ const r=heroC.getBoundingClientRect();
      const x=Math.floor((e.clientX-r.left)/r.width*L.cols), y=Math.floor((e.clientY-r.top)/r.width*L.cols);
      L.set(x,y); L.set(x+1,y); L.set(x,y+1); };
    heroC.parentElement.addEventListener("pointermove",e=>{const t=Date.now(); if(t-last>80){last=t;sow(e);}},{passive:true});
    heroC.parentElement.addEventListener("pointerdown",sow);
  }
});
/* Logo vivant */
document.querySelectorAll("canvas.logo-life").forEach(c=>safe(()=>Life(c,{cols:8,rows:8,wrap:true,interval:640,seed(set){glider(set,1,1);}})));
/* Démos des règles */
const RULES={r1:{seed(set){set(2,2);set(4,4);},reset:2}, r2:{seed(set){set(2,3);set(3,3);set(4,3);},reset:8},
  r3:{seed(set){for(let y=2;y<5;y++)for(let x=2;x<5;x++)set(x,y);},reset:5}, r4:{seed(set){set(3,3);set(4,3);set(3,4);},reset:3}};
document.querySelectorAll("canvas.rule-demo").forEach(c=>safe(()=>{ const r=RULES[c.dataset.rule]; if(!r)return;
  Life(c,{cols:7,rows:7,interval:700,seed:r.seed,every(s,set,reseed){if(s>=r.reset)reseed();}}); }));

/* ---------- Révélations au scroll ---------- */
const rv=document.querySelectorAll(".rv");
if(rv.length){
  if(reduced){ rv.forEach(el=>el.classList.add("in")); }
  else{
    const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} }),{threshold:.18,rootMargin:"0px 0px -6% 0px"});
    rv.forEach(el=>io.observe(el));
  }
}

/* ---------- Compteurs ---------- */
const counters=document.querySelectorAll("[data-count]");
if(counters.length){
  const io=new IntersectionObserver(es=>es.forEach(en=>{
    if(!en.isIntersecting||en.target.dataset.done)return; en.target.dataset.done=1;
    const el=en.target, target=parseFloat(el.dataset.count), pre=el.dataset.prefix||"", suf=el.dataset.suffix||"";
    if(reduced){el.textContent=pre+target+suf;return;}
    const t0=performance.now(), dur=1400;
    (function tick(t){ const p=Math.min(1,(t-t0)/dur), e2=1-Math.pow(1-p,3);
      el.textContent=pre+Math.round(target*e2)+suf; if(p<1)requestAnimationFrame(tick); })(t0);
  }),{threshold:.6});
  counters.forEach(c=>io.observe(c));
}

/* ---------- Constellation de l'écosystème ---------- */
const eco=document.getElementById("eco");
if(eco){
  const cap=document.getElementById("eco-caption"), base=cap?cap.textContent:"";
  eco.querySelectorAll("[data-info]").forEach(n=>{
    n.addEventListener("mouseenter",()=>{ if(cap)cap.textContent=n.dataset.info; n.classList.add("on"); });
    n.addEventListener("mouseleave",()=>{ if(cap)cap.textContent=base; n.classList.remove("on"); });
    n.addEventListener("focus",()=>{ if(cap)cap.textContent=n.dataset.info; });
    n.addEventListener("blur",()=>{ if(cap)cap.textContent=base; });
  });
}

/* ---------- Tarifs : rythme de paiement ---------- */
const seg=document.getElementById("pay-toggle");
if(seg){
  const prices=document.querySelectorAll(".price[data-base]"), note=document.getElementById("pay-note");
  const modes={m:{k:1,label:"Paiement chaque mois · engagement 6 mois."},
    t:{k:.95,label:"−5 % : paiement chaque trimestre · engagement 12 mois."},
    a:{k:.93,label:"−7 % : année payée d'avance · engagement 12 mois."}};
  seg.addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b)return;
    seg.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));
    const m=modes[b.dataset.mode];
    prices.forEach(p=>{p.textContent=Math.round(+p.dataset.base*m.k).toLocaleString("fr-FR")+" €";});
    note.textContent=m.label; });
}
})();
/* ---------- Navigation : fond au défilement, masquage en descente, menu mobile ---------- */
(function(){
  const nav=document.getElementById("nav"); if(!nav)return;
  const light=nav.classList.contains("light");
  let last=scrollY;
  const onScroll=()=>{
    const y=scrollY;
    if(!light) nav.classList.toggle("solid", y>60);
    nav.classList.toggle("hide", y>last && y>320 && !document.getElementById("menu").classList.contains("open"));
    last=y;
  };
  addEventListener("scroll",onScroll,{passive:true}); onScroll();
  const burger=document.getElementById("burger"), menu=document.getElementById("menu");
  if(burger&&menu){
    burger.addEventListener("click",()=>{ const open=menu.classList.toggle("open"); burger.setAttribute("aria-expanded",open); burger.textContent=open?"Fermer":"Menu"; nav.classList.toggle("solid",open||scrollY>60||light); });
    menu.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{ menu.classList.remove("open"); burger.setAttribute("aria-expanded","false"); burger.textContent="Menu"; }));
  }
  /* Révélation des images */
  const imgs=document.querySelectorAll(".img-rv");
  if(imgs.length){
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){ imgs.forEach(el=>el.classList.add("in")); }
    else{ const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} }),{threshold:.2}); imgs.forEach(el=>io.observe(el)); }
  }
  /* Aperçu du site témoin : mise à l'échelle de l'iframe */
  const dev=document.querySelector(".device .screen iframe");
  if(dev){
    const fit=()=>{ const w=dev.parentElement.clientWidth; dev.style.transform="scale("+(w/1440)+")"; };
    addEventListener("resize",fit,{passive:true}); fit();
  }
})();
(function(){
  const cap=document.getElementById("net-caption");
  if(!cap)return;
  const msgs=["Un praticien par ville, tous connectés entre eux.",
    "Votre confrère de Lyon publie un article expert : il vous cite à Marseille.",
    "Google et les IA voient des recommandations croisées, signées, visibles.",
    "L'autorité de chacun nourrit celle de tous. Jamais celle d'un concurrent."];
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  let i=0;
  setInterval(()=>{ cap.classList.add("fade");
    setTimeout(()=>{ i=(i+1)%msgs.length; cap.textContent=msgs[i]; cap.classList.remove("fade"); },500);
  },5200);
})();
