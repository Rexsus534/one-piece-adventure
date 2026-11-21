
import * as THREE from "https://esm.sh/three@0.160.0";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "https://esm.sh/three@0.160.0/examples/jsm/utils/SkeletonUtils.js";

const canvas = document.querySelector("#game");
const loading = document.querySelector("#loading");
const message = document.querySelector("#message");
const dialog = document.querySelector("#dialog");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8bd8ff);
scene.fog = new THREE.Fog(0x8bd8ff, 45, 140);

const camera = new THREE.PerspectiveCamera(
  65, innerWidth / innerHeight, 0.1, 500
);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const clock = new THREE.Clock();
const loader = new GLTFLoader();

scene.add(new THREE.HemisphereLight(0xc8edff, 0x53613a, 2));

const sun = new THREE.DirectionalLight(0xffedc5, 2.5);
sun.position.set(-30, 55, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

// DENİZ
const sea = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({
    color: 0x168cc5,
    roughness: 0.4
  })
);
sea.rotation.x = -Math.PI / 2;
sea.position.y = -1.1;
scene.add(sea);

// ADA
const island = new THREE.Mesh(
  new THREE.CircleGeometry(42, 80),
  new THREE.MeshStandardMaterial({ color: 0x8fbd65 })
);
island.rotation.x = -Math.PI / 2;
island.position.y = -0.18;
island.receiveShadow = true;
scene.add(island);

const beach = new THREE.Mesh(
  new THREE.RingGeometry(36, 42, 80),
  new THREE.MeshStandardMaterial({
    color: 0xd9c18a,
    side: THREE.DoubleSide
  })
);
beach.rotation.x = -Math.PI / 2;
beach.position.y = -0.12;
scene.add(beach);

// AĞAÇLAR
function makeTree(x, z, scale = 1) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.32, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x76502d })
  );
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  tree.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x287b43 })
  );
  crown.position.y = 2.55;
  crown.scale.set(1.15, 0.8, 1.1);
  crown.castShadow = true;
  tree.add(crown);

  tree.position.set(x, 0, z);
  tree.scale.setScalar(scale);
  scene.add(tree);
}

[
  [-17,-13],[-22,4],[-14,19],[18,-17],
  [25,-5],[20,17],[-3,27],[5,-26],
  [-30,-25],[30,25],[0,-34],[32,0]
].forEach(([x,z], i) => makeTree(x, z, 0.85 + (i % 3) * 0.12));

// OYUNCU
const player = new THREE.Group();
scene.add(player);

let playerMixer = null;
let playerActions = {};
let activeAction = "";

function fitModel(model, targetHeight = 1.8) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bounds.getSize(size);

  if (size.y > 0) {
    model.scale.multiplyScalar(targetHeight / size.y);
  }

  const fitted = new THREE.Box3().setFromObject(model);
  model.position.y -= fitted.min.y;

  model.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
}

function playAnimation(kind) {
  if (!playerMixer) return;

  const names = Object.keys(playerActions);
  let chosen = null;

  if (kind === "run") {
    chosen = names.find(n => n.toLowerCase().includes("run"));
  } else if (kind === "walk") {
    chosen = names.find(n => n.toLowerCase().includes("walk"));
    if (!chosen) {
      chosen = names.find(n => n.toLowerCase().includes("run"));
    }
  } else {
    chosen = names.find(n => n.toLowerCase().includes("idle"));
  }

  if (!chosen || chosen === activeAction) return;

  Object.values(playerActions).forEach(action => {
    action.fadeOut(0.15);
  });

  playerActions[chosen].reset().fadeIn(0.15).play();
  activeAction = chosen;
}

function showMessage(text) {
  message.textContent = text;
  message.classList.remove("hidden");

  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => {
    message.classList.add("hidden");
  }, 2600);
}

