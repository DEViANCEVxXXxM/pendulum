import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {DEFAULTS, RAD, rk4, positions, energy, begin, separation, deg} from './chaos-physics.js';

// CHAOS — Double Pendulum Observatory. The 3D apparatus visualises a rigorous
// planar point-mass model; a second solution changes theta_1 by only delta.
const $=id=>document.getElementById(id);
const STATE={...DEFAULTS,elapsed:0};
const scene=new THREE.Scene();scene.background=new THREE.Color(0x060910);
scene.fog=new THREE.FogExp2(0x060910,.0075);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.54;renderer.shadowMap.enabled=false;
$('canvas-container').append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,200);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.065;controls.enablePan=true;
controls.minDistance=6.8;controls.maxDistance=60;controls.minPolarAngle=.13;controls.maxPolarAngle=2.68;
const PRESETS=[
 {name:'Observatory',pos:[2.2,2.45,23.6],target:[-1.1,-.80,0],title:'Order, becoming chaos.',detail:'Two pendulums begin almost alike. Their trajectories slowly diverge into unpredictability.'},
 {name:'Side Study',pos:[12.5,1.9,12.8],target:[-2.0,-1.05,-.1],title:'Anatomy of motion.',detail:'A raking view reveals the mass distribution, joint geometry and coupled rods.'},
 {name:'Light Trails',pos:[-10.7,-1.4,12.6],target:[-2.4,-1.1,-.15],title:'A memory in light.',detail:'Every luminous stroke is a recent position from the numerical solution.'},
 {name:'Phase Space',pos:[12.4,1.0,9.3],target:[8.5,-1.15,-2.1],title:'Beyond position.',detail:'Angle versus angular velocity reveals the nonlinear structure of the motion.'}
];
let activePreset=0,moveCamera=null;
function selectPreset(i,instant=false){
 activePreset=i;
 document.querySelectorAll('.dock-btn').forEach((b,j)=>b.classList.toggle('active',i===j));
 $('sceneViewTitle').textContent=PRESETS[i].title;
 $('sceneViewDescription').textContent=PRESETS[i].detail;
 $('sceneViewIndex').textContent=String(i+1).padStart(2,'0')+' / 04';
 $('statView').textContent=PRESETS[i].name;
 if(i===3&&!STATE.phase){STATE.phase=true;$('tPhase').checked=true;phaseGroup.visible=true;}
 if(instant){camera.position.set(...PRESETS[i].pos);controls.target.set(...PRESETS[i].target);controls.update();return;}
 moveCamera={t:0,from:camera.position.clone(),focus:controls.target.clone(),to:new THREE.Vector3(...PRESETS[i].pos),aim:new THREE.Vector3(...PRESETS[i].target)};
}
controls.addEventListener('start',()=>{moveCamera=null;});
selectPreset(0,true);

