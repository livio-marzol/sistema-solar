import * as THREE from 'three';

/**
 * Cria a atmosfera volumétrica hiper-realista da Terra utilizando um ShaderMaterial com efeito Fresnel em GLSL.
 * Elimina contornos e arestas duras, gerando um halo suave com intensidade máxima no limbo
 * e decaimento exponencial gradativo até transparência total.
 * 
 * @param {number} planetRadius - Raio do planeta base (Terra)
 * @returns {THREE.Mesh}
 */
export function createEarthAtmosphereMesh(planetRadius) {
  // A atmosfera se estende ligeiramente além do topo das nuvens (raio * 1.035)
  const geometry = new THREE.SphereGeometry(planetRadius * 1.035, 64, 64);

  const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      // Vetores normal e de visão no espaço da câmera (eye space)
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    uniform vec3 atmosphereColor;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    void main() {
      // Produto escalar entre a normal interna e a linha de visão
      // No centro da esfera vista de frente, viewDot aproxima-se de 1.0 (transparente)
      // Na borda tangencial (limbo), viewDot aproxima-se de 0.0 (intensidade máxima)
      float viewDot = dot(vNormal, vViewDir);
      
      // Decaimento suave com potência exponencial (Fresnel)
      float fresnel = pow(1.0 - abs(viewDot), 3.2);
      fresnel = smoothstep(0.05, 0.9, fresnel);

      // Alfa final suave sem corte abrupto
      gl_FragColor = vec4(atmosphereColor, fresnel * 0.72);
    }
  `;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      atmosphereColor: { value: new THREE.Color(0x4ca3ff) } // Azul celeste cósmico
    },
    vertexShader,
    fragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });

  const atmosphereMesh = new THREE.Mesh(geometry, material);
  atmosphereMesh.name = 'earth-atmosphere-fresnel';
  return atmosphereMesh;
}
