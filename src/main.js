import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { CELESTIAL_BODIES } from './data/planetsData.js';
import { createSaturnRingGeometry } from './utils/ringGeometry.js';
import { createStarfieldPoints } from './utils/starfield.js';
import { createEarthAtmosphereMesh } from './utils/atmosphereShader.js';
import { createSunCoronaSprite } from './utils/sunCorona.js';

/* ========================================================
   ESTADO DA SIMULAÇÃO
   ======================================================== */
const state = {
  isPaused: false,
  timeScale: 1.0,
  showOrbits: true,
  showClouds: true,
  focusedBodyId: 'overview'
};

const cameraTransition = {
  active: false,
  targetBodyId: null,
  duration: 1.2,
  elapsed: 0,
  startTarget: new THREE.Vector3(),
  startCamPos: new THREE.Vector3(),
  desiredDistance: 15,
  desiredOffsetDir: new THREE.Vector3(0.7, 0.45, 0.7).normalize()
};

let lastPlanetPosition = null;

/* ========================================================
   DETECÇÃO DE HARDWARE E OTIMIZAÇÃO (MOTO G9 POWER / ADRENO 610)
   ======================================================== */
function checkIsMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent) || window.innerWidth < 768;
}

let isMobile = checkIsMobile();

const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();

const camera = new PerspectiveCameraSetup();
const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile, // Em mobile, antialias nativo do hardware poupa a GPU Adreno
  powerPreference: 'high-performance'
});

renderer.setSize(window.innerWidth, window.innerHeight);

// Se for MOBILE: trava o pixel ratio em 1.0 para garantir 60 FPS lisos na Adreno 610
if (isMobile) {
  renderer.setPixelRatio(1.0);
} else {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

function PerspectiveCameraSetup() {
  const cam = new THREE.PerspectiveCamera(
    48,
    window.innerWidth / window.innerHeight,
    0.5,
    3000
  );
  cam.position.set(0, 220, 380);
  return cam;
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = true;
controls.zoomSpeed = isMobile ? 1.8 : 2.5; // Ajuste para gestos touch e mouse wheel
controls.minDistance = 15;
controls.maxDistance = 1500;
controls.target.set(0, 0, 0);

// Configuração otimizada para gestos touch (rotação com 1 dedo, zoom/pan com 2 dedos)
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN
};

// Precedência total do usuário: qualquer toque cancela a transição de câmera automática
controls.addEventListener('start', () => {
  cameraTransition.active = false;
});

/* ========================================================
   PÓS-PROCESSAMENTO CINEMATOGRÁFICO
   (Ativo em Desktop; em Mobile é feito bypass para 60 FPS fixos)
   ======================================================== */
let composer = null;
if (!isMobile) {
  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.15,
    0.42,
    0.84
  );
  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);
}

/* ========================================================
   SISTEMA DE CARREGAMENTO COM BARRA DE PROGRESSO
   ======================================================== */
const loadingProgressBar = document.getElementById('progress-bar');
const loadingScreen = document.getElementById('loading-screen');
const loadingStatus = document.getElementById('loading-status');

const loadingManager = new THREE.LoadingManager(
  () => {
    setTimeout(() => {
      loadingScreen.classList.add('fade-out');
    }, 400);
  },
  (itemUrl, itemsLoaded, itemsTotal) => {
    const percent = Math.round((itemsLoaded / itemsTotal) * 100);
    if (loadingProgressBar) loadingProgressBar.style.width = `${percent}%`;
    if (loadingStatus) {
      const fileName = itemUrl.split('/').pop();
      loadingStatus.textContent = `Carregando asset (${percent}%): ${fileName}`;
    }
  },
  (errUrl) => {
    console.warn('Erro ao carregar asset:', errUrl);
  }
);

const textureLoader = new THREE.TextureLoader(loadingManager);

/* ========================================================
   FUNDO ESTELAR: MILKY WAY EM SCENE.BACKGROUND
   ======================================================== */
const milkyWayTexture = textureLoader.load('./textures/milky_way.jpg');
milkyWayTexture.mapping = THREE.EquirectangularReflectionMapping;
milkyWayTexture.colorSpace = THREE.SRGBColorSpace;
scene.background = milkyWayTexture;