// Cinematic gallery lighting: warm reference and cool perturbed trajectory.
scene.add(new THREE.HemisphereLight(0xb5d3ff,0x0c1525,1.6));
const key=new THREE.DirectionalLight(0xffe5bf,2.0);key.position.set(-5,13,13);scene.add(key);
const rim=new THREE.PointLight(0x73a9ff,56,27,2);rim.position.set(-8,1,-5);scene.add(rim);
const amber=new THREE.PointLight(0xffae65,55,23,2);amber.position.set(2,-2,6);scene.add(amber);
const pale=new THREE.PointLight(0xbceaff,20,15,2);pale.position.set(9,2,4);scene.add(pale);
const MAT={
 steel:new THREE.MeshStandardMaterial({color:0x4b5d75,metalness:.85,roughness:.30}),
 graphite:new THREE.MeshStandardMaterial({color:0x101923,metalness:.74,roughness:.34}),
 silver:new THREE.MeshStandardMaterial({color:0xa9bbcf,metalness:.8,roughness:.25}),
 amber:new THREE.MeshStandardMaterial({color:0xffb66b,metalness:.38,roughness:.22,emissive:0xa45113,emissiveIntensity:.55}),
 cyan:new THREE.MeshStandardMaterial({color:0x81e2ff,metalness:.36,roughness:.25,emissive:0x126c9b,emissiveIntensity:.64}),
 glass:new THREE.MeshPhysicalMaterial({color:0x91b4ce,transparent:true,opacity:.07,roughness:.15,metalness:.14,depthWrite:false,side:THREE.DoubleSide})
};
function box(w,h,d,x,y,z,mat,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;}
function cylinder(r1,r2,h,x,y,z,mat,parent=scene,segments=20){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat);m.position.set(x,y,z);parent.add(m);return m;}
function line(points,color,opacity=.55,parent=scene){const g=new THREE.BufferGeometry().setFromPoints(points);const m=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false}));parent.add(m);return m;}
function circle(r,x,y,z,color,opacity=.22,n=164,parent=scene){const p=[];for(let i=0;i<=n;i++){const a=i*2*Math.PI/n;p.push(new THREE.Vector3(x+r*Math.cos(a),y+r*Math.sin(a),z));}return line(p,color,opacity,parent);}
// Stage: a horizontal truss behind the mechanism, precision calibration rings
// and a genuinely separate illuminated phase-portrait instrument to the right.
const rig=new THREE.Group();scene.add(rig);
box(14,.19,.35,-1,4.45,-1.4,MAT.steel,rig);
box(14,.06,.08,-1,4.66,-1.38,MAT.silver,rig);
for(const xx of [-7.55,5.55]){
 box(.26,11.8,.27,xx,-1.5,-1.65,MAT.graphite,rig);
 for(let y=-6;y<=3.8;y+=1.4){box(.37,.055,.4,xx,y,-1.65,MAT.silver,rig);}
}
for(let i=0;i<11;i++){
 const x=-7.25+i*1.18;
 box(.065,.37,.40,x,4.45,-1.4,i%2?MAT.graphite:MAT.silver,rig);
}
const pivot=new THREE.Vector3(-2.0,2.60,.20),unit=1.72;
const mount=cylinder(.39,.39,.52,pivot.x,pivot.y,pivot.z,MAT.graphite,rig);
mount.rotation.x=Math.PI/2;
const axle=cylinder(.26,.26,.65,pivot.x,pivot.y,pivot.z,MAT.silver,rig);
axle.rotation.x=Math.PI/2;
const pivotLED=new THREE.Mesh(new THREE.SphereGeometry(.1,14,12),new THREE.MeshBasicMaterial({color:0xffdea5}));pivotLED.position.set(pivot.x,pivot.y,pivot.z+.38);rig.add(pivotLED);
const guideGroup=new THREE.Group();scene.add(guideGroup);
const ringGroup=new THREE.Group();guideGroup.add(ringGroup);
function resetRings(){
 for(const c of [...ringGroup.children]){ringGroup.remove(c);c.geometry?.dispose();c.material?.dispose();}
 circle(STATE.L1*unit,pivot.x,pivot.y,-1.0,0x77a2bc,.19,172,ringGroup);
 circle((STATE.L1+STATE.L2)*unit,pivot.x,pivot.y,-1.12,0xf6bb70,.18,200,ringGroup);
 const radius=(STATE.L1+STATE.L2)*unit;
 for(let i=0;i<48;i++){
  const a=i*Math.PI/24;const r1=radius+.08,r2=radius+(i%4===0?.45:.23);
  line([new THREE.Vector3(pivot.x+Math.sin(a)*r1,pivot.y+Math.cos(a)*r1,-1.06),
        new THREE.Vector3(pivot.x+Math.sin(a)*r2,pivot.y+Math.cos(a)*r2,-1.06)],0x87a6b9,i%4===0?.3:.13,ringGroup);
 }
 const yy0=pivot.y-radius;
 line([new THREE.Vector3(pivot.x, pivot.y+radius+.5,-1.18),new THREE.Vector3(pivot.x, yy0-.5,-1.18)],0x9eacc1,.12,ringGroup);
 line([new THREE.Vector3(pivot.x-radius-.6,pivot.y,-1.18),new THREE.Vector3(pivot.x+radius+.6,pivot.y,-1.18)],0x9eacc1,.11,ringGroup);
}
resetRings();
// Gallery floor: restraint keeps the simulation central rather than an arbitrary box.
const stageFloor=new THREE.Group();scene.add(stageFloor);
const floorMesh=new THREE.Mesh(new THREE.PlaneGeometry(52,39),new THREE.MeshStandardMaterial({color:0x111927,roughness:.93,metalness:.15,transparent:true,opacity:.80,side:THREE.DoubleSide}));
floorMesh.rotation.x=-Math.PI/2;floorMesh.position.y=-6.95;stageFloor.add(floorMesh);
const grid=new THREE.GridHelper(48,36,0x39455b,0x283348);grid.position.y=-6.927;
for(const mat of (Array.isArray(grid.material)?grid.material:[grid.material])){mat.opacity=.25;mat.transparent=true;mat.depthWrite=false;}stageFloor.add(grid);
const floorRings=new THREE.Group();stageFloor.add(floorRings);
for(const radius of [3,6,10]){
 const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.009,4,120),new THREE.MeshBasicMaterial({color:0x45556f,transparent:true,opacity:.22}));
 ring.rotation.x=Math.PI/2;ring.position.set(-2,-6.9,0);floorRings.add(ring);
}
// Subtle distant stars/dust add depth while avoiding misleading physical forces.
let seed=41777;function random(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;}
const starCount=1650,stars=new Float32Array(starCount*3);
for(let i=0;i<starCount;i++){stars[i*3]=-35+random()*70;stars[i*3+1]=-9+random()*32;stars[i*3+2]=-26+random()*10;}
const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.BufferAttribute(stars,3));
const starPoints=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0x7895be,transparent:true,opacity:.22,size:.055,depthWrite:false}));scene.add(starPoints);
// High-quality soft glow texture created locally (no image downloads).
const texCanvas=document.createElement('canvas');texCanvas.width=128;texCanvas.height=128;
const ctx=texCanvas.getContext('2d');const gr=ctx.createRadialGradient(64,64,0,64,64,64);
gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.23,'rgba(255,255,255,.6)');gr.addColorStop(.64,'rgba(255,255,255,.12)');gr.addColorStop(1,'rgba(255,255,255,0)');
ctx.fillStyle=gr;ctx.fillRect(0,0,128,128);const haloTexture=new THREE.CanvasTexture(texCanvas);
function halo(hex,s){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:haloTexture,color:hex,transparent:true,opacity:.50,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true}));m.scale.set(s,s,1);scene.add(m);return m;}
const rodGeo=new THREE.CylinderGeometry(.045,.051,1,14),jointGeo=new THREE.SphereGeometry(1,24,18);
const yaxis=new THREE.Vector3(0,1,0);
function makePendulum(color,rodMaterial,zShift,main){
 const rods=[new THREE.Mesh(rodGeo,rodMaterial),new THREE.Mesh(rodGeo,rodMaterial)];
 const joints=[new THREE.Mesh(jointGeo,color),new THREE.Mesh(jointGeo,color)];
 rods.forEach(m=>{scene.add(m);});joints.forEach(m=>scene.add(m));
 joints[0].scale.setScalar(main?.20:.15);joints[1].scale.setScalar(main?.33:.23);
 const aura=halo(main?0xffb76b:0x70cfff,main?1.9:1.45);
 return {rods,joints,aura,zShift};
}
const mainPendulum=makePendulum(MAT.amber,MAT.silver,.29,true);
const twinPendulum=makePendulum(MAT.cyan,MAT.steel,-.22,false);
function setRod(m,a,b){const delta=b.clone().sub(a),length=delta.length();m.position.copy(a).addScaledVector(delta,.5);m.scale.set(1,length,1);m.quaternion.setFromUnitVectors(yaxis,delta.normalize());}
function visualPoints(state,zShift){
 const p=positions(state,STATE),P0=pivot.clone();P0.z+=zShift;
 const P1=new THREE.Vector3(pivot.x+p[0][0]*unit,pivot.y+p[0][1]*unit,pivot.z+zShift);
 const P2=new THREE.Vector3(pivot.x+p[1][0]*unit,pivot.y+p[1][1]*unit,pivot.z+zShift);
 return [P0,P1,P2];
}
function syncPendulum(model,ys){
 const p=visualPoints(ys,model.zShift);
 setRod(model.rods[0],p[0],p[1]);setRod(model.rods[1],p[1],p[2]);
 model.joints[0].position.copy(p[1]);model.joints[1].position.copy(p[2]);model.aura.position.copy(p[2]);return p;
}

