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
 const story={duration,growth};
 if(typeof module!=='undefined'&&module.exports)module.exports=story;else root.IntroStory=story;
})(typeof window!=='undefined'?window:this);
