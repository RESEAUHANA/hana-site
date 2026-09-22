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
  document.querySelectorAll('.story .io, .tarifs .io, .contact .io, .villes .io, .about-page .io, .rpage .io, .eco-page .io, .ref-page .io, .legal-page .io').forEach(el=>io.observe(el));
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
  document.querySelectorAll('.words-io').forEach(h=>{ h.innerHTML=h.textContent.trim().split(/\s+/).map((w,i)=>`<span class="w" style="--i:${i}"><i>${w}</i></span>`).join(' '); });
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

/* Tarifs : jeu de la vie derrière la carte de membre (un planeur qui traverse la grille, règles de Conway) */
(function(){
  const card=document.querySelector('.plan.main'), bg=card&&card.querySelector('.plan-bg'); if(!bg) return;
  if(new URLSearchParams(location.search).has('nomotion')||matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const cv=document.createElement('canvas'); cv.className='life'; card.insertBefore(cv,bg);
  const ctx=cv.getContext('2d'), S=44, G=[[1,0],[2,1],[0,2],[1,2],[2,2]];
  let cols=0,rows=0,grid,prev,age,t0=0,last=0,running=false;
  const idx=(x,y)=>((y+rows)%rows)*cols+((x+cols)%cols);
  function seed(){ grid=new Uint8Array(cols*rows); age=new Float32Array(cols*rows); G.forEach(([x,y])=>grid[idx(x+1,y+1)]=1); if(cols>10&&rows>6) G.forEach(([x,y])=>grid[idx(cols-5+x,Math.floor(rows/2)+y)]=1); prev=grid.slice(); }
  function resize(){ const r=card.getBoundingClientRect(); const d=Math.min(2,devicePixelRatio||1); cv.width=Math.ceil(r.width*d); cv.height=Math.ceil(r.height*d); ctx.setTransform(d,0,0,d,0,0); cols=Math.ceil(r.width/S); rows=Math.ceil(r.height/S); seed(); draw(1); }
  function step(){ const n=new Uint8Array(cols*rows); for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){ let c=0; for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ if(dx||dy) c+=grid[idx(x+dx,y+dy)]; } const a=grid[y*cols+x]; n[y*cols+x]=(c===3||(a&&c===2))?1:0; } prev=grid; grid=n; let alive=0; for(let i=0;i<grid.length;i++) alive+=grid[i]; if(!alive) seed(); }
  function draw(k){ ctx.clearRect(0,0,cv.width,cv.height); for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){ const i=y*cols+x, a=grid[i], p=prev[i]; if(!a&&!p) continue; const o=a?(p?1:k):(1-k); if(o<=0.02) continue; const sz=(S-8)*(a?(p?1:.85+.15*k):(1-.3*k)); ctx.globalAlpha=.5*o; ctx.fillStyle='#2fa36b'; ctx.beginPath(); ctx.roundRect(x*S+(S-sz)/2,y*S+(S-sz)/2,sz,sz,7); ctx.fill(); } ctx.globalAlpha=1; }
  function loop(now){ if(!running) return; if(!last) last=now; const T=520; if(now-last>=T){ step(); last=now; } draw(Math.min(1,(now-last)/260)); requestAnimationFrame(loop); }
  const io=new IntersectionObserver(es=>es.forEach(e=>{ running=e.isIntersecting; if(running){ last=0; requestAnimationFrame(loop); } }),{threshold:.1});
  io.observe(card); addEventListener('resize',resize,{passive:true}); resize();
})();

/* Contact : envoi du formulaire sans quitter la page (FormSubmit vers contact@hanahealth.fr, repli mailto) + carte chargée à la demande */
(function(){
  const f=document.getElementById('cform'); if(!f) return;
  f.addEventListener('submit',async e=>{
    e.preventDefault(); f.classList.add('tried'); if(!f.checkValidity()){ f.querySelector(':invalid')?.focus(); return; }
    const fd=new FormData(f); const data=Object.fromEntries(fd.entries());
    f.classList.add('busy');
    try{
      const r=await fetch('https://formsubmit.co/ajax/contact@hanahealth.fr',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)});
      if(!r.ok) throw new Error(r.status);
      f.classList.remove('busy'); f.classList.add('sent'); f.querySelector('.cf-ok').hidden=false;
    }catch(err){
      f.classList.remove('busy');
      const body=`Nom : ${data.nom}%0ASpécialité : ${data.specialite}%0AVille : ${data.ville}%0ATéléphone : ${data.telephone}%0AEmail : ${data.email}%0A%0A${encodeURIComponent(data.message||'')}`;
      location.href=`mailto:contact@hanahealth.fr?subject=${encodeURIComponent('Demande de visio · '+data.ville)}&body=${body}`;
    }
  });
  const b=document.getElementById('mapLoad'); if(!b) return;
  b.addEventListener('click',()=>{
    const m=document.getElementById('map'); const i=document.createElement('iframe');
    i.src='https://www.google.com/maps?q=Boulevard+Latil,+13008+Marseille&z=15&hl=fr&output=embed'; i.loading='lazy'; i.referrerPolicy='no-referrer-when-downgrade'; i.title='Carte : Boulevard Latil, Marseille';
    m.replaceChildren(i);
  });
})();

/* Menu mobile */
(function(){
  const b=document.querySelector('.nav-burger'), m=document.getElementById('mnav'); if(!b||!m) return;
  const set=o=>{ m.hidden=!o; b.classList.toggle('open',o); b.setAttribute('aria-expanded',o); };
  b.addEventListener('click',()=>set(m.hidden));
  m.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>set(false)));
  addEventListener('resize',()=>{ if(innerWidth>1240) set(false); },{passive:true});
})();

