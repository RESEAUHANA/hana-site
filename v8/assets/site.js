(function(){
  const body=document.body, nav=document.getElementById('nav');
  const pal=new URLSearchParams(location.search).get('p'); if(pal) body.classList.add('p-'+pal);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slow=+(new URLSearchParams(location.search).get('slow')||1);
  const timers=[]; const later=(f,t)=>timers.push(setTimeout(f,t*slow));

  /* Séquence d'arrivée : le planeur seul, face à nous (géré dans glider3d.js) → il glisse à droite,
     le sigle HANA apparaît, puis l'accroche et le bouton. « Passer » saute à l'état final. */
  function reveal(){
    timers.forEach(clearTimeout);
    body.classList.remove('is-intro'); body.classList.add('is-reveal'); body.classList.add('is-ready');
    dispatchEvent(new Event('hana:reveal'));
  }
  if(reduce){ reveal(); } else { later(reveal,700); }
  const skip=document.getElementById('skip'); skip&&skip.addEventListener('click',reveal);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') reveal(); });
  const ready=()=>{}; // (nav et textes suivent is-reveal)

  /* parallaxe légère du texte + nav au scroll */
  const hc=document.getElementById('heroContent');
  const onScroll=()=>{ const y=scrollY; nav&&nav.classList.toggle('scrolled',y>40);
    if(!reduce&&hc){ const k=Math.min(1,y/innerHeight); hc.style.setProperty('--hy',(k*-60)+'px'); hc.style.setProperty('--ho',String(1-k*1.4)); } };
  addEventListener('scroll',onScroll,{passive:true}); onScroll();
})();

/* Section réseau : les étapes pilotent la constellation au défilement ; sur mobile (carte au-dessus des étapes),
   la séquence se joue toute seule quand la carte apparaît ; un clic sur une ville l'allume et envoie une impulsion vers le hub */
(function(){
  const sec=document.getElementById('reseau'); if(!sec||new URLSearchParams(location.search).has('noreseau')) return;
  const nodes=[...sec.querySelectorAll('.net .node')], links=[...sec.querySelectorAll('.net .link')];
  const go=n=>{ sec.dataset.step=n; sec.classList.remove('s1','s2','s3'); for(let i=1;i<=n;i++) sec.classList.add('s'+i); };
  const setYou=i=>{ nodes.forEach((n,k)=>n.classList.toggle('you',k===i)); document.getElementById('capCity').textContent=nodes[i].dataset.n;
    if(+(sec.dataset.step||0)<2) go(2);
    links.forEach((l,k)=>l.classList.toggle('hit',k===i)); setTimeout(()=>links[i]&&links[i].classList.remove('hit'),1600); };
  nodes.forEach((n,i)=>{ n.addEventListener('click',()=>setYou(i)); n.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); setYou(i); } }); });
  nodes.forEach((n,k)=>n.classList.toggle('you',n.dataset.n==='Lyon'));
  const steps=[...sec.querySelectorAll('.step')];
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(!e.isIntersecting) return; e.target.classList.add('in','on'); go(Math.max(+e.target.dataset.step,+(sec.dataset.step||0))); steps.forEach(s=>{ if(s!==e.target) s.classList.remove('on'); }); }),{threshold:.6});
  steps.forEach(s=>io.observe(s));
  // carte visible : on déroule 1 → 2 → 3 automatiquement (utile sur mobile où les étapes sont plus bas)
  const map=sec.querySelector('.reseau-map');
  const auto=new IntersectionObserver(es=>{ if(!es[0].isIntersecting) return; auto.disconnect(); steps[0].classList.add('in'); go(1); setTimeout(()=>{ if(+(sec.dataset.step||0)<2) go(2); },1400); setTimeout(()=>{ if(+(sec.dataset.step||0)<3) go(3); },3600); },{threshold:.35});
  auto.observe(map);
})();
/* aide au contrôle : ?dbg=reseau&step=N ouvre directement la section réseau à l'étape N (captures) */
(function(){
  const q=new URLSearchParams(location.search); if(q.get('dbg')!=='reseau') return;
  const n=+(q.get('step')||3);
  addEventListener('load',()=>{ setTimeout(()=>{ document.documentElement.style.scrollBehavior='auto'; const sec=document.getElementById('reseau'); window.scrollTo(0,sec.offsetTop-80); sec.dataset.step=n; sec.classList.add('s1'); if(n>=2) sec.classList.add('s2'); if(n>=3) sec.classList.add('s3'); sec.querySelectorAll('.step').forEach(s=>s.classList.add('in')); dispatchEvent(new CustomEvent('hana:step',{detail:n})); },300); });
})();