function loadPlayer() {
  let finished = false;
  const finishLoading = () => {
    if (finished) return;
    finished = true;
    loading.classList.add("hidden");
  };

  // Karakter dosyası gelmese bile oyun dünyası açılabilsin.
  const timeout = setTimeout(() => {
    if (finished) return;
    console.error("Rogue.gltf yükleme zaman aşımı.");
    const fallback = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.45, 1.0, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x244f9c })
    );
    body.position.y = 0.9;
    fallback.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd3a4 })
    );
    head.position.y = 1.65;
    fallback.add(head);
    player.add(fallback);
    loading.innerHTML = "<h1>Model yüklenemedi</h1><p>Oyun model olmadan açılıyor...</p>";
    setTimeout(finishLoading, 1200);
  }, 12000);

  loader.load(
    "./Rogue.gltf",
    gltf => {
      if (finished) return;
      clearTimeout(timeout);
      const model = gltf.scene;
      fitModel(model, 1.8);
      player.add(model);

      playerMixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach(clip => {
        playerActions[clip.name] = playerMixer.clipAction(clip);
      });
      playAnimation("idle");
      finishLoading();
    },
    progress => {
      if (progress.total) {
        const pct = Math.round(progress.loaded / progress.total * 100);
        loading.querySelector("p").textContent = "Karakter yükleniyor: " + pct + "%";
      }
    },
    error => {
      clearTimeout(timeout);
      console.error("Rogue.gltf yüklenemedi:", error);
      loading.innerHTML = "<h1>Karakter dosyası yüklenemedi</h1><p>Model olmadan dünya açılıyor...</p>";
      finishLoading();
    }
  );
}

loadPlayer();

// NPC'LER
const npcData = [
  {
    file: "Warrior.gltf",
    x: 8, z: -5,
    name: "Kılıç Ustası",
    message: "Kılıcını geliştir. Büyük denizlerde güçlü olmalısın!"
  },
  {
    file: "Ranger.gltf",
    x: -10, z: -8,
    name: "Keskin Nişancı",
    message: "Uzak adalarda keşfedilmemiş hazineler var."
  },
  {
    file: "Cleric.gltf",
    x: 12, z: 9,
    name: "Şifacı",
    message: "Yolculuğa çıkmadan önce hazırlığını yap."
  },
  {
    file: "Wizard.gltf",
    x: -15, z: 10,
    name: "Gizemli Büyücü",
    message: "Denizlerde tuhaf güçler uyandığını hissediyorum."
  },
  {
    file: "Monk.gltf",
    x: 2, z: 16,
    name: "Dövüş Ustası",
    message: "Gerçek güç, antrenmanla kazanılır."
  }
];

const npcs = [];

for (const data of npcData) {
  const group = new THREE.Group();
  group.position.set(data.x, 0, data.z);
  scene.add(group);

  const npc = { ...data, group, mixer: null };
  npcs.push(npc);

  loader.load(
    `./${data.file}`,
    gltf => {
      const model = cloneSkeleton(gltf.scene);
      fitModel(model, 1.8);
      group.add(model);

      if (gltf.animations.length) {
        npc.mixer = new THREE.AnimationMixer(model);
        const idle =
          gltf.animations.find(a =>
            a.name.toLowerCase().includes("idle")
          ) || gltf.animations[0];

        npc.mixer.clipAction(idle).play();
      }
    },
    undefined,
    error => console.error(data.file, "yüklenemedi:", error)
  );
}

// KLAVYE KONTROLLERİ
const keys = {};

addEventListener("keydown", event => {
  keys[event.key.toLowerCase()] = true;

  if (event.key.toLowerCase() === "e") {
    interact();
  }
});

addEventListener("keyup", event => {
  keys[event.key.toLowerCase()] = false;
});

// MOBİL JOYSTICK
let joyX = 0;
let joyY = 0;
let joyOn = false;

const joystick = document.querySelector("#joystick");
const stick = document.querySelector("#stick");

joystick.addEventListener("pointerdown", event => {
  joyOn = true;
  joystick.setPointerCapture(event.pointerId);
  moveStick(event);
});

joystick.addEventListener("pointermove", event => {
  if (joyOn) moveStick(event);
});

function stopStick() {
  joyOn = false;
  joyX = 0;
  joyY = 0;
  stick.style.transform = "translate(0px, 0px)";
}