/* Réalisations : bandeau qui défile de droite à gauche, glissable à la souris et au doigt, molette horizontale, boutons */
(function(){
  const m=document.querySelector('.marq-sites'); if(!m) return;
  const track=m.querySelector('.marq-track'); const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let x=Math.max(20,Math.min(80,innerWidth*0.05)), half=0, drag=null, lastX=0, vel=0, vis=false, seen=0, hover=false, last=performance.now();
  const measure=()=>{ half=track.scrollWidth/2; }; measure(); addEventListener('resize',measure); addEventListener('load',measure);
  const render=()=>{ if(half>0){ while(x<=-half) x+=half; while(x>0) x-=half; } track.style.setProperty('--x',x.toFixed(1)+'px'); };
  new IntersectionObserver(es=>{ vis=es[0].isIntersecting; if(vis&&!seen) seen=performance.now(); },{threshold:.05}).observe(m); /* le défilement ne démarre que 5 s après l'apparition : le temps de lire les premiers noms */
  m.addEventListener('pointerenter',()=>hover=true); m.addEventListener('pointerleave',()=>hover=false);
  m.addEventListener('dragstart',e=>e.preventDefault());
  m.addEventListener('pointerdown',e=>{ if(e.button) return; e.preventDefault(); drag=e.clientX; lastX=e.clientX; vel=0; try{ m.setPointerCapture(e.pointerId); }catch(_){} });
  m.addEventListener('pointermove',e=>{ if(drag===null) return; const dx=e.clientX-lastX; lastX=e.clientX; x+=dx; vel=dx; if(Math.abs(e.clientX-drag)>6) m.classList.add('dragging'); render(); });
  const up=()=>{ drag=null; setTimeout(()=>m.classList.remove('dragging'),80); }; m.addEventListener('pointerup',up); m.addEventListener('pointercancel',up);
  m.addEventListener('click',e=>{ if(m.classList.contains('dragging')) e.preventDefault(); },true);
  m.addEventListener('wheel',e=>{ if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){ e.preventDefault(); x-=e.deltaX; render(); } },{passive:false});
  const step=()=>{ const c=m.querySelector('.rsite'); return c?c.getBoundingClientRect().width+22:400; };
  document.querySelectorAll('.marq-btn').forEach(b=>b.addEventListener('click',()=>{ const d=+b.dataset.dir; const x0=x, target=x-d*step(); const t0=performance.now();
    const go=now=>{ const k=Math.min(1,(now-t0)/450), e=1-Math.pow(1-k,3); x=x0+(target-x0)*e; render(); if(k<1) requestAnimationFrame(go); }; requestAnimationFrame(go);
    hover=true; clearTimeout(b._t); b._t=setTimeout(()=>{ if(!m.matches(':hover')) hover=false; },3000); }));
  function tick(now){ requestAnimationFrame(tick); const dt=Math.min(64,Math.max(0,now-last)); last=now; if(!vis) return;
    if(drag===null){ x+=vel; vel*=0.9; if(Math.abs(vel)<0.05) vel=0; if(!hover&&!reduce&&seen&&now-seen>5000) x-=dt*0.035; }
    render(); }
  render(); requestAnimationFrame(tick);
})();


/* Villes disponibles : un clic sur une place pré-remplit le formulaire (ville + spécialité) avant d'y descendre */
(function(){
  const seats=[...document.querySelectorAll('.seat')]; if(!seats.length) return;
  const f=document.getElementById('cform'); if(!f) return;
  const ville=f.querySelector('[name=ville]'), spec=f.querySelector('[name=specialite]');
  seats.forEach(s=>s.addEventListener('click',()=>{
    if(ville) ville.value=s.dataset.city||'';
    if(spec&&s.dataset.spec){ [...spec.options].forEach(o=>{ if(o.text.startsWith(s.dataset.spec)) spec.value=o.value; }); }
    f.classList.add('prefilled'); setTimeout(()=>f.classList.remove('prefilled'),4000);
  }));
})();

/* Page réseau : jeu de la vie interactif (règles de Conway sur un tore, clic = cellule, planeur / aléatoire / pause / effacer) */
(function(){
  const cv=document.getElementById('lifeBig'); if(!cv) return;
  const ctx=cv.getContext('2d'), gen=document.getElementById('lifeGen'), pop=document.getElementById('lifePop');
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches||new URLSearchParams(location.search).has('nomotion');
  let S=26, cols=0, rows=0, grid, prev, g=0, running=!reduce, last=0, vis=false, W=0;
  const idx=(x,y)=>((y+rows)%rows)*cols+((x+cols)%cols);
  const GL=[[1,0],[2,1],[0,2],[1,2],[2,2]];
  function count(){ let a=0; for(let i=0;i<grid.length;i++) a+=grid[i]; pop.textContent=a; gen.textContent=g; }
  function glider(x,y){ GL.forEach(([dx,dy])=>grid[idx(x+dx,y+dy)]=1); }
  function seed(){ grid=new Uint8Array(cols*rows); prev=grid.slice(); g=0; glider(1,1); glider(Math.floor(cols*0.55),Math.floor(rows*0.15)); glider(Math.floor(cols*0.2),Math.floor(rows*0.6)); prev=grid.slice(); count(); }
  function resize(){ const r=cv.getBoundingClientRect(); const d=Math.min(2,devicePixelRatio||1); W=Math.round(r.width); S=W<420?22:26; cols=Math.floor(W/S); rows=cols; cv.width=Math.ceil(W*d); cv.height=Math.ceil(W*d); ctx.setTransform(d,0,0,d,0,0); seed(); draw(1); }
  function step(){ const n=new Uint8Array(cols*rows); for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){ let c=0; for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ if(dx||dy) c+=grid[idx(x+dx,y+dy)]; } const a=grid[y*cols+x]; n[y*cols+x]=(c===3||(a&&c===2))?1:0; } prev=grid; grid=n; g++; count(); }
  function draw(k){ ctx.clearRect(0,0,W,W); const off=(W-cols*S)/2; ctx.strokeStyle='rgba(255,255,255,.05)'; ctx.lineWidth=1; ctx.beginPath(); for(let x=0;x<=cols;x++){ ctx.moveTo(off+x*S+.5,off); ctx.lineTo(off+x*S+.5,off+rows*S); } for(let y=0;y<=rows;y++){ ctx.moveTo(off,off+y*S+.5); ctx.lineTo(off+cols*S,off+y*S+.5); } ctx.stroke();
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){ const i=y*cols+x, a=grid[i], p=prev[i]; if(!a&&!p) continue; const o=a?(p?1:k):(1-k); if(o<=0.02) continue; const sz=(S-6)*(a?(p?1:.8+.2*k):(1-.3*k)); ctx.globalAlpha=.9*o; ctx.fillStyle='#2fa36b'; ctx.beginPath(); ctx.roundRect(off+x*S+(S-sz)/2,off+y*S+(S-sz)/2,sz,sz,5); ctx.fill(); } ctx.globalAlpha=1; }
  function loop(now){ requestAnimationFrame(loop); if(!vis) return; if(!last) last=now; const T=420; if(running&&now-last>=T){ step(); last=now; } draw(running?Math.min(1,(now-last)/240):1); }
  cv.addEventListener('pointerdown',e=>{ const r=cv.getBoundingClientRect(); const off=(W-cols*S)/2; const x=Math.floor((e.clientX-r.left-off)/S), y=Math.floor((e.clientY-r.top-off)/S); if(x<0||y<0||x>=cols||y>=rows) return; grid[y*cols+x]=grid[y*cols+x]?0:1; prev[y*cols+x]=grid[y*cols+x]; count(); draw(1); });
  const btns=[...document.querySelectorAll('[data-life]')];
  const setPause=()=>btns.forEach(b=>{ if(b.dataset.life==='pause'){ b.classList.toggle('on',!running); b.textContent=running?'Pause':'Reprendre'; } });
  btns.forEach(b=>b.addEventListener('click',()=>{ const a=b.dataset.life;
    if(a==='glider'){ glider(Math.floor(Math.random()*(cols-4)),Math.floor(Math.random()*(rows-4))); prev=grid.slice(); count(); draw(1); }
    if(a==='random'){ for(let i=0;i<grid.length;i++) grid[i]=Math.random()<0.28?1:0; prev=grid.slice(); g=0; count(); draw(1); }
    if(a==='pause'){ running=!running; last=0; setPause(); }
    if(a==='clear'){ grid=new Uint8Array(cols*rows); prev=grid.slice(); g=0; count(); draw(1); }
  }));
  setPause();
  new IntersectionObserver(es=>{ vis=es[0].isIntersecting; if(vis) last=0; },{threshold:.1}).observe(cv);
  addEventListener('resize',()=>{ clearTimeout(cv._t); cv._t=setTimeout(resize,150); },{passive:true});
  resize(); requestAnimationFrame(loop);
})();
/* Qui sommes-nous : jeu de la vie dans le hero (deux planeurs qui traversent la page, règles de Conway, sans collision) */
(function(){
  const hero=document.querySelector('.about-page .about-hero'); if(!hero) return;
  if(new URLSearchParams(location.search).has('nomotion')||matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const cv=document.createElement('canvas'); cv.className='life'; hero.insertBefore(cv,hero.firstChild);
  const ctx=cv.getContext('2d'), S=44, G=[[1,0],[2,1],[0,2],[1,2],[2,2]];
  let cols=0,rows=0,grid,prev,last=0,running=false;
  const idx=(x,y)=>((y+rows)%rows)*cols+((x+cols)%cols);
  function seed(){ grid=new Uint8Array(cols*rows); G.forEach(([x,y])=>grid[idx(x+1,y+1)]=1); if(cols>12&&rows>6) G.forEach(([x,y])=>grid[idx(Math.floor(cols*0.55)+x,Math.floor(rows*0.45)+y)]=1); prev=grid.slice(); }
  function resize(){ const r=hero.getBoundingClientRect(); const d=Math.min(2,devicePixelRatio||1); cv.width=Math.ceil(r.width*d); cv.height=Math.ceil(r.height*d); ctx.setTransform(d,0,0,d,0,0); cols=Math.ceil(r.width/S); rows=Math.ceil(r.height/S); seed(); draw(1); }
  function step(){ const n=new Uint8Array(cols*rows); for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){ let c=0; for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ if(dx||dy) c+=grid[idx(x+dx,y+dy)]; } const a=grid[y*cols+x]; n[y*cols+x]=(c===3||(a&&c===2))?1:0; } prev=grid; grid=n; let alive=0; for(let i=0;i<grid.length;i++) alive+=grid[i]; if(alive<5||alive>12) seed(); }
  function draw(k){ ctx.clearRect(0,0,cv.width,cv.height); for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){ const i=y*cols+x, a=grid[i], p=prev[i]; if(!a&&!p) continue; const o=a?(p?1:k):(1-k); if(o<=0.02) continue; const sz=(S-8)*(a?(p?1:.85+.15*k):(1-.3*k)); ctx.globalAlpha=.34*o; ctx.fillStyle='#2fa36b'; ctx.beginPath(); ctx.roundRect(x*S+(S-sz)/2,y*S+(S-sz)/2,sz,sz,7); ctx.fill(); } ctx.globalAlpha=1; }
  function loop(now){ if(!running) return; if(!last) last=now; const T=560; if(now-last>=T){ step(); last=now; } draw(Math.min(1,(now-last)/280)); requestAnimationFrame(loop); }
  const io=new IntersectionObserver(es=>es.forEach(e=>{ running=e.isIntersecting; if(running){ last=0; requestAnimationFrame(loop); } }),{threshold:.05});
  io.observe(hero); addEventListener('resize',resize,{passive:true}); resize();
})();

