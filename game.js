import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";

// One Piece Adventure - local animated GLTF characters
const canvas = document.querySelector("#game");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8bd8ff);
scene.fog = new THREE.Fog(0x8bd8ff, 55, 150);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 400);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const clock = new THREE.Clock();
const loader = new GLTFLoader();
scene.add(new THREE.HemisphereLight(0xc8edff, 0x53613a, 2.0));
const sun = new THREE.DirectionalLight(0xffedc5, 2.3);
sun.position.set(-30, 55, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

// Island ground and sea
const sea = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: 0x168cc5, roughness: 0.42 }));
sea.rotation.x = -Math.PI / 2;
sea.position.y = -1.1;
scene.add(sea);
const island = new THREE.Mesh(new THREE.CircleGeometry(42, 80), new THREE.MeshStandardMaterial({ color: 0x8fbd65, roughness: 1 }));
island.rotation.x = -Math.PI / 2;
island.position.y = -0.18;
island.receiveShadow = true;
scene.add(island);
const beach = new THREE.Mesh(new THREE.RingGeometry(36, 42, 80), new THREE.MeshStandardMaterial({ color: 0xd9c18a, roughness: 1, side: THREE.DoubleSide }));
beach.rotation.x = -Math.PI / 2;
beach.position.y = -0.12;
scene.add(beach);

// Simple island scenery props; characters themselves are the uploaded real GLTF models.
function makeTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x76502d }));
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  tree.add(trunk);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.25, 10, 8), new THREE.MeshStandardMaterial({ color: 0x287b43 }));
  crown.position.y = 2.55;
  crown.scale.set(1.15, 0.8, 1.1);
  crown.castShadow = true;
  tree.add(crown);
  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  scene.add(tree);
}
[[-17,-13],[-22,4],[-14,19],[18,-17],[25,-5],[20,17],[-3,27],[5,-26]].forEach(([x,z],i)=>makeTree(x,z,0.85+(i%3)*0.12));

const player = new THREE.Group();
scene.add(player);
let playerMixer = null;
let playerActions = {};
let activePlayerAction = "";
let playerReady = false;

function fitModel(model, height = 1.8) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bounds.getSize(size);
  if (size.y > 0) model.scale.multiplyScalar(height / size.y);
  const fitted = new THREE.Box3().setFromObject(model);
  model.position.y -= fitted.min.y;
  model.traverse(o => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
  });
}

function chooseAction(actions, candidates) {
  const key = Object.keys(actions).find(k => candidates.some(c => k.toLowerCase().includes(c.toLowerCase())));
  return key ? actions[key] : null;
}
function playPlayerAnimation(kind) {
  if (!playerMixer) return;
  const candidates = kind === "run" ? ["Run"] : kind === "walk" ? ["Walk", "Run"] : ["Idle"];
  const action = chooseAction(playerActions, candidates);
  if (!action || activePlayerAction === action.getClip().name) return;
  Object.values(playerActions).forEach(a => { if (a.isRunning()) a.fadeOut(0.16); });
  action.reset().fadeIn(0.16).play();
  activePlayerAction = action.getClip().name;
}

function loadPlayer() {
  loader.load("./models/Rogue.gltf", gltf => {
    const model = gltf.scene;
    fitModel(model, 1.8);
    player.add(model);
    playerMixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach(clip => { playerActions[clip.name] = playerMixer.clipAction(clip); });
    playPlayerAnimation("idle");
    playerReady = true;
    hideLoading();
  }, undefined, err => {
    console.error("Rogue.gltf load failed:", err);
    showMessage("Rogue modeli yüklenemedi. models/Rogue.gltf dosyasını kontrol et.");
    hideLoading();
  });
}
loadPlayer();

// Different uploaded characters are used for the island NPCs.
const npcData = [
  { file: "Warrior.gltf", x: 8, z: -5, name: "Kılıç Ustası", message: "Kılıcını geliştir. Büyük denizlerde güçlü olmalısın!" },
  { file: "Ranger.gltf", x: -10, z: -8, name: "Keskin Nişancı", message: "Uzak adalarda keşfedilmemiş hazineler var." },
  { file: "Cleric.gltf", x: 12, z: 9, name: "Şifacı", message: "Yolculuğa çıkmadan önce hazırlığını yap." },
  { file: "Wizard.gltf", x: -15, z: 10, name: "Gizemli Büyücü", message: "Denizlerde tuhaf güçler uyandığını hissediyorum." },
  { file: "Monk.gltf", x: 2, z: 16, name: "Dövüş Ustası", message: "Gerçek güç, antrenmanla kazanılır." }
];
const npcs = [];
for (const data of npcData) {
  const group = new THREE.Group();
  group.position.set(data.x, 0, data.z);
  scene.add(group);
  const npc = { ...data, group, mixer: null };
  npcs.push(npc);
  loader.load(`./models/${data.file}`, gltf => {
    const model = cloneSkeleton(gltf.scene);
    fitModel(model, 1.8);
    group.add(model);
    if (gltf.animations.length) {
      npc.mixer = new THREE.AnimationMixer(model);
      const idle = gltf.animations.find(a => a.name.toLowerCase().includes("idle")) || gltf.animations[0];
      npc.mixer.clipAction(idle).play();
    }
  }, undefined, err => console.error(`${data.file} load failed`, err));
}

