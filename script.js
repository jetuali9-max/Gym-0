import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const exercises = {
  waist: [
    {name:"Hip Circles", dir:"↻ Clockwise / ↺ Anti-clockwise", how:"Stand comfortably with your feet apart. Keep your upper body relaxed and move the pelvis in a smooth circle.", focus:"Hip mobility and controlled circular movement.", warning:"Use a comfortable range. Do not force or jerk the hips.", type:"hipCircle"},
    {name:"Pelvic Tilts", dir:"↑ Tilt up / ↓ Return", how:"Lie on your back with knees bent. Gently tilt the pelvis to flatten the lower back, then return to neutral.", focus:"Pelvic control and deep-core awareness.", warning:"Keep the motion small and controlled; do not aggressively arch your back.", type:"pelvicTilt"},
    {name:"Glute Bridges", dir:"↑ Hips up / ↓ Hips down", how:"Lie on your back with knees bent. Press through the feet, lift the hips, pause briefly, then lower slowly.", focus:"Glutes and hip extension.", warning:"Avoid over-arching the lower back at the top.", type:"bridge"},
    {name:"Bodyweight Squats", dir:"↓ Squat / ↑ Stand", how:"Stand with feet comfortable. Bend at the hips and knees, then drive through your feet to stand.", focus:"Lower-body strength and hip movement.", warning:"Keep knees tracking in the same direction as your toes.", type:"squat"},
    {name:"Hip Flexor Stretch", dir:"→ Gentle lean", how:"Use a split stance or kneeling position. Stay tall and gently move the hips forward.", focus:"Front-of-hip mobility.", warning:"Stretch gently. Do not bounce or force the position.", type:"stretch"},
    {name:"Cat-Cow", dir:"↑ Arch / ↓ Round", how:"Start on hands and knees. Slowly alternate between a gentle arch and a gentle rounded-back position.", focus:"Spinal mobility and controlled breathing.", warning:"Move slowly and stay within a comfortable range.", type:"catcow"}
  ],
  abs: [
    {name:"Crunches", dir:"↑ Curl / ↓ Lower", how:"Lie on your back with knees bent. Curl your upper body slightly upward, then lower with control.", focus:"Abdominal contraction.", warning:"Do not pull on your neck or use momentum.", type:"crunch"},
    {name:"Reverse Crunches", dir:"↑ Hips / ↓ Lower", how:"Lie on your back and bring the knees toward the torso, gently curling the pelvis upward.", focus:"Controlled lower-abdominal movement.", warning:"Avoid swinging the legs.", type:"reverseCrunch"},
    {name:"Bicycle Crunches", dir:"↔ Alternate sides", how:"Lie on your back and alternate bringing the opposite elbow and knee toward each other.", focus:"Core rotation and control.", warning:"Slow down if you lose control or pull your neck.", type:"bicycle"},
    {name:"Plank", dir:"— Hold", how:"Support yourself on forearms and toes or knees. Keep the body in a straight line.", focus:"Whole-core bracing.", warning:"Do not let the hips sag or rise excessively.", type:"plank"},
    {name:"V-Ups", dir:"↗ Meet / ↙ Lower", how:"Lie on your back. Raise the torso and legs toward each other, then lower slowly.", focus:"Full abdominal control.", warning:"Use only a range you can control.", type:"vup"},
    {name:"Cable Crunches", dir:"↓ Curl / ↑ Return", how:"Kneel with a secure cable attachment. Curl the torso down and return slowly.", focus:"Loaded abdominal flexion.", warning:"Use manageable resistance and controlled reps.", type:"cable"},
    {name:"Dragon Flags", dir:"↑ Raise / ↓ Lower", how:"Use a stable bench and control the body as one unit while raising and lowering.", focus:"Advanced full-core control.", warning:"Advanced movement: stop if you cannot maintain control.", type:"dragon"}
  ]
};

const allExercises = [...exercises.waist, ...exercises.abs];