/* Qui sommes-nous : le parcours en quatre écrans. Le défilement vertical fait glisser la piste horizontale (écran épinglé),
   l'écran actif reçoit .on (entrées), la barre et le compteur suivent. Statique sous 900 px, en mouvement réduit, ou avec ?hs=N (aperçu). */
(function(){
  const sec=document.getElementById('parcours'), track=document.getElementById('hsTrack'); if(!sec||!track) return;
  const panels=[...track.querySelectorAll('.hp')], n=panels.length, bar=document.getElementById('hsBar'), cur=document.getElementById('hsCur');
  const q=new URLSearchParams(location.search); const forced=+q.get('hs')||0;
  const small=matchMedia('(max-width:900px)'), reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  let staticMode=false;
  function setStatic(on){ staticMode=on; sec.classList.toggle('static',on); if(on){ panels.forEach(p=>p.classList.add('on')); } }
  if(forced){ setStatic(true); return; }
  function update(){
    if(staticMode) return;
    const r=sec.getBoundingClientRect(), travel=(n-1)*innerHeight;
    const p=Math.min(1,Math.max(0,-r.top/travel));
    const max=track.scrollWidth-track.parentElement.clientWidth;
    track.style.transform='translate3d('+(-p*max)+'px,0,0)';
    const i=Math.min(n-1,Math.round(p*(n-1)));
    panels.forEach((el,k)=>el.classList.toggle('on',k===i));
    if(bar) bar.style.width=(p*100)+'%';
    if(cur) cur.textContent=String(i+1).padStart(2,'0');
  }
  function mode(){ setStatic(small.matches||reduce); if(!staticMode){ panels.forEach(p=>p.classList.remove('on')); update(); } }
  small.addEventListener('change',mode);
  addEventListener('scroll',()=>{ if(!staticMode) requestAnimationFrame(update); },{passive:true});
  addEventListener('resize',update,{passive:true});
  mode();
})();
/* Menu déroulant « Ce que nous faisons » : survol via CSS ; clic, toucher et clavier ici */
(function(){
  const dd=document.querySelector('.dd'), btn=dd&&dd.querySelector('.dd-btn'); if(!btn) return;
  const set=o=>{ dd.classList.toggle('open',o); btn.setAttribute('aria-expanded',o); };
  btn.addEventListener('click',e=>{ e.stopPropagation(); set(!dd.classList.contains('open')); });
  document.addEventListener('click',e=>{ if(!dd.contains(e.target)) set(false); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') set(false); });
  dd.addEventListener('mouseleave',()=>set(false));
})();
/* L'écosystème : les sources de visibilité sont des cellules du jeu de la vie (vraies règles de Conway, grille bornée).
   Trois actes, glisser-déposer d'une cellule nommée, cellules anonymes pour les naissances. */
(function(){
  const grid=document.getElementById('ecoGrid'); if(!grid) return;
  const boardEl=grid.closest('.eco-board'), svg=document.getElementById('ecoLinks'); svg.setAttribute('preserveAspectRatio','none');
  const mqP=matchMedia('(max-width:760px) and (orientation:portrait)'); let C=14,R=9,P=false;
  function geom(){ P=mqP.matches; C=P?9:14; R=P?14:9; svg.setAttribute('viewBox',`0 0 ${C} ${R}`); grid.style.setProperty('--c',C); grid.style.setProperty('--r',R); grid.style.aspectRatio=`${C}/${R}`; }
  const T=(x,y)=>P?[y,x]:[x,y];
  const genEl=document.getElementById('ecoGen'), aliveEl=document.getElementById('ecoAlive'), totalEl=document.getElementById('ecoTotal'), verdict=document.getElementById('ecoVerdict'), hint=document.getElementById('ecoHint');
  const monthBtn=document.getElementById('ecoMonth'), bornEl=document.getElementById('ecoBorn'), bornWrap=document.getElementById('ecoBornWrap');
  const playBtn=document.getElementById('ecoPlay'), resetBtn=document.getElementById('ecoReset'), netTg=document.getElementById('ecoNet'), acts=[...document.querySelectorAll('#ecoActs .act')];
  const I={
    site:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M7 7h.01M10 7h.01"/></svg>',
    pages:'<svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/></svg>',
    google:'<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>',
    youtube:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/></svg>',
    linkedin:'<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>',
    hana:'<svg viewBox="0 0 24 24"><rect x="10" y="3" width="4" height="4" rx="1"/><rect x="15" y="9" width="4" height="4" rx="1"/><rect x="5" y="15" width="4" height="4" rx="1"/><rect x="10" y="15" width="4" height="4" rx="1"/><rect x="15" y="15" width="4" height="4" rx="1"/></svg>',
    ville:'<svg viewBox="0 0 24 24"><path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-6h6v6M4 21h16"/></svg>',
    doc:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
    data:'<svg viewBox="0 0 24 24"><circle cx="6" cy="7" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7.5 8.5l3.5 7.5M16.5 8.5 13 16M8 7h8"/></svg>',
    doctolib:'<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/></svg>',
    ordre:'<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/><path d="M12 8v7M8.5 11.5h7"/></svg>',
    insta:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r=".8"/></svg>',
    avis:'<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    savante:'<svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 9h6"/></svg>',
    annuaire:'<svg viewBox="0 0 24 24"><path d="M4 6h12M4 12h9M4 18h7"/><path d="M18 21s-3-3.2-3-5.5a3 3 0 0 1 6 0c0 2.3-3 5.5-3 5.5z"/></svg>'
  };
  const SRC={
    site:['Votre site','site'],pages:['Pages actes','pages'],google:['Fiche Google','google'],youtube:['YouTube','youtube'],linkedin:['LinkedIn','linkedin'],hana:['Réseau HANA','hana'],
    ville:['Page ville','ville'],doc:['Page praticien','doc'],data:['Données structurées','data'],doctolib:['Doctolib','doctolib'],ordre:['Ordre des médecins','ordre'],insta:['Instagram','insta'],avis:['Avis Google','avis'],savante:['Société savante','savante'],annuaire:['Annuaire local','annuaire'],acte:['Page acte','pages'],expert:['Contenu expert','savante'],pub:['Publication Google','google'],video:['Vidéo YouTube','youtube'],post:['Post LinkedIn','linkedin'],avisr:['Avis répondu','avis'],photo:['Photo fiche Google','insta']
  };
  // figures stables de Conway : ruche (6), baignoire (4), bateau (5)
  const BEE=[[1,0],[2,0],[0,1],[3,1],[1,2],[2,2]], TUB=[[1,0],[0,1],[2,1],[1,2]], BOAT=[[0,0],[1,0],[0,1],[2,1],[1,2]];
  const place=(shape,ox,oy)=>shape.map(([x,y])=>[x+ox,y+oy]);
  const ACTS={
    1:{cells:[['site',6,4]],verdict:'Génération 1 : aucune voisine, le site s\'éteint. Seul, il n\'existe que pour lui-même.'},
    2:{cells:[['site',1,1],['pages',4,7],['google',8,1],['youtube',12,3],['linkedin',2,5],['hana',10,7],['insta',6,3],['doctolib',12,7],['avis',5,5]],verdict:'Génération 1 : aucune source n\'en touche une autre. Toutes s\'éteignent en même temps.'},
    4:{cells:()=>ACTS[3].cells(false),verdict:'Cliquez « Mois suivant » : HANA pose trois sources. Regardez ce qui naît.'},
    3:{cells:(net)=>{ const b=place(BEE,4,3).map((p,i)=>[['site','pages','google','youtube','linkedin','hana'][i],p[0],p[1]]); if(!net) return b; const t=place(TUB,10,1).map((p,i)=>[['ville','doc','data','doctolib'][i],p[0],p[1]]); const o=place(BOAT,0,6).map((p,i)=>[['ordre','insta','avis','savante','annuaire'][i],p[0],p[1]]); return b.concat(t,o); },verdict:'La ruche tient, génération après génération : chaque source a deux ou trois voisines. Retirez-en une, et regardez.'}
  };
  let act=3, named=[], anon=new Set(), gen=0, timer=null, dirty=false, month=0, born=0;
  const key=(x,y)=>y*C+x;
  function build(){
    geom(); month=0; born=0; if(bornEl) bornEl.textContent=0;
    named.forEach(n=>n.el.remove()); grid.querySelectorAll('.cell.anon').forEach(e=>e.remove()); named=[]; anon=new Set(); gen=0; dirty=false;
    let cells=ACTS[act].cells; if(typeof cells==='function') cells=cells(netTg.checked);
    cells.forEach(([id,x0,y0])=>{ const [x,y]=T(x0,y0); if(id==='anon'){ anon.add(key(x,y)); return; } const el=document.createElement('div'); el.className='cell'; el.style.setProperty('--x',x); el.style.setProperty('--y',y); el.innerHTML=`<i>${I[SRC[id][1]]}<b>${SRC[id][0]}</b></i>`; el.dataset.id=id; grid.appendChild(el); named.push({id,x,y,alive:true,el}); });
    drawAnon(); links(); count(); verdict.textContent=ACTS[act].verdict; verdict.classList.remove('bad'); enableDrag();
  }
  function board(){ const g=new Uint8Array(C*R); named.forEach(n=>{ if(n.alive) g[key(n.x,n.y)]=1; }); anon.forEach(k=>g[k]=1); return g; }
  function neighbours(g,x,y){ let c=0; for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){ if(!dx&&!dy) continue; const X=x+dx,Y=y+dy; if(X<0||Y<0||X>=C||Y>=R) continue; c+=g[key(X,Y)]; } return c; }
  function evolve(g){ const n=new Uint8Array(C*R); for(let y=0;y<R;y++)for(let x=0;x<C;x++){ const k=key(x,y), a=g[k], c=neighbours(g,x,y); n[k]=((a&&(c===2||c===3))||(!a&&c===3))?1:0; } return n; }
  function step(){
    const g=board(), nx=evolve(g), next=new Set(); nx.forEach((v,k)=>{ if(v) next.add(k); }); const pos=new Map(); named.forEach(n=>{ if(n.alive) pos.set(key(n.x,n.y),n); });
    let died=[]; named.forEach(n=>{ if(n.alive&&!next.has(key(n.x,n.y))){ n.alive=false; died.push(n); } });
    const newAnon=new Set(); next.forEach(k=>{ if(!pos.has(k)||!pos.get(k).alive) newAnon.add(k); }); // tout ce qui vit et n'est pas une cellule nommée vivante
    named.forEach(n=>{ if(n.alive) newAnon.delete(key(n.x,n.y)); });
    const bornNow=[...newAnon].filter(k=>!anon.has(k)&&!g[k]);
    born+=bornNow.length; if(bornEl) bornEl.textContent=born;
    anon=newAnon; gen++;
    died.forEach((n,i)=>setTimeout(()=>n.el.classList.add('dead'),i*140));
    drawAnon(bornNow); links(); count();
    const alive=named.filter(n=>n.alive).length;
    if(!alive&&!anon.size){ stop(); verdict.textContent=dirty?`Génération ${gen} : plus rien. Une seule source déplacée, et l'écosystème entier s'est éteint.`:ACTS[act].verdict; verdict.classList.add('bad'); }
    else if(dirty&&died.length){ verdict.textContent=`Génération ${gen} : ${died.length} source${died.length>1?'s':''} vien${died.length>1?'nent':'t'} de s'éteindre, faute de voisines.`; verdict.classList.add('bad'); }
    else if(!dirty&&act===3&&gen>=3){ verdict.textContent=`Génération ${gen} : rien n'a bougé. C'est ça, un écosystème stable.`; verdict.classList.remove('bad'); }
    if(gen>=12&&!died.length&&act===3&&!dirty) stop();
  }
  function drawAnon(born=[]){ grid.querySelectorAll('.cell.anon').forEach(e=>e.remove()); anon.forEach(k=>{ const x=k%C,y=Math.floor(k/C); const el=document.createElement('div'); el.className='cell anon'+(born.includes(k)?' born':''); el.style.setProperty('--x',x); el.style.setProperty('--y',y); el.innerHTML='<i></i>'; grid.appendChild(el); }); }
  function links(){ const g=board(); let out=''; const live=named.filter(n=>n.alive); for(let i=0;i<live.length;i++)for(let k=i+1;k<live.length;k++){ const a=live[i],b=live[k]; if(Math.abs(a.x-b.x)<=1&&Math.abs(a.y-b.y)<=1) out+=`<line x1="${a.x+.5}" y1="${a.y+.5}" x2="${b.x+.5}" y2="${b.y+.5}" vector-effect="non-scaling-stroke"/>`; } svg.innerHTML=out; }
  function count(){ genEl.textContent=gen; aliveEl.textContent=named.filter(n=>n.alive).length; totalEl.textContent=named.length; }
  function stop(){ if(timer){ clearInterval(timer); timer=null; } playBtn.textContent='Lancer les règles'; playBtn.classList.remove('on'); }
  function play(){ if(timer){ stop(); return; } step(); if(!named.some(n=>n.alive)&&!anon.size) return; timer=setInterval(step,700); playBtn.textContent='Pause'; }
  playBtn.addEventListener('click',play); resetBtn.addEventListener('click',()=>{ stop(); build(); });
  // Acte 04 : chaque mois, trois sources en L dans une zone libre ; la règle des naissances en fait un bloc stable
  const MONTHS=[['ville','doc','data'],['acte','expert','pub'],['video','post','avisr'],['acte','photo','expert'],['pub','post','acte'],['video','expert','avisr'],['acte','pub','post'],['doctolib','ordre','savante']];
  function freeBox(){ const g=board(); const liveNamed=named.filter(n=>n.alive).map(n=>key(n.x,n.y));
    const ok=(x,y)=>{ if(x+1>=C||y+1>=R) return false; const box=[key(x,y),key(x+1,y),key(x,y+1),key(x+1,y+1)]; if(box.some(k=>g[k])) return false;
      // simulation : on pose le L, on avance 3 générations ; tout l'existant doit survivre, le bloc doit se former, et l'état doit être stable
      const t=g.slice(); t[box[0]]=1; t[box[1]]=1; t[box[2]]=1; const g1=evolve(t), g2=evolve(g1), g3=evolve(g2);
      if(!box.every(k=>g1[k]&&g2[k])) return false; if(!liveNamed.every(k=>g1[k]&&g2[k]&&g3[k])) return false; for(let k=0;k<g2.length;k++){ if(g2[k]!==g3[k]) return false; } return true; };
    const order=[]; for(let y=0;y<R-1;y++)for(let x=0;x<C-1;x++) order.push([x,y]);
    order.sort((a,b)=>{ const da=Math.hypot(a[0]-(C-1)/2,a[1]-(R-1)/2), db=Math.hypot(b[0]-(C-1)/2,b[1]-(R-1)/2); return db-da; }); // les plus loin du centre d'abord : l'écosystème s'étend vers les bords
    return order.find(([x,y])=>ok(x,y))||null; }
  function nextMonth(){ if(timer) stop(); const box=freeBox(); if(!box){ verdict.textContent='La grille est pleine. Dans une ville, ça s\'appelle une place prise.'; verdict.classList.remove('bad'); monthBtn.disabled=true; return; }
    month++; const ids=MONTHS[(month-1)%MONTHS.length]; const [bx,by]=box; const pts=[[bx,by],[bx+1,by],[bx,by+1]];
    pts.forEach(([x,y],i)=>{ const id=ids[i]; const el=document.createElement('div'); el.className='cell'; el.style.setProperty('--x',x); el.style.setProperty('--y',y); el.innerHTML=`<i>${I[SRC[id][1]]}<b>${SRC[id][0]}</b></i>`; el.dataset.id=id; el.classList.add('born'); grid.appendChild(el); named.push({id,x,y,alive:true,el}); });
    enableDrag(); links(); count(); verdict.textContent=month===1?'Mois 1 : HANA publie votre page ville, votre page praticien et vos données structurées. Elles se touchent, elles se confirment…':`Mois ${month} : trois sources posées. Elles se touchent, elles se confirment…`; verdict.classList.remove('bad');
    setTimeout(()=>{ step(); const alive=named.filter(n=>n.alive).length; verdict.textContent=month<6?`Mois ${month} : une visibilité est née là où il n'y avait rien (une citation, une réponse, une demande). ${alive} sources vivantes, ${born} naissance${born>1?'s':''}.`:month===6?`Six mois : l'écosystème a gagné du terrain sans rien perdre. ${alive} sources vivantes, ${born} naissances. C'est le régime de croisière.`:`Mois ${month} : l'écosystème continue de s'étendre. ${alive} sources vivantes, ${born} naissances.`; verdict.classList.remove('bad'); },900); }
  monthBtn&&monthBtn.addEventListener('click',nextMonth);
  acts.forEach(li=>li.querySelector('button').addEventListener('click',()=>{ act=+li.dataset.act; acts.forEach(x=>x.classList.toggle('on',x===li)); netTg.closest('label').style.display=act===3?'':'none'; if(monthBtn){ monthBtn.hidden=act!==4; monthBtn.disabled=false; } if(bornWrap) bornWrap.hidden=act!==4; hint.textContent=act===3?'Glissez une cellule hors de la ruche, puis lancez les règles.':act===4?'Chaque clic sur « Mois suivant » = un mois de travail HANA.':'Lancez les règles, puis comparez avec la situation 03.'; stop(); build(); }));
  netTg.addEventListener('change',()=>{ stop(); build(); });
  // glisser-déposer d'une cellule nommée (souris et doigt), aimantée à la grille
  function enableDrag(){ named.forEach(n=>{ const el=n.el; el.onpointerdown=e=>{ if(timer) stop(); try{ el.setPointerCapture(e.pointerId); }catch(err){} el.classList.add('drag'); const r=grid.getBoundingClientRect(), s=r.width/C;
      const move=ev=>{ const x=Math.min(C-1,Math.max(0,Math.floor((ev.clientX-r.left)/s))), y=Math.min(R-1,Math.max(0,Math.floor((ev.clientY-r.top)/s))); if(x!==n.x||y!==n.y){ if(named.some(o=>o!==n&&o.x===x&&o.y===y)) return; n.x=x; n.y=y; el.style.setProperty('--x',x); el.style.setProperty('--y',y); dirty=true; if(!n.alive){ n.alive=true; el.classList.remove('dead'); } links(); count(); } };
      const up=()=>{ el.classList.remove('drag'); el.removeEventListener('pointermove',move); el.removeEventListener('pointerup',up); el.removeEventListener('pointercancel',up); if(dirty){ verdict.textContent='Une source a bougé. Lancez les règles et regardez ce que ça change.'; verdict.classList.remove('bad'); } };
      el.addEventListener('pointermove',move); el.addEventListener('pointerup',up); el.addEventListener('pointercancel',up); }; }); }
  // changement d'orientation → on reconstruit dans la nouvelle géométrie
  mqP.addEventListener('change',()=>{ stop(); build(); });
  // plein écran « comme un vrai jeu » : API Fullscreen + verrou paysage si le navigateur l'accepte, sinon superposition fixe (défilable).
  // Sortie rapide : bouton « Quitter », Échap, bouton retour du téléphone (état d'historique poussé à l'entrée), sortie du vrai plein écran.
  const fullBtn=document.getElementById('ecoFull'), closeBtn=document.getElementById('ecoClose');
  const fullLabel=on=>{ if(!fullBtn) return; const s=fullBtn.querySelector('span')||fullBtn; s.textContent=on?'Quitter le plein écran':'Jouer en plein écran'; fullBtn.classList.toggle('is-on',on); };
  function isFull(){ return boardEl.classList.contains('eco-full'); }
  async function enterFull(){
    if(isFull()) return;
    boardEl.classList.add('eco-full'); boardEl.classList.add('in'); document.body.classList.add('eco-lock'); fullLabel(true);
    try{ history.pushState({ecoFull:true},''); }catch(e){}
    try{ if(boardEl.requestFullscreen) await boardEl.requestFullscreen({navigationUI:'hide'}); }catch(e){}
    try{ if(screen.orientation&&screen.orientation.lock) await screen.orientation.lock('landscape'); }catch(e){}
    setTimeout(()=>{ stop(); build(); },250);
  }
  async function leave(fromPop){
    if(!isFull()) return;
    boardEl.classList.remove('eco-full'); document.body.classList.remove('eco-lock'); fullLabel(false);
    try{ if(screen.orientation&&screen.orientation.unlock) screen.orientation.unlock(); }catch(e){}
    try{ if(document.fullscreenElement) await document.exitFullscreen(); }catch(e){}
    if(!fromPop && history.state && history.state.ecoFull){ try{ history.back(); }catch(e){} }
    setTimeout(()=>{ stop(); build(); },250);
  }
  const exitFull=()=>leave(false);
  fullBtn&&fullBtn.addEventListener('click',()=>isFull()?exitFull():enterFull());
  closeBtn&&closeBtn.addEventListener('click',exitFull);
  document.addEventListener('fullscreenchange',()=>{ if(!document.fullscreenElement&&isFull()) leave(false); });
  addEventListener('popstate',()=>{ if(isFull()) leave(true); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&isFull()) exitFull(); });
  build();
  // pause du chrono hors écran
  new IntersectionObserver(es=>es.forEach(e=>{ if(!e.isIntersecting) stop(); }),{threshold:0}).observe(grid);
})();