// Partículas 3D para profundidade espacial e paralaxe
const starfieldParticles = createStarfieldPoints();
scene.add(starfieldParticles);

/* ========================================================
   ILUMINAÇÃO
   ======================================================== */
// 1. Luz ambiente sutil
const ambientLight = new THREE.AmbientLight(0x222a3a, 0.20);
scene.add(ambientLight);

// 2. Luz pontual no centro exato do Sol
const sunPointLight = new THREE.PointLight(0xffffff, 3.2, 0, 0.15);
sunPointLight.position.set(0, 0, 0);
scene.add(sunPointLight);

// Luz hemisférica adicional super sutil
const hemiLight = new THREE.HemisphereLight(0x304055, 0x0d121c, 0.15);
scene.add(hemiLight);

/* ========================================================
   ESTRUTURA DOS CORPOS CELESTES
   - Sol: SphereGeometry(raio, 128, 128) sem aros sólidos
   - Planetas: SphereGeometry(raio, 64, 64)
   ======================================================== */
const bodiesRegistry = new Map();
const orbitLinesGroup = new THREE.Group();
scene.add(orbitLinesGroup);

const sphereGeometryCache = new Map();
function getSphereGeometry(radius) {
  if (!sphereGeometryCache.has(radius)) {
    // 64x64 segmentos para esferas perfeitamente lisas
    sphereGeometryCache.set(radius, new THREE.SphereGeometry(radius, 64, 64));
  }
  return sphereGeometryCache.get(radius);
}

// Criação do Sol com geometria 128x128
const sunData = CELESTIAL_BODIES.find(b => b.id === 'sun');
const sunTexture = textureLoader.load(sunData.texture);
sunTexture.colorSpace = THREE.SRGBColorSpace;

const sunMaterial = new THREE.MeshBasicMaterial({
  map: sunTexture,
  color: 0xffffff
});

const sunGeometry = new THREE.SphereGeometry(sunData.radius, 128, 128);
const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
sunMesh.name = 'sun';
scene.add(sunMesh);

// Corona solar suave via Sprite com gradiente radial (elimina qualquer anel sólido ou contorno duro)
const sunCoronaSprite = createSunCoronaSprite(sunData.radius);
sunMesh.add(sunCoronaSprite);

bodiesRegistry.set('sun', {
  data: sunData,
  mesh: sunMesh,
  pivot: sunMesh,
  angle: 0
});

// Criação dos Planetas e Lua
let earthMeshRef = null;
let earthCloudsMesh = null;