// Two recent bob-2 trajectories, and dim upper-mass traces.
const MAX_HISTORY=1100;const HISTORY_RATE=1/42;
const trailMain=[],trailTwin=[],trailUpper=[];let sampleAccum=0;
function makeTrail(rgb,opacity){
 const geo=new THREE.BufferGeometry();const pos=new Float32Array(MAX_HISTORY*3),col=new Float32Array(MAX_HISTORY*3);
 geo.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));
 geo.setAttribute('color',new THREE.BufferAttribute(col,3).setUsage(THREE.DynamicDrawUsage));geo.setDrawRange(0,0);
 const material=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,toneMapped:false});
 const obj=new THREE.Line(geo,material);obj.frustumCulled=false;scene.add(obj);return {obj,geo,pos,col,rgb,baseOpacity:opacity};
}
const trails=[makeTrail([1,.61,.27],.78),makeTrail([.29,.79,1],.73),makeTrail([1,.74,.47],.27)];
function renderTrail(t,hist){
 const max=Math.max(2,Math.round(STATE.trailSeconds/HISTORY_RATE));const relevant=hist.slice(-Math.min(max,MAX_HISTORY));
 const n=relevant.length;for(let i=0;i<n;i++){
  const v=relevant[i],r=i/Math.max(1,n-1),age=Math.pow(r,2.15);
  t.pos[3*i]=v.x;t.pos[3*i+1]=v.y;t.pos[3*i+2]=v.z;
  t.col[3*i]=t.rgb[0]*age;t.col[3*i+1]=t.rgb[1]*age;t.col[3*i+2]=t.rgb[2]*age;
 }
 t.geo.setDrawRange(0,n);t.geo.attributes.position.needsUpdate=true;t.geo.attributes.color.needsUpdate=true;
 t.obj.material.opacity=Math.min(1,t.baseOpacity*STATE.trailLight);
}
// Phase portrait is a genuine theta_1 vs omega_1 history, not a fake attractor.
// Wrapping at +-180 degrees is handled by breaking the line at the seam.
const phaseGroup=new THREE.Group();phaseGroup.position.set(9.1,-1.0,-2.0);scene.add(phaseGroup);
const board=new THREE.Mesh(new THREE.PlaneGeometry(7.0,6.7),new THREE.MeshPhysicalMaterial({color:0x162438,roughness:.32,metalness:.35,transparent:true,opacity:.72,side:THREE.DoubleSide}));
board.position.z=-.10;phaseGroup.add(board);
const panelFrame=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.5,-3.35,0),new THREE.Vector3(3.5,-3.35,0),new THREE.Vector3(3.5,3.35,0),new THREE.Vector3(-3.5,3.35,0)]),new THREE.LineBasicMaterial({color:0x739bb1,transparent:true,opacity:.7}));phaseGroup.add(panelFrame);
for(let i=-3;i<=3;i++){
 line([new THREE.Vector3(i, -2.65,.02),new THREE.Vector3(i,2.65,.02)],0x7294ac,i===0?.40:.13,phaseGroup);
 line([new THREE.Vector3(-2.85,i*.85,.02),new THREE.Vector3(2.85,i*.85,.02)],0x7294ac,i===0?.40:.13,phaseGroup);
}
function makeLabel(str,w=3.0,color='#bbcce0'){
 const c=document.createElement('canvas');c.width=384;c.height=80;const c2=c.getContext('2d');
 c2.font='bold 31px ui-monospace,monospace';c2.textAlign='center';c2.fillStyle=color;c2.fillText(str,192,51);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 return new THREE.Mesh(new THREE.PlaneGeometry(w,w*80/384),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
}
for(const [s,x,y,w] of [['PHASE / THETA1 x OMEGA1',0,3,4.3],['ANGLE   -180° ... +180°',0,-3.0,3.8],['OMEGA1  ±8 rad/s',0,2.75,2.8]]){
 const label=makeLabel(s,w,s.startsWith('PHASE')?'#f5c48d':'#7b96b7');label.position.set(x,y,.08);phaseGroup.add(label);
}
const phaseHistA=[],phaseHistB=[];
const PHASE_MAX=1100;
function makePhaseTrail(rgb){
 const geo=new THREE.BufferGeometry();const pos=new Float32Array(PHASE_MAX*2*3),col=new Float32Array(PHASE_MAX*2*3);
 geo.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));
 geo.setAttribute('color',new THREE.BufferAttribute(col,3).setUsage(THREE.DynamicDrawUsage));geo.setDrawRange(0,0);
 const obj=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({transparent:true,opacity:.82,vertexColors:true,depthWrite:false,blending:THREE.AdditiveBlending}));
 obj.frustumCulled=false;phaseGroup.add(obj);return {geo,pos,col,obj,rgb};
}
const phaseA=makePhaseTrail([1,.68,.33]),phaseB=makePhaseTrail([.37,.82,1]);
function phasePoint(y,z){
 const wrapped=Math.atan2(Math.sin(y[0]),Math.cos(y[0]));
 return {x:wrapped/Math.PI*2.8,y:THREE.MathUtils.clamp(y[2]/8,-1,1)*2.55,z};
}
function renderPhase(t,hist){
 const history=hist.slice(-Math.min(Math.round(STATE.trailSeconds/HISTORY_RATE),MAX_HISTORY));
 let n=0;for(let i=1;i<history.length;i++){
  const a=history[i-1],b=history[i];if(Math.abs(a.x-b.x)>3.4)continue;
  const fade=Math.pow(i/Math.max(1,history.length-1),1.7);
  for(const pt of [a,b]){t.pos[n*3]=pt.x;t.pos[n*3+1]=pt.y;t.pos[n*3+2]=pt.z;
   t.col[n*3]=t.rgb[0]*fade;t.col[n*3+1]=t.rgb[1]*fade;t.col[n*3+2]=t.rgb[2]*fade;n++;}
  if(n>=PHASE_MAX*2-2)break;
 }
 t.geo.setDrawRange(0,n);t.geo.attributes.position.needsUpdate=true;t.geo.attributes.color.needsUpdate=true;
}
const phaseDotA=new THREE.Mesh(new THREE.SphereGeometry(.10,12,12),new THREE.MeshBasicMaterial({color:0xffc482}));phaseGroup.add(phaseDotA);
const phaseDotB=new THREE.Mesh(new THREE.SphereGeometry(.09,12,12),new THREE.MeshBasicMaterial({color:0x7cdeff}));phaseGroup.add(phaseDotB);

