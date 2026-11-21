import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "https://esm.sh/three@0.160.0/examples/jsm/utils/SkeletonUtils.js";

const canvas=document.querySelector("#game"), loading=document.querySelector("#loading"), message=document.querySelector("#message");
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x8fd9ff); scene.fog=new THREE.Fog(0x8fd9ff,100,260);
const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,500);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true}); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.shadowMap.enabled=true; renderer.outputColorSpace=THREE.SRGBColorSpace;
const clock=new THREE.Clock(), loader=new GLTFLoader();
scene.add(new THREE.HemisphereLight(0xe6f7ff,0x52663a,2));
const sun=new THREE.DirectionalLight(0xffedc5,2.4); sun.position.set(-35,60,30); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);

const mat=(color,rough=.9)=>new THREE.MeshStandardMaterial({color,roughness:rough});
const ocean=new THREE.Mesh(new THREE.PlaneGeometry(500,500),mat(0x138bc4,.35)); ocean.rotation.x=-Math.PI/2; ocean.position.y=-1.3; scene.add(ocean);
const waterline=new THREE.Mesh(new THREE.PlaneGeometry(500,500),new THREE.MeshBasicMaterial({color:0x64d8ef,transparent:true,opacity:.08})); waterline.rotation.x=-Math.PI/2; waterline.position.y=-1.22; scene.add(waterline);

function island(x,z,r,grass=0x7cbd55){
 const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
 const land=new THREE.Mesh(new THREE.CylinderGeometry(r*.86,r,3.6,48,1),mat(0x765337)); land.position.y=-1.9; land.castShadow=true; land.receiveShadow=true; g.add(land);
 const top=new THREE.Mesh(new THREE.CircleGeometry(r*.86,48),mat(grass)); top.rotation.x=-Math.PI/2; top.position.y=-.08; top.receiveShadow=true; g.add(top);
 const sand=new THREE.Mesh(new THREE.RingGeometry(r*.78,r*.88,48),mat(0xe6d18e)); sand.rotation.x=-Math.PI/2; sand.position.y=-.02; g.add(sand);
 return g;
}
island(0,0,42); // Foosha Village başlangıç adası
function locationLabel(text,x,z,color="#fff2c6"){const c=document.createElement("canvas");c.width=512;c.height=128;const ctx=c.getContext("2d");ctx.fillStyle="rgba(20,35,50,.82)";ctx.fillRect(8,8,496,112);ctx.strokeStyle="#d9a441";ctx.lineWidth=5;ctx.strokeRect(8,8,496,112);ctx.font="bold 46px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=color;ctx.fillText(text,256,64);const tex=new THREE.CanvasTexture(c);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true}));sprite.scale.set(13,3.25,1);sprite.position.set(x,7,z);scene.add(sprite);return sprite;}
locationLabel("FOOSHA VILLAGE",0,-32); locationLabel("KÖY İSKELESİ",25,7);

function palm(x,z,s=1,base=0){
 const g=new THREE.Group(); g.position.set(x,base,z); scene.add(g);
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.28*s,.45*s,4.8*s,7),mat(0x93633a)); trunk.position.y=2.4*s; trunk.castShadow=true; g.add(trunk);
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7, leaf=new THREE.Mesh(new THREE.ConeGeometry(.65*s,4.2*s,5),mat(0x207a42)); leaf.position.set(Math.sin(a)*1.2*s,4.4*s,Math.cos(a)*1.2*s); leaf.rotation.z=Math.cos(a)*.65; leaf.rotation.x=Math.sin(a)*.65; leaf.castShadow=true; g.add(leaf);}
}
for(let i=0;i<25;i++){const a=i*2.399,rad=14+(i%4)*5; palm(Math.cos(a)*rad,Math.sin(a)*rad,.75+(i%3)*.15);}


