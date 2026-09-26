/* Local geographic atlas. No external map service or visitor coordinates. */
(()=>{'use strict';
const canvas=document.getElementById('career-atlas'),ctx=canvas.getContext('2d');
const {career,locations}=window.ExperienceData,land=window.WorldLand;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],reduce=matchMedia('(prefers-reduced-motion: reduce)');
const readout=$('.atlas-readout'),select=$('#atlas-station'),geo=window.AtlasGeometry;
let phase=0,drawAge=0;
const dotTile=document.createElement('canvas');dotTile.width=dotTile.height=8;const dotContext=dotTile.getContext('2d');dotContext.fillStyle='#d4e3d233';dotContext.beginPath();dotContext.arc(2,2,.65,0,Math.PI*2);dotContext.fill();const landPattern=ctx.createPattern(dotTile,'repeat');
$('.atlas-map-meta').textContent=String(Object.keys(locations).length).padStart(2,'0')+' ORTE · '+String(career.length).padStart(2,'0')+' STATIONEN';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const views={world:{lon:5,lat:16,zoom:1},europe:{lon:15,lat:48,zoom:7},germany:{lon:9.2,lat:49.5,zoom:23}};
let camera={...views.world},target={...camera},selected=null,selectedIndex=-1,visible=false,dirty=true,width=0,height=0,pressed=null,gesture=null,arrivalAge=0,arrived=false;
const pointers=new Map();let screenPins=[];
function setTarget(next){target={lon:clamp(next.lon,-175,175),lat:clamp(next.lat,-65,75),zoom:clamp(next.zoom,1,40)};dirty=true}
function setView(view){if(!views[view])return;arrived=true;setTarget(views[view]);$$('[data-map-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapView===view)))}
function customView(){ $$('[data-map-view]').forEach(b=>b.setAttribute('aria-pressed','false')) }
function focusPlace(key,index){const points=[locations[key]];if(index>0&&career[index-1].point!==key)points.unshift(locations[career[index-1].point]);setTarget(geo.frame(points,canvas.clientWidth,canvas.clientHeight));customView()}
function paintReadout(index){
 const station=career[index];selectedIndex=index;select.value=String(index);phase=0;
 readout.querySelector('.atlas-years').textContent=station.years;
 readout.querySelector('h3').textContent=station.role;
 readout.querySelector('.atlas-company').textContent=station.company;
 readout.querySelector('.atlas-focus').textContent=station.focus;
 updateStoryNav();
 readout.querySelectorAll('[data-station]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.station)===index)));
 dirty=true;window.ProfileNavigation?.refresh();
}
function choosePlace(key,index){
 if(!locations[key])return;arrived=true;selected=key;readout.dataset.place=key;
 $$('[data-location]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.location===key)));
 readout.querySelector('.atlas-place').textContent=locations[key].name;
 const choices=career.map((s,i)=>({s,i})).filter(item=>item.s.point===key),list=readout.querySelector('.atlas-city-roles');
 list.hidden=choices.length<2;list.replaceChildren(...choices.map(({s,i})=>{const b=document.createElement('button');b.type='button';b.dataset.station=i;b.textContent=s.years+' · '+s.company;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{paintReadout(i);focusPlace(key,i)});return b}));
 if(choices.length)paintReadout(index!==undefined?index:choices[0].i); // a place opens on its earliest role — the founder reads his path chronologically; the other roles stay selectable
 else{selectedIndex=-1;select.value='';const n=locations[key].note;readout.querySelector('.atlas-years').textContent=n?n.label:'Deutschland';readout.querySelector('h3').textContent=n?n.title:'Ein Ort meines beruflichen Weges.';readout.querySelector('.atlas-company').textContent='';readout.querySelector('.atlas-focus').textContent=n?n.focus:'';}
 focusPlace(key,index);updateStoryNav();window.ProfileNavigation?.refresh();
}
function updateStoryNav(){
 $('#atlas-prev').disabled=selectedIndex<=0;
 $('#atlas-progress').textContent=selectedIndex<0?'MEIN WEG':String(selectedIndex+1).padStart(2,'0')+' / '+String(career.length).padStart(2,'0');
 $('#atlas-next').textContent=selectedIndex<0?'Weg beginnen':selectedIndex===career.length-1?'Zum Anfang':'Nächste Station';
}
function stepStation(delta){const i=selectedIndex<0?0:delta>0?(selectedIndex+1)%career.length:Math.max(0,selectedIndex-1);choosePlace(career[i].point,i)}
$('#atlas-prev').addEventListener('click',()=>stepStation(-1));$('#atlas-next').addEventListener('click',()=>stepStation(1));updateStoryNav();
for(const [key,p] of Object.entries(locations)){const b=document.createElement('button');b.type='button';b.dataset.location=key;b.setAttribute('aria-pressed','false');b.textContent=p.name;b.addEventListener('click',()=>choosePlace(key));$('.atlas-locations').append(b)}
career.forEach((s,i)=>{const option=document.createElement('option');option.value=i;option.textContent=s.years+' · '+s.city+' · '+s.role;select.append(option)});
select.addEventListener('change',()=>{if(select.value==='')return;const i=Number(select.value);choosePlace(career[i].point,i)});
$$('[data-map-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.mapView)));
function zoom(factor){setTarget({...target,zoom:target.zoom*factor});customView()}
$('#atlas-zoom-in').addEventListener('click',()=>zoom(1.6));$('#atlas-zoom-out').addEventListener('click',()=>zoom(1/1.6));
function scale(){return width/375*camera.zoom}
function project(lon,lat){return geo.project({lon,lat},camera,width,height)}
function gestureState(){const values=[...pointers.values()];return values.length>1?{x:(values[0].x+values[1].x)/2,y:(values[0].y+values[1].y)/2,d:Math.hypot(values[0].x-values[1].x,values[0].y-values[1].y)}:{...values[0],d:0}}
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;arrived=true;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});gesture=gestureState();pressed=pointers.size===1?{x:e.clientX,y:e.clientY,moved:false}:null;target={...camera};canvas.classList.add('is-dragging')});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=gestureState(),s=scale();if(pressed&&Math.hypot(e.clientX-pressed.x,e.clientY-pressed.y)>5)pressed.moved=true;setTarget({lon:camera.lon-(next.x-gesture.x)/s,lat:camera.lat+(next.y-gesture.y)/s,zoom:gesture.d>0&&next.d>0?camera.zoom*next.d/gesture.d:camera.zoom});camera={...target};gesture=next;customView()});
function release(e){
 if(!pointers.has(e.pointerId))return;
 const hit=e.type==='pointerup'&&pressed&&!pressed.moved&&pointers.size===1;
 pointers.delete(e.pointerId);if(pointers.size)gesture=gestureState();else{gesture=null;canvas.classList.remove('is-dragging')}
 if(hit){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,nearest=screenPins.map(p=>({...p,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];if(nearest?.d<24){if(camera.zoom<4)setView('europe');else choosePlace(nearest.key)}}
 pressed=null;
}
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
canvas.addEventListener('keydown',e=>{const step=35/scale();let next={...target};if(e.key==='ArrowLeft')next.lon-=step;else if(e.key==='ArrowRight')next.lon+=step;else if(e.key==='ArrowUp')next.lat+=step;else if(e.key==='ArrowDown')next.lat-=step;else if(e.key==='+'||e.key==='=')next.zoom*=1.5;else if(e.key==='-')next.zoom/=1.5;else if(e.key==='0'){e.preventDefault();setView('world');return}else return;e.preventDefault();setTarget(next);customView()});
new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)dirty=true}).observe(canvas);
new ResizeObserver(()=>dirty=true).observe(canvas);reduce.addEventListener('change',()=>dirty=true);
function draw(){
 ctx.clearRect(0,0,width,height);
 const glow=ctx.createRadialGradient(width*.55,height*.48,0,width*.55,height*.48,width*.72);
 glow.addColorStop(0,'#254a50');glow.addColorStop(1,'#132d34');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
 ctx.strokeStyle='rgba(173,202,197,.09)';ctx.lineWidth=.6;
 const grid=camera.zoom>14?2:camera.zoom>3?10:30;
 for(let lon=-180;lon<=180;lon+=grid){const p=project(lon,0);ctx.beginPath();ctx.moveTo(p.x,0);ctx.lineTo(p.x,height);ctx.stroke()}
 for(let lat=-80;lat<=80;lat+=grid){const p=project(0,lat);ctx.beginPath();ctx.moveTo(0,p.y);ctx.lineTo(width,p.y);ctx.stroke()}
 ctx.beginPath();for(const ring of land){for(let i=0;i<ring.length;i++){const p=project(ring[i][0],ring[i][1]);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}ctx.closePath()}
 ctx.fillStyle='#416167';ctx.fill('evenodd');ctx.fillStyle=landPattern;ctx.fill('evenodd');ctx.strokeStyle='#9bb5ad80';ctx.lineWidth=.65;ctx.stroke();
 if(camera.zoom>2){ctx.beginPath();for(const ring of window.WorldBorders){for(let i=0;i<ring.length;i++){const p=project(ring[i][0],ring[i][1]);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}ctx.closePath()}ctx.strokeStyle='#b8c9b52e';ctx.lineWidth=.65;ctx.stroke()}
 // The threads connect documented successive stations, not invented travel routes.
 const routes=[];
 for(let i=1;i<career.length;i++){
  const from=locations[career[i-1].point],to=locations[career[i].point];if(career[i-1].point===career[i].point)continue;
  const route=geo.curve(project(from.lon,from.lat),project(to.lon,to.lat));routes.push({route,index:i});
  ctx.beginPath();ctx.moveTo(route.a.x,route.a.y);ctx.quadraticCurveTo(route.c.x,route.c.y,route.b.x,route.b.y);
  const active=i===selectedIndex;ctx.strokeStyle=active?'#edca84':'#d4bc805e';ctx.lineWidth=active?2:1;
  ctx.setLineDash(career[i].years.includes('parallel')?[4,5]:[]);ctx.stroke();ctx.setLineDash([]);
 }
 const pulse=selectedIndex<0?routes[Math.floor(phase/6)%routes.length]:routes.find(r=>r.index===selectedIndex);
 if(pulse&&!reduce.matches&&!pointers.size){
  const t=(phase%6)/4.6;
  if(t<=1){const q=geo.pointOn(pulse.route,t);const halo=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,15);halo.addColorStop(0,'#ffe5a0aa');halo.addColorStop(1,'#ffe5a000');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(q.x,q.y,15,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff1c5';ctx.beginPath();ctx.arc(q.x,q.y,2.5,0,Math.PI*2);ctx.fill()}
 }
 screenPins=[];
 for(const [key,p] of Object.entries(locations)){
  const q=project(p.lon,p.lat);if(q.x<-20||q.x>width+20||q.y<-20||q.y>height+20)continue;screenPins.push({...q,key});const active=key===selected;
  ctx.beginPath();ctx.arc(q.x,q.y,active?17:9,0,Math.PI*2);ctx.fillStyle=active?'#edbd7130':'#142b3470';ctx.fill();
  ctx.beginPath();ctx.arc(q.x,q.y,active?9:5,0,Math.PI*2);ctx.strokeStyle=active?'#efcf8d':'#efe2bc99';ctx.lineWidth=1;ctx.stroke();
  ctx.beginPath();ctx.arc(q.x,q.y,active?4:2.8,0,Math.PI*2);ctx.fillStyle=active?'#efcf8d':'#f1e5c4';ctx.fill();
 }
 const occupied=screenPins.map(p=>({x:p.x-7,y:p.y-7,w:14,h:14}));
 const priorities=[selected,'istanbul','milan','munich','cologne','dusseldorf','schiltach','stuttgart','karlsruhe'];
 const order=[...new Set(priorities)].filter(Boolean);
 if(camera.zoom>=3){
  for(const key of order){const pin=screenPins.find(p=>p.key===key);if(!pin)continue;const active=key===selected;
   ctx.font=(active?'500 ':'400 ')+(width<420?(active?15:13):(active?17:14))+'px "Space Grotesk",sans-serif';
   const name=locations[key].name,box=geo.label(pin,ctx.measureText(name).width,width,height,occupied);if(!box)continue;occupied.push(box);
   ctx.beginPath();ctx.moveTo(pin.x,pin.y);ctx.lineTo(clamp(pin.x,box.x,box.x+box.w),clamp(pin.y,box.y,box.y+box.h));ctx.strokeStyle=active?'#edca84':'#cbd7c176';ctx.lineWidth=.7;ctx.stroke();
   ctx.fillStyle=active?'#eed4a1':'#18353bea';ctx.fillRect(box.x,box.y,box.w,box.h);ctx.fillStyle=active?'#213a3d':'#f0ebdb';ctx.fillText(name,box.x+9,box.y+18);
  }
 }else{const q=project(14,49);ctx.fillStyle='#efe2bc';ctx.font='13px "Space Grotesk",sans-serif';ctx.fillText('Meine Stationen',clamp(q.x+16,12,width-130),clamp(q.y-16,108,height-48))}
 $('.atlas-coordinate').textContent=Math.abs(camera.lat).toFixed(1)+'° '+(camera.lat>=0?'N':'S')+' / '+Math.abs(camera.lon).toFixed(1)+'° '+(camera.lon>=0?'O':'W');
 $('#atlas-zoom-out').disabled=target.zoom<=1;$('#atlas-zoom-in').disabled=target.zoom>=40;
}
function tick(dt){
 if(!visible||document.hidden||!$('#menu').hidden||document.querySelector('dialog[open]'))return;
 dt=Math.min(dt,.1);phase+=reduce.matches?0:dt;drawAge+=dt;
 if(!arrived){arrivalAge+=dt;if(arrivalAge>2.8||reduce.matches){arrived=true;setView('europe');}}
 const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
 if(w!==width||h!==height){width=w;height=h;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);dirty=true}
 const diff=Math.abs(camera.lon-target.lon)+Math.abs(camera.lat-target.lat)+Math.abs(camera.zoom-target.zoom);
 if(diff<.001&&!dirty&&(reduce.matches||drawAge<1/30))return;
 const a=reduce.matches?1:1-Math.exp(-dt/.28);for(const key of ['lon','lat','zoom'])camera[key]+=(target[key]-camera[key])*a;
 if(diff<.005)camera={...target};draw();dirty=false;drawAge=0;
}
window.CareerAtlas={tick};
})();
