/* Browser-owned mobile motion. Geometry is rebuilt only when the layout changes. */
(function(root){
  // With linear x control points this is exactly p*p*(3-2*p), as in journey-path.js.
  const turnEase='cubic-bezier(0.3333333333333333,0,0.6666666666666666,1)';
  const translate=(x,y)=>`translate3d(${x}px,${y}px,0)`;
  function framesFor(path,width,height,reduced=false){
    const vector=direction=>({x:direction==='right'?width:0,y:direction==='down'?height:direction==='up'?-height:0});
    return path.stops.map((stop,i)=>{
      const previous=path.stops[i-1],incoming=previous?vector(previous.direction):{x:0,y:0},outgoing=vector(stop.direction);
      const scene=[],content=[];
      function add(frames,at,values,easing='linear'){
        const frame={offset:at/path.total,...values,easing};
        // A chapter may fit entirely in the viewport, so its reading range can be zero.
        if(frames.at(-1)?.offset===frame.offset)frames[frames.length-1]=frame;else frames.push(frame);
      }
      const pose=(x,y,opacity)=>({transform:translate(reduced?0:x,reduced?0:y),opacity});
      add(scene,0,pose(incoming.x,incoming.y,reduced&&previous?0:1));
      if(previous){
        add(scene,previous.turnStart,pose(incoming.x,incoming.y,reduced?0:1),turnEase);
        add(scene,previous.end,pose(0,0,1));
      }
      if(stop.distance){
        add(scene,stop.turnStart,pose(0,0,1),turnEase);
        add(scene,stop.end,pose(-outgoing.x,-outgoing.y,reduced?0:1));
      }
      add(scene,path.total,stop.distance?pose(-outgoing.x,-outgoing.y,reduced?0:1):pose(0,0,1));
      add(content,0,{transform:translate(0,0)});
      add(content,stop.panStart,{transform:translate(0,0)});
      add(content,stop.panStart+stop.pan,{transform:translate(0,-stop.pan)});
      add(content,path.total,{transform:translate(0,-stop.pan)});
      return{scene,content};
    });
  }
  function create({path,width,height,top,scenes,contents,reduced=false}){
    if(!root.ScrollTimeline||!root.Animation||!('rangeStart' in root.Animation.prototype)||path.total<=0)return null;
    const animations=[];
    try{
      const timeline=new root.ScrollTimeline({source:document.documentElement,axis:'y'});
      // Pixel attachment ranges keep Safari's expanding toolbar from changing the
      // mapping between document scroll and chapter position.
      const options={timeline,rangeStart:top+'px',rangeEnd:(top+path.total)+'px',duration:'auto',fill:'both',easing:'linear'};
      framesFor(path,width,height,reduced).forEach((frames,i)=>{
        animations.push(scenes[i].animate(frames.scene,options));
        animations.push(contents[i].animate(frames.content,options));
      });
      return{cancel(){animations.forEach(animation=>animation.cancel())}};
    }catch(error){
      animations.forEach(animation=>animation.cancel());
      return null;
    }
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={framesFor,create};
  else root.JourneyScroll={create};
})(typeof window!=='undefined'?window:globalThis);
