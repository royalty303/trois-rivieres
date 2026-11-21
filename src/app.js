{
const $=s=>document.querySelector(s);
const PL=Object.fromEntries(LIEUX.map(l=>[l.id,l]));
const DOCS={p1704:{file:'img/plan-1704-calage.jpg',label:'Plan de 1704',short:'1704',view:[46.34335,-72.53775,16.5],
  geo:[[46.342608,-72.541651],[46.346066,-72.536379],[46.340714,-72.539053]]},
 goad:{file:'img/plan-1903.jpg',label:'Plan Goad 1888-1903',short:'1888-1903',view:[46.3445,-72.5415,15.5],
  geo:[[46.337787,-72.576246],[46.370483,-72.556104],[46.325015,-72.529308]]}};
const BASES={
 carte:['Carte','https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}','https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}','Carte © Esri, HERE, Garmin, contributeurs OpenStreetMap'],
 satellite:['Satellite','https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',null,'Imagerie © Esri, Maxar, Earthstar Geographics'],
 relief:['Relief','https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',null,'Relief © Esri']};
const src=(f,w=900)=>f.startsWith('c:')?'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(f.slice(2))+'?width='+w:'img/'+f;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const popup=l=>`${l.img[0]?`<img src="${src(l.img[l.img.length-1][0],500)}" alt="">`:''}<small>${esc(l.d)}</small><b>${esc(l.n)}</b>${esc(l.t)}${l.sv?`<a class="psv" href="${svUrl(l.sv)}" target="_blank" rel="noopener">Street View ↗</a>`:''}`;
function svUrl(v){return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${v[0]},${v[1]}&heading=${v[2]}&pitch=${v[3]||5}`}

/* ---------- Composant carte : fond actuel, plan ancien en fondu, contour du feu ---------- */
const FEU=[[46.339284,-72.542957],[46.338821,-72.542628],[46.338784,-72.542189],[46.339089,-72.54154],[46.339026,-72.540861],[46.339357,-72.540451],[46.339919,-72.539643],[46.340193,-72.539218],[46.34081,-72.538581],[46.341283,-72.538135],[46.341837,-72.537947],[46.342518,-72.537834],[46.343069,-72.537955],[46.343419,-72.538251],[46.343198,-72.539003],[46.343192,-72.539468],[46.343348,-72.539475],[46.344289,-72.538893],[46.344525,-72.539312],[46.344572,-72.540103],[46.34451,-72.540551],[46.344222,-72.540934],[46.343825,-72.540974],[46.343694,-72.541208],[46.343677,-72.541475],[46.342835,-72.542046],[46.341835,-72.542766],[46.342121,-72.543666],[46.341964,-72.543814],[46.341108,-72.544343],[46.340896,-72.54432],[46.340112,-72.544753],[46.339277,-72.544704],[46.339055,-72.544328],[46.33902,-72.543735],[46.33935,-72.543326]];
function MapView(box,el){
 const st={base:'carte',doc:null,t:70,feu:false};
 const map=L.map(el,{zoomControl:false,scrollWheelZoom:false,zoomSnap:.5,dragging:!L.Browser.mobile,tap:false}).setView([46.3435,-72.541],15);
 L.control.zoom({position:'topright'}).addTo(map);
 map.on('click',()=>{map.scrollWheelZoom.enable();map.dragging.enable()});
 const pane=map.createPane('doc');pane.style.zIndex=350;pane.style.pointerEvents='none';
 const img=document.createElement('img');img.className='docimg';img.alt='';pane.appendChild(img);
 const feu=L.polygon(FEU,{color:'#c0281b',weight:3,dashArray:'8 6',fillColor:'#e0502a',fillOpacity:.13}).bindTooltip('Zone détruite par le feu du 22 juin 1908',{sticky:true});
 box.insertAdjacentHTML('beforeend',`<div class="ctl"><div class="row"><span class="lbl">FOND</span><div class="seg" data-k="base">${Object.entries(BASES).map(([k,b])=>`<button data-v="${k}">${b[0]}</button>`).join('')}</div></div>
  <div class="row"><span class="lbl">HIER</span><div class="seg" data-k="doc"><button data-v="">Aucun plan</button><button data-v="p1704">1704</button><button data-v="goad">1888-1903</button></div><button class="feubtn" data-feu>Feu de 1908</button></div>
  <div class="row mixrow"><span class="lbl">OPACITÉ</span><span class="sm">Aujourd’hui</span><input type="range" min="0" max="100" value="70" aria-label="Opacité du plan ancien"><span class="sm docyear">1888</span></div></div><p class="fail"></p>`);
 const ctl=box.querySelector('.ctl'),rng=ctl.querySelector('input'),fail=box.querySelector('.fail');
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
 function apply(){
  for(const s of ctl.querySelectorAll('.seg'))for(const b of s.children)b.setAttribute('aria-pressed',String((st[s.dataset.k]||'')===b.dataset.v));
  ctl.querySelector('[data-feu]').setAttribute('aria-pressed',String(st.feu));
  ctl.querySelector('.mixrow').hidden=!st.doc;if(st.doc)ctl.querySelector('.docyear').textContent=DOCS[st.doc].short;rng.value=st.t;
  for(const k in tiles)if(k!==st.base&&map.hasLayer(tiles[k]))map.removeLayer(tiles[k]);
  if(!map.hasLayer(tile(st.base))){fail.classList.remove('on');tile(st.base).addTo(map)}
  st.feu?feu.addTo(map):map.removeLayer(feu);
  pane.style.opacity=st.t/100;draw()}
 ctl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-feu')){st.feu=!st.feu;if(st.feu)map.flyToBounds(feu.getBounds(),{padding:[60,60],duration:.8})}
  else{const k=b.parentElement.dataset.k;st[k]=b.dataset.v||null;if(k==='doc'&&st.doc)map.flyTo(DOCS[st.doc].view.slice(0,2),DOCS[st.doc].view[2],{duration:.8})}
  apply()});
 rng.addEventListener('input',()=>{st.t=+rng.value;apply()});
 map.on('zoomstart',()=>img.style.visibility='hidden');map.on('zoomend viewreset',()=>{draw();img.style.visibility='visible'});
 apply();
 return {map,st,apply,set(o){Object.assign(st,o);apply()}};
}
const pinIcon=(l,old)=>L.divIcon({className:'pin'+(old?' old':''),html:`<i style="background:${PER[l.per][1]}"></i>`,iconSize:[22,22]});

/* ---------- Mots expliqués ---------- */
function gloss(texts){const used=new Set();return texts.map(t=>{let h=esc(t);
 for(const [k,re,def] of GLOSS){if(used.has(k))continue;const m=h.match(re);if(!m)continue;
  const i=m.index;if(h.lastIndexOf('<',i)>h.lastIndexOf('>',i))continue;
  h=h.slice(0,i)+`<button class="term" data-g="${GLOSS.findIndex(g=>g[0]===k)}">${m[0]}</button>`+h.slice(i+m[0].length);used.add(k)}
 return h})}
const pop=document.createElement('div');pop.className='gpop';pop.setAttribute('role','dialog');pop.hidden=true;document.body.appendChild(pop);
document.addEventListener('click',e=>{const b=e.target.closest('.term');
 if(!b){if(!e.target.closest('.gpop'))pop.hidden=true;return}
 const g=GLOSS[+b.dataset.g];pop.innerHTML=`<b>${esc(g[0])}</b><p>${esc(g[2])}</p>`;pop.hidden=false;
 const r=b.getBoundingClientRect(),w=Math.min(320,innerWidth-24);pop.style.width=w+'px';
 pop.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2))+'px';
 const below=r.bottom+10+pop.offsetHeight<innerHeight;pop.style.top=(below?r.bottom+8:r.top-pop.offsetHeight-8)+'px'});
addEventListener('keydown',e=>{if(e.key==='Escape')pop.hidden=true});
addEventListener('scroll',()=>pop.hidden=true,true);

/* ---------- Visionneuse : flèches entre les images d’un même lieu ---------- */
const lb=$('#lb');let gal=[],gi=0;
function showLb(){const b=gal[gi];lb.querySelector('img').src=b.dataset.zoom;lb.querySelector('p').textContent=b.dataset.cap||'';
 const many=gal.length>1;lb.querySelectorAll('.nav').forEach(n=>n.hidden=!many);lb.querySelector('.cnt').textContent=many?`${gi+1} / ${gal.length}`:''}
document.addEventListener('click',e=>{const b=e.target.closest('[data-zoom]');if(!b)return;const g=b.closest('.pics');gal=g?[...g.querySelectorAll('[data-zoom]')]:[b];gi=gal.indexOf(b);showLb();lb.showModal()});
const step=d=>{if(gal.length<2)return;gi=(gi+d+gal.length)%gal.length;showLb()};
$('#lbp').onclick=()=>step(-1);$('#lbn').onclick=()=>step(1);
lb.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}if(e.key==='ArrowRight'){e.preventDefault();step(1)}});
let tx=null;lb.addEventListener('touchstart',e=>{tx=e.touches[0].clientX},{passive:true});lb.addEventListener('touchend',e=>{if(tx===null)return;const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>50)step(dx<0?1:-1);tx=null});
$('#lbx').onclick=()=>lb.close();lb.addEventListener('click',e=>{if(e.target===lb)lb.close()});

/* ---------- Le récit ---------- */
let R=null,rMarks=[],cur=0;const seen=new Set();
$('#steps').innerHTML=CHAP.map((c,i)=>`<button data-i="${i}" title="${esc(c.h)}">${i+1}. ${esc(c.era.split(' – ')[0].replace('Avant ','av. '))}</button>`).join('');
function chapter(i,fly=true){
 cur=Math.max(0,Math.min(CHAP.length-1,i));const c=CHAP[cur];seen.add(cur);
 if(location.hash!=='#recit-'+(cur+1))history.replaceState(null,'','#recit-'+(cur+1));
 document.querySelectorAll('#steps button').forEach((b,j)=>{b.toggleAttribute('aria-current',j===cur);if(j===cur)b.setAttribute('aria-current','step');b.classList.toggle('seen',seen.has(j));if(j===cur)b.scrollIntoView({inline:'center',block:'nearest'})});
 const pins=(c.pins||[]).map(id=>PL[id]);
 $('#ptext').innerHTML=`<p class="count">Étape ${cur+1} sur ${CHAP.length} · ${esc(c.era)}</p><h2>${esc(c.h)}</h2>${gloss(c.p).map(x=>`<p>${x}</p>`).join('')}
  ${c.look?`<div class="look"><b>À OBSERVER SUR LA CARTE</b>${esc(c.look)}</div>`:''}
  ${pins.length?`<div class="chips">${pins.map(l=>`<button class="chip" data-fly="${l.id}"><i style="background:${PER[l.per][1]}"></i>${esc(l.n)}</button>`).join('')}</div>`:''}
  ${srcLine(c.s)}${c.doc?`<figure><button data-zoom="img/${c.doc[0]}" data-cap="${esc(c.doc[1])}"><img src="img/${c.doc[0]}" alt="${esc(c.doc[1])}" loading="lazy"></button><figcaption>${esc(c.doc[1])} · touchez pour agrandir</figcaption></figure>`:''}`;
 $('#ptext').scrollTop=0;
 $('#prev').disabled=cur===0;$('#next').textContent=cur===CHAP.length-1?'Explorer la carte →':'Suivant →';
 if(!R)return;
 /* la carte se construit : lieux des étapes passées en petit, ceux de l’étape en grand */
 rMarks.forEach(m=>R.map.removeLayer(m));rMarks=[];
 for(const l of LIEUX){if(!l.ll||l.ch>cur)continue;const now=(c.pins||[]).includes(l.id);
  const m=L.marker(l.ll,{icon:pinIcon(l,!now),zIndexOffset:now?500:0,title:l.n}).bindPopup(popup(l),{maxWidth:260}).addTo(R.map);
  if(now&&pins.length<=4)m.bindTooltip(l.n,{permanent:true,direction:'right',offset:[8,0],className:'plbl'});
  rMarks.push(m)}
 R.set({base:c.base||'carte',doc:DOCS[c.doc2]?c.doc2:null,feu:c.doc2==='feu',t:70});
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
let lf='all',skyMaps=[];
$('#filters').innerHTML=`<button data-f="all" aria-pressed="true">Tous</button>${Object.entries(PER).map(([k,[n,c]])=>`<button data-f="${k}" aria-pressed="false"><i style="background:${c}"></i>${n}</button>`).join('')}<input type="search" id="q" placeholder="Chercher un lieu, une rue, une date…" aria-label="Chercher un lieu">`;
const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function renderGrid(){const q=norm($('#q').value||'');
 $('#grid').innerHTML=LIEUX.filter(l=>(lf==='all'||l.per===lf)&&norm(l.n+' '+l.t+' '+l.d).includes(q)).map(l=>`<article class="card" data-id="${l.id}">
  ${l.sky?`<div class="sky" data-sky="${l.id}"><span>Vue du ciel aujourd’hui</span></div>`:''}${l.img.length?`<div class="pics n${l.img.length}">${l.img.map(([f,y,c])=>`<button data-zoom="${src(f,1600)}" data-cap="${esc(l.n+' · '+y+' · '+c)}"><img src="${src(f,700)}" alt="${esc(l.n+', '+y)}" loading="lazy"><span>${esc(y)}</span></button>`).join('')}</div>`:''}
  <div class="cb"><p class="meta"><i style="background:${PER[l.per][1]}"></i>${esc(PER[l.per][0].toUpperCase())} · ${esc(l.d)}</p><h3>${esc(l.n)}</h3><p>${gloss([l.t])[0]}</p>${srcLine(l.s)}
  ${l.ll?`<div class="acts"><button class="go" data-go="${l.id}">Voir sur la carte →</button>${l.sv?`<a class="sv" href="${svUrl(l.sv)}" target="_blank" rel="noopener">Street View ↗</a>`:''}</div>`:'<p class="nomap">Emplacement non cartographié</p>'}</div></article>`).join('')||'<p>Aucun lieu ne correspond.</p>';
 skyMaps.forEach(m=>m.remove());skyMaps=[];if(window.L)document.querySelectorAll('[data-sky]').forEach(el=>{const l=PL[el.dataset.sky];const m=L.map(el,{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,touchZoom:false}).setView(l.ll,l.sky);L.tileLayer(BASES.satellite[1],{maxZoom:20,maxNativeZoom:19}).addTo(m);skyMaps.push(m)})}
$('#filters').onclick=e=>{const b=e.target.closest('[data-f]');if(!b)return;lf=b.dataset.f;document.querySelectorAll('#filters [data-f]').forEach(x=>x.setAttribute('aria-pressed',x===b));renderGrid()};
$('#q').addEventListener('input',renderGrid);
$('#grid').onclick=e=>{const b=e.target.closest('[data-go]');if(b)goPlace(b.dataset.go)};
renderGrid();$('#nLieux').textContent=`${LIEUX.length} lieux, avec leurs photos d’hier et d’aujourd’hui quand elles existent.`;

/* ---------- Sources ---------- */
function srcLine(ks){return ks&&ks.length?`<p class="srcs"><b>Sources :</b> ${[...new Set(ks)].map(k=>SRC[k]?(SRC[k][2]?`<a href="${SRC[k][2]}" target="_blank" rel="noopener" title="${esc(SRC[k][1])}">${esc(SRC[k][0])}</a>`:`<span title="${esc(SRC[k][1])}">${esc(SRC[k][0])}</span>`):'').join(' · ')}</p>`:''}
const REFS=Object.keys(SRC).filter(k=>SRC[k][2]).map(k=>[SRC[k][1],SRC[k][2]]);

$('#refs').innerHTML=REFS.map(([t,u])=>`<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('');
const CRED=[['hero-1881.jpg','Vue à vol d’oiseau de Trois-Rivières en 1881, P.-F. Pinsonneault, BAnQ (domaine public)'],['plan-1685.jpg','Plan de Trois-Rivières, 1685, via Wikimedia Commons (domaine public)'],['plan-1704.jpg','Plan de la ville, 1704, Jacques Levasseur de Néré, via Wikimedia Commons (domaine public)'],['plan-1720.jpg','Plan du Platon, 1720, Chaussegros de Léry, Bibliothèque et Archives Canada (domaine public)'],['plan-1760.jpg','Plan de la ville, 1760, via Wikimedia Commons (domaine public)'],['plan-1781.jpg','Trois-Rivières et le lac Saint-Pierre, 1781, J. F. W. Des Barres, BAnQ (domaine public)'],['plan-1815.jpg','La ville en 1815, dans Benjamin Sulte, Histoire des Canadiens-Français, 1882, British Library (domaine public)'],['plan-1861.jpg','Carte de l’Amirauté no 2830a, 1861, McGill Library (domaine public)'],['plan-1903.jpg','Plan d’assurance-incendie, Charles E. Goad, 1888 révisé en 1903, BAnQ (domaine public)'],['plan-incendie.jpg','Périmètre du feu de 1908 sur le plan Goad, Wikimedia Commons (domaine public)'],
 ...LIEUX.flatMap(l=>l.img.map(([f,y,c])=>[f,`${l.n}, ${y} : ${c}`])),['forges-2006.jpg','Rue des Forges, 2006 : Nicholas Wang, CC BY-SA 2.0']];
$('#credits').innerHTML=CRED.map(([f,t])=>`<li>${f.startsWith('c:')?`<a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.slice(2).replace(/ /g,'_'))}" target="_blank" rel="noopener">${esc(t)}</a>`:esc(t)}</li>`).join('')+'<li>Images de Wikimedia Commons affichées depuis Commons; cliquez sur un crédit pour voir la fiche, l’auteur et la licence.</li>';

/* ---------- Personnages ---------- */
const initials=n=>n.replace(/^Mgr /,'').split(/[ -]/).filter(w=>/^[A-ZÉ]/.test(w)).map(w=>w[0]).slice(0,2).join('');
$('#ggrid').innerHTML=GENS.map(g=>`<article class="card gcard"><div class="cb"><div class="mono" aria-hidden="true">${initials(g.n)}</div><p class="dates">${esc(g.v)}</p><h3>${esc(g.n)}</h3><p class="orig">${esc(g.o)}</p><p>${gloss([g.t])[0]}</p>${srcLine(g.s)}${g.p&&PL[g.p]&&PL[g.p].ll?`<button class="go" data-go="${g.p}">${esc(PL[g.p].n)} sur la carte →</button>`:''}</div></article>`).join('');

$('#ggrid').onclick=e=>{const b=e.target.closest('[data-go]');if(b)goPlace(b.dataset.go)};

/* ---------- Institutions et noms de lieux ---------- */
const goBtn=x=>x.p&&PL[x.p]&&PL[x.p].ll?`<button class="go" data-go="${x.p}">${esc(PL[x.p].n)} sur la carte →</button>`:(x.ll?`<button class="go" data-ll="${x.ll.join(',')}" data-n="${esc(x.n)}">Voir sur la carte →</button>`:'');
const tcard=x=>`<article class="card tcard"><div class="cb"><p class="when">${esc(x.d)}</p><h3>${esc(x.n)}</h3><p>${gloss([x.t])[0]}</p>${srcLine(x.s)}${goBtn(x)}</div></article>`;
$('#igrid').innerHTML=INST.map(tcard).join('');
function renderNoms(){const q=norm($('#qn').value||'');$('#ngrid').innerHTML=TOPO.filter(x=>norm(x.n+' '+x.d+' '+x.t).includes(q)).map(tcard).join('')||'<p>Aucun nom ne correspond.</p>'}
renderNoms();$('#qn').oninput=renderNoms;
let topoMark=null;
function goTopo(ll,n){location.hash='#carte';setTimeout(()=>{if(!C)return;if(topoMark)C.map.removeLayer(topoMark);
 topoMark=L.circleMarker(ll,{radius:10,color:'#fff',weight:3,fillColor:'#b5532b',fillOpacity:1}).addTo(C.map).bindPopup(`<b>${n}</b>`);
 C.map.flyTo(ll,16.5,{duration:.9});setTimeout(()=>topoMark.openPopup(),950);if(innerWidth<=900)scrollTo({top:0,behavior:'smooth'})},60)}
['#igrid','#ngrid'].forEach(g=>$(g).onclick=e=>{const b=e.target.closest('[data-go],[data-ll]');if(!b)return;if(b.dataset.go)goPlace(b.dataset.go);else goTopo(b.dataset.ll.split(',').map(Number),b.dataset.n)});

/* ---------- Parcours à pied ---------- */
const STOPS=PARCOURS.map(id=>PL[id]);
const hav=(a,b)=>{const r=Math.PI/180,x=Math.sin((b[0]-a[0])*r/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin((b[1]-a[1])*r/2)**2;return 12742000*Math.asin(Math.sqrt(x))};
const pLen=STOPS.reduce((t,l,i)=>i?t+hav(STOPS[i-1].ll,l.ll):0,0);
$('#pIntro').textContent=`${STOPS.length} arrêts dans l’arrondissement historique et le centre-ville, du lieu de l’ancienne église paroissiale jusqu’à la rue des Forges. Environ ${(Math.round(pLen*1.3/100)/10).toString().replace('.',',')} km de marche; comptez une heure et demie à deux heures avec les arrêts. Chaque arrêt ouvre l’itinéraire à pied depuis votre position.`;
const firstSent=t=>{const m=t.match(/^.+?[.!?](\s|$)/);return m?m[0].trim():t};
$('#stops').innerHTML=STOPS.map((l,i)=>`<li data-i="${i}"><button class="num" data-i="${i}" aria-label="Arrêt ${i+1} sur la carte">${i+1}</button><b data-i="${i}">${esc(l.n)}</b><small>${esc(l.d)}</small><p>${esc(firstSent(l.t))}</p><div class="lk"><button data-fiche="${l.id}">Fiche du lieu</button><a href="https://www.google.com/maps/dir/?api=1&destination=${l.ll[0]},${l.ll[1]}&travelmode=walking" target="_blank" rel="noopener">Itinéraire à pied ↗</a>${l.sv?`<a href="${svUrl(l.sv)}" target="_blank" rel="noopener">Street View ↗</a>`:''}</div></li>`).join('');
let P=null;const pMarks=[];
function pSel(i){if(!P)return;document.querySelectorAll('#stops li').forEach(li=>li.classList.toggle('on',+li.dataset.i===i));P.flyTo(STOPS[i].ll,18,{duration:.7});pMarks[i].openPopup();if(innerWidth<=900)scrollTo({top:0,behavior:'smooth'})}
function parcoursMap(){if(P){P.invalidateSize();return}
 setTimeout(()=>{P.invalidateSize();P.fitBounds(L.latLngBounds(STOPS.map(l=>l.ll)),{padding:[24,24]})},250);
 P=L.map('mapP',{zoomControl:true}).setView([46.3436,-72.5395],16);
 L.tileLayer(BASES.carte[1],{maxZoom:20,maxNativeZoom:19,attribution:BASES.carte[3]}).addTo(P);
 L.polyline(STOPS.map(l=>l.ll),{color:'#b5532b',weight:4,opacity:.75,dashArray:'2 9',lineCap:'round'}).addTo(P);
 STOPS.forEach((l,i)=>{pMarks[i]=L.marker(l.ll,{icon:L.divIcon({className:'pnum',html:String(i+1),iconSize:[26,26]}),title:l.n}).addTo(P).bindPopup(`<small>Arrêt ${i+1}</small><b>${esc(l.n)}</b>${esc(firstSent(l.t))}`,{maxWidth:240});pMarks[i].on('click',()=>{document.querySelectorAll('#stops li').forEach(li=>li.classList.toggle('on',+li.dataset.i===i));const li=document.querySelector(`#stops li[data-i="${i}"]`);if(innerWidth>900)li.scrollIntoView({block:'nearest',behavior:'smooth'})})});
 P.fitBounds(L.latLngBounds(STOPS.map(l=>l.ll)),{padding:[30,30]})}
$('#stops').onclick=e=>{const f=e.target.closest('[data-fiche]');if(f){openFiche(f.dataset.fiche);return}const b=e.target.closest('[data-i]');if(b&&!e.target.closest('a'))pSel(+b.dataset.i)};
let meMark=null;
$('#loc').onclick=()=>{if(!navigator.geolocation){$('#loc').textContent='Géolocalisation non disponible';return}
 $('#loc').textContent='Recherche de votre position…';
 navigator.geolocation.getCurrentPosition(p=>{const ll=[p.coords.latitude,p.coords.longitude];if(meMark)P.removeLayer(meMark);meMark=L.marker(ll,{icon:L.divIcon({className:'me',iconSize:[16,16]}),title:'Vous êtes ici'}).addTo(P);
  const d=hav(ll,STOPS[0].ll);$('#loc').textContent='Me situer sur la carte';if(d<5000)P.flyTo(ll,17);else P.fitBounds(L.latLngBounds([ll,...STOPS.map(l=>l.ll)]),{padding:[30,30]})},
  ()=>{$('#loc').textContent='Position refusée ou indisponible'},{enableHighAccuracy:true,timeout:10000})};
function openFiche(id){lf='all';$('#q').value='';document.querySelectorAll('#filters [data-f]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f==='all'));renderGrid();location.hash='#lieux';setTimeout(()=>{const el=document.querySelector(`#grid [data-id="${id}"]`);if(el){el.scrollIntoView({behavior:'smooth',block:'start'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1600)}},120)}

/* ---------- Navigation : une vue à la fois, l’onglet actif indique où l’on est ---------- */
function route(){const h=location.hash.slice(1)||'accueil';const [v,n]=h.split('-');const SUBS=['gens','institutions','noms'];const sub=SUBS.includes(v)?v:null;const view=sub?'gens':['accueil','recit','carte','lieux','parcours','sources'].includes(v)?v:'accueil';
 if(sub){document.querySelectorAll('.subp').forEach(d=>d.classList.toggle('on',d.id==='s-'+sub));document.querySelectorAll('.subtabs a').forEach(x=>x.toggleAttribute('aria-current',x.dataset.sub===sub))}
 document.querySelectorAll('.view').forEach(s=>s.classList.toggle('on',s.id==='v-'+view));
 document.querySelectorAll('nav.tabs a').forEach(a=>a.toggleAttribute('aria-current',a.getAttribute('href')==='#'+view)||0);
 document.querySelectorAll('nav.tabs a').forEach(a=>{if(a.getAttribute('href')==='#'+view)a.setAttribute('aria-current','page')});
 if(view==='recit'){if(!R){R=MapView($('#mbR'),'mapR')}R.map.invalidateSize();chapter(n?(+n-1):cur,false)}
 if(view==='lieux')skyMaps.forEach(m=>m.invalidateSize());
 if(view==='parcours'&&window.L)setTimeout(parcoursMap,0);
 if(view==='carte'){if(!C){C=MapView($('#mbC'),'mapC');C.set({doc:'goad'});C.map.setView(DOCS.goad.view.slice(0,2),DOCS.goad.view[2]);
   for(const l of LIEUX)if(l.ll)cMarks[l.id]=L.marker(l.ll,{icon:pinIcon(l,false),title:l.n}).bindPopup(popup(l),{maxWidth:260});syncMarks()}
  C.map.invalidateSize()}
 if(view!=='recit'||!n)scrollTo(0,0)}
addEventListener('hashchange',route);route();
}
