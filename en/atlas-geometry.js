/* Small, deterministic geometry helpers shared by the interactive atlas and its tests. */
(function(root){
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function project(point,camera,width,height){const scale=width/375*camera.zoom;return{x:width/2+(point.lon-camera.lon)*scale,y:height/2-(point.lat-camera.lat)*scale}}
 function frame(points,width,height){
  const xs=points.map(p=>p.lon),ys=points.map(p=>p.lat),lon=(Math.min(...xs)+Math.max(...xs))/2,lat=(Math.min(...ys)+Math.max(...ys))/2;
  const sx=Math.max(80,width-150)/Math.max(3,Math.max(...xs)-Math.min(...xs));
  const sy=Math.max(80,height-210)/Math.max(3,Math.max(...ys)-Math.min(...ys));
  const zoom=clamp(Math.min(sx,sy)*375/Math.max(1,width),2,26),scale=width/375*zoom;
  return{lon,lat:lat+20/scale,zoom};
 }
 function curve(a,b){const distance=Math.hypot(a.x-b.x,a.y-b.y);return{a,b,c:{x:(a.x+b.x)/2,y:(a.y+b.y)/2-Math.min(95,distance*.2)}}}
 function pointOn(curve,t){const u=1-t;return{x:u*u*curve.a.x+2*u*t*curve.c.x+t*t*curve.b.x,y:u*u*curve.a.y+2*u*t*curve.c.y+t*t*curve.b.y}}
 function overlaps(a,b,gap=5){return a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y}
 function label(pin,textWidth,width,height,occupied){
  const w=textWidth+18,h=26;
  const offsets=[[16,-31],[16,9],[-w-16,-31],[-w-16,9],[-w/2,-49],[-w/2,25]];
  for(const [dx,dy]of offsets){const box={x:pin.x+dx,y:pin.y+dy,w,h};if(box.x<10||box.x+w>width-10||box.y<96||box.y+h>height-39)continue;if(!occupied.some(r=>overlaps(box,r)))return box}
  return null;
 }
 const api={project,frame,curve,pointOn,overlaps,label};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AtlasGeometry=api;
})(typeof window!=='undefined'?window:this);
