{
const $=s=>document.querySelector(s);
const PL=Object.fromEntries(LIEUX.map(l=>[l.id,l]));
const DOCS={goad:{file:'img/plan-1903.jpg',label:'Plan Goad 1888-1903',short:'1888-1903',view:[46.3445,-72.5415,15.5],
  geo:[[46.337787,-72.576246],[46.370483,-72.556104],[46.325015,-72.529308]]},
 feu:{file:'img/plan-incendie.jpg',label:'Zone du feu de 1908',short:'Feu de 1908',view:[46.3432,-72.5418,16.5],
  geo:[[46.339189,-72.549576],[46.350145,-72.542813],[46.33554,-72.538113]]}};
const BASES={
 carte:['Carte','https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}','https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}','Carte © Esri, HERE, Garmin, contributeurs OpenStreetMap'],
 satellite:['Satellite','https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',null,'Imagerie © Esri, Maxar, Earthstar Geographics'],
 relief:['Relief','https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',null,'Relief © Esri']};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const popup=l=>`${l.img[0]?`<img src="img/${l.img[l.img.length-1][0]}" alt="">`:''}<small>${esc(l.d)}</small><b>${esc(l.n)}</b>${esc(l.t)}`;

/* ---------- Composant carte : fond, document calé, rideau ou fondu ---------- */
function MapView(box,el,withDocCtl){
 const st={base:'carte',doc:null,mode:'rideau',t:50};
 const map=L.map(el,{zoomControl:false,scrollWheelZoom:false,zoomSnap:.5,dragging:!L.Browser.mobile,tap:false}).setView([46.3435,-72.541],15);
 L.control.zoom({position:'topright'}).addTo(map);
 map.on('click',()=>{map.scrollWheelZoom.enable();map.dragging.enable()});
 const pane=map.createPane('doc');pane.style.zIndex=350;pane.style.pointerEvents='none';
 const img=document.createElement('img');img.className='docimg';img.alt='';pane.appendChild(img);
 box.insertAdjacentHTML('beforeend',`<div class="ctl"><div class="row"><span class="lbl">FOND</span><div class="seg" data-k="base">${Object.entries(BASES).map(([k,b])=>`<button data-v="${k}">${b[0]}</button>`).join('')}</div></div>
  <div class="row docrow"${withDocCtl?'':' hidden'}><span class="lbl">DOCUMENT</span><div class="seg" data-k="doc"><button data-v="">Aucun</button>${Object.entries(DOCS).map(([k,d])=>`<button data-v="${k}">${d.short}</button>`).join('')}</div></div>
  <div class="row mixrow"><span class="lbl">COMPARER</span><div class="seg" data-k="mode"><button data-v="rideau">Rideau</button><button data-v="fondu">Fondu</button></div><input type="range" min="0" max="100" value="50" aria-label="Dosage entre le document et la ville actuelle"></div></div>
  <div class="swipe"><span aria-hidden="true">⟷</span></div><div class="tag l"></div><div class="tag r"></div><p class="fail"></p>`);
 const ctl=box.querySelector('.ctl'),sw=box.querySelector('.swipe'),rng=ctl.querySelector('input'),fail=box.querySelector('.fail');
 L.DomEvent.disableClickPropagation(ctl);L.DomEvent.disableScrollPropagation(ctl);
 const tiles={};
 function tile(k){if(tiles[k])return tiles[k];const b=BASES[k],t=L.tileLayer(b[1],{maxZoom:20,maxNativeZoom:k==='relief'?16:19,attribution:b[3]});let ok=0,bad=0,alt=b[2];
  t.on('tileload',()=>{ok++;fail.classList.remove('on')});
  t.on('tileerror',()=>{bad++;if(ok||bad<5)return;if(alt){t.setUrl(alt);alt=null;bad=0;return}if(st.base===k){fail.textContent=`Le fond « ${b[0]} » ne répond pas pour le moment. Essayez un autre fond.`;fail.classList.add('on')}});
  return tiles[k]=t}
 function draw(){const d=DOCS[st.doc];if(!d){img.style.display='none';return}
  if(img.dataset.f!==d.file){img.dataset.f=d.file;img.style.display='none';img.onload=draw;img.src=d.file;return}
  if(!img.naturalWidth)return;
  const [p0,p1,p2]=d.geo.map(c=>map.latLngToLayerPoint(c)),w=img.naturalWidth,h=img.naturalHeight;
  img.style.display='block';img.style.transform=`matrix(${(p1.x-p0.x)/w},${(p1.y-p0.y)/w},${(p2.x-p0.x)/h},${(p2.y-p0.y)/h},${p0.x},${p0.y})`}
 function clip(){if(st.mode!=='rideau'||!st.doc){pane.style.clip='';return}
  const nw=map.containerPointToLayerPoint([0,0]),se=map.containerPointToLayerPoint(map.getSize()),w=map.getSize().x*st.t/100;
  pane.style.clip=`rect(${nw.y}px, ${nw.x+w}px, ${se.y}px, ${nw.x}px)`;sw.style.left=w+'px'}
 function apply(){
  for(const s of ctl.querySelectorAll('.seg'))for(const b of s.children)b.setAttribute('aria-pressed',String((st[s.dataset.k]||'')===b.dataset.v));
  ctl.querySelector('.mixrow').hidden=!st.doc;rng.value=st.t;
  box.classList.toggle('rideau',!!st.doc&&st.mode==='rideau');box.classList.toggle('fondu',!!st.doc&&st.mode==='fondu');
  if(st.doc){const d=DOCS[st.doc];box.querySelector('.tag.l').textContent=st.mode==='rideau'?'◀ '+d.short:d.short+' · '+st.t+' %';box.querySelector('.tag.r').textContent=st.mode==='rideau'?'Aujourd’hui ▶':'Aujourd’hui · '+(100-st.t)+' %'}
  for(const k in tiles)if(k!==st.base&&map.hasLayer(tiles[k]))map.removeLayer(tiles[k]);
  if(!map.hasLayer(tile(st.base))){fail.classList.remove('on');tile(st.base).addTo(map)}
  pane.style.opacity=st.mode==='fondu'?st.t/100:.92;draw();clip()}
 ctl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=b.parentElement.dataset.k;st[k]=b.dataset.v||null;if(k==='doc'&&st.doc)map.flyTo(DOCS[st.doc].view.slice(0,2),DOCS[st.doc].view[2],{duration:.8});apply()});
 rng.addEventListener('input',()=>{st.t=+rng.value;apply()});
 map.on('zoomstart',()=>img.style.visibility='hidden');map.on('zoomend viewreset',()=>{draw();img.style.visibility='visible'});map.on('move zoom resize zoomend',clip);
 const grip=sw.querySelector('span');
 grip.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();grip.setPointerCapture(e.pointerId);map.dragging.disable();
  const mv=ev=>{const r=box.getBoundingClientRect();st.t=Math.round(Math.max(0,Math.min(100,(ev.clientX-r.left)/r.width*100)));apply()};
  const up=()=>{grip.removeEventListener('pointermove',mv);grip.removeEventListener('pointerup',up);if(!L.Browser.mobile)map.dragging.enable()};
  grip.addEventListener('pointermove',mv);grip.addEventListener('pointerup',up)});
 apply();
 return {map,st,apply,set(o){Object.assign(st,o);apply()}};
}
const pinIcon=(l,old)=>L.divIcon({className:'pin'+(old?' old':''),html:`<i style="background:${PER[l.per][1]}"></i>`,iconSize:[22,22]});

