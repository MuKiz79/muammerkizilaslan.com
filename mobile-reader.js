/* Keep reading on the browser's native scroll surface; pin only spatial turns. */
(function(root){
  function create({scenes,contents,stage}){
    const html=document.documentElement;
    const measure=document.createElement('div');
    measure.className='reader-viewport';measure.setAttribute('aria-hidden','true');stage.append(measure);
    const surfaces=scenes.map((scene,i)=>{
      const surface=document.createElement('div');surface.className='scene-surface';
      surface.append(contents[i]);scene.append(surface);return surface;
    });
    let enabled=false,painted='';
    function clear(i){
      scenes[i].classList.remove('is-turning');
      surfaces[i].style.transform='';surfaces[i].style.opacity='';contents[i].style.transform='';
    }
    return{
      mode(small){
        html.classList.toggle('native-reading',small);
        if(enabled===small)return;
        enabled=small;painted='';scenes.forEach((scene,i)=>{clear(i);scene.style.transform='';scene.style.opacity=''});
      },
      height(){
        const height=measure.clientHeight;
        html.style.setProperty('--reader-height',height+'px');
        return height;
      },
      layout(path,height){
        path.stops.forEach((stop,i)=>{
          // Adjacent chapter wrappers overlap by one viewport. The native sticky
          // surface therefore reaches its last line at precisely stop.pan.
          scenes[i].style.setProperty('--reader-span',(stop.end-stop.start+height)+'px');
          scenes[i].style.setProperty('--reader-pin',(-stop.pan)+'px');
        });
        painted='';
      },
      render(state){
        const turning=state.frames.length===2,visible=new Set(state.frames.map(frame=>frame.index));
        const key=state.frames.map(frame=>frame.index).join(':');
        if(key!==painted){
          scenes.forEach((scene,i)=>{
            scene.style.visibility=visible.has(i)?'visible':'hidden';
            if(turning&&visible.has(i))scene.classList.add('is-turning');else clear(i);
          });
          painted=key;
        }
        // No transforms, scrollTo calls or position writes during native reading.
        if(!turning)return;
        for(const frame of state.frames){
          surfaces[frame.index].style.transform=`translate3d(${frame.x}px,${frame.y}px,0)`;
          surfaces[frame.index].style.opacity=String(frame.opacity);
          const offset=`translate3d(0,${frame.contentY}px,0)`;
          if(contents[frame.index].style.transform!==offset)contents[frame.index].style.transform=offset;
        }
      }
    };
  }
  if(typeof module!=='undefined'&&module.exports)module.exports=create;
  else root.createMobileReader=create;
})(typeof window!=='undefined'?window:globalThis);
