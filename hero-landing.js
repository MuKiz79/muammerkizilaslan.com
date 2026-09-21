/* The story ends once. Give the live controls a short entrance, never another text sequence. */
(function(){
'use strict';
const hero=document.querySelector('.hero');if(!hero)return;
let arrival=null;
function stop(){clearTimeout(arrival);arrival=null;hero.classList.remove('is-arriving')}
function reveal(){stop();hero.classList.add('is-arriving');arrival=setTimeout(stop,850)}
window.addEventListener('signatureintro:start',stop);
window.addEventListener('signatureintro:end',reveal);
window.addEventListener('perspective:change',stop);
document.addEventListener('pointerdown',stop,true);
document.addEventListener('keydown',stop);
document.addEventListener('wheel',stop,{passive:true});
window.addEventListener('scroll',stop,{passive:true});
})();
