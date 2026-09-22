/* Le réseau sur un globe (COBE, 5 Ko, WebGL) : la Terre en points, centrée sur l'Europe, qui tourne lentement.
   Étape 1 : votre ville s'allume. Étape 2 : les autres villes s'y relient par des arcs. Étape 3 : tout le réseau brille.
   Boutons sous le globe : choisir sa ville → tout se recentre sur elle. */
import createGlobe from 'https://cdn.jsdelivr.net/npm/cobe@2.0.1/+esm';

const cv=document.getElementById('globe'); if(!cv||new URLSearchParams(location.search).has('noglobe')) throw new Error('no globe');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const CITIES=[
  ['Paris',48.86,2.35],['Lille',50.63,3.06],['Nantes',47.22,-1.55],['Bordeaux',44.84,-0.58],['Toulouse',43.60,1.44],
  ['Lyon',45.76,4.83],['Marseille',43.30,5.37],['Nice',43.70,7.26],['Bruxelles',50.85,4.35],['Genève',46.20,6.14],
];
const GREEN=[0.25,0.82,0.54], WHITE=[1,1,1], DIM=[0.55,0.62,0.78];
const HUB=[46.6,2.6];   // le hub HANA, au centre de la carte
let you=5, step=1, globe=null, t0=performance.now();

// vue fixe centrée sur le hub : phi = -longitude, theta = latitude (radians) ; léger balancement pour la vie
const D=Math.PI/180, PHI0=+(new URLSearchParams(location.search).get('phi')||0), THETA0=+(new URLSearchParams(location.search).get('theta')||0.3);

function options(){
  const w=cv.offsetWidth, dpr=Math.min(devicePixelRatio,2);
  const markers=CITIES.map((c,i)=>({location:[c[1],c[2]], size:i===you?0.05:(step>=3?0.03:0.02), color:i===you?WHITE:(step>=3?GREEN:DIM)}));
  if(step>=2) markers.push({location:HUB, size:0.06, color:GREEN});
  const arcs=step>=2?CITIES.map(c=>({from:[c[1],c[2]], to:HUB, color:GREEN})):[];
  return {devicePixelRatio:dpr,width:w*dpr,height:w*dpr,phi:PHI0,theta:THETA0,dark:1,diffuse:1.2,mapSamples:20000,mapBrightness:10,
    baseColor:[0.55,0.65,0.9],markerColor:GREEN,glowColor:[0.2,0.28,0.5],arcColor:GREEN,arcWidth:0.5,arcHeight:0.22,scale:+(new URLSearchParams(location.search).get('sc')||1),offset:[0,0],
    markers,arcs,
    onRender:(state)=>{ const t=(performance.now()-t0)/1000; state.phi=PHI0+(reduce?0:Math.sin(t*0.25)*0.035); state.theta=THETA0+(reduce?0:Math.cos(t*0.21)*0.02); state.width=cv.offsetWidth*dpr; state.height=cv.offsetWidth*dpr; }};
}
function build(){ if(globe) globe.destroy(); globe=createGlobe(cv,options()); }
build();
addEventListener('resize',build);


// étapes (défilement) et choix de la ville
addEventListener('hana:step',e=>{ step=e.detail; build(); });
const pick=document.getElementById('cityPick');
CITIES.forEach((c,i)=>{ const b=document.createElement('button'); b.type='button'; b.textContent=c[0]; b.className=i===you?'on':''; b.addEventListener('click',()=>{ you=i; [...pick.children].forEach((x,k)=>x.classList.toggle('on',k===i)); document.getElementById('capCity').textContent=c[0]; build(); }); pick.appendChild(b); });
document.getElementById('capCount').textContent=String(CITIES.length-1);