CELESTIAL_BODIES.forEach(body => {
  if (body.id === 'sun') return;

  if (body.isMoon) {
    return;
  }

  // Criação do container orbital
  const planetContainer = new THREE.Group();
  planetContainer.name = `${body.id}-container`;
  scene.add(planetContainer);

  const geometry = getSphereGeometry(body.radius);
  let material;

  // 1. TERRA: Superfície diurna + Luzes noturnas (emissiveMap) + Nuvens + Atmosfera Fresnel
  if (body.id === 'earth') {
    const dayTex = textureLoader.load(body.texture); // /textures/earth_day.jpg
    dayTex.colorSpace = THREE.SRGBColorSpace;

    const nightTex = textureLoader.load(body.nightTexture); // /textures/earth_night.jpg
    nightTex.colorSpace = THREE.SRGBColorSpace;

    material = new THREE.MeshStandardMaterial({
      map: dayTex,
      roughness: 0.65,
      metalness: 0.1,
      emissive: new THREE.Color(0xfff2b2),
      emissiveMap: nightTex,
      emissiveIntensity: 0.95
    });

    const planetMesh = new THREE.Mesh(geometry, material);
    planetMesh.name = body.id;
    earthMeshRef = planetMesh;

    // Camada de nuvens com raio * 1.015, 64x64, rotação independente e transparência
    const cloudsTex = textureLoader.load(body.cloudsTexture); // /textures/earth_clouds.jpg
    cloudsTex.colorSpace = THREE.SRGBColorSpace;

    const cloudsGeo = new THREE.SphereGeometry(body.radius * 1.015, 64, 64);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: 0.48,
      blending: THREE.NormalBlending,
      roughness: 0.9,
      depthWrite: false
    });
    earthCloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    planetMesh.add(earthCloudsMesh);

    // Atmosfera hiper-realista com Shader Fresnel em GLSL (sem borda dura/outline sólido)
    const atmosphereMesh = createEarthAtmosphereMesh(body.radius);
    planetMesh.add(atmosphereMesh);

    planetContainer.rotation.z = THREE.MathUtils.degToRad(body.axialTilt);
    planetContainer.add(planetMesh);

    setupOrbitAndRegister(body, planetMesh, planetContainer);
    return;
  }

  // 2. MERCÚRIO: Carrega 2k_mercury com tratamento resiliente contra falhas
  if (body.id === 'mercury') {
    const mercuryTex = textureLoader.load(
      body.texture,
      undefined,
      undefined,
      () => {
        // Fallback para cor sólida cinza se houver falha de rede/arquivo
        material.color = new THREE.Color(0x8c8c8c);
        material.map = null;
        material.needsUpdate = true;
      }
    );
    mercuryTex.colorSpace = THREE.SRGBColorSpace;

    material = new THREE.MeshStandardMaterial({
      map: mercuryTex,
      roughness: 0.85,
      metalness: 0.05,
      color: 0xcccccc
    });
  } else {
    // 3. DEMAIS PLANETAS (Vênus, Marte, Júpiter, Saturno, Urano, Netuno)
    const texture = textureLoader.load(body.texture);
    texture.colorSpace = THREE.SRGBColorSpace;

    const matConfig = {
      map: texture,
      roughness: 0.8,
      metalness: 0.05
    };

    if (body.tintColor) {
      matConfig.color = new THREE.Color(body.tintColor);
    }

    material = new THREE.MeshStandardMaterial(matConfig);
  }

  const planetMesh = new THREE.Mesh(geometry, material);
  planetMesh.name = body.id;

  // SATURNO: Anéis com RingGeometry e 2k_saturn_ring_alpha (transparência/alphaMap)
  if (body.hasRings) {
    const ringTex = textureLoader.load(body.ringTexture);
    ringTex.colorSpace = THREE.SRGBColorSpace;

    const ringGeometry = createSaturnRingGeometry(body.ringInnerRadius, body.ringOuterRadius, 128);
    const ringMaterial = new THREE.MeshStandardMaterial({
      map: ringTex,
      alphaMap: ringTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      roughness: 0.7,
      metalness: 0.1
    });

    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2;
    planetMesh.add(ringMesh);
  }

  planetContainer.rotation.z = THREE.MathUtils.degToRad(body.axialTilt);
  planetContainer.add(planetMesh);

  setupOrbitAndRegister(body, planetMesh, planetContainer);
});

function setupOrbitAndRegister(body, planetMesh, planetContainer) {
  // Linha orbital discreta
  const orbitPoints = [];
  const segments = 180;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    orbitPoints.push(new THREE.Vector3(Math.cos(theta) * body.distance, 0, Math.sin(theta) * body.distance));
  }
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(body.color),
    transparent: true,
    opacity: 0.28,
    linewidth: 1
  });
  const orbitLine = new THREE.Line(orbitGeo, orbitMat);
  orbitLinesGroup.add(orbitLine);

  // Ângulo inicial variado
  const initialAngle = Math.random() * Math.PI * 2;

  bodiesRegistry.set(body.id, {
    data: body,
    mesh: planetMesh,
    container: planetContainer,
    angle: initialAngle
  });
}

