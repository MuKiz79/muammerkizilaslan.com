const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {framesFor}=require('../journey-scroll.js');
const mobilePath=require('../journey-path.js').mobile;

// Independently interpolate the keyframes the browser receives and compare them
// with the existing route, including every seam, reverse travel and reduced motion.
function sample(frames,progress){
  let i=0;
  while(i<frames.length-2&&frames[i+1].offset<=progress)i++;
  const a=frames[i],b=frames[i+1];
  const linear=Math.max(0,Math.min(1,(progress-a.offset)/(b.offset-a.offset)));
  const t=a.easing==='linear'?linear:linear*linear*(3-2*linear);
  const xy=frame=>frame.transform.match(/translate3d\(([-\d.e]+)px,([-\d.e]+)px,0\)/).slice(1).map(Number);
  const [ax,ay]=xy(a),[bx,by]=xy(b);
  return{x:ax+(bx-ax)*t,y:ay+(by-ay)*t,opacity:a.opacity+(b.opacity-a.opacity)*t};
}
let comparisons=0;
for(const [width,height] of [[320,568],[390,844],[430,932],[700,900]]){
  for(const reduced of [false,true]){
    const path=mobilePath(width,height,[height,1400,3200,height-10,1800].map((h,i)=>({height:h,direction:['right','down','up','right','up'][i]})));
    const tracks=framesFor(path,width,height,reduced);
    const positions=new Set([0,path.total]);
    for(let t=0;t<=path.total;t+=7.31)positions.add(t);
    for(const s of path.stops)for(const t of [s.start,s.panStart+s.pan,s.turnStart,s.end])for(const d of [-.001,0,.001])positions.add(Math.max(0,Math.min(path.total,t+d)));
    for(const t of [...positions].reverse()){
      const state=path.sample(t,reduced);
      for(const expected of state.frames){
        const scene=sample(tracks[expected.index].scene,t/path.total);
        const content=sample(tracks[expected.index].content,t/path.total);
        for(const property of ['x','y','opacity'])assert.ok(Math.abs(scene[property]-expected[property])<1e-8,property+' matches the original route at '+t);
        assert.ok(Math.abs(content.y-expected.contentY)<1e-8,'long reading ranges match');
        comparisons++;
      }
      for(const [i,track] of tracks.entries()){
        if(state.frames.some(frame=>frame.index===i))continue;
        const scene=sample(track.scene,t/path.total);
        assert.ok(scene.opacity<1e-8||Math.abs(scene.x)>=width-1e-8||Math.abs(scene.y)>=height-1e-8,'inactive chapters stay offscreen or transparent');
      }
    }
  }
}
console.log('PASS: '+comparisons+' browser-keyframe comparisons with the existing mobile route');

const source=fs.readFileSync(require.resolve('../journey-scroll.js'),'utf8');
function fixture({supported=true,failAt=Infinity}={}){
  const animations=[];
  const root={Animation:function(){}};
  if(supported){root.ScrollTimeline=class{constructor(options){this.options=options}};root.Animation.prototype.rangeStart='normal';}
  const context={window:root,document:{documentElement:{}}};
  vm.runInNewContext(source,context);
  const elements=Array.from({length:3},()=>({animate(frames,options){
    if(animations.length===failAt)throw new Error('unsupported animation');
    const animation={frames,options,canceled:false,cancel(){this.canceled=true}};
    animations.push(animation);return animation;
  }}));
  const path=mobilePath(390,844,[1400,844,1800].map(height=>({height,direction:'right'})));
  return{animations,run:()=>root.JourneyScroll.create({path,width:390,height:844,top:1384,scenes:elements,contents:elements}),path};
}
const supported=fixture(),driver=supported.run();
assert.equal(supported.animations.length,6);
for(const a of supported.animations){assert.equal(a.options.rangeStart,'1384px');assert.equal(a.options.rangeEnd,(1384+supported.path.total)+'px');assert.equal(a.options.duration,'auto');}
driver.cancel();assert.ok(supported.animations.every(a=>a.canceled));
const unsupported=fixture({supported:false});assert.equal(unsupported.run(),null);assert.equal(unsupported.animations.length,0);
const partial=fixture({failAt:3});assert.equal(partial.run(),null);assert.ok(partial.animations.every(a=>a.canceled));
console.log('PASS: pixel ranges, teardown, unavailable API and partial-failure fallback');

for(const name of ['main.js','en/main.js']){
  const main=fs.readFileSync(require.resolve('../'+name),'utf8');
  let motionWrites=0;
  const style=new Proxy({},{set(){motionWrites++;return true}});
  const scene={style};
  const context={
    path:{sample:()=>({index:0,frames:[{index:0,x:0,y:0,contentY:-123.25,opacity:1}]})},
    currentTravel:123.25,maxTravel:4000,reduce:{matches:false},mobile:{matches:true},nativeJourney:{},
    scenes:[scene],sceneContents:[{style}],paintedFrames:'',paintedScene:0,activeScene:0,
    routeNav:{style:{setProperty(){}}}
  };
  vm.createContext(context);
  vm.runInContext(main.slice(main.indexOf('function renderJourney()'),main.indexOf('function updateJourney(dt)')),context);
  context.renderJourney();assert.equal(motionWrites,0,'native scrolling never receives JS motion or visibility writes');
  context.nativeJourney=null;context.renderJourney();assert.ok(motionWrites>=3,'older browsers still render the complete route');
}
console.log('PASS: both languages leave browser-owned motion untouched and retain the legacy renderer');