let reference,comparison,energyAtRelease=0,accumulator=0;
const TIMESTEP=1/240;
function restart(){
 ({main:reference,twin:comparison}=begin(STATE));
 energyAtRelease=energy(reference,STATE).total;STATE.elapsed=0;accumulator=0;sampleAccum=0;
 trailMain.length=0;trailTwin.length=0;trailUpper.length=0;phaseHistA.length=0;phaseHistB.length=0;
 resetRings();updateGeometry();samplePaths();updateReadouts();
}
function updateGeometry(){
 const size1=Math.sqrt(STATE.m1/1.2),size2=Math.sqrt(STATE.m2/1.0);
 for(const bob of [mainPendulum,twinPendulum]){
  const s=bob===mainPendulum?1:.73;
  bob.joints[0].scale.setScalar(.20*s*size1);
  bob.joints[1].scale.setScalar(.33*s*size2);
 }
 const p1=syncPendulum(mainPendulum,reference);const p2=syncPendulum(twinPendulum,comparison);
 const show=STATE.compare;
 for(const obj of [...twinPendulum.rods,...twinPendulum.joints,twinPendulum.aura])obj.visible=show;
 trails[1].obj.visible=STATE.trails&&show;trails[0].obj.visible=STATE.trails;trails[2].obj.visible=STATE.trails;
 phaseB.obj.visible=show;phaseDotB.visible=show;
 return [p1,p2];
}
function samplePaths(){
 const [a,b]=[visualPoints(reference,mainPendulum.zShift),visualPoints(comparison,twinPendulum.zShift)];
 trailMain.push(a[2]);trailTwin.push(b[2]);trailUpper.push(a[1]);
 phaseHistA.push(phasePoint(reference,.17));phaseHistB.push(phasePoint(comparison,.22));
 for(const h of [trailMain,trailTwin,trailUpper,phaseHistA,phaseHistB])if(h.length>MAX_HISTORY)h.shift();
 renderTrail(trails[0],trailMain);renderTrail(trails[1],trailTwin);renderTrail(trails[2],trailUpper);
 renderPhase(phaseA,phaseHistA);renderPhase(phaseB,phaseHistB);
 const pa=phasePoint(reference,.30),pb=phasePoint(comparison,.32);
 phaseDotA.position.set(pa.x,pa.y,pa.z);phaseDotB.position.set(pb.x,pb.y,pb.z);
}
function updateReadouts(){
 const en=energy(reference,STATE),drift=(en.total-energyAtRelease)/Math.max(1e-6,Math.abs(energyAtRelease))*100;
 const delta=separation(reference,comparison,STATE);
 $('hudSeparation').textContent=delta<.1?(delta*100).toFixed(1)+' cm':delta.toFixed(2)+' m';
 $('separationFill').style.width=Math.min(100,100*delta/Math.max(.01,2*(STATE.L1+STATE.L2))).toFixed(1)+'%';
 $('hudAngles').textContent=deg(reference[0]).toFixed(0)+'° / '+deg(reference[1]).toFixed(0)+'°';
 $('hudEnergy').textContent=en.total.toFixed(2)+' J';
 $('hudDrift').textContent=(drift>=0?'+':'')+drift.toFixed(4)+'%';
 $('hudElapsed').textContent=STATE.elapsed.toFixed(1)+' s';
 $('hudModel').textContent=STATE.damping===0?'RK4 / 240 Hz':'DAMPED / RK4';
 $('statDivergence').textContent=delta.toFixed(4)+' m';
 $('statEnergy').textContent=en.total.toFixed(3)+' J';
 $('statDrift').textContent=(drift>=0?'+':'')+drift.toFixed(5)+'%';
 $('statKV').textContent=en.kinetic.toFixed(1)+' / '+en.potential.toFixed(1)+' J';
 $('statusBadge').textContent=(STATE.damping>0?'DAMPED':'IDEAL')+' · '+(STATE.paused?'PAUSED':'RUNNING');
}
function syncDisplay(){
 const map={sTheta1:['theta1','vTheta1',v=>v.toFixed(0)+'°'],sTheta2:['theta2','vTheta2',v=>v.toFixed(0)+'°'],
 sDelta:['delta','vDelta',v=>v.toFixed(2)+'°'],sM1:['m1','vM1',v=>v.toFixed(2)+' kg'],sM2:['m2','vM2',v=>v.toFixed(2)+' kg'],
 sL1:['L1','vL1',v=>v.toFixed(2)+' m'],sL2:['L2','vL2',v=>v.toFixed(2)+' m'],
 sGravity:['g','vGravity',v=>v.toFixed(2)+' m/s²'],sDamping:['damping','vDamping',v=>v.toFixed(3)+' s⁻¹'],
 sSpeed:['timeScale','vSpeed',v=>v.toFixed(2)+'×'],sTrailSeconds:['trailSeconds','vTrailSeconds',v=>v.toFixed(0)+' s'],
 sTrailLight:['trailLight','vTrailLight',v=>v.toFixed(2)+'×']};
 for(const [id,[key,out,f]] of Object.entries(map)){$(id).value=STATE[key];$(out).textContent=f(STATE[key]);}
 for(const [id,key] of [['tTrails','trails'],['tGuides','grid'],['tPhase','phase'],['tGrid','grid']]){
  // Guides uses a separate local flag; grid controls floor calibration only.
  if(id==='tGuides')$(id).checked=guidesEnabled;else $(id).checked=STATE[key];
 }
 const compare=STATE.compare;
 $('btnTwin').classList.toggle('active',compare);$('btnSingle').classList.toggle('active',!compare);
 $('btnTwin').setAttribute('aria-pressed',String(compare));$('btnSingle').setAttribute('aria-pressed',String(!compare));
 $('comparisonMode').textContent=compare?'TWO ALMOST IDENTICAL SYSTEMS':'ONE REFERENCE TRAJECTORY';
 $('btnGuides').classList.toggle('active',guidesEnabled);
 guideGroup.visible=guidesEnabled;grid.visible=STATE.grid;floorRings.visible=STATE.grid;phaseGroup.visible=STATE.phase;
}
let guidesEnabled=true;
const physicsSliders=[['sTheta1','theta1','vTheta1',v=>v.toFixed(0)+'°'],['sTheta2','theta2','vTheta2',v=>v.toFixed(0)+'°'],
 ['sDelta','delta','vDelta',v=>v.toFixed(2)+'°'],['sM1','m1','vM1',v=>v.toFixed(2)+' kg'],['sM2','m2','vM2',v=>v.toFixed(2)+' kg'],
 ['sL1','L1','vL1',v=>v.toFixed(2)+' m'],['sL2','L2','vL2',v=>v.toFixed(2)+' m'],
 ['sGravity','g','vGravity',v=>v.toFixed(2)+' m/s²'],['sDamping','damping','vDamping',v=>v.toFixed(3)+' s⁻¹']];
