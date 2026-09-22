/* Un vrai jeu de la vie, en 3D.
   Le moteur applique les règles de Conway sur une grille de tuiles lumineuses. La graine de départ
   (8 cellules) est un « prédécesseur de planeur » : en 4 générations, par les seules règles du jeu,
   il ne reste qu'un planeur, qui continue ensuite à avancer tout seul, génération après génération.
   Naissance = la tuile monte de la grille et s'allume ; mort = elle s'éteint et s'enfonce.
   Au signal hana:reveal : la caméra glisse pour laisser la place au texte (planeur à droite / en haut). */
import * as THREE from 'three';

const cv=document.getElementById('gl'); if(!cv||new URLSearchParams(location.search).has('noglider')) throw new Error('no canvas');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile=matchMedia('(max-width: 900px)').matches;

/* ---- palette (charte HANA : bleu nuit, crème, sauge) ---- */
const NAVY=0x151e33;
const VARIANT=new URLSearchParams(location.search).get('p')||'sage';
const PAL=VARIANT==='blue'
  ? {bg:0xefe8dc, obj:0x23417f, lit:0x3f6fd0, edge:0x9fbcff, line:0xcfc6b4, line2:0xdcd4c4, halo:'79,127,214'}
  : {bg:0xffffff, obj:0x2fa36b, lit:0x2fa36b, edge:0xbfead3, line:0xd8d6cf, line2:0xe7e5df, halo:'47,163,107'};
const CREAM=PAL.bg, BLUE=PAL.obj, BLUE_LIT=PAL.lit, LINE=PAL.line, LINE2=PAL.line2;

const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setClearColor(CREAM,1);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.toneMapping=THREE.NoToneMapping;

const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(CREAM,0.06);
const camera=new THREE.PerspectiveCamera(36,1,0.1,100);

/* ---- grille au sol ---- */
const gridGroup=new THREE.Group(); scene.add(gridGroup);
const grid=new THREE.GridHelper(60,60,LINE,LINE2);
grid.material.transparent=true; grid.material.opacity=0.9; grid.material.depthWrite=false;
gridGroup.add(grid);
const pts=[]; for(let x=-30;x<=30;x++)for(let z=-30;z<=30;z++) pts.push(x,0,z);
const ptsGeo=new THREE.BufferGeometry(); ptsGeo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
gridGroup.add(new THREE.Points(ptsGeo,new THREE.PointsMaterial({color:NAVY,size:0.05,transparent:true,opacity:.35,depthWrite:false})));

/* ---- lumière ---- */
scene.add(new THREE.AmbientLight(0xffffff,0.55));
const key=new THREE.DirectionalLight(0xffffff,0.75); key.position.set(-4,8,3); scene.add(key);
const rim=new THREE.DirectionalLight(BLUE_LIT,1.0); rim.position.set(5,3,-6); scene.add(rim);
const glowLight=new THREE.PointLight(BLUE_LIT,0,10,2); glowLight.position.set(0,1.4,0); scene.add(glowLight);