/* ---------- Visionneuse ---------- */
const lb=$('#lb');
document.addEventListener('click',e=>{const b=e.target.closest('[data-zoom]');if(!b)return;lb.querySelector('img').src=b.dataset.zoom;lb.querySelector('p').textContent=b.dataset.cap||'';lb.showModal()});
$('#lbx').onclick=()=>lb.close();lb.addEventListener('click',e=>{if(e.target===lb)lb.close()});

/* ---------- Le récit ---------- */
let R=null,rMarks=[],cur=0;const seen=new Set();
$('#steps').innerHTML=CHAP.map((c,i)=>`<button data-i="${i}" title="${esc(c.h)}">${i+1}. ${esc(c.era.split(' – ')[0].replace('Avant ','av. '))}</button>`).join('');
function chapter(i,fly=true){
 cur=Math.max(0,Math.min(CHAP.length-1,i));const c=CHAP[cur];seen.add(cur);
 if(location.hash!=='#recit-'+(cur+1))history.replaceState(null,'','#recit-'+(cur+1));
 document.querySelectorAll('#steps button').forEach((b,j)=>{b.toggleAttribute('aria-current',j===cur);if(j===cur)b.setAttribute('aria-current','step');b.classList.toggle('seen',seen.has(j));if(j===cur)b.scrollIntoView({inline:'center',block:'nearest'})});
 const pins=(c.pins||[]).map(id=>PL[id]);
 $('#ptext').innerHTML=`<p class="count">Étape ${cur+1} sur ${CHAP.length} · ${esc(c.era)}</p><h2>${esc(c.h)}</h2>${c.p.map(x=>`<p>${esc(x)}</p>`).join('')}
  ${c.look?`<div class="look"><b>À OBSERVER SUR LA CARTE</b>${esc(c.look)}</div>`:''}
  ${pins.length?`<div class="chips">${pins.map(l=>`<button class="chip" data-fly="${l.id}"><i style="background:${PER[l.per][1]}"></i>${esc(l.n)}</button>`).join('')}</div>`:''}
  ${c.doc?`<figure><button data-zoom="img/${c.doc[0]}" data-cap="${esc(c.doc[1])}"><img src="img/${c.doc[0]}" alt="${esc(c.doc[1])}" loading="lazy"></button><figcaption>${esc(c.doc[1])} · touchez pour agrandir</figcaption></figure>`:''}`;
 $('#ptext').scrollTop=0;
 $('#prev').disabled=cur===0;$('#next').textContent=cur===CHAP.length-1?'Explorer la carte →':'Suivant →';
 if(!R)return;
 /* la carte se construit : lieux des étapes passées en petit, ceux de l’étape en grand */
 rMarks.forEach(m=>R.map.removeLayer(m));rMarks=[];
 for(const l of LIEUX){if(!l.ll||l.ch>cur)continue;const now=(c.pins||[]).includes(l.id);
  const m=L.marker(l.ll,{icon:pinIcon(l,!now),zIndexOffset:now?500:0,title:l.n}).bindPopup(popup(l),{maxWidth:260}).addTo(R.map);
  if(now&&pins.length<=4)m.bindTooltip(l.n,{permanent:true,direction:'right',offset:[8,0],className:'plbl'});
  rMarks.push(m)}
 R.set({base:c.base||'carte',doc:c.doc2||null,mode:'rideau',t:50});
 if(fly)R.map.flyTo(c.v.slice(0,2),c.v[2],{duration:1.1});else R.map.setView(c.v.slice(0,2),c.v[2]);
}
$('#steps').onclick=e=>{const b=e.target.closest('[data-i]');if(b)chapter(+b.dataset.i)};
$('#prev').onclick=()=>chapter(cur-1);
$('#next').onclick=()=>{if(cur===CHAP.length-1)location.hash='#carte';else{chapter(cur+1);if(innerWidth<=900)$('#v-recit').scrollIntoView()}};
$('#ptext').addEventListener('click',e=>{const b=e.target.closest('[data-fly]');if(!b||!R)return;const l=PL[b.dataset.fly];R.map.flyTo(l.ll,Math.max(R.map.getZoom(),17),{duration:.8});
 const m=rMarks.find(x=>x.getLatLng().equals(L.latLng(l.ll)));if(m)setTimeout(()=>m.openPopup(),850);if(innerWidth<=900)scrollTo({top:0,behavior:'smooth'})});