/* Récit : apparition au défilement + compteurs + chat IA */
(function(){
  if(new URLSearchParams(location.search).has('nostory')) return;
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target);
    e.target.querySelectorAll('.count').forEach(el=>{ const to=+el.dataset.to, t0=performance.now(); const tick=now=>{ const k=Math.min(1,(now-t0)/1400), v=Math.round(to*(1-Math.pow(1-k,3))); el.textContent=v.toLocaleString('fr-FR'); if(k<1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  }),{threshold:.25});
  document.querySelectorAll('.story .io').forEach(el=>io.observe(el));
})();

/* Orbite des actes : rayon calé sur la taille réelle (rotation lente : container seul, en CSS) */
(function(){
  const ring=document.querySelector('.orbit-ring'); if(!ring) return;
  const size=()=>ring.style.setProperty('--r',(ring.clientWidth*0.45)+'px'); size(); addEventListener('resize',size);
})();

/* Mouvement : titres mot à mot, bandeaux liés au défilement (+ glisser), cartes inclinables */
(function(){
  if(new URLSearchParams(location.search).has('nomotion')) return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // titres
  document.querySelectorAll('.words-io').forEach(h=>{ h.innerHTML=h.textContent.trim().split(/\s+/).map((w,i)=>`<span class="w" style="--i:${i}"><i>${w}</i></span>`).join(''); });
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }),{threshold:.3});
  document.querySelectorAll('.words-io').forEach(h=>io.observe(h));
  // bandeaux : décalage proportionnel au défilement, sens opposés, + glisser à la souris
  const marqs=[...document.querySelectorAll('.marq')];
  if(marqs.length&&!reduce){
    const st=marqs.map(m=>({m,track:m.querySelector('.track'),drag:0,dragging:null,half:0}));
    const measure=()=>st.forEach(o=>o.half=o.track.scrollWidth/2); measure(); addEventListener('resize',measure);
    let base=0;
    const render=()=>{ st.forEach((o,i)=>{ const dir=o.m.classList.contains('r')?1:-1; let x=(base*0.35*dir+o.drag)%o.half; if(x>0) x-=o.half; o.track.style.setProperty('--x',x.toFixed(1)+'px'); }); };
    addEventListener('scroll',()=>{ base=scrollY; render(); },{passive:true});
    st.forEach(o=>{ o.m.addEventListener('pointerdown',e=>{ o.dragging=e.clientX; o.m.setPointerCapture(e.pointerId); });
      o.m.addEventListener('pointermove',e=>{ if(o.dragging===null) return; o.drag+=e.clientX-o.dragging; o.dragging=e.clientX; render(); });
      const up=()=>o.dragging=null; o.m.addEventListener('pointerup',up); o.m.addEventListener('pointercancel',up); });
    render();
  }
  // cartes inclinables
  if(!reduce&&matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.tilt').forEach(el=>{
      el.addEventListener('pointermove',e=>{ const r=el.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5; el.classList.add('hover'); el.style.transform=`perspective(1200px) rotateX(${(-y*6).toFixed(2)}deg) rotateY(${(x*8).toFixed(2)}deg) translateY(-4px)`; });
      el.addEventListener('pointerleave',()=>{ el.classList.remove('hover'); el.style.transform=''; });
    });
  }
})();