/* ---- tuiles ---- */
const TILE_H=0.26, Y=TILE_H/2;
const boxGeo=new THREE.BoxGeometry(0.84,TILE_H,0.84);
const edgeGeo=new THREE.EdgesGeometry(boxGeo);
const spriteTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,`rgba(${PAL.halo},.5)`);r.addColorStop(.35,`rgba(${PAL.halo},.16)`);r.addColorStop(1,`rgba(${PAL.halo},0)`);g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);})();
const pivot=new THREE.Group(); scene.add(pivot);
const world=new THREE.Group(); pivot.add(world);
const pool=[];
function makeTile(){
  const m=new THREE.Mesh(boxGeo,new THREE.MeshPhysicalMaterial({color:BLUE,emissive:BLUE_LIT,emissiveIntensity:0.18,metalness:0.05,roughness:0.55,clearcoat:.3,clearcoatRoughness:0.4,transparent:true,fog:false}));
  const e=new THREE.LineSegments(edgeGeo,new THREE.LineBasicMaterial({color:PAL.edge,transparent:true,opacity:0.7,fog:false})); m.add(e);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:spriteTex,transparent:true,opacity:.4,depthWrite:false,blending:THREE.NormalBlending})); s.scale.set(1.9,1.9,1); s.position.y=0.1; s.visible=false;
  m.visible=false; world.add(m);
  return {mesh:m,edge:e,halo:s,x:0,z:0,state:'free',t0:0};
}
for(let i=0;i<160;i++) pool.push(makeTile());
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(7,7),new THREE.MeshBasicMaterial({map:spriteTex,transparent:true,opacity:0,depthWrite:false,color:0xffffff,blending:THREE.NormalBlending}));
shadow.rotation.x=-Math.PI/2; shadow.position.y=0.02; scene.add(shadow);

/* ---- moteur du jeu de la vie (cellules vivantes = ensemble de clés "x,z") ---- */
let live=new Set();
const key2=(x,z)=>x+','+z, parse=k=>k.split(',').map(Number);
// écosystème : quand le planeur rejoint le voisinage, la grille devient un tore W×H (compact, à droite)
const ECO_W=15, ECO_H=12; let eco=false, ecoX0=0, ecoZ0=0;
const wrap=(v,lo,n)=>lo+((v-lo)%n+n)%n;
function stepLife(){
  const cnt=new Map();
  for(const k of live){ const [x,z]=parse(k); for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){ if(!dx&&!dz) continue; let nx=x+dx,nz=z+dz; if(eco){ nx=wrap(nx,ecoX0,ECO_W); nz=wrap(nz,ecoZ0,ECO_H); } const n=key2(nx,nz); cnt.set(n,(cnt.get(n)||0)+1); } }
  const next=new Set();
  for(const [k,n] of cnt){ if(n===3||(n===2&&live.has(k))) next.add(k); }
  return next;
}
const tiles=new Map();   // clé → tuile vivante
function birth(k,now,stagger=0){ const [x,z]=parse(k); const t=pool.find(p=>p.state==='free'); if(!t) return; t.x=x; t.z=z; t.state='born'; t.t0=now+stagger; t.mesh.visible=true; t.mesh.position.set(x,Y,z); tiles.set(k,t); }
function death(k,now){ const t=tiles.get(k); if(!t) return; t.state='dying'; t.t0=now; tiles.delete(k); }
function apply(next,now){ for(const k of live) if(!next.has(k)) death(k,now); for(const k of next) if(!live.has(k)) birth(k,now); live=next; }