function hut(x,z,scale=1){
 const g=new THREE.Group(); g.position.set(x,0,z); scene.add(g);
 const walls=new THREE.Mesh(new THREE.BoxGeometry(4*scale,3*scale,3.5*scale),mat(0xd8a66a)); walls.position.y=1.5*scale; walls.castShadow=true; g.add(walls);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(3.2*scale,2*scale,4),mat(0x9a4c35)); roof.position.y=4*scale; roof.rotation.y=Math.PI/4; roof.castShadow=true; g.add(roof);
 const door=new THREE.Mesh(new THREE.BoxGeometry(.9*scale,1.8*scale,.12*scale),mat(0x53301c)); door.position.set(0,.9*scale,1.8*scale); g.add(door);
}
hut(-6,-3,1.25); hut(7,-15,.85); hut(16,9,.9);

function dock(x,z,len=14,rot=0){
 const g=new THREE.Group(); g.position.set(x,0,z); g.rotation.y=rot; scene.add(g);
 const wood=mat(0x8b603a);
 for(let i=0;i<5;i++){const plank=new THREE.Mesh(new THREE.BoxGeometry(len,.3,1.05),wood);plank.position.set(0,.05,i-2);plank.castShadow=true;g.add(plank);}
 for(let i=0;i<4;i++){const post=new THREE.Mesh(new THREE.CylinderGeometry(.22,.25,2,8),wood);post.position.set(-len/2+i*len/3,-.6,2.5);g.add(post);}
}
dock(35,4,18,-.25);
function boat(x,z,scale=1){
 const g=new THREE.Group();g.position.set(x,-.7,z);scene.add(g);
 const hull=new THREE.Mesh(new THREE.ConeGeometry(2.3*scale,7*scale,6),mat(0x713c28));hull.rotation.x=Math.PI/2; hull.rotation.z=Math.PI/6;hull.position.y=.1;g.add(hull);
 const mast=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,6*scale,8),mat(0x5b391f));mast.position.y=3*scale;g.add(mast);
 const sail=new THREE.Mesh(new THREE.PlaneGeometry(3.4*scale,4.2*scale),new THREE.MeshStandardMaterial({color:0xf3e5c0,side:THREE.DoubleSide})); sail.position.set(0,3.3*scale,0);g.add(sail);
 const flag=new THREE.Mesh(new THREE.ConeGeometry(.5*scale,1.2*scale,3),mat(0x9f2226));flag.position.set(0,6.3*scale,0);g.add(flag);
}
boat(26,10,.8);

function crate(x,z){const c=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.4,1.4),mat(0x9b6a38));c.position.set(x,.7,z);c.castShadow=true;scene.add(c);}
for(const p of [[-16,-5],[-19,-7],[4,-24],[24,2]])crate(...p);

const player=new THREE.Group();scene.add(player);let mixer=null,actions={},current="";
function fit(model,height=1.8){const b=new THREE.Box3().setFromObject(model),s=new THREE.Vector3();b.getSize(s);if(s.y>0)model.scale.multiplyScalar(height/s.y);const f=new THREE.Box3().setFromObject(model);model.position.y-=f.min.y;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});}
function anim(k){if(!mixer)return;const names=Object.keys(actions);let n=names.find(a=>a.toLowerCase().includes(k))|| (k==="walk"?names.find(a=>a.toLowerCase().includes("run")):null);if(!n||n===current)return;Object.values(actions).forEach(a=>a.fadeOut(.12));actions[n].reset().fadeIn(.12).play();current=n;}
let finished=false;function endLoad(){if(finished)return;finished=true;loading.classList.add("hidden");}
function makeFallback(){const torso=new THREE.Mesh(new THREE.BoxGeometry(.65,1.05,.4),mat(0xc93c2d));torso.position.y=.95;player.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.32,16,12),mat(0xffd2a1));head.position.y=1.7;player.add(head);const hat=new THREE.Mesh(new THREE.CylinderGeometry(.55,.5,.14,16),mat(0x7b4c20));hat.position.y=2.05;player.add(hat);endLoad();}
loader.load("./Rogue.gltf",g=>{if(finished)return;fit(g.scene);player.add(g.scene);mixer=new THREE.AnimationMixer(g.scene);g.animations.forEach(c=>actions[c.name]=mixer.clipAction(c));anim("idle");endLoad();},p=>{if(p.total)loading.querySelector("p").textContent="Macera hazırlanıyor "+Math.round(p.loaded/p.total*100)+"%";},()=>makeFallback());
setTimeout(()=>{if(!finished)makeFallback();},12000);

