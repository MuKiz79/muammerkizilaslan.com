(()=>{'use strict';
history.scrollRestoration='manual';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const hero=$('.hero'),canvas=$('#network'),ctx=canvas.getContext('2d'),grain=$('#grain'),gc=grain.getContext('2d'),field=$('#topics'),motion=$('#motion'),reduce=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:700px)');
let width=0,height=0,dpr=1,clock=0,last=0,paused=reduce.matches,visible=true,dragX=0,dragY=0,targetXRotation=0,targetYRotation=0,fieldTop=80,hoveredTopic=-1,needsDraw=true,chapterProgress=0,modalOpen=false,chapterRunway=1,heroStylesDirty=true;
const bridge=$('.hero-bridge'),heroScroll=$('.hero-scroll');
const topics=window.MUAMMER_TOPICS,FX=window.HeroEffects,Space=window.KineticSpace,legend=$('.hero-legend'),selection=$('.hero-selection');
const neural=window.NeuralSpace.create(),autopilot=window.OrbitMotion.create(),Flow=window.ThoughtFlow;
const neuralCaption=$('.neural-caption');
const topicEdges=[...new Map(FX.links.map((neighbors,i)=>{const edge=[i,neighbors[0]].sort((a,b)=>a-b);return[edge.join(':'),edge]})).values()];
// The signature intro now provides the opening; hover captions stay available.
let welcomeAllowed=false,openingTime=-1,openingSeconds=-1;
window.addEventListener('signatureintro:start',()=>{openingTime=0;openingSeconds=0;chapterProgress=0;heroStylesDirty=true;needsDraw=true});
window.addEventListener('signatureintro:end',()=>{openingTime=-1;openingSeconds=-1;needsDraw=true});
function stopWelcome(){if(welcomeAllowed){welcomeAllowed=false;needsDraw=true}}
let automaticAngles={yaw:0,pitch:0};
let effectClock=0,selectedTouch=-1,lastTopicPointer='mouse',relationStrength=0,relationOrigin=-1,relationRoute=[];
const topicSelection=FX.createTopicSelection(i=>{selectedTouch=i;hoveredTopic=i;selection.hidden=false;legend.hidden=true;$('#topic-preview-open').textContent=topics[i][0]+' entdecken';needsDraw=true},i=>openTopic(i),()=>{selectedTouch=-1;hoveredTopic=-1;selection.hidden=true;legend.hidden=false;needsDraw=true});
function clearSelection(){topicSelection.clear()}
function activateTopic(i,event){topicSelection.activate(i,lastTopicPointer,event.detail)}
const points=topics.map((t,i)=>{const b=document.createElement('button');b.className='topic '+t[2];b.textContent=t[0];b.setAttribute('aria-label',t[0]+' entdecken');field.append(b);b.addEventListener('pointerdown',e=>lastTopicPointer=e.pointerType);b.addEventListener('click',e=>activateTopic(i,e));b.addEventListener('pointerenter',()=>{stopWelcome();hoveredTopic=i;needsDraw=true});b.addEventListener('pointerleave',()=>{if(hoveredTopic===i&&selectedTouch!==i)hoveredTopic=-1;needsDraw=true});b.addEventListener('focus',()=>{stopWelcome();hoveredTopic=i;needsDraw=true});b.addEventListener('blur',()=>{if(selectedTouch!==i)hoveredTopic=-1;needsDraw=true});return{b,t,i,x:(t[3]-.5)*2,y:(t[4]-.5)*2,z:t[2]==='primary'?.55:t[2]==='secondary'?-.15:-.65,bw:0,bh:0,alpha:0,focus:0,relation:0,angleX:0,angleY:0,lastX:null,lastY:null,bendX:0,bendY:0,rank:t[2]==='primary'?3:t[2]==='secondary'?2:1}});
const noiseTile=document.createElement('canvas');noiseTile.width=noiseTile.height=128;
const noiseContext=noiseTile.getContext('2d'),noiseImage=noiseContext.createImageData(128,128);
for(let i=0;i<noiseImage.data.length;i+=4){const v=Math.random()*255;noiseImage.data[i]=noiseImage.data[i+1]=noiseImage.data[i+2]=v;noiseImage.data[i+3]=105}
noiseContext.putImageData(noiseImage,0,0);
function size(){
  fieldTop=field.offsetTop;
  const nextWidth=hero.clientWidth,nextHeight=hero.clientHeight,nextDpr=Math.min(devicePixelRatio||1,2);
  if(width!==nextWidth||height!==nextHeight||dpr!==nextDpr){
    width=nextWidth;height=nextHeight;dpr=nextDpr;
    canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    grain.width=Math.ceil(width*dpr);grain.height=Math.ceil(height*dpr);
    gc.fillStyle=gc.createPattern(noiseTile,'repeat');gc.fillRect(0,0,grain.width,grain.height);
  }
  legend.style.bottom=(height-$('.hero-bottom').offsetTop+12)+'px';
  for(const p of points){p.bw=p.b.offsetWidth;p.bh=p.b.offsetHeight;p.lastX=p.lastY=null}
  chapterRunway=Math.max(1,heroScroll.offsetHeight-height);resizeJourney();needsDraw=true;
}
const follow=(current,target,dt,tau)=>target+(current-target)*Math.exp(-dt/tau);
const softplus=x=>Math.max(0,x)+Math.log1p(Math.exp(-Math.abs(x)));
const softClamp=(value,min,max,softness=16)=>min+softness*(softplus((value-min)/softness)-softplus((value-max)/softness));
function draw(dt){
  let unsettled=false;ctx.clearRect(0,0,width,height);
  const small=mobile.matches,cluster=FX.smooth(.02,.38,chapterProgress),morph=FX.smooth(.43,.96,chapterProgress);
  const framing=Space.frame(width,height,small),spaceY=framing.cy,cx=framing.cx,cy=spaceY+(height*.77-spaceY)*morph;
  const spread=reduce.matches?1:1-Math.pow(1-Math.min(effectClock/2.1,1),3);
  const rotY=dragX+automaticAngles.yaw,rotX=dragY+automaticAngles.pitch;
  const greeting=welcomeAllowed?Flow.welcome(effectClock):null;
  const userFocus=orbit.dragging||chapterProgress>.04?-1:hoveredTopic;
  const themeTopics=window.Experience?.focusTopics||[];
  const focusIndex=userFocus>=0?userFocus:greeting?greeting.topic:themeTopics[0]??-1;
  const storyRoute=userFocus<0&&themeTopics.length?themeTopics:focusIndex>=0?Flow.route(focusIndex,FX.links):[];
  const captionVisible=chapterProgress<.03&&selectedTouch<0&&(!!greeting||userFocus>=0);
  neuralCaption.hidden=!captionVisible;
  if(captionVisible){neuralCaption.querySelector('span').textContent=greeting?'VERBINDUNGEN SCHAFFEN':'ZUSAMMENHÄNGE';neuralCaption.querySelector('p').textContent=greeting?greeting.label:storyRoute.map(i=>topics[i][0]).join(' · ');neuralCaption.style.opacity=String(greeting?greeting.opacity:1)}
  legend.hidden=captionVisible||selectedTouch>=0;
  if(focusIndex>=0){relationOrigin=focusIndex;relationRoute=storyRoute}
  const related=storyRoute.slice(1);
  relationStrength=reduce.matches?(focusIndex>=0?1:0):follow(relationStrength,focusIndex>=0?1:0,dt,.16);
  unsettled ||= Math.abs(relationStrength-(focusIndex>=0?1:0))>.001;
  unsettled=neural.draw(ctx,{width,height,small,dt,time:effectClock,shapeTime:clock,yaw:rotY,pitch:rotX,progress:chapterProgress,focusTopic:focusIndex,welcomeTime:greeting?effectClock:-1,focusGroup:focusIndex>=0?topics[focusIndex][1]:-1,reduced:reduce.matches,paused,opening:openingTime,openingSeconds})||unsettled;
  const arranged=points.map(p=>{
    const mass=FX.clamp((.8-(p.depth??p.z))/1.6),tau=orbit.dragging?.02+mass*.06:.05+mass*.10;
    p.angleY=reduce.matches?rotY:follow(p.angleY,rotY,dt,tau);p.angleX=reduce.matches?rotX:follow(p.angleX,rotX,dt,tau);
    unsettled ||= Math.abs(p.angleY-rotY)+Math.abs(p.angleX-rotX)>.0001;
    const world=Space.rotate(Space.position(p.i,clock),p.angleY,p.angleX);
    const projected=Space.project(world,width,height,small),zz=world.z;p.depth=zz;
    const scale=projected.scale,bw=p.bw*scale,bh=p.bh*scale;
    const rawX=softClamp(cx+(projected.x-cx)*spread,framing.left+bw/2,framing.right-bw/2,small?12:20);
    const rawY=softClamp(spaceY+(projected.y-spaceY)*spread,framing.top+bh/2,framing.bottom-bh/2);
    const anchorOrder=[2,1,0][p.t[1]],angle=(p.i%8)/8*Math.PI*2;
    const ax=small?width*.5:width*[.25,.5,.76][anchorOrder],ay=small?height*[.36,.51,.66][anchorOrder]:height*.54;
    let x=rawX+(ax+Math.cos(angle)*17-rawX)*cluster,y=rawY+(ay+Math.sin(angle)*11-rawY)*cluster;
    x+=(width*(.12+.76*p.i/(points.length-1))-x)*morph;y+=(height*.77-y)*morph;
    const velocityX=p.lastX===null?0:(x-p.lastX)/Math.max(.001,dt),velocityY=p.lastY===null?0:(y-p.lastY)/Math.max(.001,dt);
    p.bendX=reduce.matches?0:follow(p.bendX,FX.clamp(-velocityX*.045,-28,28),dt,.10);p.bendY=reduce.matches?0:follow(p.bendY,FX.clamp(-velocityY*.045,-28,28),dt,.10);
    p.lastX=x;p.lastY=y;unsettled ||= Math.abs(p.bendX)+Math.abs(p.bendY)>.02;
    const relatedTarget=p.i===focusIndex?1:related.includes(p.i)?.7:0;
    p.relation=reduce.matches?relatedTarget:follow(p.relation,relatedTarget,dt,.18);unsettled ||= Math.abs(p.relation-relatedTarget)>.001;
    const base=p.t[2]==='primary'?.98:p.t[2]==='secondary'?.80:.64;
    return{p,x,y,zz,scale,bw,bh,targetAlpha:base*spread*(.5+.5*FX.smooth(-.85,.65,zz))};
  }).sort((a,b)=>(b.p.i===focusIndex?1:0)-(a.p.i===focusIndex?1:0)||b.p.relation-a.p.relation||b.zz-a.zz);
  {for(let i=1;i<arranged.length;i++){const a=arranged[i];let obscured=0;for(let j=0;j<i;j++){const b=arranged[j];if(b.targetAlpha<.1)continue;const ox=Math.max(0,Math.min(a.x+a.bw/2+4,b.x+b.bw/2+4)-Math.max(a.x-a.bw/2-4,b.x-b.bw/2-4)),oy=Math.max(0,Math.min(a.y+a.bh/2-6,b.y+b.bh/2-6)-Math.max(a.y-a.bh/2+6,b.y-b.bh/2+6));obscured=Math.max(obscured,Math.min(1,ox*oy/Math.max(1,Math.min(a.bw,b.bw)*Math.min(a.bh-12,b.bh-12))))}a.occlusion=1-.98*FX.smooth(0,.22,obscured);a.targetAlpha*=a.occlusion}}
  // Depth and collision fading keep all 24 topics available in the full scene.

  const byIndex=new Map(arranged.map(a=>[a.p.i,a])),labelFade=(1-FX.smooth(.02,.27,chapterProgress));
  for(const a of arranged){
    const p=a.p,accent=FX.palette[p.t[1]],color=accent.map(v=>Math.round(36+(v-36)*p.relation));
    p.focus=reduce.matches?(p.i===focusIndex?1:0):follow(p.focus,p.i===focusIndex?1:0,dt,.1);
    const targetAlpha=(a.targetAlpha*(1-relationStrength*.72)*(1-p.relation)+Math.max(.92,a.targetAlpha)*p.relation)*(a.occlusion??1);
    p.alpha=reduce.matches?targetAlpha:follow(p.alpha,targetAlpha,dt,.09);unsettled ||= Math.abs(p.alpha-targetAlpha)>.001;
    p.b.style.transform=`translate3d(${a.x-p.bw/2}px,${a.y-p.bh/2-fieldTop}px,0) scale(${a.scale})`;
    p.b.style.opacity=String(p.alpha*labelFade);p.b.style.color=`rgb(${color})`;
    p.b.style.zIndex=String(p.i===focusIndex?600:p.relation>.3?450:Math.round((a.zz+2)*100));
    p.b.style.pointerEvents=p.alpha*labelFade<.07?'none':'auto';
    const dotAlpha=cluster*(1-morph);
    if(dotAlpha>.01){ctx.beginPath();ctx.arc(a.x,a.y,1.7,0,Math.PI*2);ctx.fillStyle=`rgba(${accent},${dotAlpha*.9})`;ctx.fill()}
  }
  // Resting connections persist without hover; depth changes their weight, never their existence.
  for(const [from,to] of topicEdges){
    const a=byIndex.get(from),b=byIndex.get(to),depth=FX.smooth(-1,1,(a.zz+b.zz)/2);
    const alpha=(.10+.10*depth)*spread*labelFade*(1-relationStrength*.4)*(openingTime<0?1:FX.smooth(2.5,4.2,openingTime));
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
    ctx.strokeStyle=`rgba(81,99,123,${alpha})`;ctx.lineWidth=.65+.35*depth;ctx.stroke();
  }
  if(openingTime<0&&relationOrigin>=0&&relationStrength>.01){const a=byIndex.get(relationOrigin);for(const i of relationRoute.slice(1)){const b=byIndex.get(i),alpha=Math.min(a.p.relation,b.p.relation)*.48*labelFade;if(alpha<.01)continue;const color=FX.palette[b.p.t[1]];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+b.x)/2+(a.p.bendX+b.p.bendX)/2,(a.y+b.y)/2+(a.p.bendY+b.p.bendY)/2,b.x,b.y);ctx.strokeStyle=`rgba(${color},${alpha})`;ctx.lineWidth=.8;ctx.stroke()}}
  if(morph>.001){ctx.fillStyle=`rgba(36,36,36,${morph})`;ctx.fillRect(width*.12,cy,width*.76,1)}
  return unsettled;
}
function tick(t){
  const dt=Math.min((t-last)/1000||1/60,.05);last=t;
  if(openingTime>=0&&!document.hidden){const elapsed=window.SignatureIntro.elapsed();openingSeconds=elapsed;openingTime=elapsed<0?-1:window.IntroStory.growth(elapsed)}
  if(visible&&!document.hidden&&!modalOpen){
    const nextProgress=reduce.matches?0:Math.max(0,Math.min(1,(scrollY-Math.max(0,height-innerHeight))/chapterRunway));
    if(heroStylesDirty||Math.abs(nextProgress-chapterProgress)>.00001){
      heroStylesDirty=false;
      chapterProgress=reduce.matches?nextProgress:follow(chapterProgress,nextProgress,dt,.065);needsDraw=true;
      const reveal=FX.smooth(.46,.88,chapterProgress);
      const controlsOpacity=String(1-FX.smooth(0,.16,chapterProgress));legend.style.opacity=controlsOpacity;selection.style.opacity=controlsOpacity;selection.inert=chapterProgress>.03;
      bridge.style.opacity=String(reveal);bridge.style.transform=`translate3d(0,${(1-reveal)*30}px,0)`;
      $('.hero-header').style.opacity=String(Math.max(0,1-chapterProgress*2));
      $('.hero-bottom').style.opacity=String(Math.max(0,1-chapterProgress*3));
      $('.hero-routes').inert=chapterProgress>.08;$('.hero-routes').style.opacity=String(Math.max(0,1-chapterProgress*9));
      field.inert=chapterProgress>.12;$('.hero-header').inert=chapterProgress>.48;$('.hero-bottom').inert=chapterProgress>.32;
    }
    orbit.update(dt,!paused&&!reduce.matches);
    if(chapterProgress>.02)stopWelcome();
    automaticAngles=autopilot.update(dt*(openingSeconds>=0?window.IntroStory.frame(openingSeconds).motion:1),!paused&&!reduce.matches);clock=autopilot.time;
    field.dataset.orbitMode=autopilot.mode;
    const tau=reduce.matches?.012:orbit.dragging?.028:.065;
    dragX=follow(dragX,targetXRotation,dt,tau);dragY=follow(dragY,targetYRotation,dt,tau);
    if(!paused){
      effectClock+=dt;

    }
    const settling=Math.abs(dragX-targetXRotation)+Math.abs(dragY-targetYRotation)>.00001;
    const fading=points.some(p=>p.focus>.002&&p.i!==hoveredTopic);
    if(!paused||needsDraw||settling||fading||openingTime>=0){needsDraw=draw(dt)||settling||fading;}
  }
  updateJourney(dt);
  window.Experience?.tick(dt);
  requestAnimationFrame(tick);
}
window.addEventListener('perspective:change',()=>{clearSelection();needsDraw=true});
function syncMotion(){motion.textContent=reduce.matches?'BEWEGUNG — REDUZIERT':paused?'BEWEGUNG — AUS':'BEWEGUNG — AN';motion.setAttribute('aria-pressed',String(!paused))}motion.addEventListener('click',()=>{stopWelcome();if(reduce.matches)return;paused=!paused;if(paused){effectClock=Math.max(effectClock,2.1);needsDraw=true}syncMotion()});reduce.addEventListener('change',()=>{stopWelcome();paused=reduce.matches;syncMotion();size();needsDraw=true});
$('#topic-preview-open').addEventListener('click',()=>{if(selectedTouch>=0)openTopic(selectedTouch)});$('#topic-preview-clear').addEventListener('click',clearSelection);
field.addEventListener('pointerdown',e=>{if(!e.target.closest('.topic'))clearSelection()});
function neuralPointer(e,pulse=false){
  if(e.isPrimary===false||(e.type==='pointerdown'&&e.pointerType==='mouse'&&e.button!==0))return;
  if(e.type==='pointerdown'){stopWelcome();autopilot.contact(true);}
  const rect=hero.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width,y=(e.clientY-rect.top)/rect.height;
  if(pulse&&!paused&&!reduce.matches)neural.pulse(x,y);else neural.point(x,y);
  needsDraw=true;
}
field.addEventListener('pointermove',e=>neuralPointer(e),{passive:true});
field.addEventListener('pointerdown',e=>neuralPointer(e,true),{passive:true});
for(const event of ['pointerleave','pointercancel','lostpointercapture'])field.addEventListener(event,()=>{neural.release();needsDraw=true});
field.addEventListener('pointerup',e=>{if(e.isPrimary===false)return;autopilot.contact(false);if(e.pointerType!=='mouse'){neural.release();needsDraw=true}});
for(const event of ['pointercancel','lostpointercapture'])field.addEventListener(event,e=>{if(e.isPrimary!==false)autopilot.contact(false)});