/* Actes : anneau 3D d'objets — rotation lente, glisser, et scroll ; l'objet de face donne le titre */
(function(){
  const ring=document.getElementById('actsRing'); if(!ring||new URLSearchParams(location.search).has('noacts')) return;
  const objs=[...ring.querySelectorAll('.obj')], name=document.getElementById('actName'), cat=document.getElementById('actCat');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const n=objs.length; let rot=0, vel=0, drag=null, lastX=0, front=-1, vis=false, lastScroll=scrollY;
  new IntersectionObserver(es=>{ vis=es[0].isIntersecting; },{threshold:.1}).observe(ring);
  let W=ring.clientWidth, H=ring.clientHeight; addEventListener('resize',()=>{ W=ring.clientWidth; H=ring.clientHeight; });
  function layout(){
    const Rx=W*0.42, Ry=H*0.12; let best=-1, bz=-2;
    objs.forEach((o,i)=>{ const a=rot+i*2*Math.PI/n; const x=Math.sin(a)*Rx, z=Math.cos(a), y=-z*Ry; const s=0.5+0.5*(z+1)/2, op=0.25+0.75*(z+1)/2;
      o.style.setProperty('--x',x.toFixed(1)+'px'); o.style.setProperty('--y',y.toFixed(1)+'px'); o.style.setProperty('--s',s.toFixed(3)); o.style.setProperty('--o',op.toFixed(3)); o.style.setProperty('--z',Math.round(100+z*50)); if(z>bz){bz=z;best=i;} });
    if(best!==front){ front=best; objs.forEach((o,i)=>o.classList.toggle('front',i===best)); name.classList.add('swap'); setTimeout(()=>{ name.textContent=objs[best].dataset.name; cat.textContent=objs[best].dataset.cat; name.classList.remove('swap'); },220); }
  }
  let odd=false;
  function tick(){ requestAnimationFrame(tick); odd=!odd; if(!vis||odd) return; if(drag===null){ rot+=vel*2+(reduce?0:0.005); vel*=0.85; } layout(); }   // 30 images/s suffisent, et rien hors écran
  ring.addEventListener('pointerdown',e=>{ drag=e.clientX; lastX=e.clientX; ring.setPointerCapture(e.pointerId); });
  ring.addEventListener('pointermove',e=>{ if(drag===null) return; const dx=e.clientX-lastX; lastX=e.clientX; rot+=dx*0.006; vel=dx*0.004; });
  const up=()=>drag=null; ring.addEventListener('pointerup',up); ring.addEventListener('pointercancel',up);
  addEventListener('scroll',()=>{ if(!vis||reduce) return; const d=scrollY-lastScroll; lastScroll=scrollY; rot+=d*0.0025; },{passive:true});
  objs.forEach((o,i)=>o.addEventListener('click',()=>{ const target=-i*2*Math.PI/n; let d=((target-rot)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI; vel=0; const t0=performance.now(), r0=rot; const go=now=>{ const k=Math.min(1,(now-t0)/700), e=1-Math.pow(1-k,3); rot=r0+d*e; if(k<1) requestAnimationFrame(go); }; requestAnimationFrame(go); }));
  layout(); requestAnimationFrame(tick);
})();

/* Carte « appel entrant » : sonne quand elle apparaît, décroche après deux sonneries, puis compteur */
(function(){
  const call=document.getElementById('call'); if(!call) return;
  const t=document.getElementById('callTimer'); let sec=0, started=false;
  new IntersectionObserver(es=>{ if(!es[0].isIntersecting||started) return; started=true;
    setTimeout(()=>{ call.classList.add('live'); setInterval(()=>{ sec++; t.textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0'); },1000); },2600);
  },{threshold:.5}).observe(call);
})();

/* Expertises : cartes empilées ; la carte recouverte recule et s'assombrit légèrement */
(function(){
  const cards=[...document.querySelectorAll('#stack .sc')]; if(!cards.length) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let vis=false; new IntersectionObserver(es=>{ vis=es[0].isIntersecting; },{rootMargin:'200px'}).observe(document.getElementById('stack'));
  const tick=()=>{ if(!vis) return; cards.forEach((c,i)=>{ const next=cards[i+1]; if(!next){ c.style.setProperty('--s',1); c.style.setProperty('--b',1); return; }
    const r=c.getBoundingClientRect(), n=next.getBoundingClientRect(); const k=Math.min(1,Math.max(0,(r.bottom-n.top)/r.height));
    c.style.setProperty('--s',(1-k*0.05).toFixed(3)); c.style.setProperty('--b',(1-k*0.35).toFixed(3)); }); };
  addEventListener('scroll',tick,{passive:true}); addEventListener('resize',tick); tick();
})();