// Criação da Lua (orbitando a Terra com moon.jpg em esfera 64x64)
const moonData = CELESTIAL_BODIES.find(b => b.id === 'moon');
if (moonData) {
  const moonContainer = new THREE.Group();
  moonContainer.name = 'moon-container';
  scene.add(moonContainer);

  const moonTex = textureLoader.load(moonData.texture); // /textures/moon.jpg
  moonTex.colorSpace = THREE.SRGBColorSpace;

  const moonMat = new THREE.MeshStandardMaterial({
    map: moonTex,
    roughness: 0.9,
    metalness: 0.0
  });

  const moonMesh = new THREE.Mesh(getSphereGeometry(moonData.radius), moonMat);
  moonMesh.name = 'moon';
  moonContainer.add(moonMesh);

  // Linha de órbita da Lua ao redor da Terra
  const moonOrbitPoints = [];
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2;
    moonOrbitPoints.push(new THREE.Vector3(Math.cos(t) * moonData.distance, 0, Math.sin(t) * moonData.distance));
  }
  const moonOrbitGeo = new THREE.BufferGeometry().setFromPoints(moonOrbitPoints);
  const moonOrbitMat = new THREE.LineBasicMaterial({
    color: 0x99aacc,
    transparent: true,
    opacity: 0.22
  });
  const moonOrbitLine = new THREE.Line(moonOrbitGeo, moonOrbitMat);
  scene.add(moonOrbitLine);

  bodiesRegistry.set('moon', {
    data: moonData,
    mesh: moonMesh,
    container: moonContainer,
    orbitLine: moonOrbitLine,
    angle: 0
  });
}

/* ========================================================
   SISTEMA DE INTERATIVIDADE, RAYCASTER E HOVER
   ======================================================== */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tooltip = document.getElementById('planet-tooltip');
const interactiveMeshes = [];

bodiesRegistry.forEach(entry => {
  if (entry.mesh) interactiveMeshes.push(entry.mesh);
});

// Distinção entre clique intencional e arrasto do OrbitControls
let pointerDownPos = { x: 0, y: 0 };
let wasDragging = false;

window.addEventListener('pointerdown', (e) => {
  pointerDownPos.x = e.clientX;
  pointerDownPos.y = e.clientY;
  wasDragging = false;
});

window.addEventListener('pointermove', (e) => {
  const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (dist > 6) {
    wasDragging = true;
  }
});

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveMeshes, false);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    document.body.style.cursor = 'pointer';

    const bodyEntry = bodiesRegistry.get(hit.name);
    if (bodyEntry && tooltip) {
      tooltip.textContent = `${bodyEntry.data.name.toUpperCase()} [${bodyEntry.data.type}]`;
      tooltip.style.left = `${event.clientX}px`;
      tooltip.style.top = `${event.clientY}px`;
      tooltip.classList.add('visible');
    }
  } else {
    document.body.style.cursor = 'default';
    if (tooltip) tooltip.classList.remove('visible');
  }
});

// Clique na cena 3D foca no planeta apenas se NÃO foi arrasto de câmera
window.addEventListener('click', (event) => {
  if (wasDragging) return;

  // Ignora cliques que ocorram sobre botões ou HUD
  if (event.target.closest('#hud-overlay') && !event.target.matches('#canvas-container')) {
    return;
  }

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveMeshes, false);
  if (intersects.length > 0) {
    const hit = intersects[0].object;
    focusOnBody(hit.name);
  }
});

/* ========================================================
   TRANSIÇÃO SUAVE DE CÂMERA (NASA EYES STYLE)
   ======================================================== */
