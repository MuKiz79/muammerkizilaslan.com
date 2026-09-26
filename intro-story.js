/* One six-second story controls both the opening words and the neural volume. */
(function(root){
 const duration=6600;
 function growth(seconds){
  const t=Math.max(0,seconds),beats=[[0,0],[2.2,1.12],[4.4,2.15],[6.25,3.05]];
  for(let i=1;i<beats.length;i++)if(t<beats[i][0]){
   const [a,x]=beats[i-1],[b,y]=beats[i],p=(t-a)/(b-a);
   return x+(y-x)*p;
  }
  return beats.at(-1)[1];
 }
 // Build connections while the first word holds; send one thought as the sentence completes.
 const smooth=(a,b,t)=>{const p=Math.max(0,Math.min(1,(t-a)/(b-a)));return p*p*(3-2*p)};
 function frame(seconds){
  const t=Math.max(0,seconds);
  return {assembly:smooth(.2,2.2,t),visibility:smooth(0,.65,t),
   connections:[0,1,2,3].map(layer=>smooth(.45+layer*.32,1.2+layer*.32,t)),
   signalAge:t<2.5?-1:(t-2.5)*2.8,motion:smooth(2.24,3.56,t)};
 }
 const story={duration,growth,frame};
 if(typeof module!=='undefined'&&module.exports)module.exports=story;else root.IntroStory=story;
})(typeof window!=='undefined'?window:this);