document.addEventListener('keydown',e=>{if(!$('#v-recit').classList.contains('on')||lb.open)return;if(e.key==='ArrowRight')$('#next').click();if(e.key==='ArrowLeft'&&cur>0)chapter(cur-1)});

/* ---------- La carte libre ---------- */
let C=null;const cMarks={},perOn=new Set(Object.keys(PER));
$('#legend').innerHTML=Object.entries(PER).map(([k,[n,c]])=>`<button data-p="${k}" aria-pressed="true"><i style="background:${c}"></i>${n}</button>`).join('');
function renderList(){$('#plist').innerHTML=LIEUX.filter(l=>l.ll&&perOn.has(l.per)).map(l=>`<li><button data-go="${l.id}"><i style="background:${PER[l.per][1]}"></i><span>${esc(l.n)}<small>${esc(l.d)}</small></span></button></li>`).join('')}
function syncMarks(){for(const l of LIEUX){const m=cMarks[l.id];if(!m)continue;perOn.has(l.per)?m.addTo(C.map):C.map.removeLayer(m)}}
$('#legend').onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;const k=b.dataset.p;perOn.has(k)?perOn.delete(k):perOn.add(k);b.setAttribute('aria-pressed',perOn.has(k));renderList();if(C)syncMarks()};
renderList();
function goPlace(id){const l=PL[id];if(!l||!l.ll)return;location.hash='#carte';setTimeout(()=>{if(!C)return;if(!perOn.has(l.per)){perOn.add(l.per);document.querySelector(`#legend [data-p="${l.per}"]`).setAttribute('aria-pressed','true');renderList();syncMarks()}
 C.map.flyTo(l.ll,17.5,{duration:.9});setTimeout(()=>cMarks[id].openPopup(),950);if(innerWidth<=900)scrollTo({top:0,behavior:'smooth'})},60)}