function focusOnBody(bodyId) {
  state.focusedBodyId = bodyId;

  // Atualiza botões de navegação
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-target') === bodyId);
  });

  cameraTransition.active = true;
  cameraTransition.targetBodyId = bodyId;
  cameraTransition.elapsed = 0;
  cameraTransition.startTarget.copy(controls.target);
  cameraTransition.startCamPos.copy(camera.position);

  if (bodyId === 'overview') {
    lastPlanetPosition = null;
    cameraTransition.duration = 1.3;
    // Limites de zoom dinâmico para visão geral
    controls.minDistance = 15;
    controls.maxDistance = 1500;
    updateInfoPanelForOverview();
    return;
  }

  if (bodyId === 'sun') {
    // Limites de zoom dinâmico proporcionais ao Sol
    controls.minDistance = sunData.radius * 1.35;
    controls.maxDistance = 750;
  }

  const targetEntry = bodiesRegistry.get(bodyId);
  if (!targetEntry) return;

  // Limites de zoom dinâmico proporcionais ao corpo celeste focado (evita colisão no chão)
  if (bodyId !== 'sun') {
    controls.minDistance = Math.max(1.8, targetEntry.data.radius * 1.35);
    controls.maxDistance = Math.max(50, targetEntry.data.cameraDistance * 7.5);
  }

  const currentPlanetPos = new THREE.Vector3();
  targetEntry.mesh.getWorldPosition(currentPlanetPos);
  lastPlanetPosition = currentPlanetPos.clone();

  const camDist = targetEntry.data.cameraDistance || 15;

  // Preserva a direção angular atual da câmera para transição fluida
  const currentOffset = camera.position.clone().sub(controls.target);
  let offsetDir;
  if (currentOffset.lengthSq() > 0.001) {
    offsetDir = currentOffset.normalize();
    if (offsetDir.y < 0.25) offsetDir.y = 0.35;
    offsetDir.normalize();
  } else {
    offsetDir = new THREE.Vector3(0.7, 0.45, 0.7).normalize();
  }

  cameraTransition.duration = 1.2;
  cameraTransition.desiredDistance = camDist;
  cameraTransition.desiredOffsetDir.copy(offsetDir);

  updateInfoPanel(targetEntry.data);
}

function updateCameraTransition(delta) {
  if (!cameraTransition.active) return;

  cameraTransition.elapsed += delta;
  const t = Math.min(1, cameraTransition.elapsed / cameraTransition.duration);
  // Curva de suavização Ease-Out Cúbica
  const easeOut = 1 - Math.pow(1 - t, 3);

  if (cameraTransition.targetBodyId === 'overview') {
    const overviewTarget = new THREE.Vector3(0, 0, 0);
    const overviewCamPos = new THREE.Vector3(0, 220, 380);

    controls.target.lerpVectors(cameraTransition.startTarget, overviewTarget, easeOut);
    camera.position.lerpVectors(cameraTransition.startCamPos, overviewCamPos, easeOut);
  } else {
    const targetEntry = bodiesRegistry.get(cameraTransition.targetBodyId);
    if (targetEntry) {
      const dynamicPlanetPos = new THREE.Vector3();
      targetEntry.mesh.getWorldPosition(dynamicPlanetPos);

      const targetCamPos = dynamicPlanetPos.clone().addScaledVector(
        cameraTransition.desiredOffsetDir,
        cameraTransition.desiredDistance
      );

      controls.target.lerpVectors(cameraTransition.startTarget, dynamicPlanetPos, easeOut);
      camera.position.lerpVectors(cameraTransition.startCamPos, targetCamPos, easeOut);

      if (lastPlanetPosition) {
        lastPlanetPosition.copy(dynamicPlanetPos);
      } else {
        lastPlanetPosition = dynamicPlanetPos.clone();
      }
    }
  }

  if (t >= 1) {
    cameraTransition.active = false;
  }
}

/* ========================================================
   ATUALIZAÇÃO DA INTERFACE HUD / TELEMETRIA
   ======================================================== */
const infoPanel = document.getElementById('info-panel');
const bodyTypeEl = document.getElementById('body-type');
const bodyNameEl = document.getElementById('body-name');
const bodyDescEl = document.getElementById('body-desc');
const statDiameterEl = document.getElementById('stat-diameter');
const statDistanceEl = document.getElementById('stat-distance');
const statOrbitEl = document.getElementById('stat-orbit');
const statDayEl = document.getElementById('stat-day');
const statMoonsEl = document.getElementById('stat-moons');
const statTempEl = document.getElementById('stat-temp');
const toggleInfoBtn = document.getElementById('toggle-info-btn');

function updateInfoPanel(data) {
  if (!infoPanel) return;
  infoPanel.classList.remove('collapsed');
  if (toggleInfoBtn) toggleInfoBtn.classList.add('active');

  bodyTypeEl.textContent = data.type.toUpperCase();
  bodyNameEl.textContent = data.name;
  bodyDescEl.textContent = data.description;

  statDiameterEl.textContent = data.facts.diameter;
  statDistanceEl.textContent = data.facts.realDistance;
  statOrbitEl.textContent = data.facts.orbitalPeriod;
  statDayEl.textContent = data.facts.dayDuration;
  statMoonsEl.textContent = data.facts.moons;
  statTempEl.textContent = data.facts.temperature;
}

