/* A volumetric, layered neural sculpture. Sparse impulses reveal its structure. */
(()=>{'use strict';
const counts=[4,7,10,12,10,7,4],nodes=[],edges=[],starts=[];
for(let layer=0;layer<counts.length;layer++){
 starts.push(nodes.length);
 for(let i=0;i<counts[layer];i++){
  const a=i*2.399963+layer*.38,r=Math.sqrt((i+.5)/counts[layer])*(74+Math.sin(layer/6*Math.PI)*37);
  nodes.push({x:(layer-3)*67,y:Math.cos(a)*r,z:Math.sin(a)*r,layer,slot:i});
 }
}
for(let l=0;l<6;l++)for(let a=starts[l];a<starts[l]+counts[l];a++){
 const next=nodes.map((n,i)=>({n,i})).filter(p=>p.n.layer===l+1).sort((p,q)=>Math.hypot(nodes[a].y-p.n.y,nodes[a].z-p.n.z)-Math.hypot(nodes[a].y-q.n.y,nodes[a].z-q.n.z));
 for(const b of next.slice(0,3))edges.push([a,b.i]);
}
const path=[starts[0]+1];for(let l=0;l<6;l++)path.push(edges.find(e=>e[0]===path[l])[1]);
window.IntroSpace={create(canvas){
 const ctx=canvas.getContext('2d');let frame=0,start=0;
 function draw(ms,reduced=false){
  const t=reduced?3.3:(ms-start)/1000,w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const small=w<700,cx=w*(small?.5:.74),cy=h*(small?.30:.46),scale=Math.min(w/(small?495:950),h/590),yaw=-.76+t*.27,pitch=.22+Math.sin(t*.42)*.13;
  const reveal=Math.min(1,Math.max(0,t/.9)),ease=1-Math.pow(1-reveal,3),unfold=1.4-.4*ease;
  const pts=nodes.map(p=>{const xx=p.x*Math.cos(yaw)+p.z*Math.sin(yaw),zz=-p.x*Math.sin(yaw)+p.z*Math.cos(yaw),y=p.y*Math.cos(pitch)-zz*Math.sin(pitch),depth=p.y*Math.sin(pitch)+zz*Math.cos(pitch),perspective=650/(650-depth);return{x:cx+xx*scale*perspective*unfold,y:cy+y*scale*perspective*unfold,z:depth,s:perspective}});
  const mask=x=>small?1:Math.max(.025,Math.min(1,(x-w*.47)/(w*.15)));
  const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,250*scale);glow.addColorStop(0,'rgba(166,184,177,.12)');glow.addColorStop(1,'rgba(166,184,177,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  // Edges are depth sorted, with a small curve so layers read as a volume.
  edges.slice().sort((a,b)=>(pts[a[0]].z+pts[a[1]].z)-(pts[b[0]].z+pts[b[1]].z)).forEach(([a,b])=>{
   const p=pts[a],q=pts[b],growth=Math.min(1,Math.max(0,(t-.14-nodes[a].layer*.12)*1.8));if(!growth)return;
   const depth=(p.s+q.s)/2,alpha=(.075+.14*(depth-.55))*growth*mask((p.x+q.x)/2);
   ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo((p.x+q.x)/2,(p.y+q.y)/2-5*scale,q.x,q.y);ctx.strokeStyle=`rgba(69,91,99,${alpha})`;ctx.lineWidth=.45+depth*.25;ctx.stroke();
  });
  // One considered signal travels layer by layer; no random flashing.
  const travel=Math.max(0,(t-1)*2),leg=Math.floor(travel),u=travel-leg;
  if(leg<6&&t>1&&!reduced){const a=pts[path[leg]],b=pts[path[leg+1]],x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u;
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(x,y);ctx.strokeStyle='rgba(177,62,44,.7)';ctx.lineWidth=1.2;ctx.stroke();
   const halo=ctx.createRadialGradient(x,y,0,x,y,12*scale);halo.addColorStop(0,'rgba(195,70,50,.28)');halo.addColorStop(1,'rgba(195,70,50,0)');ctx.fillStyle=halo;ctx.beginPath();ctx.arc(x,y,12*scale,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b74734';ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill();
  }
  [...pts.keys()].sort((a,b)=>pts[a].z-pts[b].z).forEach(i=>{
   const p=pts[i],visible=Math.min(1,Math.max(0,(t-nodes[i].layer*.08)*2))*mask(p.x);if(!visible)return;
   const r=(2.6+nodes[i].slot%3*.5)*p.s*(small?.9:1),active=path.includes(i)&&path.indexOf(i)<=travel;
   ctx.globalAlpha=visible*(.42+Math.min(.58,p.s*.38));
   const sphere=ctx.createRadialGradient(p.x-r*.35,p.y-r*.4,.1,p.x,p.y,r);sphere.addColorStop(0,'#ffffff');sphere.addColorStop(.4,active?'#efd0c6':'#e4eae7');sphere.addColorStop(1,active?'#af6552':'#6f8790');
   ctx.fillStyle=sphere;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=active?'rgba(160,62,43,.5)':'rgba(73,95,103,.25)';ctx.lineWidth=.6;ctx.stroke();ctx.globalAlpha=1;
  });
 }
 return{start(reduced){cancelAnimationFrame(frame);start=performance.now();if(reduced){draw(start,true);return}function tick(ms){draw(ms);frame=requestAnimationFrame(tick)}frame=requestAnimationFrame(tick)},stop(){cancelAnimationFrame(frame)}};
}};
})();