// NPCs from existing character files; the names/dialogue are custom for this game.
const npcList=[
 {file:"Warrior.gltf",x:8,z:-5,name:"Shanks",role:"Kızıl Saçlı Korsan",text:"Foosha’ya hoş geldin. Grand Line’a açılmak istiyorsan önce kendi yolunu çiz. Korsanlık kolay değil."},
 {file:"Ranger.gltf",x:-10,z:-8,name:"Makino",role:"Foosha Village Bar Sahibi",text:"Foosha küçük ve sakin bir köy. Shanks’ın tayfası buraya geldiğinde Luffy’nin korsan olma hayalleri daha da büyüyor."},
 {file:"Cleric.gltf",x:12,z:9,name:"Monkey D. Luffy",role:"Korsan Olmak İsteyen Çocuk",text:"Ben korsanların kralı olacağım! Bir tayfa kurup denize açılacağım!"},
 {file:"Wizard.gltf",x:-17,z:13,name:"Garp",role:"Denizci",text:"Korsan olmayı kafana koymuşsun! Denizlerin ne kadar tehlikeli olduğunu unutma."},
undefined
];
const npcs=[];
for(const d of npcList){const group=new THREE.Group();group.position.set(d.x,0,d.z);scene.add(group);const npc={...d,group,mixer:null};npcs.push(npc);loader.load("./"+d.file,g=>{const model=cloneSkeleton(g.scene);fit(model);group.add(model);if(g.animations.length){npc.mixer=new THREE.AnimationMixer(model);const idle=g.animations.find(a=>a.name.toLowerCase().includes("idle"))||g.animations[0];npc.mixer.clipAction(idle).play();}},undefined,()=>{});}