function updateInfoPanelForOverview() {
  if (!infoPanel) return;
  infoPanel.classList.remove('collapsed');
  if (toggleInfoBtn) toggleInfoBtn.classList.add('active');

  bodyTypeEl.textContent = 'SISTEMA HELIOCÊNTRICO';
  bodyNameEl.textContent = 'Sistema Solar';
  bodyDescEl.textContent = 'Composto por uma estrela anã amarela (o Sol), 8 planetas principais, centenas de satélites naturais, cinturões de asteroides e cometas, formado há cerca de 4,6 bilhões de anos.';

  statDiameterEl.textContent = '~287 bilhões de km';
  statDistanceEl.textContent = 'Via Láctea (Órion)';
  statOrbitEl.textContent = '230 Ma';
  statDayEl.textContent = '—';
  statMoonsEl.textContent = '290+ luas';
  statTempEl.textContent = 'Variável (-230°C a +465°C)';
}

/* ========================================================
   LISTENERS DE CONTROLE E UI
   ======================================================== */
document.querySelectorAll('.nav-btn').forEach(button => {
  button.addEventListener('click', () => {
    const target = button.getAttribute('data-target');
    focusOnBody(target);
  });
});

document.getElementById('focus-btn')?.addEventListener('click', () => {
  if (state.focusedBodyId) focusOnBody(state.focusedBodyId);
});

document.getElementById('reset-cam-btn')?.addEventListener('click', () => {
  focusOnBody('overview');
});

// Fechar / Minimizar painel
document.getElementById('close-panel-btn')?.addEventListener('click', () => {
  infoPanel.classList.toggle('collapsed');
  if (toggleInfoBtn) toggleInfoBtn.classList.toggle('active', !infoPanel.classList.contains('collapsed'));
});

// Toque na alça do Bottom Sheet no mobile para alternar
document.getElementById('bottom-sheet-handle')?.addEventListener('click', () => {
  infoPanel.classList.toggle('collapsed');
  if (toggleInfoBtn) toggleInfoBtn.classList.toggle('active', !infoPanel.classList.contains('collapsed'));
});

// Botão Info na barra de controle
toggleInfoBtn?.addEventListener('click', () => {
  infoPanel.classList.toggle('collapsed');
  toggleInfoBtn.classList.toggle('active', !infoPanel.classList.contains('collapsed'));
});

// Play / Pause
const playPauseBtn = document.getElementById('play-pause-btn');
const playPauseIcon = document.getElementById('play-pause-icon');
const playPauseText = document.getElementById('play-pause-text');

playPauseBtn?.addEventListener('click', () => {
  state.isPaused = !state.isPaused;
  if (playPauseIcon) playPauseIcon.textContent = state.isPaused ? '▶️' : '⏸️';
  if (playPauseText) playPauseText.textContent = state.isPaused ? 'Retomar' : 'Pausar';
  playPauseBtn.classList.toggle('active', state.isPaused);
});

// Controle de velocidade
const speedSlider = document.getElementById('speed-slider');
const speedDisplay = document.getElementById('speed-display');

speedSlider?.addEventListener('input', (e) => {
  state.timeScale = parseFloat(e.target.value);
  if (speedDisplay) speedDisplay.textContent = `${state.timeScale.toFixed(1)}x`;
});

// Alternar órbitas
const toggleOrbitsBtn = document.getElementById('toggle-orbits-btn');
toggleOrbitsBtn?.addEventListener('click', () => {
  state.showOrbits = !state.showOrbits;
  orbitLinesGroup.visible = state.showOrbits;
  const moonEntry = bodiesRegistry.get('moon');
  if (moonEntry && moonEntry.orbitLine) {
    moonEntry.orbitLine.visible = state.showOrbits;
  }
  toggleOrbitsBtn.classList.toggle('active', state.showOrbits);
});

// Alternar nuvens da Terra
const toggleCloudsBtn = document.getElementById('toggle-clouds-btn');
toggleCloudsBtn?.addEventListener('click', () => {
  state.showClouds = !state.showClouds;
  if (earthCloudsMesh) earthCloudsMesh.visible = state.showClouds;
  toggleCloudsBtn.classList.toggle('active', state.showClouds);
});

