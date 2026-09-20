/* Layered neural signal field. Decorative and driven by the hero's shared clock. */
(function(root){
 'use strict';
 const Flow=typeof module!=='undefined'&&module.exports?require('./thought-flow.js'):root.ThoughtFlow;
 const Space=typeof module!=='undefined'&&module.exports?require('./kinetic-space.js'):root.KineticSpace;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const smooth=(a,b,v)=>{const p=clamp((v-a)/(b-a));return p*p*(3-2*p)};
 function spring(position,velocity,target,dt){
  const damping=7.2,frequency=7.5,offset=position-target,e=Math.exp(-damping*dt);
  const c=Math.cos(frequency*dt),s=Math.sin(frequency*dt),b=(velocity+damping*offset)/frequency;
  return{position:target+e*(offset*c+b*s),velocity:e*((b*frequency-damping*offset)*c-(offset*frequency+damping*b)*s)};
 }
 function graph(small){
  const counts=small?[3,4,5,4,2]:[3,5,7,5,3],layers=counts.length,nodes=[],edges=[],offsets=[];
  for(let layer=0;layer<layers;layer++){
   offsets.push(nodes.length);
   for(let slot=0;slot<counts[layer];slot++)nodes.push({index:nodes.length,layer,slot,group:layer===0?0:layer===layers-1?2:1,phase:layer*1.7});
  }
  // Fully connected adjacent layers make the neural architecture legible.
  for(let layer=0;layer<layers-1;layer++)for(let a=0;a<counts[layer];a++)for(let b=0;b<counts[layer+1];b++)edges.push([offsets[layer]+a,offsets[layer+1]+b]);
  const neighbors=nodes.map(()=>[]);
  for(const [a,b] of edges){neighbors[a].push(b);neighbors[b].push(a)}
  return{nodes,edges,neighbors,counts,layers,maxCount:Math.max(...counts)};
 }
 function distances(graph,seed){
  const result=graph.nodes.map(()=>Infinity),queue=[seed];result[seed]=0;
  for(let at=0;at<queue.length;at++)for(const next of graph.neighbors[queue[at]])if(!Number.isFinite(result[next])){result[next]=result[queue[at]]+1;queue.push(next)}
  return result;
 }
 // All axes use the same camera scale. Nodes occupy a volume, not a flat card.
 function geometry(layout,small,time,yaw,pitch,reduced=false){
  return layout.nodes.map(n=>{
   const across=n.layer/(layout.layers-1)*2-1,along=(n.slot-(layout.counts[n.layer]-1)/2)/(layout.maxCount-1)*2;
   let x=small?along*.84:across*1.48,y=small?across*1.3:along*.92;
   const z=Math.sin(n.slot*2.39996+n.layer*.9)*.64+Math.cos(n.layer*1.1)*.16;
   if(!reduced){x+=Math.sin(time*.16+n.phase)*.012;y+=Math.cos(time*.13+n.phase)*.014}
   const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);
   const yy=y*Math.cos(pitch)-zz*Math.sin(pitch),depth=y*Math.sin(pitch)+zz*Math.cos(pitch),perspective=4.8/(4.8-depth);
   return{...n,x:xx*perspective,y:yy*perspective,depth,perspective};
  });
 }
 function create(){
  const layouts=[graph(false),graph(true)],sequence=Flow.createSequence(),palette=[[170,83,47],[42,83,188],[83,117,91]];
  let aimX=.5,aimY=.5,px=.5,py=.5,touching=false,force=0,velocity=0,pending=null,groupMix=0,cameraScale=0,previousWidth=0,previousHeight=0,lastFocus=-1,cachedPlan=null,planKey='';
  function point(x,y){aimX=clamp(x);aimY=clamp(y);touching=true}
  function release(){touching=false}
  function pulse(x,y){point(x,y);pending={x:aimX,y:aimY}}
  function draw(ctx,state){
   const {width:w,height:h,small,dt,time,shapeTime=time,yaw,pitch,progress,focusGroup,focusTopic=-1,welcomeTime=-1,opening=-1,reduced,paused}=state;
   if(w<=0||h<=0)return false;
   const unfolding=opening>=0&&!reduced;
   const layout=layouts[small?1:0],fade=(1-smooth(.12,.78,progress))*(reduced||paused?1:smooth(0,1.2,time));
   const target=touching&&!reduced&&!paused?1:0,next=spring(force,velocity,target,dt);
   force=reduced?0:next.position;velocity=reduced?0:next.velocity;
   const easing=1-Math.exp(-dt/.16);px+=(aimX-px)*easing;py+=(aimY-py)*easing;
   const groupTarget=focusGroup>=0?1:0;groupMix=reduced?groupTarget:groupMix+(groupTarget-groupMix)*easing;
   if(reduced||paused)pending=null;
   if(focusTopic!==lastFocus){if(focusTopic>=0)sequence.request(focusTopic);lastFocus=focusTopic;}
   const greeting=welcomeTime>=0&&!reduced?Flow.welcome(welcomeTime):null;
   const flow=sequence.update(time),nextPlanKey=String(small)+':'+flow.seed;
   if(nextPlanKey!==planKey){cachedPlan=Flow.plan(layout,flow.seed);planKey=nextPlanKey;}
   const frame=Space.frame(w,h,small),cy=frame.cy,turn=yaw-.32,tilt=pitch+.20;
   const model=geometry(layout,small,shapeTime,turn,tilt,reduced);
   const availableY=Math.min(cy-frame.top,frame.bottom-cy),availableX=(frame.right-frame.left)/2;
   const baseScale=Math.min(availableX/(small?.9:1.5),availableY/(small?1.35:1.05));
   const extentX=Math.max(...model.map(n=>Math.abs(n.x))),extentY=Math.max(...model.map(n=>Math.abs(n.y)));
   const targetScale=Math.min(availableX/Math.max(.2,extentX),availableY/Math.max(.2,extentY),baseScale*1.25);
   if(!cameraScale||w!==previousWidth||h!==previousHeight||reduced)cameraScale=targetScale;
   else cameraScale+=(targetScale-cameraScale)*(1-Math.exp(-dt/.12));
   previousWidth=w;previousHeight=h;
   const projected=model.map(n=>{
    const birth=unfolding?smooth(.55+n.layer*.29,1.7+n.layer*.29,opening):1;
    const expansion=1-Math.pow(1-birth,3);
    let sx=frame.cx+n.x*cameraScale*expansion,sy=cy+n.y*cameraScale*expansion;
    const dx=sx-px*w,dy=sy-py*h,distance=Math.hypot(dx,dy),radius=small?100:185,weight=Math.exp(-distance*distance/(radius*radius));
    sx+=dx*.045*weight*force;sy+=dy*.045*weight*force;
    sy+=(h*.77-sy)*smooth(.18,.85,progress);
    const edge=smooth(8,35,sx)*(1-smooth(w-35,w-8,sx))*smooth(82,132,sy)*(1-smooth(h-(small?210:145),h-(small?170:105),sy));
    return{...n,x:sx,y:sy,weight,birth,alpha:birth*edge*(.42+.58*clamp((n.depth+1.7)/3.4)),connectionAlpha:birth*(.5+.5*clamp((n.depth+1.7)/3.4)),activation:0};
   });
   if(pending){
    let seed=0,best=Infinity;
    for(const n of projected){const d=Math.hypot(n.x-pending.x*w,n.y-pending.y*h);if(d<best){best=d;seed=n.index}}
    sequence.request(seed);pending=null;
   }
   for(const n of projected){
    const weight=cachedPlan.weights[n.index];
    const activation=reduced?0:Flow.activation(flow.age,n.layer,weight)*.9;
    n.activation=activation;
    if(focusTopic>=0){n.alpha*=.65+weight*.35;n.connectionAlpha*=.72+weight*.28;}
   }
   const active=Math.abs(force-target)+Math.abs(velocity)>.001||Math.abs(groupMix-groupTarget)>.001||Math.abs(cameraScale-targetScale)>.02;
   if(fade<.002)return active;
   ctx.save();ctx.beginPath();ctx.rect(0,76,w,Math.max(0,h-(small?245:170)));ctx.clip();
   // The first impulse is the origin of the same volume that stays on screen.
   if(unfolding&&opening<1.9){
    const alpha=1-smooth(.8,1.9,opening),r=3.5+Math.sin(Math.min(opening,1.2)*Math.PI)*1.5;
    const halo=ctx.createRadialGradient(frame.cx,cy,0,frame.cx,cy,32);
    halo.addColorStop(0,`rgba(185,65,45,${alpha*.2})`);halo.addColorStop(1,'rgba(185,65,45,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(frame.cx,cy,32,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=`rgba(178,66,45,${alpha})`;ctx.beginPath();ctx.arc(frame.cx,cy,r,0,Math.PI*2);ctx.fill();
   }
   const primitives=[];
   function along(a,b,t){
    const perspective=a.perspective+(b.perspective-a.perspective)*t;
    return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,depth:4.8-4.8/perspective,perspective};
   }
   for(const [from,to] of layout.edges){
    const a=projected[from],b=projected[to],alpha=Math.min(a.connectionAlpha,b.connectionAlpha)*fade;
    if(alpha<.002)continue;
    const routeWeight=cachedPlan.edgeWeight(from,to),activation=Math.max(a.activation,b.activation)*routeWeight,color=palette[greeting?[2,2,1,1,0][a.layer]:focusGroup>=0?focusGroup:a.group],segments=small?4:6;
    for(let k=0;k<segments;k++){
     const fromPoint=along(a,b,k/segments),toPoint=along(a,b,(k+1)/segments);
     primitives.push({kind:'edge',a:fromPoint,b:toPoint,depth:(fromPoint.depth+toPoint.depth)/2,color:activation>.08?color:'81,99,123',alpha:alpha*(.25+activation*.4),width:.75+activation*.65,energy:activation});
    }
    function signal(t,strength){
     if(strength<.01)return;
     const p=along(a,b,t),tail=along(a,b,Math.max(0,t-.14));
     primitives.push({kind:'edge',a:tail,b:p,depth:(tail.depth+p.depth)/2,color,alpha:alpha*strength*.7,width:1.5*p.perspective,energy:strength*.45});
     primitives.push({...p,kind:'signal',color,alpha:alpha*strength});
    }
    if(!reduced&&flow.active){
     const t=Flow.packet(flow.age,a.layer);
     if(t>=0&&t<=1&&routeWeight>0)signal(t,.9*routeWeight*Math.sin(t*Math.PI));
    }
   }
   for(const node of projected)primitives.push({kind:'node',depth:node.depth,node});
   // Interleave connections, traveling signals and neurons from back to front.
   for(const item of primitives.sort((a,b)=>a.depth-b.depth)){
    if(item.kind==='edge'){
     ctx.beginPath();ctx.moveTo(item.a.x,item.a.y);ctx.lineTo(item.b.x,item.b.y);
     if(item.energy>.12){ctx.strokeStyle=`rgba(${item.color},${item.alpha*.15})`;ctx.lineWidth=item.width+3;ctx.stroke()}
     ctx.strokeStyle=`rgba(${item.color},${item.alpha})`;ctx.lineWidth=item.width;ctx.stroke();
     if(item.energy>.3){ctx.strokeStyle=`rgba(225,237,251,${item.alpha*.7})`;ctx.lineWidth=.4;ctx.stroke()}continue;
    }
    if(item.kind==='signal'){
     const halo=ctx.createRadialGradient(item.x,item.y,0,item.x,item.y,7*item.perspective);
     halo.addColorStop(0,`rgba(${item.color},${item.alpha*.45})`);halo.addColorStop(1,`rgba(${item.color},0)`);
     ctx.beginPath();ctx.arc(item.x,item.y,7*item.perspective,0,Math.PI*2);ctx.fillStyle=halo;ctx.fill();
     ctx.beginPath();ctx.arc(item.x,item.y,2.4*item.perspective,0,Math.PI*2);ctx.fillStyle=`rgba(${item.color},${item.alpha})`;ctx.fill();continue;
    }
    const n=item.node;if(n.birth<.005)continue;
    const alpha=n.alpha*fade,color=palette[greeting?[2,2,1,1,0][n.layer]:focusGroup>=0&&cachedPlan.weights[n.index]>0?focusGroup:n.group],radius=((small?5:6.5)+n.activation*1.4)*n.perspective;
    if(n.activation>.02){const halo=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,18);halo.addColorStop(0,`rgba(${color},${alpha*n.activation*.2})`);halo.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=halo;ctx.beginPath();ctx.arc(n.x,n.y,18,0,Math.PI*2);ctx.fill()}
    ctx.beginPath();ctx.arc(n.x,n.y,radius+1.5,0,Math.PI*2);ctx.fillStyle=`rgba(244,243,239,${fade*n.birth})`;ctx.fill();
    const lightX=n.x-radius*(.34-Math.sin(turn)*.1),lightY=n.y-radius*.4;
    const material=ctx.createRadialGradient(lightX,lightY,.1,n.x,n.y,radius);
    material.addColorStop(0,`rgba(255,255,255,${fade*n.birth})`);material.addColorStop(.5,`rgba(247,249,250,${fade*n.birth})`);material.addColorStop(1,`rgba(${color},${alpha*(.13+n.activation*.15)})`);
    ctx.beginPath();ctx.arc(n.x,n.y,radius,0,Math.PI*2);ctx.fillStyle=material;ctx.fill();
    ctx.beginPath();ctx.arc(lightX,lightY,Math.max(.6,n.perspective*.85),0,Math.PI*2);ctx.fillStyle=`rgba(255,255,255,${alpha*.9})`;ctx.fill();
    ctx.beginPath();ctx.arc(n.x,n.y,radius,0,Math.PI*2);ctx.strokeStyle=`rgba(${color},${alpha*(.65+n.activation*.3)})`;ctx.lineWidth=1.2;ctx.stroke();
    ctx.beginPath();ctx.arc(n.x,n.y,1.4+n.activation*1.1,0,Math.PI*2);ctx.fillStyle=`rgba(${color},${alpha*(.35+n.activation*.6)})`;ctx.fill();
   }
   ctx.restore();return active;
  }
  return{point,release,pulse,draw};
 }
 const api={spring,graph,distances,geometry,create};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.NeuralSpace=api;
})(typeof window!=='undefined'?window:this);