/* Expertises : étiquettes verticales ; survol ou clic ouvre un volet ; défilement automatique tant qu'on n'a pas touché */
(function(){
  const xp=document.getElementById('xp'); if(!xp) return;
  const ps=[...xp.querySelectorAll('.xp-p')]; let cur=0, touched=false, vis=false;
  const go=i=>{ cur=(i+ps.length)%ps.length; ps.forEach((p,k)=>p.classList.toggle('on',k===cur)); };
  const fine=matchMedia('(pointer:fine)').matches;
  ps.forEach((p,i)=>{ if(fine) p.addEventListener('pointerenter',()=>{ touched=true; go(i); });
    p.addEventListener('click',()=>{ touched=true; go(i); });
    p.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); touched=true; go(i); } if(e.key==='ArrowRight'||e.key==='ArrowDown'){ e.preventDefault(); touched=true; go(cur+1); ps[cur].focus(); } if(e.key==='ArrowLeft'||e.key==='ArrowUp'){ e.preventDefault(); touched=true; go(cur-1); ps[cur].focus(); } }); });
  new IntersectionObserver(es=>{ vis=es[0].isIntersecting; },{threshold:.3}).observe(xp);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(()=>{ if(vis&&!touched) go(cur+1); },4200);
})();


/* Page Site internet : la maquette qui se construit (règle de naissance), la carte du maillage, l'anatomie d'une page */
(function(){
  const grid=document.getElementById('wireGrid'); if(!grid) return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches||new URLSearchParams(location.search).has('nomotion');
  /* plan de la page : [colonne, ligne, largeur, hauteur, type] sur 12 colonnes */
  const plan=[[0,0,12,1,'head'],[0,1,7,3,'hero'],[8,1,4,3,'hero'],
    [0,5,3,2,'acte'],[3,5,3,2,'acte'],[6,5,3,2,'acte'],[9,5,3,2,'acte'],
    [0,8,8,1,'txt'],[0,9,8,1,'txt'],[0,10,5,1,'txt'],[9,8,3,3,'cta'],
    [0,12,12,2,'foot']];
  const cells=plan.map(([x,y,w,h,k])=>{ const d=document.createElement('div');
    d.className='wb k-'+k; d.style.gridColumn=(x+1)+' / span '+w; d.style.gridRow=(y+1)+' / span '+h; grid.appendChild(d); return d; });
  let started=false;
  const build=()=>{ if(started) return; started=true;
    if(reduce){ cells.forEach(c=>c.classList.add('on')); return; }
    cells.forEach((c,i)=>setTimeout(()=>c.classList.add('on'),140+i*110));
    /* le planeur traverse la maquette une fois la page construite */
    setTimeout(()=>{ let i=0; const path=[3,5,9,6,10,2];
      const step=()=>{ if(i) cells[path[i-1]].classList.remove('glide');
        if(i>=path.length) return; cells[path[i]].classList.add('glide'); i++; setTimeout(step,520); }; step(); },140+cells.length*110+600);
  };
  new IntersectionObserver(es=>{ if(es[0].isIntersecting) build(); },{threshold:.2}).observe(grid);
})();

