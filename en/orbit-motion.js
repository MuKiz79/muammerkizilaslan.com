/* Automatic orbit and pointer ownership share one continuous phase clock. */
(function(root){
 'use strict';
 function trajectory(time){
  const phase=2*Math.PI*time/64;
  return{yaw:phase+.12*Math.sin(2*phase),pitch:.46*Math.sin(phase)+.14*Math.sin(2*phase)};
 }
 function create(){
  let time=0,speed=0,contact=false,cooldown=0,enabled=true;
  function interact(){speed=0;cooldown=1.4}
  return{
   contact(value){if(value===contact)return;contact=value;interact()},
   interact,
   cancel(){contact=false;interact()},
   update(dt,allow=true){
    enabled=allow;
    if(!allow||contact){speed=0;return trajectory(time)}
    const wait=Math.min(cooldown,dt);cooldown-=wait;dt-=wait;
    if(dt>0){
     // Exact integral of a smooth speed ramp, independent of frame rate.
     const tau=.7,decay=Math.exp(-dt/tau);
     time+=dt-(1-speed)*tau*(1-decay);speed=1-(1-speed)*decay;
    }
    return trajectory(time);
   },
   get time(){return time},
   get mode(){return !enabled?'paused':contact?'manual':cooldown>0||speed<.99?'resuming':'automatic'}
  };
 }
 const api={trajectory,create};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OrbitMotion=api;
})(typeof window!=='undefined'?window:this);