const orbit=window.createOrbitInput(field,{
  getBounds:()=>hero.getBoundingClientRect(),
  onRotate:(x,y)=>{autopilot.interact();targetXRotation+=x;targetYRotation+=y;needsDraw=true},
  onDragging:active=>{if(active){stopWelcome();autopilot.interact();}needsDraw=true}
});
window.addEventListener('blur',()=>{orbit.cancel();neural.release();autopilot.cancel()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){orbit.cancel();neural.release();autopilot.cancel()}});
new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(!visible){orbit.cancel();neural.release();autopilot.cancel()}}).observe(hero);
const dialog=$('#topic-dialog'),caseDialog=$('#case-dialog'),cases=window.MUAMMER_CASES;
let priorTopic,selectedTopic=0,priorCase,caseKey='hans',modalRevision=0,modalAnimations=[];
function resetAnimations(){modalRevision++;modalAnimations.forEach(a=>a.cancel());modalAnimations=[];return modalRevision}
function animate(el,frames,duration=650,delay=0){
  if(reduce.matches)return Promise.resolve();
  const a=el.animate(frames,{duration,delay,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'});
  modalAnimations.push(a);return a.finished.catch(()=>{});
}
function spatialTransform(source,title){
  const a=source.getBoundingClientRect(),b=title.getBoundingClientRect();
  const scale=parseFloat(getComputedStyle(source).fontSize)/parseFloat(getComputedStyle(title).fontSize);
  return `translate3d(${a.left+5-b.left}px,${a.top+9-b.top}px,0) scale(${scale})`;
}
function unlock(){modalOpen=false;document.body.style.overflow='';needsDraw=true}
function openTopic(i){
  if(dialog.open||caseDialog.open)return;
  orbit.cancel();neural.release();autopilot.cancel();modalOpen=true;selectedTopic=i;dialog.style.setProperty('--topic-accent',`rgb(${FX.palette[topics[i][1]]})`);priorTopic=points[i].b;resetAnimations();
  const title=dialog.querySelector('h2');title.textContent=topics[i][0];
  dialog.querySelector('.topic-copy').textContent=topics[i][5];
  const evidence=(window.MUAMMER_TOPIC_EVIDENCE||{})[topics[i][0]]||[],stations=window.ExperienceData?.career||[];
  dialog.querySelector('.topic-evidence-list').replaceChildren(...evidence.map(e=>{const s=stations.find(x=>x.id===e.station),li=document.createElement('li'),label=document.createElement('b'),text=document.createElement('span');const co=document.createElement('span'),wh=document.createElement('span');co.className='ev-company';wh.className='ev-where';if(s){co.textContent=s.company;wh.textContent=s.city+' · '+s.years}else{co.textContent=e.label||'';wh.textContent=e.sub||''}label.append(co,wh);text.textContent=e.text;li.append(label,text);return li}));
  dialog.querySelector('.topic-evidence').hidden=!evidence.length;
  dialog.querySelector('.topic-category').textContent=['UNTERNEHMERISCHE PERSPEKTIVE','TECHNOLOGISCHE PERSPEKTIVE','MENSCHEN & ZUSAMMENARBEIT'][topics[i][1]];
  dialog.querySelector('.topic-index').textContent=String(i+1).padStart(2,'0')+' / '+topics.length+' PERSPEKTIVEN';
  document.body.style.overflow='hidden';dialog.showModal();dialog.scrollTop=0;
  animate(title,[{transform:spatialTransform(priorTopic,title)},{transform:'none'}],760);
  animate(dialog,[{backgroundColor:'rgba(231,231,231,0)'},{backgroundColor:'rgba(231,231,231,.97)'}],550);
  animate(dialog.querySelector('.topic-body'),[{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'none'}],600,180);
  animate(dialog.querySelector('.topic-category'),[{opacity:0},{opacity:1}],500,220);
}
async function closeTopic(navigate=false){
  if(!dialog.open)return;
  const revision=resetAnimations(),title=dialog.querySelector('h2');
  if(!navigate){
    animate(dialog.querySelector('.topic-body'),[{opacity:1},{opacity:0}],200);
    animate(dialog.querySelector('.topic-category'),[{opacity:1},{opacity:0}],180);
    animate(dialog,[{opacity:1},{opacity:0}],380);
    await animate(title,[{transform:'none'},{transform:spatialTransform(priorTopic,title)}],420);
  }
  if(revision!==modalRevision)return;
  dialog.close();resetAnimations();unlock();priorTopic?.focus({preventScroll:true});
}
dialog.querySelector('.dialog-close').addEventListener('click',()=>closeTopic());
dialog.addEventListener('cancel',e=>{e.preventDefault();closeTopic()});
dialog.querySelector('a').addEventListener('click',()=>closeTopic(true));
dialog.querySelector('.topic-case').addEventListener('click',async()=>{
  const keys=['bor','hans','bsh'],key=keys[topics[selectedTopic][1]],source=priorTopic;
  await closeTopic(true);openCase(key,source);
});
function renderCase(key){
  const c=cases[key];caseKey=key;
  caseDialog.querySelector('.case-brand').textContent=c.brand;
  caseDialog.querySelector('.case-meta').textContent=c.meta;
  caseDialog.querySelector('h2').textContent=c.title;
  caseDialog.querySelector('.case-intro').textContent=c.intro;
  caseDialog.querySelector('.case-facts').replaceChildren(...c.facts.map(text=>{const span=document.createElement('span');span.textContent=text;return span}));
  caseDialog.querySelector('.case-flow').replaceChildren(...c.flow.map((text,i)=>{const li=document.createElement('li'),n=document.createElement('small'),label=document.createElement('span');n.textContent='0'+(i+1);label.textContent=text;li.append(n,label);return li}));
  caseDialog.querySelector('.case-story').replaceChildren(...c.sections.map(([label,heading,copy])=>{const section=document.createElement('section'),tag=document.createElement('p'),div=document.createElement('div'),h=document.createElement('h3'),p=document.createElement('p');tag.className='eyebrow';tag.textContent=label;h.textContent=heading;p.textContent=copy;div.append(h,p);section.append(tag,div);return section}));
  caseDialog.querySelector('.case-next').textContent='Weiter: '+cases[c.next].brand;
  caseDialog.style.setProperty('--case-color',{hans:'#efe4d0',bor:'#bfc3f2',bsh:'#e8ab91'}[key]);
  caseDialog.style.setProperty('--case-ink',{hans:'#302d29',bor:'#292940',bsh:'#3d2c29'}[key]);
  caseDialog.scrollTop=0;
}
function openCase(key,source){
  orbit.cancel();modalOpen=true;priorCase=source;resetAnimations();renderCase(key);
  document.body.style.overflow='hidden';caseDialog.showModal();
  animate(caseDialog,[{opacity:0,transform:'translateY(32px)'},{opacity:1,transform:'none'}],550);
}
async function closeCase(){
  if(!caseDialog.open)return;
  const revision=resetAnimations();await animate(caseDialog,[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(20px)'}],280);
  if(revision!==modalRevision)return;
  caseDialog.close();resetAnimations();priorCase?.focus({preventScroll:true});unlock();
}
caseDialog.querySelector('.case-close').addEventListener('click',closeCase);
caseDialog.addEventListener('cancel',e=>{e.preventDefault();closeCase()});
caseDialog.querySelector('.case-next').addEventListener('click',()=>{
  resetAnimations();renderCase(cases[caseKey].next);caseDialog.querySelector('.case-close').focus({preventScroll:true});
  animate(caseDialog.querySelector('.case-article'),[{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],450);
});
$$('[data-case]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openCase(a.dataset.case,a)}));
const journey=$('#journey'),track=$('#track'),rail=$('.rail'),menu=$('#menu'),toggle=$('#menu-toggle'),scenes=$$('.journey-scene'),routeNav=$('.route-nav');
const sceneContents=scenes.map(scene=>{const content=document.createElement('div');content.className='scene-content';while(scene.firstChild)content.append(scene.firstChild);scene.append(content);return content});
const routeIndex=document.createElement('button');routeIndex.id='route-index';routeIndex.type='button';routeIndex.setAttribute('aria-label','Kapitelübersicht öffnen');routeIndex.append($('#route-position'));routeNav.insertBefore(routeIndex,$('#route-next'));
let maxTravel=0,journeyTop=0,currentTravel=0,targetTravel=0,panels=[],lastScroll=-1,path=null,activeScene=0,layoutWidth=0,layoutHeight=0,wasMobile=mobile.matches,paintedScene=-1,paintedFrames='';
function resizeJourney(){
  panels=$$('.panel');
  const small=mobile.matches,newWidth=innerWidth;
  const previousStop=path?.stops[activeScene],previousProgress=previousStop?Math.max(0,Math.min(1,(scrollY-journeyTop-previousStop.start)/Math.max(1,previousStop.end-previousStop.start))):0;
  const withinJourney=scrollY>=journeyTop&&layoutWidth>0;
  document.documentElement.classList.toggle('mobile-spatial',small);
  const newHeight=$('.stage').clientHeight;
  const changed=layoutWidth!==newWidth||(!small&&layoutHeight!==newHeight)||wasMobile!==small;
  if(small){
    track.style.transform='';
    path=window.createMobileJourneyPath(newWidth,newHeight,scenes.map((scene,i)=>({height:sceneContents[i].scrollHeight,direction:scene.dataset.direction})));
    maxTravel=path.total;journey.style.height=(maxTravel+newHeight)+'px';
    renderMobileNav();
  }else{
    sceneContents.forEach(content=>content.style.transform='');
    const viewportWidth=newWidth-rail.offsetWidth;
    path=window.createJourneyPath(viewportWidth,newHeight,scenes.map(scene=>({width:scene.scrollWidth,direction:scene.dataset.direction})));
    maxTravel=path.total;journey.style.height=(maxTravel+newHeight)+'px';
  }
  journeyTop=journey.offsetTop;
  if(changed&&withinJourney){
    const destination=journeyTop+path.stops[activeScene].start+(wasMobile===small?previousProgress*(path.stops[activeScene].end-path.stops[activeScene].start):0);
    window.scrollTo({top:Math.max(0,destination),behavior:'instant'});
  }
  paintedScene=-1;paintedFrames='';currentTravel=targetTravel=Math.max(0,Math.min(maxTravel,scrollY-journeyTop));renderJourney();
  layoutWidth=newWidth;layoutHeight=newHeight;wasMobile=small;lastScroll=-1;
}
function renderJourney(){
  const state=path.sample(currentTravel,reduce.matches),visibleScenes=new Set(state.frames.map(f=>f.index));
  const frameKey=state.frames.map(f=>f.index).join(':');
  if(frameKey!==paintedFrames){scenes.forEach((scene,i)=>{scene.style.visibility=visibleScenes.has(i)?'visible':'hidden'});paintedFrames=frameKey}
  for(const frame of state.frames){const scene=scenes[frame.index];scene.style.transform=`translate3d(${frame.x}px,${frame.y}px,0)`;scene.style.opacity=String(frame.opacity);if(mobile.matches)sceneContents[frame.index].style.transform=`translate3d(0,${frame.contentY}px,0)`}
  activeScene=state.index;
  if(mobile.matches)routeNav.style.setProperty('--route-progress',String(maxTravel?currentTravel/maxTravel:0));
  if(paintedScene===activeScene)return;
  paintedScene=activeScene;scenes.forEach((scene,i)=>scene.inert=i!==activeScene);
  const dark=scenes[activeScene].querySelector('.panel').classList.contains('dark');
  rail.classList.toggle('is-dark',dark);routeNav.classList.toggle('is-dark',dark);
  panels.forEach(p=>p.classList.toggle('is-current',p.closest('.journey-scene')===scenes[activeScene]));
  if(mobile.matches){renderMobileNav();return}
  $('#route-prev').textContent='Zurück';mobileNavState='';
  $('#route-position').textContent=scenes[activeScene].dataset.label.toUpperCase();
  $('#route-prev').disabled=false;$('#route-prev').setAttribute('aria-label',activeScene===0?'Zurück zum Start':'Vorheriger Abschnitt: '+scenes[activeScene-1].dataset.label);$('#route-next').disabled=activeScene===scenes.length-1;
  $('#route-next').textContent='Weiter';
  $('#route-next').setAttribute('aria-label','Nächster Abschnitt'+(scenes[activeScene+1]?': '+scenes[activeScene+1].dataset.label:''));
}
function updateJourney(dt){
  const y=scrollY;
  if(mobile.matches){
    routeNav.classList.toggle('is-live',y>=journeyTop-innerHeight*.4&&!modalOpen&&menu.hidden);
    rail.classList.toggle('is-fixed',y>=journeyTop);
  }else rail.classList.remove('is-fixed');
  targetTravel=Math.max(0,Math.min(maxTravel,y-journeyTop));
  if(y===lastScroll&&Math.abs(currentTravel-targetTravel)<.08)return;lastScroll=y;
  currentTravel=reduce.matches?targetTravel:follow(currentTravel,targetTravel,dt,mobile.matches?.045:.065);
  if(Math.abs(currentTravel-targetTravel)<.08)currentTravel=targetTravel;
  renderJourney();
}
function destinationFor(el){
  if(el===hero)return 0;
  const scene=scenes.indexOf(el.closest('.journey-scene'));if(scene<0)return journeyTop;
  if(mobile.matches){const stop=path.stops[scene];return journeyTop+stop.start+Math.min(stop.pan,Math.max(0,el.offsetTop-64))}
  const stop=path.stops[scene],pan=Math.min(stop.pan,el.offsetLeft);
  return journeyTop+stop.start+(pan>0?innerHeight*.18+pan:0);
}
function go(hash,instant=false){
  const el=$(hash);if(!el)return;const y=Math.max(0,destinationFor(el));
  if(instant){currentTravel=targetTravel=Math.max(0,Math.min(maxTravel,y-journeyTop));renderJourney()}
  window.scrollTo({top:y,behavior:reduce.matches||instant||hash==='#home'?'instant':'smooth'});history.replaceState(null,'',hash);
  if(hash==='#home'&&!instant)window.SignatureIntro?.show();
}
$('#route-prev').addEventListener('click',()=>{go(activeScene>0?'#'+scenes[activeScene-1].querySelector('.panel').id:'#home')});
$('#route-next').addEventListener('click',()=>{if(activeScene<scenes.length-1)go('#'+scenes[activeScene+1].querySelector('.panel').id);else if(mobile.matches)go('#home')});
// A quiet chapter index in thumb reach. Its title opens the overview; no arrow glyphs on phones.
let mobileNavState='';function renderMobileNav(){
  if(!mobile.matches||!scenes.length)return;const s=scenes[activeScene],last=activeScene===scenes.length-1,state=activeScene+':'+last;if(state===mobileNavState)return;mobileNavState=state;
  $('#route-position').textContent=({ 'Ausgewählte Aufgaben':'Verantwortung','Perspektiven wechseln':'Mein Weg','Karriaro-Werkstatt':'Karriaro' }[s.dataset.label]||s.dataset.label);
  routeIndex.dataset.position=String(activeScene+1).padStart(2,'0')+' / '+String(scenes.length).padStart(2,'0');
  $('#route-prev').textContent=activeScene===0?'Start':'Zurück';$('#route-prev').disabled=false;$('#route-prev').setAttribute('aria-label',activeScene===0?'Zurück zum Start':'Vorheriger Abschnitt: '+scenes[activeScene-1].dataset.label);
  $('#route-next').textContent=last?'Anfang':'Weiter';$('#route-next').disabled=false;$('#route-next').setAttribute('aria-label',last?'Zurück zum Anfang':'Nächster Abschnitt: '+scenes[activeScene+1].dataset.label);
}
// Explicit menu choices go straight to their destination. The chapter buttons and native scroll retain the spatial journey.
let destinationFade=null;
function goDirect(hash){
  destinationFade?.cancel();destinationFade=null;
  go(hash,true);lastScroll=-1;updateJourney(0);
  if(hash==='#home'){window.SignatureIntro?.show();return}
  const destination=$(hash),surface=mobile.matches?destination:destination.closest('.journey-scene');
  if(!reduce.matches&&surface?.animate)destinationFade=surface.animate([{filter:'opacity(0)'},{filter:'opacity(1)'}],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});
}
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const hash=a.getAttribute('href');if(!$(hash))return;e.preventDefault();const direct=!!a.closest('#menu,.hero-header');closeMenu();if(direct)goDirect(hash);else go(hash)});
let menuPrevious;function openMenu(){menuPrevious=document.activeElement;menu.hidden=false;hero.inert=true;journey.inert=true;toggle.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';$('#menu-close').focus()}function closeMenu(){const wasOpen=!menu.hidden;menu.hidden=true;hero.inert=false;journey.inert=false;toggle.setAttribute('aria-expanded','false');if(wasOpen)document.body.style.overflow='';if(wasOpen)menuPrevious?.focus({preventScroll:true})}toggle.addEventListener('click',openMenu);$('#menu-close').addEventListener('click',closeMenu);document.addEventListener('keydown',e=>{if(menu.hidden)return;if(e.key==='Escape')closeMenu();if(e.key==='Tab'){const nodes=[...menu.querySelectorAll('a,button')],first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
routeIndex.addEventListener('click',openMenu);
let keyboardNavigation=false;document.addEventListener('keydown',e=>{if(e.key==='Tab')keyboardNavigation=true});document.addEventListener('pointerdown',()=>keyboardNavigation=false);document.addEventListener('focusin',e=>{
  if(!keyboardNavigation||!menu.hidden||modalOpen)return;
  const panel=e.target.closest('.panel');if(!panel)return;
  const stage=$('.stage');stage.scrollLeft=0;stage.scrollTop=0;
  if(mobile.matches){
    const scene=panel.closest('.journey-scene');scene.scrollTop=0;scene.scrollLeft=0;
    const rect=e.target.getBoundingClientRect(),stop=path.stops[activeScene];
    if(rect.top<80||rect.bottom>innerHeight-90)goMobileFocus(stop,rect);
  }else window.scrollTo({top:destinationFor(panel),behavior:'instant'});
});
function goMobileFocus(stop,rect){window.scrollTo({top:journeyTop+stop.start+Math.max(0,Math.min(stop.pan,currentTravel-stop.start+rect.top-90)),behavior:'instant'})}
window.ProfileNavigation={go,refresh:resizeJourney};
// Recompute long reading ranges when disclosures, product choices or loaded assets change their height.
if('ResizeObserver' in window){let pending=false;const ro=new ResizeObserver(()=>{if(!mobile.matches||pending)return;pending=true;requestAnimationFrame(()=>{pending=false;resizeJourney()})});sceneContents.forEach(content=>ro.observe(content))}
// Native scroll drives both reversible routes; mobile content stays readable before each spatial turn.
window.addEventListener('resize',size);mobile.addEventListener('change',size);document.fonts.ready.then(size);document.querySelectorAll('.work-rows details,.experience details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open){d.parentElement.querySelectorAll('details').forEach(other=>{if(other!==d)other.open=false})}resizeJourney()}));window.addEventListener('load',size);window.addEventListener('pageshow',()=>{const destination=location.hash;if(!destination||!$(destination))return;const restore=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>go(destination,true)));if(document.body.classList.contains('intro-active'))window.addEventListener('signatureintro:end',restore,{once:true});else restore()});syncMotion();size();requestAnimationFrame(tick);
})();
