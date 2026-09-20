/* Deterministic branching and convergence, linked to the portfolio's real topics. */
(function(root){
 'use strict';
 const stories={8:[8,10,15,2],9:[9,10,15,2],16:[16,17,7,2],17:[17,18,7,2],7:[7,1,11,2],1:[1,7,16,2],2:[2,8,15,20]};
 function route(topic,links){return stories[topic]||[topic,...(links[topic]||[]).slice(0,3)]}
 function welcome(time){
  if(time>=5.2)return null;
  const topic=time<2.1?16:time<3.6?8:2;
  return{topic,label:topic===16?'Menschen.':topic===8?'Technologie.':'Wertschöpfung.',age:Math.max(0,time-.75),opacity:Math.min(1,time/.6,(5.2-time)/.45)};
 }
 const timing={step:1.75,departure:.30,travel:1.45,active:8.1,cycle:10.2};
 function plan(layout,seed){
  const weights=layout.nodes.map(()=>0),selected=[];let offset=0;
  for(let layer=0;layer<layout.layers;layer++){
   const count=layout.counts[layer],center=(seed+layer*2)%count,slots=[];
   for(let b=0;b<Math.min([1,2,2,1,1][layer],count);b++){
    const index=offset+(center+b)%count;slots.push(index);weights[index]=b===0?1:.7;
   }
   selected.push(slots);offset+=count;
  }
  const edges=new Map();
  for(let layer=0;layer<selected.length-1;layer++){
   const a=selected[layer],b=selected[layer+1];
   for(let i=0;i<Math.max(a.length,b.length);i++){
    const from=a[i%a.length],to=b[i%b.length];edges.set(from+':'+to,Math.sqrt(weights[from]*weights[to]));
   }
  }
  return{weights,edgeWeight:(a,b)=>edges.get(a+':'+b)||0};
 }
 // One complete thought at a time. Interaction chooses the next path, never adds waves.
 function createSequence(){
  const seeds=[16,8,2,7];let cycle=-1,seed=16,queued=null;
  return{
   request(value){if(Number.isInteger(value)&&value>=0)queued=value},
   update(time){
    const phase=Math.max(0,time-.6),next=Math.floor(phase/timing.cycle);
    if(next!==cycle){cycle=next;seed=queued===null?seeds[cycle%seeds.length]:queued;queued=null;}
    const age=time<.6?-1:phase-cycle*timing.cycle;
    return{age,seed,active:age>=0&&age<timing.active};
   }
  };
 }
 function activation(age,layer,weight){
  const elapsed=age-layer*timing.step;
  if(elapsed<0||elapsed>1.1)return 0;
  const rise=Math.min(1,elapsed/.12),decay=Math.exp(-Math.max(0,elapsed-.12)/(layer===4?.42:.28));
  return weight*rise*decay*(1-Math.max(0,(elapsed-.8)/.3));
 }
 function packet(age,layer){return(age-layer*timing.step-timing.departure)/timing.travel}
 const api={route,welcome,plan,timing,createSequence,activation,packet};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ThoughtFlow=api;
})(typeof window!=='undefined'?window:this);
