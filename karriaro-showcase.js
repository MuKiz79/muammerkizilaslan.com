/* A narrow, origin-checked playback bridge for the live Karriaro portfolio. */
(()=>{'use strict';
  if(window.parent===window||new URLSearchParams(location.search).get('showcase')!=='karriaro')return;
  const allowed=new Set(['https://karriaro-webdesign.de','https://www.karriaro-webdesign.de']);
  const local=location.hostname==='127.0.0.1'||location.hostname==='localhost';
  function accepts(origin){
    if(allowed.has(origin))return true;
    try{const u=new URL(origin);return local&&u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname);}catch{return false;}
  }
  let parentOrigin='';
  try{parentOrigin=new URL(document.referrer).origin;}catch{return;}
  if(!accepts(parentOrigin))return;
  const state=window.KarriaroShowcase={paused:false};
  document.documentElement.classList.add('karriaro-preview');
  let ready=false,firstPlay=true,revision=0;
  function report(type){window.parent.postMessage({channel:'karriaro-preview',type},parentOrigin);}
  function pause(){
    revision++;window.SignatureIntro?.pause();state.paused=true;
    document.documentElement.classList.add('karriaro-preview-paused');
  }
  function play(replay=false){
    revision++;state.paused=false;document.documentElement.classList.remove('karriaro-preview-paused');
    if(firstPlay||replay){firstPlay=false;window.SignatureIntro?.show();}
    else window.SignatureIntro?.resume();
  }
  function still(){
    play();window.SignatureIntro?.finish();const current=revision;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(current===revision){pause();firstPlay=true;}}));
  }
  window.addEventListener('message',event=>{
    if(!ready||event.source!==window.parent||event.origin!==parentOrigin||event.data?.channel!=='karriaro-preview')return;
    switch(event.data.type){
      case 'play':play();break;
      case 'replay':play(true);break;
      case 'pause':pause();break;
      case 'still':still();break;
      default:return;
    }
    report(state.paused?'paused':'playing');
  });
  window.addEventListener('load',()=>document.fonts.ready.then(()=>{
    window.SignatureIntro?.finish();
    requestAnimationFrame(()=>requestAnimationFrame(()=>{pause();ready=true;report('ready');}));
  }),{once:true});
})();