const root = document.querySelector(".app");
const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
const modal = document.querySelector("#workoutModal");
const viewer = document.querySelector("#viewer");
const modalTitle = document.querySelector("#modalTitle");
const modalCategory = document.querySelector("#modalCategory");
const directionPill = document.querySelector("#directionPill");
const howText = document.querySelector("#howText");
const focusText = document.querySelector("#focusText");
const warningText = document.querySelector("#warningText");
const playBtn = document.querySelector("#playBtn");
const resetBtn = document.querySelector("#resetBtn");
const reverseBtn = document.querySelector("#reverseBtn");
const pauseTop = document.querySelector("#pauseTop");
const speedRange = document.querySelector("#speedRange");
const speedValue = document.querySelector("#speedValue");
const viewerStatus = document.querySelector("#viewerStatus");

let activeExercise = allExercises[0];
let playing = true;
let reverse = false;
let speed = 1;
let phase = 0;
let raf = 0;
let dragging = false;
let lastPointer = {x:0,y:0};
let cameraDistance = 6.8;

function cardTemplate(ex, category){
  return `<article class="exercise-card">
    <div class="mini-preview" aria-hidden="true"><div class="mini-figure"></div></div>
    <div class="card-cat">${category}</div>
    <h4>${ex.name}</h4>
    <p>${ex.dir}</p>
    <button class="open-card" type="button" data-exercise="${encodeURIComponent(ex.name)}">Open 3D Demo →</button>
  </article>`;
}

function renderLists(){
  document.querySelector("#waistExercises").innerHTML = exercises.waist.map(x=>cardTemplate(x,"WAIST / HIP")).join("");
  document.querySelector("#absExercises").innerHTML = exercises.abs.map(x=>cardTemplate(x,"ABS / CORE")).join("");
  document.querySelector("#homeExercises").innerHTML = allExercises.map(x=>cardTemplate(x, exercises.waist.includes(x) ? "WAIST / HIP" : "ABS / CORE")).join("");
  document.querySelector("#homeCount").textContent = `${allExercises.length} exercises`;
}
renderLists();

function openPage(page){
  navButtons.forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  pages.forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));
  window.scrollTo({top:0,behavior:"smooth"});
}
navButtons.forEach(b=>b.addEventListener("click",()=>openPage(b.dataset.page)));

document.addEventListener("click", e=>{
  const btn = e.target.closest("[data-exercise]");
  if(!btn) return;
  const name = decodeURIComponent(btn.dataset.exercise);
  activeExercise = allExercises.find(x=>x.name===name) || allExercises[0];
  openWorkout(activeExercise);
});

function openWorkout(ex){
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  modalTitle.textContent = ex.name;
  const isWaist = exercises.waist.includes(ex);
  modalCategory.textContent = isWaist ? "WAIST / HIP • 3D" : "ABS / CORE • 3D";
  directionPill.textContent = ex.dir;
  howText.textContent = ex.how;
  focusText.textContent = ex.focus;
  warningText.textContent = ex.warning;
  phase=0; reverse=false; playing=true; speed=1;
  speedRange.value="1"; speedValue.textContent="1.0×";
  playBtn.textContent="Ⅱ Pause"; pauseTop.textContent="Ⅱ";
  viewerStatus.textContent="PLAYING";
  if(scene) setTimeout(resize,0);
}
function closeWorkout(){
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
}
document.querySelector("#closeModal").addEventListener("click",closeWorkout);
document.querySelector(".modal-backdrop").addEventListener("click",closeWorkout);
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeWorkout()});

playBtn.addEventListener("click",()=>{
  playing=!playing;
  playBtn.textContent=playing?"Ⅱ Pause":"▶ Play";
  pauseTop.textContent=playing?"Ⅱ":"▶";
  viewerStatus.textContent=playing?"PLAYING":"PAUSED";
});
pauseTop.addEventListener("click",()=>playBtn.click());
resetBtn.addEventListener("click",()=>{phase=0; trainer.rotation.set(0,0,0); cameraDistance=6.8; camera.position.set(0,1.3,cameraDistance); camera.lookAt(0,1,0);});
reverseBtn.addEventListener("click",()=>{reverse=!reverse; viewerStatus.textContent=reverse?"REVERSE":"PLAYING";});
speedRange.addEventListener("input",()=>{speed=Number(speedRange.value);speedValue.textContent=`${speed.toFixed(1)}×`;});

let scene, camera, renderer, trainer, parts={}, arrowGroup;