$('#plist').onclick=e=>{const b=e.target.closest('[data-go]');if(b)goPlace(b.dataset.go)};

/* ---------- Les lieux ---------- */
let lf='all';
$('#filters').innerHTML=`<button data-f="all" aria-pressed="true">Tous</button>${Object.entries(PER).map(([k,[n,c]])=>`<button data-f="${k}" aria-pressed="false"><i style="background:${c}"></i>${n}</button>`).join('')}<input type="search" id="q" placeholder="Chercher un lieu, une rue, une date…" aria-label="Chercher un lieu">`;
const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function renderGrid(){const q=norm($('#q').value||'');
 $('#grid').innerHTML=LIEUX.filter(l=>(lf==='all'||l.per===lf)&&norm(l.n+' '+l.t+' '+l.d).includes(q)).map(l=>`<article class="card">
  ${l.img.length?`<div class="pics n${l.img.length}">${l.img.map(([f,y,c])=>`<button data-zoom="img/${f}" data-cap="${esc(l.n+' · '+y+' · '+c)}"><img src="img/${f}" alt="${esc(l.n+', '+y)}" loading="lazy"><span>${esc(y)}</span></button>`).join('')}</div>`:''}
  <div class="cb"><p class="meta"><i style="background:${PER[l.per][1]}"></i>${esc(PER[l.per][0].toUpperCase())} · ${esc(l.d)}</p><h3>${esc(l.n)}</h3><p>${esc(l.t)}</p>
  ${l.ll?`<button class="go" data-go="${l.id}">Voir sur la carte →</button>`:'<p class="nomap">Emplacement non cartographié</p>'}</div></article>`).join('')||'<p>Aucun lieu ne correspond.</p>'}
$('#filters').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;lf=b.dataset.f;document.querySelectorAll('#filters [data-f]').forEach(x=>x.setAttribute('aria-pressed',x===b));renderGrid()};
$('#q').addEventListener('input',renderGrid);
$('#grid').onclick=e=>{const b=e.target.closest('[data-go]');if(b)goPlace(b.dataset.go)};
renderGrid();$('#nLieux').textContent=`${LIEUX.length} lieux, avec leurs photos d’hier et d’aujourd’hui quand elles existent.`;

/* ---------- Sources ---------- */
const REFS=[
 ['Ville de Trois-Rivières, Survol historique','https://www.v3r.net/culture/histoire-et-patrimoine/histoire-de-trois-rivieres'],
 ['Répertoire du patrimoine culturel du Québec, Site patrimonial de Trois-Rivières (déclaré en 1964)','https://www.patrimoine-culturel.gouv.qc.ca/detail.do?id=93531&methode=consulter&type=bien'],
 ['Répertoire, Hôtel de ville et centre culturel de Trois-Rivières (prix Massey 1971, hôtels de ville successifs)','https://www.patrimoine-culturel.gouv.qc.ca/rpcq/detail.do?id=174361&methode=consulter&type=bien'],
 ['Répertoire, Site patrimonial des Ursulines-de-Trois-Rivières','https://www.patrimoine-culturel.gouv.qc.ca/rpcq/detail.do?id=156548&methode=consulter&type=bien'],
 ['Répertoire, Ancienne prison de Trois-Rivières','https://www.patrimoine-culturel.gouv.qc.ca/detail.do?id=92686&methode=consulter&type=bien'],
 ['Répertoire, Maison Maurice-Duplessis','https://www.patrimoine-culturel.gouv.qc.ca/rpcq/detail.do?id=96509&methode=consulter&type=bien'],
 ['Répertoire, Usine de filtration de la CIP','https://www.patrimoine-culturel.gouv.qc.ca/detail.do?id=166359&methode=consulter&type=bien'],
 ['Parcs Canada, Lieu historique national des Forges-du-Saint-Maurice','https://www.pc.gc.ca/apps/dfhd/page_nhs_fra.aspx?id=724'],
 ['Institut canadien des urbanistes, La place Pierre-Boucher et le parc du Platon (site de l’église paroissiale, 1713-1908)','https://www.cip-icu.ca/wp-content/uploads/2023/11/La-place-Pierre-Boucher-et-le-parc-du-Platon.pdf'],
 ['Ville de Trois-Rivières, toponymie : rue du Chanoine-Chamberland','https://www.v3r.net/culture/histoire-et-patrimoine/toponymie/toponyme/chanoine-chamberland'],
 ['Ville de Trois-Rivières, toponymie : Wabasso','https://www.v3r.net/culture/histoire-et-patrimoine/toponymie/toponyme/wabasso'],
 ['Boréalis, historique et mission','https://www.borealis3r.ca/a-propos/historique-et-mission/'],
 ['UQTR, historique','https://www.uqtr.ca/historique/index.shtml'],
 ['René Beaudoin, 22 juin 1908, l’incendie de Trois-Rivières (album de photos)','https://troisrivieresnumerique.ca/wp-content/uploads/2024/09/2013_Beaudoin_incendie-1908.pdf']];
