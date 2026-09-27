(function(root){
 'use strict';
 const TAU=Math.PI*2;
 // Camera space is shared by labels, suspension contours and their attachments.
 // The camera remains outside the bounded sculpture through unrestricted rotation.
 function rotate(p,yaw,pitch){
  const x=p.x*Math.cos(yaw)+p.z*Math.sin(yaw),z=-p.x*Math.sin(yaw)+p.z*Math.cos(yaw);
  return{x,y:p.y*Math.cos(pitch)-z*Math.sin(pitch),z:p.y*Math.sin(pitch)+z*Math.cos(pitch)};
 }
 function position(index,time,count=24){
  const slot=(index*7)%count,latitude=1-2*(slot+.5)/count;
  const phase=slot*2.399963229728653,timeScale=.023+(index%5)*.004;
  const angle=phase+time*timeScale*(index%3===1?-1:1);
  const y=latitude*.87+Math.sin(time*.16+phase)*.055;
  const radius=.84+(index%4)*.046;
  const ring=Math.sqrt(Math.max(0,1-y*y))*radius;
  return rotate({x:Math.cos(angle)*ring,y:y*radius,z:Math.sin(angle)*ring},.3,Math.sin(time*.07+index)*.065);
 }
 function contour(group,angle,time){
  const r=.94+group*.04;
  const p={x:Math.cos(angle)*r,y:Math.sin(angle)*r*.72,z:Math.sin(angle)*r*.24};
  return rotate(p,[-.4,.95,-.85][group]+Math.sin(time*.06+group)*.08,[-.45,.55,1.1][group]);
 }
 function frame(width,height,small){
  return {cx:width*.5,cy:height/2-(small?30:0),rx:width*(small?.40:.38),ry:Math.max(80,(height-(small?320:245))*.43),left:12,right:width-12,top:small?160:115,bottom:height-(small?180:115)};
 }
 function project(p,width,height,small){
  const perspective=3.8/(3.8-p.z),f=frame(width,height,small);
  return{x:f.cx+p.x*f.rx*perspective,y:f.cy+p.y*f.ry*perspective,z:p.z,perspective,scale:Math.pow(perspective,small?.9:1.22)};
 }
 const api={rotate,position,contour,project,frame,TAU};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.KineticSpace=api;
})(typeof window!=='undefined'?window:this);
