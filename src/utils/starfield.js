import * as THREE from 'three';

/**
 * Cria o campo de partículas tridimensional de estrelas cósmicas
 * para gerar profundidade espacial e paralaxe quando a câmera se move.
 * O fundo da Via Láctea é aplicado via scene.background com EquirectangularReflectionMapping.
 * 
 * @returns {THREE.Points}
 */
export function createStarfieldPoints() {
  const starCount = 3500;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  const starColors = [
    new THREE.Color(0xffffff), // Branca brilhante
    new THREE.Color(0xdbe9ff), // Azulada jovem
    new THREE.Color(0xfff4e8), // Amarelada solar
    new THREE.Color(0xffd2a1), // Gigante alaranjada
    new THREE.Color(0xb5d4ff)  // Azul celeste
  ];

  for (let i = 0; i < starCount; i++) {
    const radius = 500 + Math.random() * 800;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);

    const chosenColor = starColors[Math.floor(Math.random() * starColors.length)];
    colors[i * 3] = chosenColor.r;
    colors[i * 3 + 1] = chosenColor.g;
    colors[i * 3 + 2] = chosenColor.b;
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Canvas para ponto estelar suave
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  gradient.addColorStop(0.65, 'rgba(180,215,255,0.25)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  const starPointTexture = new THREE.CanvasTexture(canvas);

  const starMaterial = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    map: starPointTexture,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const starField = new THREE.Points(starGeometry, starMaterial);
  starField.name = 'starfield-particles';
  return starField;
}