for(const [id,key,out,format] of physicsSliders){
 $(id).addEventListener('input',()=>{$(out).textContent=format(Number($(id).value));});
 $(id).addEventListener('change',()=>{STATE[key]=Number($(id).value);restart();});
}
for(const [id,key,out,f] of [['sSpeed','timeScale','vSpeed',v=>v.toFixed(2)+'×'],
 ['sTrailSeconds','trailSeconds','vTrailSeconds',v=>v.toFixed(0)+' s'],['sTrailLight','trailLight','vTrailLight',v=>v.toFixed(2)+'×']]){
 $(id).addEventListener('input',()=>{STATE[key]=Number($(id).value);$(out).textContent=f(STATE[key]);
  if(key!=='timeScale'){samplePaths();}});
}
function setCompare(v){STATE.compare=v;syncDisplay();updateGeometry();}
$('btnTwin').addEventListener('click',()=>setCompare(true));$('btnSingle').addEventListener('click',()=>setCompare(false));
$('btnRelease').addEventListener('click',()=>{for(const [id,key] of physicsSliders)STATE[key]=Number($(id).value);restart();});
$('tTrails').addEventListener('change',()=>{STATE.trails=$('tTrails').checked;updateGeometry();});
$('tGuides').addEventListener('change',()=>{guidesEnabled=$('tGuides').checked;guideGroup.visible=guidesEnabled;$('btnGuides').classList.toggle('active',guidesEnabled);});
$('tPhase').addEventListener('change',()=>{STATE.phase=$('tPhase').checked;phaseGroup.visible=STATE.phase;});
$('tGrid').addEventListener('change',()=>{STATE.grid=$('tGrid').checked;grid.visible=STATE.grid;floorRings.visible=STATE.grid;});
$('btnGuides').addEventListener('click',()=>{$('tGuides').checked=!$('tGuides').checked;$('tGuides').dispatchEvent(new Event('change'));});
function setPaused(v){STATE.paused=v;$('btnPause').classList.toggle('active',v);$('btnPause').title=v?'Resume [Space]':'Pause [Space]';updateReadouts();}
$('btnPause').addEventListener('click',()=>setPaused(!STATE.paused));
function resetAll(){Object.assign(STATE,DEFAULTS);guidesEnabled=true;setPaused(false);syncDisplay();restart();selectPreset(0);}
$('btnReset').addEventListener('click',resetAll);
$('btnDrawer').addEventListener('click',()=>{$('inspectorDrawer').classList.toggle('collapsed');});
$('btnCapture').addEventListener('click',()=>{renderer.render(scene,camera);const a=document.createElement('a');a.href=renderer.domElement.toDataURL('image/png');a.download='chaos-double-pendulum.png';a.click();});
$('btnFullscreen').addEventListener('click',()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.();});
document.querySelectorAll('.dock-btn').forEach((b,i)=>b.addEventListener('click',()=>selectPreset(i)));
document.querySelectorAll('.tab-btn').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('.tab-btn').forEach(x=>x.classList.toggle('active',x===b));
 document.querySelectorAll('.tab-content').forEach(p=>p.classList.toggle('active',p.id===b.dataset.tab));
}));
addEventListener('keydown',e=>{
 if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
 if(e.code==='Space'){e.preventDefault();$('btnPause').click();}
 else if(e.code==='KeyC')setCompare(!STATE.compare);
 else if(e.code==='KeyG')$('btnGuides').click();
 else if(e.code==='KeyR')$('btnReset').click();
 else if(e.code==='KeyH')$('btnDrawer').click();
 else if(e.code==='KeyP')$('btnCapture').click();
 else if(e.code==='KeyF')$('btnFullscreen').click();
 else if(e.key>='1'&&e.key<='4')selectPreset(Number(e.key)-1);
});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));});

