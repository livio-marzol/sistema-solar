import * as THREE from 'three';

/**
 * Cria a corona solar suave hiper-realista utilizando um Sprite billboard com gradiente radial sem arestas.
 * Elimina anéis e aros poligonais rígidos, fornecendo um brilho solar difuso que alimenta
 * o passe de UnrealBloomPass de forma orgânica.
 * 
 * @param {number} sunRadius - Raio do Sol
 * @returns {THREE.Sprite}
 */
export function createSunCoronaSprite(sunRadius) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.18, 'rgba(255, 235, 160, 0.95)');
  gradient.addColorStop(0.35, 'rgba(255, 180, 50, 0.7)');
  gradient.addColorStop(0.55, 'rgba(255, 120, 20, 0.35)');
  gradient.addColorStop(0.75, 'rgba(255, 70, 0, 0.12)');
  gradient.addColorStop(0.92, 'rgba(200, 40, 0, 0.03)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });

  const coronaSprite = new THREE.Sprite(spriteMaterial);
  // Escala generosa que cobre o disco solar com decaimento natural
  const scale = sunRadius * 4.2;
  coronaSprite.scale.set(scale, scale, 1.0);
  coronaSprite.name = 'sun-corona-sprite';

  return coronaSprite;
}
