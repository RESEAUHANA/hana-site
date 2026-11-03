/* Accueil · « L'écosystème qui s'éclate » : le défilement pilote le schéma (styles : assets/eco-burst.css). */
(()=>{
  const sec=document.getElementById('ecosysteme'); if(!sec) return;
  const stage=sec.querySelector('.eb-stage'), core=sec.querySelector('.eb-core'), sub=sec.querySelector('.eb-sub');
  const orbs=[...sec.querySelectorAll('.eb-orb')], docs=[...sec.querySelectorAll('.eb-doc')];
  const lines=[...sec.querySelectorAll('.eb-l')], dlines=[...sec.querySelectorAll('.eb-dl')];
  const bits=[...sec.querySelectorAll('.eb-debris i')], caps=[...sec.querySelectorAll('.eb-cap')], dots=[...sec.querySelectorAll('.eb-dots i')];
  const ring=sec.querySelector('.eb-ring'), ring2=sec.querySelector('.eb-ring2'), wave=sec.querySelector('.eb-wave'), glow=sec.querySelector('.eb-glow'), hint=sec.querySelector('.eb-hint');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp=v=>v<0?0:v>1?1:v;
  const seg=(t,a,b)=>clamp((t-a)/(b-a));
  const outBack=x=>{ const c=1.5; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
  const outCubic=x=>1-Math.pow(1-x,3);
  const rad=d=>d*Math.PI/180;
  const subs=['','vos sources','une seule identité','notre réseau','travaille pour vous'];
  // bornes des étapes (part du défilement de la section)
  const STEPS=[0,.13,.36,.56,.78];

  let cur=-1;
  function render(t){
    const p=outBack(seg(t,.11,.33));             // éclatement des 8 sources
    const d=seg(t,.1,.3);                          // éclats et onde de choc
    const L=outCubic(seg(t,.37,.52));              // liens centre → sources
    const N=outCubic(seg(t,.57,.73));              // réseau des chirurgiens
    const spin=t*38;                               // l'orbite tourne doucement
    const R1=38-11*N, R2=42;

    orbs.forEach((o,i)=>{
      const a=rad(+o.style.getPropertyValue('--a')+spin), r=R1*p;
      o.style.left=(50+Math.cos(a)*r)+'%'; o.style.top=(50+Math.sin(a)*r)+'%';
      o.style.setProperty('--os',(.35+.65*Math.min(p,1.05)).toFixed(3));
      o.style.setProperty('--or',((1-clamp(p))*(i%2?140:-140)).toFixed(1)+'deg');
      o.style.setProperty('--oo',clamp(p*3).toFixed(2));
      o.style.setProperty('--lo',clamp((p-.7)*3.3).toFixed(2));
      const l=lines[i]; l.setAttribute('x2',(50+Math.cos(a)*r).toFixed(2)); l.setAttribute('y2',(50+Math.sin(a)*r).toFixed(2));
      l.style.strokeDashoffset=(1-L).toFixed(3);
    });
    docs.forEach((o,i)=>{
      const a=rad(+o.style.getPropertyValue('--a')+spin), k=clamp(N*1.4-i*.06), r=R2*(.7+.3*outCubic(k));
      const x=50+Math.cos(a)*r, y=50+Math.sin(a)*r;
      o.style.left=x+'%'; o.style.top=y+'%';
      o.style.setProperty('--do',k.toFixed(2)); o.style.setProperty('--ds',(.5+.5*outBack(k)).toFixed(3));
      const l=dlines[i]; l.setAttribute('x2',x.toFixed(2)); l.setAttribute('y2',y.toFixed(2)); l.style.opacity=k.toFixed(2);
    });
    bits.forEach(b=>{
      const a=rad(+b.style.getPropertyValue('--a')), r=(6+48*outCubic(d))*+b.style.getPropertyValue('--d');
      b.style.transform=`translate(-50%,-50%) translate(${(Math.cos(a)*r*stage.offsetWidth/100).toFixed(1)}px,${(Math.sin(a)*r*stage.offsetWidth/100).toFixed(1)}px) rotate(${(d*260).toFixed(0)}deg)`;
      b.style.opacity=(d>0&&d<1?Math.sin(d*Math.PI):0).toFixed(2);
    });
    wave.style.setProperty('--w',(d*5).toFixed(2)); wave.style.setProperty('--wo',(d>0&&d<1?(1-d)*.9:0).toFixed(2));
    ring.style.setProperty('--r',(R1*clamp(p)).toFixed(2)); ring.style.setProperty('--o',(clamp(p)*.9).toFixed(2));
    ring2.style.setProperty('--r',(R2*N).toFixed(2)); ring2.style.setProperty('--o',N.toFixed(2));
    glow.style.setProperty('--glow',(.6+.5*clamp(p)+.3*N).toFixed(2));
    // le cœur se contracte juste avant l'éclatement, puis respire
    const pre=seg(t,.04,.11);
    core.style.setProperty('--cs',(1.25-.2*pre+(d>0?.08*Math.sin(d*Math.PI):0)-.12*N).toFixed(3));
    hint.style.setProperty('--ho',t<.06?1:0);

    let s=0; STEPS.forEach((b,i)=>{ if(t>=b) s=i; });
    if(s!==cur){
      cur=s; caps.forEach((c,i)=>c.classList.toggle('on',i===s)); dots.forEach((x,i)=>x.classList.toggle('on',i<=s));
      sub.textContent=subs[s]; sec.classList.toggle('is-end',s===4);
      if(s===2) orbs.forEach((o,i)=>setTimeout(()=>{ o.classList.remove('ping'); void o.offsetWidth; o.classList.add('ping'); },i*90));
    }
  }

  if(reduce){ render(1); return; }
  sec.classList.add('eb-js');

  let ticking=false;
  const update=()=>{
    ticking=false;
    const r=sec.getBoundingClientRect(), span=r.height-innerHeight;
    document.body.classList.toggle('eb-in',r.top<=1&&r.bottom>=innerHeight-1); // masque le bouton « haut de page » sur mobile pendant la section
    render(span>0?clamp(-r.top/span):0);
  };
  const ask=()=>{ if(!ticking){ ticking=true; requestAnimationFrame(update); } };
  addEventListener('scroll',ask,{passive:true}); addEventListener('resize',ask);
  update();
})();