// Real-time integration with bounded catch-up. No dynamics depend on frame rate.
let last=performance.now(),fpsFrames=0,fpsTime=0,hudTimer=0;
function tick(now){
 requestAnimationFrame(tick);
 const wallDt=Math.min(.066,Math.max(0,(now-last)/1000));last=now;
 fpsFrames++;fpsTime+=wallDt;hudTimer+=wallDt;
 if(fpsTime>.65){$('statFps').textContent=Math.round(fpsFrames/fpsTime)+' FPS';fpsTime=0;fpsFrames=0;}
 if(moveCamera){
  moveCamera.t=Math.min(1,moveCamera.t+wallDt*1.2);
  const k=moveCamera.t*moveCamera.t*(3-2*moveCamera.t);
  camera.position.lerpVectors(moveCamera.from,moveCamera.to,k);controls.target.lerpVectors(moveCamera.focus,moveCamera.aim,k);
  if(moveCamera.t>=1)moveCamera=null;
 }
 controls.update();
 if(!STATE.paused){
  accumulator=Math.min(.21,accumulator+wallDt*STATE.timeScale);
  let iterations=0;
  while(accumulator>=TIMESTEP&&iterations<52){
   reference=rk4(reference,STATE,TIMESTEP);comparison=rk4(comparison,STATE,TIMESTEP);
   accumulator-=TIMESTEP;STATE.elapsed+=TIMESTEP;sampleAccum+=TIMESTEP;iterations++;
   if(sampleAccum>=HISTORY_RATE){sampleAccum-=HISTORY_RATE;samplePaths();}
  }
  updateGeometry();
 }
 if(hudTimer>.095){updateReadouts();hudTimer=0;}
 scene.rotation.y=0;renderer.render(scene,camera);
}
syncDisplay();restart();requestAnimationFrame(tick);