(function(){
  const svg=document.getElementById('armap'); if(!svg) return;
  const N=[{id:'home',x:222,y:22,w:76,h:26,t:'Accueil',hub:1},
    {id:'a1',x:14,y:96,w:120,h:26,t:'Augmentation mammaire',cls:'act'},
    {id:'a2',x:150,y:96,w:104,h:26,t:'Ptôse mammaire',cls:'act'},
    {id:'a3',x:270,y:96,w:104,h:26,t:'Plastie abdominale',cls:'act'},
    {id:'a4',x:390,y:96,w:116,h:26,t:'Lipoaspiration',cls:'act'},
    {id:'c1',x:14,y:178,w:120,h:26,t:'Choisir ses implants'},
    {id:'c2',x:150,y:178,w:104,h:26,t:'Cicatrices et évolution'},
    {id:'c3',x:390,y:178,w:116,h:26,t:'Lipofilling associé'},
    {id:'p1',x:14,y:264,w:120,h:26,t:'Parcours et titres'},
    {id:'p2',x:150,y:264,w:104,h:26,t:'Plateau technique'},
    {id:'p3',x:270,y:264,w:104,h:26,t:'Honoraires'},
    {id:'rdv',x:386,y:264,w:124,h:26,t:'Contact · RDV Doctolib',cls:'cta'}];
  /* Liens éditoriaux (trait plein) : l'accueil vers chaque intervention ; un contenu expert vers l'intervention qu'il éclaire ;
     deux interventions reliées seulement si elles s'associent en pratique. */
  const LE=[['home','a1'],['home','a2'],['home','a3'],['home','a4'],['home','p1'],
    ['c1','a1'],['c2','a2'],['c2','a3'],['c3','a1'],['c3','a4'],
    ['a1','a2'],['a3','a4'],['p1','p2']];
  /* Liens de gabarit (pointillé) : présents sur chaque page d'intervention et de contenu expert :
     parcours et titres, plateau technique, honoraires, contact et rendez-vous. */
  const LT=[];
  ['a1','a2','a3','a4'].forEach(x=>{ LT.push([x,'p1'],[x,'p2'],[x,'p3'],[x,'rdv']); });
  ['c1','c2','c3'].forEach(x=>{ LT.push([x,'rdv']); });
  LT.push(['home','rdv'],['p3','rdv'],['p2','rdv']);
  const L=LE.concat(LT); const isT=new Set(LT.map(x=>x.join('|')));
  const byId=Object.fromEntries(N.map(n=>[n.id,n]));
  const gL=svg.querySelector('.ar-links'), gN=svg.querySelector('.ar-nodes');
  const ns='http://www.w3.org/2000/svg';
  L.forEach(([a,b])=>{ const A=byId[a],B=byId[b]; const l=document.createElementNS(ns,'line');
    l.setAttribute('x1',A.x+A.w/2); l.setAttribute('y1',A.y+A.h/2); l.setAttribute('x2',B.x+B.w/2); l.setAttribute('y2',B.y+B.h/2);
    l.setAttribute('class','lk'+(isT.has(a+'|'+b)?' tpl':'')); l.dataset.a=a; l.dataset.b=b; gL.appendChild(l); });
  N.forEach(n=>{ const g=document.createElementNS(ns,'g'); g.setAttribute('class','nd'+(n.hub?' hub':'')+(n.cls?' '+n.cls:'')); g.dataset.id=n.id;
    const r=document.createElementNS(ns,'rect'); r.setAttribute('x',n.x); r.setAttribute('y',n.y); r.setAttribute('width',n.w); r.setAttribute('height',n.h); r.setAttribute('rx',8);
    const t=document.createElementNS(ns,'text'); t.setAttribute('x',n.x+n.w/2); t.setAttribute('y',n.y+n.h/2+3.4); t.setAttribute('text-anchor','middle'); t.textContent=n.t;
    g.appendChild(r); g.appendChild(t); gN.appendChild(g); });
  const hot=id=>{ gN.querySelectorAll('.nd').forEach(g=>g.classList.toggle('hot', id!==null && (g.dataset.id===id || L.some(([a,b])=>(a===id&&b===g.dataset.id)||(b===id&&a===g.dataset.id)))));
    gL.querySelectorAll('.lk').forEach(l=>l.classList.toggle('hot', id!==null && (l.dataset.a===id||l.dataset.b===id))); };
  gN.querySelectorAll('.nd').forEach(g=>{ g.addEventListener('pointerenter',()=>hot(g.dataset.id)); g.addEventListener('pointerleave',()=>hot(null)); });
  /* sur mobile et sans survol : une page s'allume à tour de rôle */
  let auto=null, vis=false;
  const cycle=()=>{ const ids=N.map(n=>n.id); let i=0; auto=setInterval(()=>{ if(!vis) return; hot(ids[i%ids.length]); i++; },1600); };
  new IntersectionObserver(es=>{ vis=es[0].isIntersecting; },{threshold:.2}).observe(svg);
  if(matchMedia('(hover: none)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) cycle();
})();

(function(){
  const list=document.querySelectorAll('.anat-list li'); if(!list.length) return;
  const blocks=document.querySelectorAll('#anatomie .anat-page .ap-b');
  const set=n=>{ list.forEach(li=>li.classList.toggle('on',li.dataset.an===n)); blocks.forEach(b=>b.classList.toggle('on',b.dataset.an===n)); };
  set('1');
  const io=new IntersectionObserver(es=>{ es.forEach(e=>{ if(e.isIntersecting) set(e.target.dataset.an); }); },{rootMargin:'-45% 0px -45% 0px'});
  list.forEach(li=>{ io.observe(li); li.addEventListener('pointerenter',()=>set(li.dataset.an)); });
})();

(function(){
  const c=document.getElementById('cwv'); if(!c) return;
  new IntersectionObserver((es,o)=>{ if(es[0].isIntersecting){ c.classList.add('in'); o.disconnect(); } },{threshold:.4}).observe(c);
})();

/* Retour en haut (toutes les pages) : bouton rond en bas à droite, visible après un écran de défilement */
(function(){
  const b=document.createElement('button'); b.type='button'; b.className='totop'; b.setAttribute('aria-label','Revenir en haut de la page');
  b.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(b);
  const upd=()=>b.classList.toggle('show', scrollY>innerHeight*0.9);
  addEventListener('scroll',upd,{passive:true}); upd();
  b.addEventListener('click',()=>{ const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches; scrollTo({top:0,behavior:reduce?'auto':'smooth'}); });
})();

/* Écosystème : onglets 01-04 dans le plateau (une colonne), recadrage sur la grille au choix d'une situation, invitation au clic */
(function(){
  const acts=[...document.querySelectorAll('#ecoActs .act')]; if(!acts.length) return;
  const tabs=[...document.querySelectorAll('#ecoTabs button')]; const board=document.querySelector('.eco-board');
  const sync=()=>{ const cur=acts.find(a=>a.classList.contains('on')); const n=cur?cur.dataset.act:'3'; tabs.forEach(t=>t.classList.toggle('on',t.dataset.act===n)); };
  tabs.forEach(t=>t.addEventListener('click',()=>{ const btn=document.querySelector('#ecoActs .act[data-act="'+t.dataset.act+'"] button'); if(btn) btn.click(); }));
  acts.forEach(a=>a.querySelector('button').addEventListener('click',()=>{
    sync();
    if(board && !board.classList.contains('eco-full') && matchMedia('(max-width:1000px)').matches){
      const r=board.getBoundingClientRect(); if(r.top<60 || r.top>innerHeight*0.5) scrollTo({top:scrollY+r.top-84,behavior:'smooth'});
    }
  }));
  sync();
  const side=document.querySelector('.eco-side');
  if(side && 'IntersectionObserver' in window){ const o=new IntersectionObserver(es=>{ es.forEach(x=>{ if(x.isIntersecting){ side.classList.add('nudge'); o.disconnect(); } }); },{threshold:.35}); o.observe(side); }
})();

/* Étiquettes qui défilent (« Ce que nous ne ferons jamais ») : boucle continue vers la gauche ; se pilote à la souris (glisser,
   molette ou pavé tactile horizontal, deux flèches) et au doigt (glisser) ; pause au survol, et 4 s après chaque action ;
   statique (toutes les étiquettes visibles) si l'utilisateur préfère moins de mouvement */
(function(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.nev-marq').forEach(m=>{
    const track=m.querySelector('.nev-track'), set=m.querySelector('.nev-set'); if(!track||!set) return;
    if(reduce){ m.classList.add('static'); return; }
    m.insertAdjacentHTML('afterend','<div class="nev-nav"><button type="button" class="nev-btn" data-dir="-1" aria-label="Étiquettes précédentes"><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button><div class="swipe light" aria-hidden="true"><svg viewBox="0 0 120 24"><path d="M6 12h108M14 5l-8 7 8 7M106 5l8 7-8 7"/></svg><i></i></div><button type="button" class="nev-btn" data-dir="1" aria-label="Étiquettes suivantes"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div>');
    const nav=m.nextElementSibling;
    let x=0, w=0, vis=false, hover=false, drag=null, lastX=0, vel=0, hold=0, last=performance.now(), anim=null;
    const speed=parseFloat(m.dataset.speed||'0.04'); /* px par ms */
    const measure=()=>{ w=set.getBoundingClientRect().width; }; measure(); addEventListener('resize',measure);
    const step=()=>{ const c=m.querySelector('.nev-card'); return c?c.getBoundingClientRect().width+16:320; };
    new IntersectionObserver(es=>{ vis=es[0].isIntersecting; },{threshold:.05}).observe(m);
    function render(){ if(w){ while(x<=-w) x+=w; while(x>0) x-=w; } track.style.transform='translateX('+x+'px)'; }
    const touch=()=>{ hold=performance.now(); anim=null; };
    /* souris : survol = pause ; glisser avec capture du pointeur (le geste continue hors de la bande) */
    m.addEventListener('pointerenter',e=>{ if(e.pointerType==='mouse') hover=true; });
    m.addEventListener('pointerleave',()=>{ hover=false; });
    m.addEventListener('pointerdown',e=>{ if(e.pointerType==='mouse'&&e.button!==0) return; drag=e.clientX; lastX=e.clientX; vel=0; touch(); m.classList.add('dragging'); try{ m.setPointerCapture(e.pointerId); }catch(err){} if(e.pointerType==='mouse') e.preventDefault(); });
    m.addEventListener('pointermove',e=>{ if(drag===null) return; const dx=e.clientX-lastX; lastX=e.clientX; x+=dx; vel=dx; render(); });
    const up=()=>{ drag=null; m.classList.remove('dragging'); touch(); }; m.addEventListener('pointerup',up); m.addEventListener('pointercancel',up);
    /* molette horizontale / pavé tactile (ou Maj + molette) : la page continue de défiler verticalement avec une molette normale */
    m.addEventListener('wheel',e=>{ const dx=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:(e.shiftKey?e.deltaY:0); if(!dx) return; e.preventDefault(); x-=dx; vel=0; touch(); render(); },{passive:false});
    /* flèches : une étiquette à la fois, en douceur */
    nav.querySelectorAll('.nev-btn').forEach(b=>b.addEventListener('click',()=>{ const d=+b.dataset.dir, x0=x, target=x-d*step(), t0=performance.now(); touch(); const id=anim={};
      (function go(now){ if(anim!==id) return; const k=Math.min(1,(now-t0)/450), e=1-Math.pow(1-k,3); x=x0+(target-x0)*e; render(); if(k<1) requestAnimationFrame(go); })(t0); }));
    function tick(now){ const dt=Math.min(64,now-last); last=now;
      if(vis&&drag===null&&!anim){ x+=vel; vel*=0.9; if(Math.abs(vel)<0.05) vel=0; if(!hover&&now-hold>4000) x-=dt*speed; render(); }
      requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  });
})();
/* Écosystème : rayon de l'orbite en pixels (les pourcentages ne valent rien dans une transformation) + orbite figée si ?nomotion */
(function(){ const o=document.querySelector('.eorb'); if(!o) return; const fit=()=>{ const node=parseFloat(getComputedStyle(o).getPropertyValue('--node'))||76; o.style.setProperty('--r',(o.clientWidth/2-node/2-4)+'px'); }; fit(); addEventListener('resize',fit); setTimeout(fit,300); })();
/* Écosystème : orbite figée si ?nomotion */
(function(){ if(new URLSearchParams(location.search).has('nomotion')){ document.querySelectorAll('.orbit-layer,.orb-in,.orbit-links .sp,.bt.hana .ring,.orbit-sweep,.orbit-center .ring').forEach(el=>el.style.animation='none'); } })();
