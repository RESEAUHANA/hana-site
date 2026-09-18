/* HANA v7 */
(function(){
"use strict";
var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ----- menu mobile ----- */
var nav=document.querySelector(".nav"),tg=document.querySelector(".nav-toggle");
if(tg){tg.addEventListener("click",function(){var o=nav.classList.toggle("open");tg.setAttribute("aria-expanded",o?"true":"false");});}

/* ----- révélations au scroll ----- */
var rvs=document.querySelectorAll(".rv");
if("IntersectionObserver" in window && !reduced){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});},{threshold:.12});
  rvs.forEach(function(el){io.observe(el);});
}else{rvs.forEach(function(el){el.classList.add("in");});}

/* ----- compteurs ----- */
document.querySelectorAll("[data-count]").forEach(function(el){
  var target=parseInt(el.getAttribute("data-count"),10),
      pre=el.getAttribute("data-prefix")||"",suf=el.getAttribute("data-suffix")||"";
  function run(){var t0=null;function step(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/900,1);el.textContent=pre+Math.round(target*(p<.5?2*p*p:-1+(4-2*p)*p))+suf;if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}
  if(reduced){el.textContent=pre+target+suf;return;}
  if("IntersectionObserver" in window){var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){run();o.unobserve(el);}});},{threshold:.4});o.observe(el);}else run();
});

/* ----- jeu de la vie : moteur commun ----- */
function Life(canvas,opts){
  opts=opts||{};
  var ctx=canvas.getContext("2d"),cell=opts.cell||14,cols,rows,grid,next,raf,last=0,interval=opts.interval||120;
  var color=opts.color||"rgba(168,196,176,.9)",dpr=Math.min(window.devicePixelRatio||1,2);
  function size(){
    var w=canvas.clientWidth||canvas.parentElement.clientWidth,h=canvas.clientHeight||canvas.parentElement.clientHeight;
    canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    cols=Math.max(10,Math.floor(w/cell));rows=Math.max(10,Math.floor(h/cell));
    grid=new Uint8Array(cols*rows);next=new Uint8Array(cols*rows);
    seed();
  }
  function seed(){
    if(opts.pattern){opts.pattern(grid,cols,rows);return;}
    for(var i=0;i<cols*rows;i++)grid[i]=Math.random()<(opts.density||.12)?1:0;
  }
  function stepGrid(){
    for(var y=0;y<rows;y++)for(var x=0;x<cols;x++){
      var n=0;
      for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){
        if(!dx&&!dy)continue;
        n+=grid[((y+dy+rows)%rows)*cols+((x+dx+cols)%cols)];
      }
      var i=y*cols+x;next[i]=grid[i]?(n===2||n===3?1:0):(n===3?1:0);
    }
    var t=grid;grid=next;next=t;
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle=color;
    for(var y=0;y<rows;y++)for(var x=0;x<cols;x++)if(grid[y*cols+x])
      ctx.fillRect(x*cell+1,y*cell+1,cell-2,cell-2);
  }
  function loop(ts){
    raf=requestAnimationFrame(loop);
    if(ts-last<interval)return;last=ts;stepGrid();draw();
  }
  function sow(px,py){
    var x=Math.floor(px/cell),y=Math.floor(py/cell);
    for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++)
      if(Math.random()<.7)grid[((y+dy+rows)%rows)*cols+((x+dx+cols)%cols)]=1;
  }
  size();draw();
  if(!reduced)raf=requestAnimationFrame(loop);
  var rT;window.addEventListener("resize",function(){clearTimeout(rT);rT=setTimeout(size,180);});
  return{sow:sow,reseed:function(){grid.fill(0);seed();},canvas:canvas};
}