// Devil Fruit pickup visuals and interactions
const fruitTypes=[
 {name:"Gomu Gomu",color:0xf1b3d7,desc:"Lastik gücü! Toplama sayısı +1."},
 {name:"Mera Mera",color:0xf26c30,desc:"Alev gücü! Toplama sayısı +1."},
 {name:"Goro Goro",color:0xffd83c,desc:"Elektrik gücü! Toplama sayısı +1."},
 {name:"Hie Hie",color:0x8ce9f5,desc:"Buz gücü! Toplama sayısı +1."},
 {name:"Yami Yami",color:0x56335f,desc:"Karanlık güç! Toplama sayısı +1."},
 {name:"Tori Tori",color:0x8dd77b,desc:"Doğa gücü! Toplama sayısı +1."}
];
const fruits=[];
function createFruit(data,x,z){
 const g=new THREE.Group();g.position.set(x,.65,z);
 const sphere=new THREE.Mesh(new THREE.SphereGeometry(.55,20,16),mat(data.color,.45));sphere.scale.set(1,.85,1);g.add(sphere);
 const swirl=new THREE.Mesh(new THREE.TorusGeometry(.23,.07,8,16),mat(0xf4e9cf));swirl.position.y=.2;swirl.rotation.x=Math.PI/2;g.add(swirl);
 const stem=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,.35,7),mat(0x5c8b3e));stem.position.y=.62;stem.rotation.z=.35;g.add(stem);
 const leaf=new THREE.Mesh(new THREE.SphereGeometry(.18,8,8),mat(0x63a843));leaf.position.set(.22,.7,0);leaf.scale.set(1,.35,.6);g.add(leaf);
 scene.add(g); fruits.push({data,group:g,taken:false});
}
createFruit(fruitTypes[0],-21,12);createFruit(fruitTypes[1],12,-22);createFruit(fruitTypes[2],24,15);createFruit(fruitTypes[3],-28,17);createFruit(fruitTypes[4],30,-20);createFruit(fruitTypes[5],-19,-26);
const inventory=[];const collectedFruits=[];const fruitBox=document.querySelector("#fruitInventory");const quest=document.querySelector("#quest");let eatingTimer=0;let powerTimer=0;let powerColor=0xffd65a;let powerRing=null;let powerSparks=[];
function updateInventory(){fruitBox.textContent=inventory.length?inventory.join(" · "):"Boş";document.querySelector("#fruitCount").textContent=inventory.length;}
function toast(t){message.textContent=t;message.classList.remove("hidden");clearTimeout(toast.timer);toast.timer=setTimeout(()=>message.classList.add("hidden"),2600);}
function nearby(){let found=null,dist=3.6;for(const n of npcs){const d=player.position.distanceTo(n.group.position);if(d<dist){found=n;dist=d;}}for(const f of fruits){if(f.taken)continue;const d=player.position.distanceTo(f.group.position);if(d<dist){found=f;dist=d;}}return found;}
function interact(){if(eatingTimer>0){toast("Meyve yeme animasyonu sürüyor.");return;}const target=nearby();if(!target){toast("Yakında konuşacak biri veya meyve yok.");return;}if(target.data){target.taken=true;inventory.push(target.data.name);collectedFruits.push(target.data);scene.remove(target.group);eatingTimer=1.15;updateInventory();toast(target.data.name+" meyvesini yiyorsun!");quest.textContent="Foosha Village’ı keşfet ve köy sakinleriyle konuş. Şeytan meyveleri nadirdir; bulduğun meyveyi envanterine ekle.";return;}document.querySelector("#npcName").textContent=target.name+" · "+target.role;document.querySelector("#npcText").textContent=target.text;document.querySelector("#dialog").classList.remove("hidden");}
document.querySelector("#closeDialog").onclick=()=>document.querySelector("#dialog").classList.add("hidden");document.querySelector("#usePower").onclick=usePower;
document.querySelector("#interact").onclick=interact;addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==="e")interact();if(e.key.toLowerCase()==="f")usePower();});addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);

