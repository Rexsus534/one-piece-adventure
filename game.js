
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";

// =====================================
// ONE PIECE ADVENTURE - GAME.JS
// =====================================

const canvas = document.querySelector("#game");
const loading = document.querySelector("#loading");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8bd8ff);
scene.fog = new THREE.Fog(0x8bd8ff, 65, 180);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

const renderer = new THREE.WebGLRenderer({
  canvas: canvas instanceof HTMLCanvasElement ? canvas : undefined,
  antialias: true
});

if (!(canvas instanceof HTMLCanvasElement)) {
  document.querySelector("#game")?.appendChild(renderer.domElement);
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const loader = new GLTFLoader();
const clock = new THREE.Clock();

// =====================================
// LIGHTING
// =====================================

scene.add(new THREE.HemisphereLight(0xc8edff, 0x527044, 2));

const sun = new THREE.DirectionalLight(0xfff0d0, 2.5);
sun.position.set(-35, 60, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

// =====================================
// OCEAN
// =====================================

const oceanGeometry = new THREE.PlaneGeometry(500, 500);
const oceanMaterial = new THREE.MeshStandardMaterial({
  color: 0x168cc5,
  roughness: 0.35,
  metalness: 0.05
});

const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
ocean.rotation.x = -Math.PI / 2;
ocean.position.y = -1.2;
scene.add(ocean);

// Temporary ground under the scene
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(48, 64),
  new THREE.MeshStandardMaterial({
    color: 0xd8c18a,
    roughness: 1
  })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.35;
ground.receiveShadow = true;
scene.add(ground);

// =====================================
// FREE READY-MADE ISLAND MODEL
// CC0 tropical island scene
// =====================================

let islandLoaded = false;

loader.load(
  "https://cdn.3dassets.dev/assets/6862/v1/model.glb",
  (gltf) => {
    const island = gltf.scene;
    island.scale.setScalar(1);
    island.position.set(0, -0.3, 0);

    island.traverse((object) => {
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });

    scene.add(island);
    islandLoaded = true;
    console.log("Island model loaded!");
  },
  undefined,
  (error) => {
    console.error("Island model could not load:", error);
  }
);

// =====================================
// PLAYER
// Add your downloaded model here:
// models/pirate.glb
// =====================================

const player = new THREE.Group();
scene.add(player);

let playerModel = null;
let playerMixer = null;
let playerAnimations = {};
let currentAnimation = "";

const playerState = {
  speed: 7,
  runSpeed: 12,
  moving: false,
  running: false,
  direction: new THREE.Vector3()
};

function prepareCharacter(model, targetHeight = 1.8) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);

  if (size.y > 0) {
    model.scale.multiplyScalar(targetHeight / size.y);
  }

  const newBox = new THREE.Box3().setFromObject(model);
  model.position.y -= newBox.min.y;

  model.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}

function playAnimation(name) {
  if (!playerMixer || !playerAnimations[name]) return;
  if (currentAnimation === name) return;

  const next = playerAnimations[name];

  if (playerMixer._activeAction) {
    playerMixer._activeAction.fadeOut(0.15);
  }

  next.reset().fadeIn(0.15).play();
  playerMixer._activeAction = next;
  currentAnimation = name;
}

function loadPlayer() {
  loader.load(
    "./models/pirate.glb",
    (gltf) => {
      playerModel = gltf.scene;
      prepareCharacter(playerModel);

      player.add(playerModel);

      playerMixer = new THREE.AnimationMixer(playerModel);

      for (const clip of gltf.animations) {
        const name = clip.name.toLowerCase();

        if (name.includes("idle")) {
          playerAnimations.idle = playerMixer.clipAction(clip);
        } else if (name.includes("walk")) {
          playerAnimations.walk = playerMixer.clipAction(clip);
        } else if (name.includes("run")) {
          playerAnimations.run = playerMixer.clipAction(clip);
        } else if (name.includes("jump")) {
          playerAnimations.jump = playerMixer.clipAction(clip);
        }
      }

      if (playerAnimations.idle) {
        playAnimation("idle");
      } else if (gltf.animations.length > 0) {
        const action = playerMixer.clipAction(gltf.animations[0]);
        action.play();
      }

      console.log("Player model loaded!");
    },
    undefined,
    (error) => {
      console.warn(
        "Player model not found. Upload models/pirate.glb to GitHub.",
        error
      );

      // Temporary visible character until the GLB is added
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.42, 0.9, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0xb52c25 })
      );
      body.position.y = 0.9;
      body.castShadow = true;
      player.add(body);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xf0bd91 })
      );
      head.position.y = 1.65;
      head.castShadow = true;
      player.add(head);
    }
  );
}