function makeMaterial(color, rough=.5){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:.05});}
const skin=makeMaterial(0xffc3a7,.65);
const suit=makeMaterial(0xf15f9c,.42);
const dark=makeMaterial(0x2a2130,.55);
const jointMat=makeMaterial(0xff9fc3,.45);

function sphere(pos,r,mat){
  const m=new THREE.Mesh(new THREE.SphereGeometry(r,20,14),mat);
  m.position.copy(pos); return m;
}
function limb(a,b,r,mat){
  const d=new THREE.Vector3().subVectors(b,a);
  const g=new THREE.CapsuleGeometry(r,Math.max(.02,d.length()-r*2),6,12);
  const m=new THREE.Mesh(g,mat);
  m.position.copy(a).add(b).multiplyScalar(.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
  return m;
}
function createHuman(){
  trainer = new THREE.Group();
  parts={};
  parts.hips=sphere(new THREE.Vector3(0,.55,0),.42,suit);
  parts.chest=sphere(new THREE.Vector3(0,1.5,0),.55,suit);
  parts.head=sphere(new THREE.Vector3(0,2.45,0),.31,skin);
  parts.neck=limb(new THREE.Vector3(0,2.05,0),new THREE.Vector3(0,2.2,0),.12,skin);

  parts.lUpperArm=limb(new THREE.Vector3(-.45,1.8,0),new THREE.Vector3(-.9,1.2,0),.12,suit);
  parts.lForeArm=limb(new THREE.Vector3(-.9,1.2,0),new THREE.Vector3(-1.02,.65,0),.105,skin);
  parts.rUpperArm=limb(new THREE.Vector3(.45,1.8,0),new THREE.Vector3(.9,1.2,0),.12,suit);
  parts.rForeArm=limb(new THREE.Vector3(.9,1.2,0),new THREE.Vector3(1.02,.65,0),.105,skin);

  parts.lThigh=limb(new THREE.Vector3(-.25,.25,0),new THREE.Vector3(-.48,-.55,0),.17,dark);
  parts.lShin=limb(new THREE.Vector3(-.48,-.55,0),new THREE.Vector3(-.52,-1.25,0),.125,suit);
  parts.rThigh=limb(new THREE.Vector3(.25,.25,0),new THREE.Vector3(.48,-.55,0),.17,dark);
  parts.rShin=limb(new THREE.Vector3(.48,-.55,0),new THREE.Vector3(.52,-1.25,0),.125,suit);

  Object.values(parts).forEach(p=>trainer.add(p));
  trainer.add(sphere(new THREE.Vector3(-.45,1.2,0),.14,jointMat));
  trainer.add(sphere(new THREE.Vector3(.45,1.2,0),.14,jointMat));
  trainer.add(sphere(new THREE.Vector3(-.48,-.55,0),.17,jointMat));
  trainer.add(sphere(new THREE.Vector3(.48,-.55,0),.17,jointMat));
  scene.add(trainer);
}

function makeArrow(){
  arrowGroup=new THREE.Group();
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(1.3,.6,.2),1.0,0xff77ae,.22,.13);
  arrowGroup.add(arrow);
  scene.add(arrowGroup);
}