/* ----- grilles vivantes interactives ----- */
document.querySelectorAll("canvas.life").forEach(function(cv){
  var isMobile=window.matchMedia("(max-width:719px)").matches;
  var inHero=!!cv.closest(".hero-brand");
  var life=Life(cv,{cell:isMobile?12:16,density:inHero?.07:.11,interval:inHero?150:130});
  var host=cv.closest(".hero-brand")||cv.closest(".life-card")||cv.parentElement;
  function pt(e){var r=cv.getBoundingClientRect();var t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top};}
  host.addEventListener("pointermove",function(e){if(e.pointerType==="mouse"&&Math.random()<.35){var p=pt(e);life.sow(p.x,p.y);}});
  host.addEventListener("click",function(e){if(e.target.closest("a,button"))return;var p=pt(e);life.sow(p.x,p.y);});
  if(!inHero)host.addEventListener("touchmove",function(e){var p=pt(e);life.sow(p.x,p.y);},{passive:true});
});

/* ----- logo : mini-vie en boucle ----- */
document.querySelectorAll("canvas.logo-life").forEach(function(c){
  var ctx=c.getContext("2d"),n=5,s=c.width/n,g=[],i;
  for(i=0;i<n*n;i++)g.push(Math.random()<.35?1:0);
  /* glider initial */
  g[1]=1;g[n+2]=1;g[2*n]=1;g[2*n+1]=1;g[2*n+2]=1;
  function draw(){ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle="#7A9986";
    for(var y=0;y<n;y++)for(var x=0;x<n;x++)if(g[y*n+x])ctx.fillRect(x*s+1,y*s+1,s-2,s-2);}
  function step(){var nx=[];for(var y=0;y<n;y++)for(var x=0;x<n;x++){var c2=0;
    for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;c2+=g[((y+dy+n)%n)*n+((x+dx+n)%n)];}
    var idx=y*n+x;nx[idx]=g[idx]?(c2===2||c2===3?1:0):(c2===3?1:0);}
    if(nx.join("")===g.join("")||nx.indexOf(1)===-1){g=[];for(var k=0;k<n*n;k++)g.push(Math.random()<.35?1:0);}else g=nx;
    draw();}
  draw();if(!reduced)setInterval(step,700);
});

/* ----- démos des 4 règles (page méthode) ----- */
var RULES={
  r1:function(g,c,r){var x=Math.floor(c/2),y=Math.floor(r/2);g[y*c+x]=1;g[y*c+x+1]=1;},
  r2:function(g,c,r){var x=Math.floor(c/2)-1,y=Math.floor(r/2)-1;g[y*c+x]=1;g[y*c+x+1]=1;g[(y+1)*c+x]=1;g[(y+1)*c+x+1]=1;},
  r3:function(g,c,r){for(var y=2;y<r-2;y++)for(var x=2;x<c-2;x++)g[y*c+x]=Math.random()<.75?1:0;},
  r4:function(g,c,r){var x=2,y=2;g[y*c+x+1]=1;g[(y+1)*c+x+2]=1;g[(y+2)*c+x]=1;g[(y+2)*c+x+1]=1;g[(y+2)*c+x+2]=1;}
};
document.querySelectorAll("canvas.rule-demo").forEach(function(c){
  var k=c.getAttribute("data-rule");
  var l=Life(c,{cell:14,interval:420,color:"rgba(168,196,176,.95)",pattern:function(g,cols,rows){(RULES[k]||RULES.r2)(g,cols,rows);}});
  if(!reduced)setInterval(function(){l.reseed();},6000);
});

/* ----- formulaire de rappel ----- */
var form=document.getElementById("rappel-form");
if(form){
  form.addEventListener("submit",function(e){
    var action=form.getAttribute("action")||"";
    var usePlaceholder=action.indexOf("VOTRE_ID")!==-1;
    if(usePlaceholder){
      e.preventDefault();
      var fd=new FormData(form),lines=[];
      fd.forEach(function(v,k){if(k==="_gotcha"||!v)return;lines.push(k+" : "+v);});
      var body=encodeURIComponent("Demande de rappel depuis hanahealth.fr\n\n"+lines.join("\n"));
      window.location.href="mailto:contact@hanahealth.fr?subject="+encodeURIComponent("Demande de rappel — "+(fd.get("Ville")||""))+"&body="+body;
      form.classList.add("sent");
    }
  });
}
})();