$('#refs').innerHTML=REFS.map(([t,u])=>`<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('');
const CRED=[['hero-1881.jpg','Vue à vol d’oiseau de Trois-Rivières en 1881, P.-F. Pinsonneault, BAnQ (domaine public)'],['plan-1685.jpg','Plan de Trois-Rivières, 1685, via Wikimedia Commons (domaine public)'],['plan-1704.jpg','Plan de la ville, 1704, Jacques Levasseur de Néré, via Wikimedia Commons (domaine public)'],['plan-1720.jpg','Plan du Platon, 1720, Chaussegros de Léry, Bibliothèque et Archives Canada (domaine public)'],['plan-1760.jpg','Plan de la ville, 1760, via Wikimedia Commons (domaine public)'],['plan-1781.jpg','Trois-Rivières et le lac Saint-Pierre, 1781, J. F. W. Des Barres, BAnQ (domaine public)'],['plan-1815.jpg','La ville en 1815, dans Benjamin Sulte, Histoire des Canadiens-Français, 1882, British Library (domaine public)'],['plan-1861.jpg','Carte de l’Amirauté no 2830a, 1861, McGill Library (domaine public)'],['plan-1903.jpg','Plan d’assurance-incendie, Charles E. Goad, 1888 révisé en 1903, BAnQ (domaine public)'],['plan-incendie.jpg','Périmètre du feu de 1908 sur le plan Goad, Wikimedia Commons (domaine public)'],
 ...LIEUX.flatMap(l=>l.img.map(([f,y,c])=>[f,`${l.n}, ${y} : ${c}`])),['forges-2006.jpg','Rue des Forges, 2006 : Nicholas Wang, CC BY-SA 2.0']];
$('#credits').innerHTML=CRED.map(([f,t])=>`<li>${esc(t)}</li>`).join('');

/* ---------- Navigation : une vue à la fois, l’onglet actif indique où l’on est ---------- */
function route(){const h=location.hash.slice(1)||'accueil';const [v,n]=h.split('-');const view=['accueil','recit','carte','lieux','sources'].includes(v)?v:'accueil';
 document.querySelectorAll('.view').forEach(s=>s.classList.toggle('on',s.id==='v-'+view));
 document.querySelectorAll('nav.tabs a').forEach(a=>a.toggleAttribute('aria-current',a.getAttribute('href')==='#'+view)||0);
 document.querySelectorAll('nav.tabs a').forEach(a=>{if(a.getAttribute('href')==='#'+view)a.setAttribute('aria-current','page')});
 if(view==='recit'){if(!R){R=MapView($('#mbR'),'mapR',false)}R.map.invalidateSize();chapter(n?(+n-1):cur,false)}
 if(view==='carte'){if(!C){C=MapView($('#mbC'),'mapC',true);C.set({doc:'goad'});C.map.setView(DOCS.goad.view.slice(0,2),DOCS.goad.view[2]);
   for(const l of LIEUX)if(l.ll)cMarks[l.id]=L.marker(l.ll,{icon:pinIcon(l,false),title:l.n}).bindPopup(popup(l),{maxWidth:260});syncMarks()}
  C.map.invalidateSize()}
 if(view!=='recit'||!n)scrollTo(0,0)}
addEventListener('hashchange',route);route();
}
