/* Bandeau cookies et mesure d'audience : Google Analytics ne se charge qu'après un accord du visiteur. */
(function(){
  var ID='G-RKPQM9TJMK', KEY='hana-consent', MAX=182*864e5, loaded=false, box=null;
  function read(){
    try{
      var v=JSON.parse(localStorage.getItem(KEY));
      if(v&&Date.now()-v.t<MAX) return v.c;
    }catch(e){}
    return null;
  }
  function save(c){
    try{localStorage.setItem(KEY,JSON.stringify({c:c,t:Date.now()}));}catch(e){}
  }
  function load(){
    if(loaded) return;
    loaded=true;
    window['ga-disable-'+ID]=false;
    window.dataLayer=window.dataLayer||[];
    window.gtag=function(){dataLayer.push(arguments);};
    gtag('js',new Date());
    gtag('config',ID,{allow_google_signals:false,allow_ad_personalization_signals:false});
    var s=document.createElement('script');
    s.async=true;
    s.src='https://www.googletagmanager.com/gtag/js?id='+ID;
    document.head.appendChild(s);
  }
  function clear(){
    window['ga-disable-'+ID]=true;
    document.cookie.split(';').forEach(function(c){
      var n=c.split('=')[0].trim();
      if(n.indexOf('_ga')!==0) return;
      ['','; domain=hanahealth.fr','; domain=.hanahealth.fr'].forEach(function(d){
        document.cookie=n+'=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'+d;
      });
    });
  }
  function style(){
    if(document.getElementById('ck-style')) return;
    var s=document.createElement('style');
    s.id='ck-style';
    s.textContent='.ck{position:fixed;z-index:80;left:12px;right:12px;bottom:12px;box-sizing:border-box;padding:14px 16px;background:#fff;color:#2c3a5b;border:1px solid rgba(44,58,91,.14);border-radius:14px;box-shadow:0 10px 34px rgba(20,28,48,.2);font:400 13.5px/1.45 Archivo,system-ui,sans-serif}'
      +'.ck p{margin:0}.ck a{color:inherit;text-decoration:underline}'
      +'.ck-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}'
      +'.ck button{min-height:42px;padding:0 12px;border-radius:9px;border:1px solid #2c3a5b;background:#fff;color:#2c3a5b;font:600 13.5px/1 Archivo,system-ui,sans-serif;cursor:pointer}'
      +'.ck button[data-c="1"]{background:#2c3a5b;color:#fff}'
      +'.ck button:focus-visible{outline:2px solid #2fa36b;outline-offset:2px}'
      +'@media (min-width:640px){.ck{left:24px;right:auto;bottom:24px;width:390px}}'
      +'@media print{.ck{display:none}}';
    document.head.appendChild(s);
  }
  function hide(){
    if(box){box.remove();box=null;}
  }
  function show(){
    if(box) return;
    style();
    box=document.createElement('div');
    box.className='ck';
    box.setAttribute('role','region');
    box.setAttribute('aria-label','Choix concernant les cookies');
    box.innerHTML='<p>Nous mesurons l\'audience du site avec Google Analytics, seulement si vous l\'acceptez. <a href="/confidentialite.html#cookies">En savoir plus</a></p>'
      +'<div class="ck-btns"><button type="button" data-c="0">Refuser</button><button type="button" data-c="1">Accepter</button></div>';
    box.addEventListener('click',function(e){
      var b=e.target.closest('button');
      if(!b) return;
      var yes=b.getAttribute('data-c')==='1';
      save(yes?1:0);
      hide();
      if(yes) load();
      else clear();
    });
    document.body.appendChild(box);
  }
  window.hanaTrack=function(name){
    if(loaded) gtag('event',name);
  };
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a');
    if(!a) return;
    if(a.hasAttribute('data-cookies')){e.preventDefault();show();return;}
    var h=a.getAttribute('href')||'';
    if(h.indexOf('tel:')===0) window.hanaTrack('clic_telephone');
    else if(h.indexOf('mailto:')===0) window.hanaTrack('clic_email');
  });
  var c=read();
  if(c===1) load();
  else if(c===null) show();
})();
