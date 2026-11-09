import * as THREE from 'three';

/**
 * Cria a geometria do anel de Saturno com coordenadas UV radiais mapeadas
 * para que a textura em faixa (1D estendida em 2048x125) seja mapeada
 * perfeitamente do raio interno ao externo.
 * 
 * @param {number} innerRadius - Raio interno do anel
 * @param {number} outerRadius - Raio externo do anel
 * @param {number} thetaSegments - Segmentos angulares (64 ou 128 para círculo suave)
 * @returns {THREE.RingGeometry}
 */
export function createSaturnRingGeometry(innerRadius, outerRadius, thetaSegments = 128) {
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, thetaSegments);
  const pos = geometry.attributes.position;
  const uvs = geometry.attributes.uv;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const distance = Math.sqrt(x * x + y * y);
    // Fração de distância entre raio interno e raio externo (0 a 1)
    const normalizedDistance = (distance - innerRadius) / (outerRadius - innerRadius);
    
    // UV: U mapeia o corte radial, V fica centralizado em 0.5
    uvs.setXY(i, Math.max(0, Math.min(1, normalizedDistance)), 0.5);
  }

  uvs.needsUpdate = true;
  return geometry;
}