/* ========================================================
   LOOP DE ANIMAÇÃO E FÍSICA ORBITAL
   ======================================================== */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const effectiveDelta = state.isPaused ? 0 : delta * state.timeScale;

  // 1. Rotação lenta da textura/esfera do Sol para dinamismo cósmico vivo
  sunMesh.rotation.y += 0.0012 * (state.isPaused ? 0.25 : state.timeScale);

  // 2. Movimento orbital e rotação dos planetas
  bodiesRegistry.forEach((entry, bodyId) => {
    if (bodyId === 'sun') return;

    if (bodyId === 'moon') {
      const earthEntry = bodiesRegistry.get('earth');
      if (earthEntry) {
        entry.angle += entry.data.orbitSpeed * effectiveDelta;
        
        const mx = earthEntry.container.position.x + Math.cos(entry.angle) * entry.data.distance;
        const mz = earthEntry.container.position.z + Math.sin(entry.angle) * entry.data.distance;
        const my = earthEntry.container.position.y + Math.sin(entry.angle * 1.5) * 0.7;

        entry.container.position.set(mx, my, mz);
        entry.mesh.rotation.y += entry.data.rotationSpeed * (state.isPaused ? 0.2 : state.timeScale);

        if (entry.orbitLine) {
          entry.orbitLine.position.copy(earthEntry.container.position);
        }
      }
      return;
    }

    // Planetas em órbita heliocêntrica
    entry.angle += entry.data.orbitSpeed * effectiveDelta;
    const px = Math.cos(entry.angle) * entry.data.distance;
    const pz = Math.sin(entry.angle) * entry.data.distance;

    entry.container.position.set(px, 0, pz);

    // Rotação sobre o próprio eixo
    entry.mesh.rotation.y += entry.data.rotationSpeed * (state.isPaused ? 0.2 : state.timeScale);

    // Rotação independente suave das nuvens da Terra
    if (bodyId === 'earth' && earthCloudsMesh) {
      earthCloudsMesh.rotation.y += 0.0035 * (state.isPaused ? 0.2 : state.timeScale);
    }
  });

  // 3. Transição suave de câmera (se ativa)
  updateCameraTransition(delta);

  // 4. Modo de Rastreamento (Tracking) do Planeta focado
  if (!cameraTransition.active && state.focusedBodyId && state.focusedBodyId !== 'overview') {
    const currentFocused = bodiesRegistry.get(state.focusedBodyId);
    if (currentFocused) {
      const currentPos = new THREE.Vector3();
      currentFocused.mesh.getWorldPosition(currentPos);

      if (lastPlanetPosition) {
        const deltaMove = currentPos.clone().sub(lastPlanetPosition);

        controls.target.add(deltaMove);
        camera.position.add(deltaMove);

        lastPlanetPosition.copy(currentPos);
      } else {
        lastPlanetPosition = currentPos.clone();
      }
    }
  }

  // 5. Rotação sutil das partículas estelares para dinamismo
  starfieldParticles.rotation.y += 0.00004;

  // 6. Atualização do OrbitControls (com damping habilitado)
  controls.update();

  // 7. Renderização com seleção inteligente de pipeline de GPU
  // Em mobile: renderiza direto via WebGLRenderer garantindo 60 FPS lisos na Adreno 610
  // Em desktop: renderiza via EffectComposer com UnrealBloomPass para máxima fidelidade
  if (isMobile || !composer) {
    renderer.render(scene, camera);
  } else {
    composer.render();
  }
}

/* ========================================================
   REDIMENSIONAMENTO RESPONSIVO
   ======================================================== */
window.addEventListener('resize', () => {
  isMobile = checkIsMobile();
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (isMobile) {
    renderer.setPixelRatio(1.0);
    controls.zoomSpeed = 1.8;
  } else {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    controls.zoomSpeed = 2.5;
    if (composer) {
      composer.setSize(window.innerWidth, window.innerHeight);
      composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  }
});

// Inicialização
updateInfoPanelForOverview();
animate();