// graine : le planeur lui-même, orientation classique ; il avance ensuite par les règles de Conway
const SEED=[[1,0],[2,1],[0,2],[1,2],[2,2]];
// les vaisseaux du jeu de la vie : planeur, puis vaisseaux léger, moyen et lourd (formes canoniques)
const SHIPS=[
  [[1,0],[2,1],[0,2],[1,2],[2,2]],                                                  // glider
  [[1,0],[4,0],[0,1],[0,2],[4,2],[0,3],[1,3],[2,3],[3,3]],                          // LWSS
  [[2,0],[0,1],[4,1],[5,2],[0,3],[5,3],[1,4],[2,4],[3,4],[4,4],[5,4]],              // MWSS
  [[2,0],[3,0],[0,1],[5,1],[6,2],[0,3],[6,3],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4]],  // HWSS
];
let ship=0;
// transformation : chaque tuile glisse vers la cellule libre la plus proche ; le surplus naît ou s'éteint
function morphTo(cells,now){
  const cx=cells.reduce((a,c)=>a+c[0],0)/cells.length, cz=cells.reduce((a,c)=>a+c[1],0)/cells.length;
  const targets=cells.map(([x,z])=>[Math.round(x-cx+focus.x),Math.round(z-cz+focus.z)]);
  const alive=[...tiles.values()]; const left=targets.slice(); const next=new Set();
  for(const t of alive){ if(!left.length){ death(key2(t.x,t.z),now); continue; }
    let bi=0,bd=1e9; left.forEach((c,i)=>{const d=(c[0]-t.x)**2+(c[1]-t.z)**2; if(d<bd){bd=d;bi=i;}});
    const [nx,nz]=left.splice(bi,1)[0]; tiles.delete(key2(t.x,t.z));
    t.fx=t.x; t.fz=t.z; t.x=nx; t.z=nz; t.state='move'; t.t0=now; tiles.set(key2(nx,nz),t); next.add(key2(nx,nz)); }
  let i=0; for(const [nx,nz] of left){ const k=key2(nx,nz); birth(k,now,200+i++*60); next.add(k); }
  live=next;
}
// voisinage : 20 cellules posées à la génération 2 du planeur ; avec lui, ça grandit (pic 49) puis se stabilise
// en 28 cellules avec oscillateurs à la génération 31 (vérifié par simulation, grille bouclée 15×12)
const SOUP=[[3,10],[7,1],[7,9],[7,11],[8,2],[8,6],[10,1],[10,2],[11,0],[11,11],[12,1],[12,3],[12,4],[12,7],[13,2],[13,11],[14,1],[14,3],[14,4],[14,9]];
const ECO=false;   // (génération de cellules abandonnée : le planeur reste l'objet 3D du logo)
const smooth=(a,b,x)=>{ const t=Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); };
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

let gen=0, lastStep=0, started=false;
const start=performance.now();
function stepInterval(){ return 1e9; }   // pas de génération : l'objet est figé, il tourne