function setup3D(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090a11);
  camera = new THREE.PerspectiveCamera(42,1,.1,100);
  camera.position.set(0,1.25,cameraDistance);
  camera.lookAt(0,1,0);
  renderer = new THREE.WebGLRenderer({antialias:true,alpha:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewer.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffe7f2,0x171421,2.3));
  const key = new THREE.DirectionalLight(0xffffff,2.4);
  key.position.set(3,5,5); scene.add(key);
  const rim = new THREE.PointLight(0xff5fa2,18,8);
  rim.position.set(-3,2,2); scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(3.1,64),
    new THREE.MeshStandardMaterial({color:0x17121b,roughness:1})
  );
  floor.rotation.x=-Math.PI/2; floor.position.y=-1.32; scene.add(floor);

  createHuman(); makeArrow();
  renderer.domElement.addEventListener("pointerdown",e=>{
    dragging=true; lastPointer={x:e.clientX,y:e.clientY};
    renderer.domElement.setPointerCapture?.(e.pointerId);
  });
  renderer.domElement.addEventListener("pointermove",e=>{
    if(!dragging)return;
    trainer.rotation.y+=(e.clientX-lastPointer.x)*.012;
    trainer.rotation.x=Math.max(-.35,Math.min(.35,trainer.rotation.x+(e.clientY-lastPointer.y)*.006));
    lastPointer={x:e.clientX,y:e.clientY};
  });
  renderer.domElement.addEventListener("pointerup",()=>dragging=false);
  renderer.domElement.addEventListener("wheel",e=>{
    e.preventDefault();
    cameraDistance=Math.max(4.2,Math.min(9,cameraDistance+e.deltaY*.005));
    camera.position.z=cameraDistance; camera.lookAt(0,1,0);
  },{passive:false});
  resize();
  animate();
}
function resize(){
  if(!renderer)return;
  const r=viewer.getBoundingClientRect();
  if(!r.width||!r.height)return;
  renderer.setSize(r.width,r.height,false);
  camera.aspect=r.width/r.height;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize",resize);

function resetPose(){
  Object.values(parts).forEach(p=>p.rotation.set(0,0,0));
  trainer.position.set(0,0,0);
}
function animatePose(t){
  resetPose();
  const s=Math.sin(phase), c=Math.cos(phase);
  const q=(s+1)/2;
  const type=activeExercise?.type;

  if(type==="hipCircle"){
    parts.hips.rotation.y=s*.6;
    trainer.position.x=Math.sin(phase)*.16;
    trainer.rotation.z=Math.cos(phase)*.05;
    arrowGroup.rotation.z=phase;
  }else if(type==="pelvicTilt"){
    parts.hips.rotation.x=s*.3;
    parts.chest.rotation.x=-s*.08;
    arrowGroup.rotation.z=s*.2;
  }else if(type==="bridge"){
    trainer.position.y=q*.55;
    parts.hips.rotation.x=s*.12;
    arrowGroup.rotation.z=0;
  }else if(type==="squat"){
    trainer.position.y=-q*.55;
    parts.chest.rotation.x=q*.3;
    parts.lThigh.rotation.x=-q*.3; parts.rThigh.rotation.x=-q*.3;
    arrowGroup.rotation.z=Math.PI;
  }else if(type==="stretch"){
    parts.hips.rotation.x=s*.2;
    parts.chest.rotation.x=-s*.08;
    arrowGroup.rotation.z=s*.1;
  }else if(type==="catcow"){
    parts.chest.rotation.x=s*.38;
    parts.head.rotation.x=-s*.22;
    arrowGroup.rotation.z=s*.15;
  }else if(type==="crunch"){
    parts.chest.rotation.x=s*.55;
    parts.head.rotation.x=s*.25;
    arrowGroup.rotation.z=Math.PI;
  }else if(type==="reverseCrunch"){
    trainer.position.y=q*.28;
    parts.hips.rotation.x=s*.48;
    arrowGroup.rotation.z=0;
  }else if(type==="bicycle"){
    parts.chest.rotation.z=s*.4;
    parts.head.rotation.z=-s*.3;
    parts.lUpperArm.rotation.z=s*.35;
    parts.rUpperArm.rotation.z=-s*.35;
    arrowGroup.rotation.z=s*.5;
  }else if(type==="plank"){
    trainer.position.y=-.62;
    trainer.rotation.z=.08;
    arrowGroup.rotation.z=0;
  }else if(type==="vup"){
    trainer.position.y=q*.28;
    parts.chest.rotation.x=s*.55;
    parts.hips.rotation.x=-s*.4;
    arrowGroup.rotation.z=s*.25;
  }else if(type==="cable"){
    parts.chest.rotation.x=s*.48;
    trainer.position.y=-q*.12;
    arrowGroup.rotation.z=Math.PI;
  }else if(type==="dragon"){
    trainer.position.y=q*.65;
    parts.chest.rotation.x=s*.16;
    parts.hips.rotation.x=-s*.16;
    arrowGroup.rotation.z=0;
  }
}
function animate(){
  raf=requestAnimationFrame(animate);
  if(playing && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    phase += .018*speed*(reverse?-1:1);
  }
  if(scene){animatePose(performance.now());renderer.render(scene,camera);}
}
setup3D();