// Controls
const keys = {};
addEventListener("keydown", e => { keys[e.key.toLowerCase()] = true; if (e.key.toLowerCase() === "e") interact(); });
addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
let joyX = 0, joyY = 0, joyOn = false;
const joystick = document.querySelector("#joystick");
const stick = document.querySelector("#stick");
if (joystick && stick) {
  joystick.addEventListener("pointerdown", e => { joyOn = true; joystick.setPointerCapture(e.pointerId); moveStick(e); });
  joystick.addEventListener("pointermove", e => { if (joyOn) moveStick(e); });
  const stop = () => { joyOn = false; joyX = joyY = 0; stick.style.transform = "translate(0px, 0px)"; };
  joystick.addEventListener("pointerup", stop);
  joystick.addEventListener("pointercancel", stop);
}
function moveStick(e) {
  const r = joystick.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const max = r.width * 0.32, len = Math.hypot(dx, dy);
  if (len > max) { dx = dx / len * max; dy = dy / len * max; }
  joyX = dx / max; joyY = dy / max;
  stick.style.transform = `translate(${dx}px, ${dy}px)`;
}

let cameraAngle = 0, dragging = false, lastX = 0;
renderer.domElement.addEventListener("pointerdown", e => { if (e.pointerType === "mouse" && e.button === 0) { dragging = true; lastX = e.clientX; } });
addEventListener("pointerup", () => dragging = false);
addEventListener("pointermove", e => { if (dragging) { cameraAngle -= (e.clientX - lastX) * 0.005; lastX = e.clientX; } });

const message = document.querySelector("#message");
const dialog = document.querySelector("#dialog");
const npcName = document.querySelector("#npcName");
const npcText = document.querySelector("#npcText");
const closeDialog = document.querySelector("#closeDialog");
let messageTimer;
function showMessage(text) {
  if (!message) return;
  message.textContent = text;
  message.classList.remove("hidden");
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => message.classList.add("hidden"), 2600);
}
function interact() {
  let closest = null, best = 3.5;
  for (const npc of npcs) {
    const d = player.position.distanceTo(npc.group.position);
    if (d < best) { best = d; closest = npc; }
  }
  if (!closest) { showMessage("Konuşmak için bir NPC'ye yaklaş."); return; }
  if (npcName) npcName.textContent = closest.name;
  if (npcText) npcText.textContent = closest.message;
  dialog?.classList.remove("hidden");
}
closeDialog?.addEventListener("click", () => dialog?.classList.add("hidden"));
document.querySelector("#interact")?.addEventListener("click", interact);

function hideLoading() { document.querySelector("#loading")?.classList.add("hidden"); }

const forward = new THREE.Vector3(), right = new THREE.Vector3(), move = new THREE.Vector3();
function updatePlayer(dt) {
  let x = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + joyX;
  let z = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + joyY;
  move.set(0, 0, 0);
  camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  move.addScaledVector(forward, -z).addScaledVector(right, x);
  const moving = move.lengthSq() > 0.015;
  const running = !!keys.shift;
  if (moving) {
    move.normalize();
    player.position.addScaledVector(move, (running ? 10.5 : 6.5) * dt);
    const angle = Math.atan2(move.x, move.z);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, angle, Math.min(dt * 11, 1));
    playPlayerAnimation(running ? "run" : "walk");
  } else playPlayerAnimation("idle");
  player.position.x = THREE.MathUtils.clamp(player.position.x, -38, 38);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -38, 38);
}
function updateCamera(dt) {
  const desired = new THREE.Vector3(player.position.x + Math.sin(cameraAngle) * 7.5, player.position.y + 4.1, player.position.z + Math.cos(cameraAngle) * 7.5);
  camera.position.lerp(desired, Math.min(dt * 5, 1));
  camera.lookAt(player.position.x, player.position.y + 1.25, player.position.z);
}

const levelEl = document.querySelector("#level");
const moneyEl = document.querySelector("#money");
const xpEl = document.querySelector("#xp");
if (levelEl) levelEl.textContent = "1";
if (moneyEl) moneyEl.textContent = "100";
if (xpEl) xpEl.textContent = "0";

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
camera.position.set(0, 5, 9);
camera.lookAt(0, 1, 0);
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  updatePlayer(dt);
  updateCamera(dt);
  if (playerMixer) playerMixer.update(dt);
  for (const npc of npcs) if (npc.mixer) npc.mixer.update(dt);
  sea.position.x = player.position.x;
  sea.position.z = player.position.z;
  renderer.render(scene, camera);
}
animate();
