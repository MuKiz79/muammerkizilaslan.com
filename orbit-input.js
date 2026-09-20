/* Pointer input shared by mouse, pen and touch. No browser-specific movementX. */
(function(root){
  'use strict';
  root.createOrbitInput=function(field,options){
    let active=null,velocityX=0,velocityY=0,suppressClick=false;
    const now=options.now||(()=>performance.now());
    const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
    function stop(){velocityX=velocityY=0;}
    function finish(event,cancelled){
      if(!active||event.pointerId!==active.id)return;
      const ended=active;active=null;
      const idle=now()-ended.lastAt;
      if(cancelled||!ended.dragged||idle>160)stop();
      else{const holdDecay=Math.exp(-idle/65);velocityX*=holdDecay;velocityY*=holdDecay;}
      suppressClick=ended.dragged||cancelled;
      field.classList.remove('is-dragging');
      options.onDragging?.(false);
      if(ended.captor.hasPointerCapture?.(ended.id))ended.captor.releasePointerCapture(ended.id);
    }
    field.addEventListener('pointerdown',event=>{
      if(active||event.isPrimary===false||(event.pointerType==='mouse'&&event.button!==0))return;
      stop();suppressClick=false;
      const captor=event.target.closest?.('.topic')||field;
      active={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,lastAt:now(),samples:[{x:event.clientX,y:event.clientY,t:now()}],dragged:false,captor};
      captor.setPointerCapture?.(event.pointerId);
      options.onHover?.(0,0);
    });
    field.addEventListener('pointermove',event=>{
      if(!active){
        if(event.pointerType==='mouse'){
          const rect=options.getBounds();
          options.onHover?.((event.clientX-rect.left)/rect.width*2-1,(event.clientY-rect.top)/rect.height*2-1);
        }
        return;
      }
      if(event.pointerId!==active.id)return;
      const time=now(),dx=event.clientX-active.x,dy=event.clientY-active.y;
      const distance=Math.hypot(event.clientX-active.startX,event.clientY-active.startY);
      if(!active.dragged&&distance<6)return;
      if(!active.dragged){active.dragged=true;field.classList.add('is-dragging');options.onDragging?.(true);}
      event.preventDefault();
      const rect=options.getBounds(),sensitivity=Math.PI/(1.12*Math.max(240,Math.min(rect.width,rect.height)));
      const angleX=dx*sensitivity,angleY=-dy*sensitivity;
      // Estimate release speed across a short history, not one noisy last event.
      active.samples.push({x:event.clientX,y:event.clientY,t:time});
      while(active.samples.length>2&&active.samples[1].t<time-80)active.samples.shift();
      const sample=active.samples[0],elapsed=Math.max(.001,(time-sample.t)/1000);
      velocityX=clamp((event.clientX-sample.x)*sensitivity/elapsed,-3.2,3.2);
      velocityY=clamp(-(event.clientY-sample.y)*sensitivity/elapsed,-3.2,3.2);
      active.x=event.clientX;active.y=event.clientY;active.lastAt=time;
      options.onRotate(angleX,angleY);
    },{passive:false});
    field.addEventListener('pointerup',event=>finish(event,false));
    field.addEventListener('pointercancel',event=>finish(event,true));
    field.addEventListener('lostpointercapture',event=>finish(event,true));
    field.addEventListener('pointerleave',()=>{if(!active)options.onHover?.(0,0);});
    field.addEventListener('click',event=>{
      // Keyboard activation has detail=0 and must continue to work after dragging.
      if(suppressClick&&event.detail!==0){event.preventDefault();event.stopImmediatePropagation();}
    },true);
    return{
      update(dt,allowInertia=true){
        if(active)return false;
        if(!allowInertia){stop();return false;}
        if(Math.abs(velocityX)+Math.abs(velocityY)<.008){stop();return false;}
        const decay=Math.exp(-4.3*dt),travel=(1-decay)/4.3;
        options.onRotate(velocityX*travel,velocityY*travel);
        velocityX*=decay;velocityY*=decay;
        return true;
      },
      cancel(){if(active)finish({pointerId:active.id},true);stop();},
      get dragging(){return !!active?.dragged;}
    };
  };
})(typeof window!=='undefined'?window:globalThis);