joystick.addEventListener("pointerup", stopStick);
joystick.addEventListener("pointercancel", stopStick);

function moveStick(event) {
  const rect = joystick.getBoundingClientRect();

  let dx = event.clientX - (rect.left + rect.width / 2);
  let dy = event.clientY - (rect.top + rect.height / 2);

  const max = rect.width * 0.32;
  const length = Math.hypot(dx, dy);

  if (length > max) {
    dx = dx / length * max;
    dy = dy / length * max;
  }

  joyX = dx / max;
  joyY = dy / max;

  stick.style.transform = `translate(${dx}px, ${dy}px)`;
}

// KAMERA
let cameraAngle = 0;
let dragging = false;
let lastX = 0;

renderer.domElement.addEventListener("pointerdown", event => {
  if (event.pointerType === "mouse" && event.button === 0) {
    dragging = true;
    lastX = event.clientX;
  }
});

addEventListener("pointerup", () => {
  dragging = false;
});

addEventListener("pointermove", event => {
  if (dragging) {
    cameraAngle -= (event.clientX - lastX) * 0.005;
    lastX = event.clientX;
  }
});

// NPC İLE KONUŞMA
function interact() {
  let closest = null;
  let bestDistance = 3.5;

  for (const npc of npcs) {
    const distance = player.position.distanceTo(npc.group.position);

    if (distance < bestDistance) {
      bestDistance = distance;
      closest = npc;
    }
  }

  if (!closest) {
    showMessage("Konuşmak için bir NPC'ye yaklaş!");
    return;
  }

  document.querySelector("#npcName").textContent = closest.name;
  document.querySelector("#npcText").textContent = closest.message;
  dialog.classList.remove("hidden");
}

document.querySelector("#closeDialog").addEventListener("click", () => {
  dialog.classList.add("hidden");
});

document.querySelector("#interact").addEventListener("click", interact);

// HAREKET
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const movement = new THREE.Vector3();

function updatePlayer(dt) {
  const x =
    (keys.d || keys.arrowright ? 1 : 0) -
    (keys.a || keys.arrowleft ? 1 : 0) + joyX;

  const z =
    (keys.s || keys.arrowdown ? 1 : 0) -
    (keys.w || keys.arrowup ? 1 : 0) + joyY;

  movement.set(0, 0, 0);

  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  movement.addScaledVector(forward, -z);
  movement.addScaledVector(right, x);

  const moving = movement.lengthSq() > 0.015;
  const running = !!keys.shift;

  if (moving) {
    movement.normalize();

    player.position.addScaledVector(
      movement,
      (running ? 10.5 : 6.5) * dt
    );

    const angle = Math.atan2(movement.x, movement.z);
    player.rotation.y = THREE.MathUtils.lerp(
      player.rotation.y,
      angle,
      Math.min(dt * 11, 1)
    );

    playAnimation(running ? "run" : "walk");
  } else {
    playAnimation("idle");
  }

  player.position.x = THREE.MathUtils.clamp(player.position.x, -38, 38);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -38, 38);
}

// KAMERA TAKİBİ
function updateCamera(dt) {
  const desired = new THREE.Vector3(
    player.position.x + Math.sin(cameraAngle) * 7.5,
    player.position.y + 4.1,
    player.position.z + Math.cos(cameraAngle) * 7.5
  );

  camera.position.lerp(desired, Math.min(dt * 5, 1));

  camera.lookAt(
    player.position.x,
    player.position.y + 1.25,
    player.position.z
  );
}

// EKRAN BOYUTU
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// OYUN DÖNGÜSÜ
function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);

  updatePlayer(dt);
  updateCamera(dt);

  if (playerMixer) playerMixer.update(dt);

  for (const npc of npcs) {
    if (npc.mixer) npc.mixer.update(dt);
  }

  renderer.render(scene, camera);
}

camera.position.set(0, 5, 9);
camera.lookAt(0, 1, 0);

animate();

document.querySelector("#level").textContent = "1";
document.querySelector("#money").textContent = "100";
document.querySelector("#xp").textContent = "0";