loadPlayer();

// =====================================
// NPC SYSTEM
// NPCs use the same downloaded model
// =====================================

const npcs = [];

const npcLocations = [
  { x: 7, z: -5, name: "Köy Rehberi", message: "Adanın doğusunda gizemli bir yer var. Orayı keşfet!" },
  { x: -9, z: -8, name: "Yaşlı Denizci", message: "Denizlerde keşfedilecek çok ada var." },
  { x: 12, z: 8, name: "Köylü", message: "Burada yeni bir macera başlayabilir!" }
];

function createNPC(data, index) {
  const npc = new THREE.Group();
  npc.position.set(data.x, 0, data.z);
  scene.add(npc);

  const info = {
    group: npc,
    name: data.name,
    message: data.message,
    mixer: null,
    action: null
  };

  npcs.push(info);

  loader.load(
    "./models/pirate.glb",
    (gltf) => {
      const model = cloneSkeleton(gltf.scene);
      prepareCharacter(model, 1.8);
      npc.add(model);

      if (gltf.animations.length) {
        info.mixer = new THREE.AnimationMixer(model);

        const idle = gltf.animations.find((clip) =>
          clip.name.toLowerCase().includes("idle")
        );

        const action = info.mixer.clipAction(idle || gltf.animations[0]);
        action.play();
        info.action = action;
      }
    },
    undefined,
    () => {
      // Temporary NPC until the model is uploaded
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.4, 0.85, 5, 10),
        new THREE.MeshStandardMaterial({
          color: [0x315caa, 0x5b813b, 0x8a4caa][index]
        })
      );
      body.position.y = 0.85;
      body.castShadow = true;
      npc.add(body);
    }
  );
}

npcLocations.forEach(createNPC);

// =====================================
// INPUT
// =====================================

const keys = {};

window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;

  if (event.key.toLowerCase() === "e") {
    interactWithNPC();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

// =====================================
// MOBILE JOYSTICK
// =====================================

const joystick = document.querySelector("#joystick");
const stick = document.querySelector("#stick");
const mobile = document.querySelector("#mobile");

let joystickActive = false;
let joystickX = 0;
let joystickY = 0;

if (joystick && stick) {
  joystick.addEventListener("pointerdown", (event) => {
    joystickActive = true;
    joystick.setPointerCapture(event.pointerId);
    moveStick(event);
  });

  joystick.addEventListener("pointermove", (event) => {
    if (joystickActive) moveStick(event);
  });

  const stopJoystick = () => {
    joystickActive = false;
    joystickX = 0;
    joystickY = 0;
    stick.style.transform = "translate(0px, 0px)";
  };

  joystick.addEventListener("pointerup", stopJoystick);
  joystick.addEventListener("pointercancel", stopJoystick);
}

function moveStick(event) {
  const rect = joystick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let dx = event.clientX - centerX;
  let dy = event.clientY - centerY;

  const maxDistance = rect.width * 0.32;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > maxDistance) {
    dx = (dx / distance) * maxDistance;
    dy = (dy / distance) * maxDistance;
  }

  joystickX = dx / maxDistance;
  joystickY = dy / maxDistance;

  stick.style.transform = `translate(${dx}px, ${dy}px)`;
}

// =====================================
// CAMERA
// =====================================

let cameraAngle = 0;
let cameraDistance = 8;
let draggingCamera = false;
let previousPointerX = 0;

renderer.domElement.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button === 0) {
    draggingCamera = true;
    previousPointerX = event.clientX;
  }
});

window.addEventListener("pointerup", () => {
  draggingCamera = false;
});

window.addEventListener("pointermove", (event) => {
  if (!draggingCamera) return;

  const movement = event.clientX - previousPointerX;
  cameraAngle -= movement * 0.005;
  previousPointerX = event.clientX;
});

