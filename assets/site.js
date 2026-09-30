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
  const dw=ring.closest('section')&&ring.closest('section').querySelector('.ring-dots');
  if(dw){ objs.forEach((o,i)=>{ const b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label',o.dataset.name||('Élément '+(i+1))); b.addEventListener('click',()=>o.click()); dw.appendChild(b); });
    const bs=[...dw.children]; const sync=()=>{ bs.forEach((b,i)=>b.classList.toggle('on',i===front)); requestAnimationFrame(sync); }; sync(); }
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

/* Contact : envoi du formulaire sans quitter la page (Web3Forms vers contact@hanahealth.fr, repli mailto) + carte chargée à la demande */
(function(){
  const f=document.getElementById('cform'); if(!f) return;
  f.addEventListener('submit',async e=>{
    e.preventDefault(); f.classList.add('tried'); if(!f.checkValidity()){ f.querySelector(':invalid')?.focus(); return; }
    const fd=new FormData(f); const data=Object.fromEntries(fd.entries());
    if(!data.botcheck) delete data.botcheck;
    f.classList.add('busy');
    try{
      const r=await fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)});
      const res=await r.json().catch(()=>({}));
      if(!r.ok||!res.success) throw new Error(r.status);
      f.classList.remove('busy'); f.classList.add('sent'); f.querySelector('.cf-ok').hidden=false;
    }catch(err){
      f.classList.remove('busy');
      const body=encodeURIComponent(`Nom : ${data.nom}\nSpécialité : ${data.specialite}\nVille : ${data.ville}\nTéléphone : ${data.telephone}\nEmail : ${data.email}\n\n${data.message||''}`);
      location.href=`mailto:contact@hanahealth.fr?subject=${encodeURIComponent('Demande de diagnostic · '+data.ville)}&body=${body}`;
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
  let upd=null;
  const render=()=>{ if(half>0){ while(x<=-half) x+=half; while(x>0) x-=half; } track.style.setProperty('--x',x.toFixed(1)+'px'); if(upd) upd(); };
  new IntersectionObserver(es=>{ vis=es[0].isIntersecting; if(vis&&!seen) seen=performance.now(); },{threshold:.05}).observe(m); /* le défilement ne démarre que 5 s après l'apparition : le temps de lire les premiers noms */
  m.addEventListener('pointerenter',()=>hover=true); m.addEventListener('pointerleave',()=>hover=false);
  m.addEventListener('dragstart',e=>e.preventDefault());
  m.addEventListener('pointerdown',e=>{ if(e.button) return; e.preventDefault(); drag=e.clientX; lastX=e.clientX; vel=0; try{ m.setPointerCapture(e.pointerId); }catch(_){} });
  m.addEventListener('pointermove',e=>{ if(drag===null) return; const dx=e.clientX-lastX; lastX=e.clientX; x+=dx; vel=dx; if(Math.abs(e.clientX-drag)>6) m.classList.add('dragging'); render(); });
  const up=()=>{ drag=null; setTimeout(()=>m.classList.remove('dragging'),80); }; m.addEventListener('pointerup',up); m.addEventListener('pointercancel',up);
  m.addEventListener('click',e=>{ if(m.classList.contains('dragging')) e.preventDefault(); },true);
  m.addEventListener('wheel',e=>{ if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){ e.preventDefault(); x-=e.deltaX; render(); } },{passive:false});
  const step=()=>{ const c=m.querySelector('.rsite'); return c?c.getBoundingClientRect().width+22:400; };
  /* points : un par site ; le point actif suit le défilement, un clic amène le site au bord gauche */
  const x00=x, nD=Math.round(m.querySelectorAll('.rsite').length/2), dn=document.querySelector('.marq-nav.dots');
  if(dn&&nD>1){ for(let i=0;i<nD;i++){ const b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label','Site '+(i+1)+' sur '+nD);
      b.addEventListener('click',()=>{ const st=step(); let t=x00-i*st; if(half) t+=Math.round((x-t)/half)*half; const x0=x, t0=performance.now();
        const go=now=>{ const k=Math.min(1,(now-t0)/500), e=1-Math.pow(1-k,3); x=x0+(t-x0)*e; render(); if(k<1) requestAnimationFrame(go); }; requestAnimationFrame(go);
        hover=true; clearTimeout(dn._t); dn._t=setTimeout(()=>{ if(!m.matches(':hover')) hover=false; },4000); }); dn.appendChild(b); }
    const bs=[...dn.children]; let cur=-1; upd=()=>{ const i=((Math.round((x00-x)/step())%nD)+nD)%nD; if(i!==cur){ cur=i; bs.forEach((b,k)=>b.classList.toggle('on',k===i)); } }; upd(); }
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

/* Étiquettes qui défilent (« Ce que nous ne ferons jamais ») : boucle continue vers la gauche ; se pilote à la souris (glisser,
   molette ou pavé tactile horizontal, deux flèches) et au doigt (glisser) ; pause au survol, et 4 s après chaque action ;
   statique (toutes les étiquettes visibles) si l'utilisateur préfère moins de mouvement */
(function(){
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.nev-marq').forEach(m=>{
    const track=m.querySelector('.nev-track'), set=m.querySelector('.nev-set'); if(!track||!set) return;
    if(reduce){ m.classList.add('static'); return; }
    /* boucle : le second jeu est cloné ici, pour que le texte n'apparaisse qu'une fois dans la page */
    if(!track.querySelector('.nev-set.dup')){ const d=set.cloneNode(true); d.classList.add('dup'); d.setAttribute('aria-hidden','true'); d.setAttribute('data-nosnippet',''); track.appendChild(d); }
    m.insertAdjacentHTML('afterend','<div class="nev-nav dots" role="group" aria-label="Choisir une étiquette"></div>');
    const nav=m.nextElementSibling;
    let x=0, w=0, vis=false, hover=false, drag=null, lastX=0, vel=0, hold=0, last=performance.now(), anim=null;
    const speed=parseFloat(m.dataset.speed||'0.04'); /* px par ms */
    const measure=()=>{ w=set.getBoundingClientRect().width; }; measure(); addEventListener('resize',measure);
    const step=()=>{ const c=m.querySelector('.nev-card'); return c?c.getBoundingClientRect().width+16:320; };
    new IntersectionObserver(es=>{ vis=es[0].isIntersecting; },{threshold:.05}).observe(m);
    const nC=set.children.length, bs=[]; let cur=-1;
    for(let i=0;i<nC;i++){ const b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label','Étiquette '+(i+1)+' sur '+nC); b.dataset.i=i; nav.appendChild(b); bs.push(b); }
    function render(){ if(w){ while(x<=-w) x+=w; while(x>0) x-=w; } track.style.transform='translateX('+x+'px)'; const i=((Math.round(-x/step())%nC)+nC)%nC; if(i!==cur){ cur=i; bs.forEach((b,k)=>b.classList.toggle('on',k===i)); } }
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
    bs.forEach(b=>b.addEventListener('click',()=>{ const x0=x; let target=-(+b.dataset.i)*step(); if(w) target+=Math.round((x-target)/w)*w; const t0=performance.now(); touch(); const id=anim={};
      (function go(now){ if(anim!==id) return; const k=Math.min(1,(now-t0)/500), e=1-Math.pow(1-k,3); x=x0+(target-x0)*e; render(); if(k<1) requestAnimationFrame(go); else anim=null; })(t0); }));
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

/* Qui sommes-nous : parcours en frise verticale. La ligne verte se remplit avec le défilement ; chaque étape s'allume
   quand elle passe au milieu de l'écran (et reste allumée). Tout est affiché d'emblée si l'utilisateur préfère moins de mouvement. */
(function(){
  const body=document.getElementById('tlvBody'); if(!body) return;
  const steps=[...body.querySelectorAll('.tlv-step')], fill=body.querySelector('.tlv-line i');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){ steps.forEach(s=>s.classList.add('on')); fill.style.height='100%'; return; }
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('on'); }),{rootMargin:'-40% 0px -40% 0px'});
  steps.forEach(s=>io.observe(s));
  let raf=0; const upd=()=>{ raf=0; const r=body.getBoundingClientRect(); const p=Math.min(1,Math.max(0,(innerHeight*.5-r.top)/r.height)); fill.style.height=(p*100).toFixed(2)+'%'; };
  addEventListener('scroll',()=>{ if(!raf) raf=requestAnimationFrame(upd); },{passive:true}); addEventListener('resize',upd); upd();
})();

/* Référencement Google : barre de recherche du hero (six recherches, six intentions) */
(function(){
  const box=document.getElementById('rgSearch'); if(!box) return;
  const Q=document.getElementById('rgQ'), I=document.getElementById('rgI'), A=document.getElementById('rgA'), dots=[...document.querySelectorAll('#rgDots li')];
  const D=[
    ['rhinoplastie Marseille','Trouver qui pratique cette intervention, près de chez elle','Votre page Rhinoplastie'],
    ['chirurgien plasticien Marseille','Choisir un praticien','Accueil, parcours et titres, fiche Google'],
    ['rhinoplastie ultrasonique','Comprendre une technique','Un contenu expert sur la technique'],
    ['augmentation mammaire','Se renseigner, tôt dans la réflexion','Votre page Augmentation mammaire'],
    ['suites rhinoplastie','Se préparer, ou se rassurer après','Un contenu sur les suites opératoires'],
    ['prix rhinoplastie','Évaluer un budget','La section Honoraires']
  ];
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches||/[?&]nomotion/.test(location.search);
  if(still) return;
  let k=0, typing=null, visible=true;
  new IntersectionObserver(e=>{ visible=e[0].isIntersecting; },{threshold:.1}).observe(box);
  function type(txt,done){ let i=0; Q.textContent=''; clearInterval(typing); typing=setInterval(()=>{ Q.textContent=txt.slice(0,++i); if(i>=txt.length){ clearInterval(typing); done&&done(); } },55); }
  function next(){
    if(!visible||document.hidden){ setTimeout(next,1200); return; }
    k=(k+1)%D.length; box.classList.add('swap');
    type(D[k][0],()=>{ I.textContent=D[k][1]; A.textContent=D[k][2]; dots.forEach((d,j)=>d.classList.toggle('on',j===k)); box.classList.remove('swap'); setTimeout(next,3200); });
  }
  setTimeout(next,3600);
})();

/* Fiche Google : les lignes de la fiche du hero s'allument une à une */
(function(){
  const card=document.getElementById('gfCard'); if(!card) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||/[?&]nomotion/.test(location.search)) return;
  const rows=[...card.querySelectorAll('.gf-row')]; let k=0, visible=true;
  new IntersectionObserver(e=>{ visible=e[0].isIntersecting; },{threshold:.1}).observe(card);
  setInterval(()=>{ if(!visible||document.hidden) return; rows[k].classList.remove('on'); k=(k+1)%rows.length; rows[k].classList.add('on'); },1900);
})();

/* Visibilité dans les IA : la question du hero change, avec ce que nous documentons */
(function(){
  const box=document.getElementById('iaAsk'); if(!box) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||/[?&]nomotion/.test(location.search)) return;
  const Q=document.getElementById('iaQ'), L=document.getElementById('iaDocs'), dots=[...document.querySelectorAll('#iaDots li')];
  const D=[
    ['Qui consulter pour une rhinoplastie à Lyon ?',["Votre identité et votre spécialité","Votre lieu d'exercice","Votre page Rhinoplastie","Votre fiche Google"]],
    ['Quelle différence entre deux techniques de rhinoplastie ?',["Un contenu expert sur les techniques","Votre page Rhinoplastie","Les techniques que vous utilisez","Vos questions fréquentes"]],
    ['Que prévoir après une augmentation mammaire ?',["Un contenu sur les suites","Votre page Augmentation mammaire","La récupération et la reprise","Les informations pratiques"]]
  ];
  let k=0, visible=true, t=null;
  new IntersectionObserver(e=>{ visible=e[0].isIntersecting; },{threshold:.1}).observe(box);
  function type(s,done){ let i=0; Q.textContent=''; clearInterval(t); t=setInterval(()=>{ Q.textContent=s.slice(0,++i).replace(/ \?$/,'\u00a0?'); if(i>=s.length){ clearInterval(t); done(); } },45); }
  function next(){
    if(!visible||document.hidden){ setTimeout(next,1200); return; }
    k=(k+1)%D.length; L.innerHTML='';
    type(D[k][0],()=>{ L.innerHTML=D[k][1].map(x=>'<li>'+x+'</li>').join(''); dots.forEach((d,j)=>d.classList.toggle('on',j===k)); setTimeout(next,4200); });
  }
  setTimeout(next,4200);
})();