const keys={};let joyX=0,joyY=0,joyOn=false;const joystick=document.querySelector("#joystick"),stick=document.querySelector("#stick");
joystick.addEventListener("pointerdown",e=>{joyOn=true;joystick.setPointerCapture(e.pointerId);moveStick(e);});
joystick.addEventListener("pointermove",e=>{if(joyOn)moveStick(e);});
function stopStick(){joyOn=false;joyX=joyY=0;stick.style.transform="translate(0,0)";}
joystick.addEventListener("pointerup",stopStick);joystick.addEventListener("pointercancel",stopStick);
function moveStick(e){const r=joystick.getBoundingClientRect();let dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,max=r.width*.32,len=Math.hypot(dx,dy);if(len>max){dx=dx/len*max;dy=dy/len*max;}joyX=dx/max;joyY=dy/max;stick.style.transform=`translate(${dx}px,${dy}px)`;}
let cameraAngle=0,dragging=false,lastX=0;
renderer.domElement.addEventListener("pointerdown",e=>{if(e.pointerType==="mouse"&&e.button===0){dragging=true;lastX=e.clientX;}});
addEventListener("pointerup",()=>dragging=false);addEventListener("pointermove",e=>{if(dragging){cameraAngle-=(e.clientX-lastX)*.005;lastX=e.clientX;}});
const forward=new THREE.Vector3(),right=new THREE.Vector3(),movement=new THREE.Vector3();
function updatePlayer(dt){if(eatingTimer>0){eatingTimer=Math.max(0,eatingTimer-dt);player.rotation.z=Math.sin((1.15-eatingTimer)*12)*.12;player.position.y=Math.sin((1.15-eatingTimer)*10)*.08;anim("idle");return;}player.rotation.z=0;player.position.y=0;const x=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0)+joyX,z=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0)+joyY;movement.set(0,0,0);camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();movement.addScaledVector(forward,-z);movement.addScaledVector(right,x);const moving=movement.lengthSq()>.01,running=!!keys.shift;if(moving){movement.normalize();player.position.addScaledVector(movement,(running?11:6.5)*dt);player.rotation.y=Math.atan2(movement.x,movement.z);anim(running?"run":"walk");}else anim("idle");player.position.x=THREE.MathUtils.clamp(player.position.x,-38,38);player.position.z=THREE.MathUtils.clamp(player.position.z,-38,38);}
function usePower(){if(powerTimer>0){toast("Güç etkisi zaten aktif!");return;}if(!collectedFruits.length){toast("Önce bir şeytan meyvesi ye!");return;}const fruit=collectedFruits.shift();powerColor=fruit.color;powerTimer=4.2;toast(fruit.name+" gücü aktif!");if(powerRing){scene.remove(powerRing);powerRing=null;}const ring=new THREE.Mesh(new THREE.TorusGeometry(1.8,.09,10,48),new THREE.MeshBasicMaterial({color:powerColor,transparent:true,opacity:.9}));ring.rotation.x=Math.PI/2;scene.add(ring);powerRing=ring;powerSparks=[];for(let n=0;n<18;n++){const orb=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),new THREE.MeshBasicMaterial({color:powerColor}));scene.add(orb);powerSparks.push({mesh:orb,angle:n*Math.PI*2/18,radius:2.1+(n%3)*.25,phase:n*.37});}}
function updatePower(dt){if(powerTimer>0){powerTimer=Math.max(0,powerTimer-dt);if(powerRing){powerRing.position.set(player.position.x,player.position.y+1,player.position.z);powerRing.rotation.x=Math.PI/2;powerRing.rotation.z+=dt*2.2;powerRing.scale.setScalar(1+Math.sin(clock.elapsedTime*8)*.12);powerRing.material.opacity=powerTimer/4.2;}for(const s of powerSparks){s.angle+=dt*2.8;s.mesh.position.set(player.position.x+Math.cos(s.angle)*s.radius,player.position.y+1+Math.sin(clock.elapsedTime*4+s.phase)*.35,player.position.z+Math.sin(s.angle)*s.radius);}}else if(powerRing){scene.remove(powerRing);powerRing=null;for(const s of powerSparks)scene.remove(s.mesh);powerSparks=[];}}
function updateCamera(dt){const desired=new THREE.Vector3(player.position.x+Math.sin(cameraAngle)*8,player.position.y+4.2,player.position.z+Math.cos(cameraAngle)*8);camera.position.lerp(desired,Math.min(dt*5,1));camera.lookAt(player.position.x,player.position.y+1.2,player.position.z);}
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}addEventListener("resize",resize);
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);updatePlayer(dt);updateCamera(dt);if(mixer)mixer.update(dt);for(const n of npcs)if(n.mixer)n.mixer.update(dt);updatePower(dt);for(const f of fruits)if(!f.taken){f.group.rotation.y+=dt*.9;f.group.position.y=.65+Math.sin(clock.elapsedTime*2+f.group.position.x)*.18;}renderer.render(scene,camera);}
camera.position.set(0,5,9);camera.lookAt(0,1,0);updateInventory();document.querySelector("#level").textContent="1";document.querySelector("#money").textContent="100";document.querySelector("#xp").textContent="0";animate();
// In-game atlas window controls
const mapOverlay=document.querySelector("#worldMapOverlay");
document.querySelector("#worldMapButton")?.addEventListener("click",()=>mapOverlay?.classList.remove("hidden"));
document.querySelector("#closeWorldMap")?.addEventListener("click",()=>mapOverlay?.classList.add("hidden"));
mapOverlay?.addEventListener("click",e=>{if(e.target===mapOverlay)mapOverlay.classList.add("hidden");});
addEventListener("keydown",e=>{if(e.key==="Escape")mapOverlay?.classList.add("hidden");});
