/* A reversible scroll route. All geometry is computed on resize, never per frame. */
(function(root){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function createJourneyPath(width,height,scenes){
    let cursor=0;
    const stops=scenes.map((scene,i)=>{
      const pan=Math.max(0,scene.width-width),start=cursor;
      const rest=height*.18,panStart=start+rest,turnStart=panStart+pan;
      const direction=scene.direction||'right';
      const distance=i===scenes.length-1?0:(direction==='right'?width:height);
      cursor=turnStart+distance;
      return{start,panStart,pan,turnStart,end:cursor,direction,distance};
    });
    function sample(value,reduced=false){
      const distance=clamp(value,0,cursor);
      let index=stops.findIndex((s,i)=>distance<s.end||i===stops.length-1);
      const s=stops[index],pan=clamp(distance-s.panStart,0,s.pan);
      if(distance<=s.turnStart||index===stops.length-1)return{index,frames:[{index,x:-pan,y:0,opacity:1}],direction:s.direction};
      const p=clamp((distance-s.turnStart)/s.distance,0,1);
      // Smooth endpoint velocity makes the turn settle before the next axis begins.
      const eased=p*p*(3-2*p),dx=s.direction==='right'?width:0,dy=s.direction==='down'?height:s.direction==='up'?-height:0;
      const frames=reduced?
        [{index,x:-s.pan,y:0,opacity:1-eased},{index:index+1,x:0,y:0,opacity:eased}]:
        [{index,x:-s.pan-dx*eased,y:-dy*eased,opacity:1},{index:index+1,x:dx*(1-eased),y:dy*(1-eased),opacity:1}];
      return{index:p<.5?index:index+1,frames,direction:s.direction};
    }
    return{stops,total:cursor,sample};
  }
  // A phone reads each chapter vertically before travelling to the next viewport.
  // Separate viewport and content offsets keep long chapters clipped during upward entrances.
  function createMobileJourneyPath(width,height,scenes){
    let cursor=0;
    const stops=scenes.map((scene,i)=>{
      const start=cursor,pan=Math.max(0,scene.height-height),panStart=start;
      const turnStart=start+pan+height*.12,direction=scene.direction||'right';
      const distance=i===scenes.length-1?0:height*.72;
      cursor=turnStart+distance;
      return{start,panStart,pan,turnStart,end:cursor,direction,distance};
    });
    function sample(value,reduced=false){
      const travel=clamp(value,0,cursor),index=stops.findIndex((s,i)=>travel<s.end||i===stops.length-1),s=stops[index];
      const contentY=-clamp(travel-s.panStart,0,s.pan);
      if(travel<=s.turnStart||index===stops.length-1)return{index,frames:[{index,x:0,y:0,contentY,opacity:1}],direction:s.direction};
      const p=clamp((travel-s.turnStart)/s.distance,0,1),e=p*p*(3-2*p);
      const dx=s.direction==='right'?width:0,dy=s.direction==='down'?height:s.direction==='up'?-height:0;
      return{index:p<.5?index:index+1,direction:s.direction,frames:[
        {index,x:reduced?0:-dx*e,y:reduced?0:-dy*e,contentY:-s.pan,opacity:reduced?1-e:1},
        {index:index+1,x:reduced?0:dx*(1-e),y:reduced?0:dy*(1-e),contentY:0,opacity:reduced?e:1}
      ]};
    }
    return{stops,total:cursor,sample};
  }
  if(typeof module!=='undefined'&&module.exports){module.exports=createJourneyPath;module.exports.mobile=createMobileJourneyPath}
  else{root.createJourneyPath=createJourneyPath;root.createMobileJourneyPath=createMobileJourneyPath}
})(typeof window!=='undefined'?window:this);
