(function(root){
 'use strict';
 const palette=[[170,83,47],[42,83,188],[83,117,91]];
 const links=[[1,7,16,17],[0,2,4,7],[1,8,15,20],[0,1,4,7],[1,2,5,6],[2,4,6,12],[1,4,5,14],[0,1,11,16,22],[9,10,15,2,16],[8,10,15,20],[8,9,11,14],[7,10,12,14],[5,11,13,14],[0,12,14,17],[6,10,11,12],[8,9,19,20],[0,7,17,22],[0,13,16,18,23],[7,17,20,23],[15,20,21,10],[2,9,15,19],[10,15,19,20],[0,7,16,17],[0,16,17,18]];
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const smooth=(a,b,v)=>{const p=clamp((v-a)/(b-a));return p*p*(3-2*p)};
 const follow=(a,b,dt,tau)=>b+(a-b)*Math.exp(-dt/tau);
 const monogram=[],edges=[];
 function stroke(vertices,steps){let previous=-1;for(let s=0;s<vertices.length-1;s++){for(let k=s?1:0;k<=steps;k++){const t=k/steps,a=vertices[s],b=vertices[s+1],index=monogram.length;monogram.push({x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t});if(previous>=0)edges.push([previous,index]);previous=index}}}
 stroke([[-.9,.5],[-.9,-.5],[-.5,.08],[-.1,-.5],[-.1,.5]],3);
 stroke([[.22,-.5],[.22,.5]],2);stroke([[.22,.02],[.88,-.5]],3);stroke([[.22,.02],[.9,.5]],3);
 function createCoreInput(button,onChange){
  let pointer=null,pressed=false;
  function set(value){pressed=value;button.setAttribute('aria-pressed',String(value));onChange(value)}
  function cancel(){const id=pointer;pointer=null;set(false);if(id!==null&&button.hasPointerCapture?.(id))button.releasePointerCapture(id)}
  button.addEventListener('pointerdown',e=>{if(pointer!==null||e.isPrimary===false||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();e.stopPropagation();button.focus?.({preventScroll:true});pointer=e.pointerId;button.setPointerCapture?.(pointer);set(true)});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{if(pointer===e.pointerId)cancel()});
  // Keyboard/assistive activation toggles; pointer activation is hold-and-release.
  button.addEventListener('click',e=>{if(e.detail===0)set(!pressed)});
  button.addEventListener('keydown',e=>{if(e.key==='Escape')cancel()});
  button.addEventListener('blur',cancel);
  return{cancel,get pressed(){return pressed}};
 }
 function createTopicSelection(preview,open,clear){
  let selected=-1;
  return{activate(i,pointer,detail){if(detail!==0&&pointer==='touch'&&selected!==i){selected=i;preview(i)}else open(i)},clear(){selected=-1;clear()},get selected(){return selected}};
 }
 const api={palette,links,monogram,edges,clamp,smooth,follow,createCoreInput,createTopicSelection};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HeroEffects=api;
})(typeof window!=='undefined'?window:this);
