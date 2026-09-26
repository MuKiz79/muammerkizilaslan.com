/* Local geographic atlas. No external map service or visitor coordinates. */
(()=>{'use strict';
const canvas=document.getElementById('career-atlas'),ctx=canvas.getContext('2d');
const {career,locations}=window.ExperienceData,land=window.WorldLand;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],reduce=matchMedia('(prefers-reduced-motion: reduce)');
const readout=$('.atlas-readout'),select=$('#atlas-station');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const views={world:{lon:5,lat:16,zoom:1},europe:{lon:15,lat:48,zoom:7},germany:{lon:9.2,lat:49.5,zoom:23}};
let camera={...views.world},target={...camera},selected=null,selectedIndex=-1,visible=false,dirty=true,width=0,height=0,pressed=null,gesture=null,arrivalAge=0,arrived=false;
const pointers=new Map();let screenPins=[];
function setTarget(next){target={lon:clamp(next.lon,-175,175),lat:clamp(next.lat,-65,75),zoom:clamp(next.zoom,1,40)};dirty=true}
function setView(view){if(!views[view])return;arrived=true;setTarget(views[view]);$$('[data-map-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapView===view)))}
function customView(){ $$('[data-map-view]').forEach(b=>b.setAttribute('aria-pressed','false')) }
function focusPlace(key){const p=locations[key];setTarget({lon:p.lon+(innerWidth>700?2:0),lat:p.lat,zoom:key==='istanbul'||key==='milan'?10:23});customView()}
function paintReadout(index){
 const station=career[index];selectedIndex=index;select.value=String(index);
 readout.querySelector('.atlas-years').textContent=station.years;
 readout.querySelector('h3').textContent=station.role;
 readout.querySelector('.atlas-company').textContent=station.company;
 readout.querySelector('.atlas-focus').textContent=station.focus;
 updateStoryNav();
 readout.querySelectorAll('[data-station]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.station)===index)));
 dirty=true;window.ProfileNavigation?.refresh();
}
function choosePlace(key,index){
 if(!locations[key])return;arrived=true;selected=key;
 $$('[data-location]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.location===key)));
 readout.querySelector('.atlas-place').textContent=locations[key].name;
 const choices=career.map((s,i)=>({s,i})).filter(item=>item.s.point===key),list=readout.querySelector('.atlas-city-roles');
 list.replaceChildren(...choices.map(({s,i})=>{const b=document.createElement('button');b.type='button';b.dataset.station=i;b.textContent=s.years+' · '+s.company;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>paintReadout(i));return b}));
 if(choices.length)paintReadout(index!==undefined?index:choices[0].i); // a place opens on its earliest role — the founder reads his path chronologically; the other roles stay selectable
 else{selectedIndex=-1;select.value='';const n=locations[key].note;readout.querySelector('.atlas-years').textContent=n?n.label:'Deutschland';readout.querySelector('h3').textContent=n?n.title:'Ein Ort meines beruflichen Weges.';readout.querySelector('.atlas-company').textContent='';readout.querySelector('.atlas-focus').textContent=n?n.focus:'';}
 focusPlace(key);updateStoryNav();window.ProfileNavigation?.refresh();
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
function project(lon,lat){const s=scale();return{x:width/2+(lon-camera.lon)*s,y:height/2-(lat-camera.lat)*s}}
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
 const s=scale();
 ctx.strokeStyle='rgba(103,123,109,.13)';ctx.lineWidth=.6;
 const grid=camera.zoom>14?2:camera.zoom>3?10:30;
 for(let lon=-180;lon<=180;lon+=grid){const p=project(lon,0);ctx.beginPath();ctx.moveTo(p.x,0);ctx.lineTo(p.x,height);ctx.stroke()}
 for(let lat=-80;lat<=80;lat+=grid){const p=project(0,lat);ctx.beginPath();ctx.moveTo(0,p.y);ctx.lineTo(width,p.y);ctx.stroke()}
 ctx.fillStyle='#cbd5cf';ctx.strokeStyle='#9aaca2';ctx.lineWidth=.55;
 ctx.beginPath();for(const ring of land){for(let i=0;i<ring.length;i++){const p=project(ring[i][0],ring[i][1]);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}ctx.closePath()}ctx.fill('evenodd');ctx.stroke();
 if(camera.zoom>2){
  ctx.beginPath();for(const ring of window.WorldBorders){for(let i=0;i<ring.length;i++){const p=project(ring[i][0],ring[i][1]);if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}ctx.closePath()}ctx.strokeStyle='rgba(113,134,104,.38)';ctx.lineWidth=.65;ctx.stroke();
  ctx.font='9px "Space Grotesk",sans-serif';ctx.fillStyle='rgba(47,78,73,.70)';ctx.textAlign='center';
  for(const [name,lon,lat] of [['DEUTSCHLAND',10.5,51.2],['FRANKREICH',2,47],['ITALIEN',12.8,43],['TÜRKEI',34,39],['POLEN',19.2,52],['ÖSTERREICH',14,47.6],['SCHWEIZ',8.2,46.7],['NIEDERLANDE',5.5,52.5],['BELGIEN',4.6,50.5],['TSCHECHIEN',15.5,49.9],['SPANIEN',-3.8,40.5],['GRIECHENLAND',23,39]]){const p=project(lon,lat);if(p.x>20&&p.x<width-20&&p.y>85&&p.y<height-30)ctx.fillText(name,p.x,p.y)}ctx.textAlign='left';
 }
 // Geographic links join documented dated stations only.
 for(let i=1;i<career.length;i++){
  const from=locations[career[i-1].point],to=locations[career[i].point];if(!from||!to||career[i-1].point===career[i].point)continue;
  const a=project(from.lon,from.lat),b=project(to.lon,to.lat),active=i===selectedIndex;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-Math.min(130,Math.hypot(a.x-b.x,a.y-b.y)*.3),b.x,b.y);ctx.strokeStyle=active?'rgba(180,65,45,.85)':'rgba(40,92,99,.38)';ctx.lineWidth=active?1.5:.85;ctx.setLineDash(career[i].years.includes('parallel')?[3,4]:[]);ctx.stroke();ctx.setLineDash([]);
 }
 screenPins=[];
 for(const [key,p] of Object.entries(locations)){
  const q=project(p.lon,p.lat);if(q.x<-20||q.x>width+20||q.y<-20||q.y>height+20)continue;screenPins.push({...q,key});const active=key===selected;
  ctx.beginPath();ctx.arc(q.x,q.y,active?9:5,0,Math.PI*2);ctx.fillStyle=active?'rgba(188,72,48,.10)':'rgba(241,244,235,.7)';ctx.fill();ctx.beginPath();ctx.arc(q.x,q.y,active?3.6:2.5,0,Math.PI*2);ctx.fillStyle=active?'#b3422c':'#285c63';ctx.fill();
  if(active){const text=p.name.toUpperCase();ctx.font='10px "Space Grotesk",sans-serif';const tw=ctx.measureText(text).width;const left=q.x>width-130?q.x-tw-20:q.x+17;ctx.fillStyle='#eff2e9';ctx.fillRect(left-6,q.y-23,tw+12,21);ctx.fillStyle='#793d2c';ctx.fillText(text,left,q.y-9);ctx.strokeStyle='#b3422c';ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(left+(left<q.x?tw:0),q.y-8);ctx.stroke()}
 }
 if(!selected&&camera.zoom<3){const q=project(14,49);ctx.fillStyle='#4e6652';ctx.font='10px "Space Grotesk",sans-serif';ctx.fillText('MEINE STATIONEN',q.x+18,q.y-22);ctx.strokeStyle='#70856a';ctx.beginPath();ctx.moveTo(q.x+14,q.y-18);ctx.lineTo(q.x+4,q.y-4);ctx.stroke()}
 $('.atlas-coordinate').textContent=camera.zoom<2?'WELTANSICHT':Math.abs(camera.lat).toFixed(1)+'° '+(camera.lat>=0?'N':'S')+' / '+Math.abs(camera.lon).toFixed(1)+'° '+(camera.lon>=0?'O':'W');
 $('#atlas-zoom-out').disabled=target.zoom<=1;$('#atlas-zoom-in').disabled=target.zoom>=40;
}
function tick(dt){
 if(!visible||document.hidden)return;
 if(!arrived){arrivalAge+=dt;if(arrivalAge>1.4||reduce.matches){arrived=true;setView('europe');}}
 const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
 if(w!==width||h!==height){width=w;height=h;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);dirty=true}
 const diff=Math.abs(camera.lon-target.lon)+Math.abs(camera.lat-target.lat)+Math.abs(camera.zoom-target.zoom);
 if(diff<.001&&!dirty)return;
 const a=reduce.matches?1:1-Math.exp(-dt/.28);for(const key of ['lon','lat','zoom'])camera[key]+=(target[key]-camera[key])*a;
 if(diff<.005)camera={...target};draw();dirty=false;
}
window.CareerAtlas={tick};
})();