/* ---- caméra / interaction ---- */
const mouse={x:0,y:0};
addEventListener('pointermove',e=>{ mouse.x=(e.clientX/innerWidth-.5)*2; mouse.y=(e.clientY/innerHeight-.5)*2; },{passive:true});
let scrollK=0; addEventListener('scroll',()=>{ scrollK=Math.min(1,scrollY/innerHeight); },{passive:true});
function resize(){ const w=cv.clientWidth,h=cv.clientHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
addEventListener('resize',resize); resize(); new ResizeObserver(resize).observe(cv);
let revealAt=0, revealed=false;
addEventListener('hana:reveal',()=>{ if(!revealed){ revealed=true; revealAt=performance.now(); } });
function seedEco(){
  // le planeur est parti de (-1,-2) ; le tore s'étend à droite/derrière lui ; on garde les cellules déjà vivantes
  ecoX0=-3; ecoZ0=-3; eco=true; const now=performance.now(); let i=0;
  for(const [x,z] of SOUP){ const k=key2(x-3,z-3); if(!live.has(k)){ live.add(k); birth(k,now,i++*40); } }
}

const centroid=new THREE.Vector3(), focus=new THREE.Vector3(), target=new THREE.Vector3();
let heroVisible=true; new IntersectionObserver(es=>{ heroVisible=es[0].isIntersecting; },{threshold:0}).observe(cv);
function frame(now){
  requestAnimationFrame(frame);
  if(!heroVisible) return;                       // le hero est hors écran : on ne rend rien (économie GPU)
  const t=(now-start)/1000;
  if(!started){ started=true; const seed=new Set(SEED.map(([x,z])=>key2(x-2,z-2))); live=seed; let i=0; for(const k of seed) birth(k,now,i++*30); lastStep=now+300; }
  // (transformation en vaisseaux désactivée : le planeur reste le planeur)

  // progression du glissement (0 → 1) ; une fois à droite, le planeur s'efface derrière le contenu
  const r=revealed?ease(Math.min(1,(now-revealAt)/900)):0;
  const fade=1-(isMobile?0.5:0.5)*r;
  // animation des tuiles + barycentre des vivantes
  centroid.set(0,0,0); let n=0;
  for(const p of pool){
    if(p.state==='free') continue;
    const a=(now-p.t0)/1000;
    if(p.state==='born'){ const u=smooth(0,0.2,a); p.mesh.position.y=Y-(1-u)*0.4; p.mesh.material.opacity=u*fade; p.edge.material.opacity=0.5*u*fade; p.halo.material.opacity=0.4*u; p.mesh.material.emissiveIntensity=0.18; if(u>=1) p.state='alive'; }
    else if(p.state==='move'){ const u=smooth(0,0.8,a); p.mesh.position.x=p.fx+(p.x-p.fx)*u; p.mesh.position.z=p.fz+(p.z-p.fz)*u; p.mesh.position.y=Y+Math.sin(u*Math.PI)*0.35; p.mesh.material.opacity=fade; p.edge.material.opacity=0.5*fade; if(u>=1) p.state='alive'; }
    else if(p.state==='alive'){ p.mesh.position.y=Y+Math.sin(now/900+p.x)*0.025; p.mesh.material.emissiveIntensity=0.18; p.mesh.material.opacity=fade; p.edge.material.opacity=0.5*fade; }
    else if(p.state==='dying'){ const u=smooth(0,0.3,a); p.mesh.position.y=Y-u*0.5; p.mesh.material.opacity=(1-u)*fade; p.edge.material.opacity=0.5*(1-u)*fade; p.halo.material.opacity=0.4*(1-u); if(u>=1){ p.state='free'; p.mesh.visible=false; } }
    if(p.state!=='dying'){ centroid.x+=p.mesh.position.x; centroid.z+=p.mesh.position.z; n++; }
  }
  if(n){ centroid.multiplyScalar(1/n); }
  if(eco){ centroid.set(ecoX0+ECO_W/2-0.5,0,ecoZ0+ECO_H/2-0.5); }
  focus.lerp(centroid,0.06);                                   // suivi doux du barycentre (ou du centre du voisinage)
  world.position.set(-focus.x,0,-focus.z);
  // rotation lente de l'objet sur lui-même (+ un léger balancement), comme une pièce 3D de présentation
  if(!reduce){ pivot.rotation.y=t*0.28+mouse.x*0.15; pivot.rotation.x=Math.sin(t*0.5)*0.04; pivot.rotation.z=Math.cos(t*0.42)*0.03; }
  gridGroup.position.x=-(focus.x-Math.floor(focus.x)); gridGroup.position.z=-(focus.z-Math.floor(focus.z));
  glowLight.intensity=0; shadow.material.opacity=0;

  // caméra : vue de dessus face au jeu → trois-quarts, planeur décalé (droite / haut)
  const ar=camera.aspect;
  const sideEnd=isMobile?-2.9:-Math.max(1.8,Math.min(4.0,2.3+(ar-1.31)*3.8));   // décalage à droite selon la largeur de l'écran
  const side=sideEnd*r;
  const angFront=Math.sin(t*0.15)*0.05, angSide=(isMobile?-0.35:-0.5)+Math.sin(t*0.12)*(isMobile?0.12:0.22);
  const ang=angFront+(angSide-angFront)*r+mouse.x*0.08;
  const dolly=(1-smooth(0,0.9,t))*2;
  const Rfront=isMobile?15:9, Rside=isMobile?17.5:9.4*Math.sqrt(1.6/Math.min(1.6,ar));
  const R=Rfront+(Rside-Rfront)*r+dolly+scrollK*4;
  const elevFront=0.7, elevSide=isMobile?0.42:0.38;
  const elev=elevFront+(elevSide-elevFront)*r+mouse.y*0.04;
  camera.position.set(side+Math.sin(ang)*Math.cos(elev)*R, Math.sin(elev)*R+scrollK*2, Math.cos(ang)*Math.cos(elev)*R);
  target.set(side,0.1,isMobile?5.2*r:0); camera.lookAt(target);
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);