function updateCamera(delta) {
  const target = new THREE.Vector3(
    player.position.x,
    player.position.y + 1.5,
    player.position.z
  );

  const desiredPosition = new THREE.Vector3(
    player.position.x + Math.sin(cameraAngle) * cameraDistance,
    player.position.y + 4.5,
    player.position.z + Math.cos(cameraAngle) * cameraDistance
  );

  camera.position.lerp(desiredPosition, Math.min(delta * 5, 1));
  camera.lookAt(target);
}

// =====================================
// NPC INTERACTION
// =====================================

const dialog = document.querySelector("#dialog");
const npcName = document.querySelector("#npcName");
const npcText = document.querySelector("#npcText");
const closeDialog = document.querySelector("#closeDialog");
const message = document.querySelector("#message");

function showMessage(text) {
  if (!message) return;

  message.textContent = text;
  message.classList.remove("hidden");

  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => {
    message.classList.add("hidden");
  }, 2500);
}

function interactWithNPC() {
  let nearest = null;
  let nearestDistance = 3.5;

  for (const npc of npcs) {
    const distance = player.position.distanceTo(npc.group.position);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = npc;
    }
  }

  if (!nearest) {
    showMessage("Yakında konuşabileceğin kimse yok.");
    return;
  }

  if (npcName) npcName.textContent = nearest.name;
  if (npcText) npcText.textContent = nearest.message;

  dialog?.classList.remove("hidden");
}

closeDialog?.addEventListener("click", () => {
  dialog?.classList.add("hidden");
});

document.querySelector("#interact")?.addEventListener("click", interactWithNPC);

// =====================================
// PLAYER MOVEMENT
// =====================================

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const movement = new THREE.Vector3();

function updatePlayer(delta) {
  let x = 0;
  let z = 0;

  if (keys["w"] || keys["arrowup"]) z -= 1;
  if (keys["s"] || keys["arrowdown"]) z += 1;
  if (keys["a"] || keys["arrowleft"]) x -= 1;
  if (keys["d"] || keys["arrowright"]) x += 1;

  x += joystickX;
  z += joystickY;

  movement.set(0, 0, 0);

  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  movement.addScaledVector(forward, -z);
  movement.addScaledVector(right, x);

  const moving = movement.lengthSq() > 0.01;
  const running = keys["shift"];

  if (moving) {
    movement.normalize();

    const speed = running ? playerState.runSpeed : playerState.speed;

    player.position.addScaledVector(movement, speed * delta);

    const targetRotation = Math.atan2(movement.x, movement.z);
    player.rotation.y = THREE.MathUtils.lerp(
      player.rotation.y,
      targetRotation,
      Math.min(delta * 12, 1)
    );

    playerState.moving = true;
    playerState.running = running;

    if (running && playerAnimations.run) {
      playAnimation("run");
    } else if (playerAnimations.walk) {
      playAnimation("walk");
    }
  } else {
    playerState.moving = false;
    playerState.running = false;

    if (playerAnimations.idle) {
      playAnimation("idle");
    }
  }

  // Keep the player within the island area
  player.position.x = THREE.MathUtils.clamp(player.position.x, -42, 42);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -42, 42);
}

// =====================================
// UI
// =====================================

let level = 1;
let xp = 0;
let money = 100;

function updateUI() {
  const levelElement = document.querySelector("#level");
  const moneyElement = document.querySelector("#money");
  const xpElement = document.querySelector("#xp");

  if (levelElement) levelElement.textContent = level;
  if (moneyElement) moneyElement.textContent = money;
  if (xpElement) xpElement.textContent = xp;
}

updateUI();

if (loading) {
  loading.classList.add("hidden");
}

// =====================================
// RESIZE
// =====================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// =====================================
// GAME LOOP
// =====================================

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);

  updatePlayer(delta);
  updateCamera(delta);

  if (playerMixer) {
    playerMixer.update(delta);
  }

  for (const npc of npcs) {
    if (npc.mixer) npc.mixer.update(delta);
  }

  ocean.position.x = player.position.x;
  ocean.position.z = player.position.z;

  renderer.render(scene, camera);
}

camera.position.set(0, 5, 8);
camera.lookAt(0, 1, 0);

animate();

console.log("One Piece Adventure started!");
