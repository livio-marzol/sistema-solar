/**
 * Dados dos corpos celestes para a simulação NASA Eyes
 * Escalas balanceadas para visualização interativa 3D de alta fidelidade
 */

export const CELESTIAL_BODIES = [
  {
    id: 'sun',
    name: 'Sol',
    type: 'Estrela Anã Amarela (G2V)',
    radius: 16.0,
    distance: 0,
    orbitSpeed: 0,
    rotationSpeed: 0.002,
    axialTilt: 7.25,
    texture: './textures/sun.jpg',
    color: '#ffcc33',
    cameraDistance: 45,
    description: 'O Sol é a estrela no centro do nosso Sistema Solar. Ele contém 99,86% de toda a massa do sistema e gera sua energia através da fusão termonuclear de hidrogênio em hélio em seu núcleo.',
    facts: {
      diameter: '1.392.700 km (109x a Terra)',
      realDistance: '0 km (Centro do Sistema)',
      orbitalPeriod: '230 milhões de anos (Galáxia)',
      dayDuration: '25 a 35 dias terrestres',
      moons: '8 planetas, centenas de luas e asteroides',
      temperature: '5.500 °C (Superfície) / 15.000.000 °C (Núcleo)'
    }
  },
  {
    id: 'mercury',
    name: 'Mercúrio',
    type: 'Planeta Telúrico',
    radius: 2.2,
    distance: 34,
    orbitSpeed: 0.040,
    rotationSpeed: 0.004,
    axialTilt: 0.034,
    texture: './textures/2k_mercury.jpg',
    fallbackColor: '#8c8c8c',
    color: '#a39e99',
    cameraDistance: 8,
    description: 'Mercúrio é o menor e mais interno planeta do Sistema Solar. Não possui atmosfera significativa para reter calor, resultando nas maiores variações térmicas diárias de todo o sistema.',
    facts: {
      diameter: '4.879 km (0,38x a Terra)',
      realDistance: '57,9 milhões de km (0,39 UA)',
      orbitalPeriod: '88 dias terrestres',
      dayDuration: '59 dias terrestres',
      moons: '0',
      temperature: '-180 °C a 430 °C'
    }
  },
  {
    id: 'venus',
    name: 'Vênus',
    type: 'Planeta Telúrico',
    radius: 3.6,
    distance: 50,
    orbitSpeed: 0.026,
    rotationSpeed: -0.002, // Rotação retrógrada
    axialTilt: 177.3,
    texture: './textures/2k_venus_atmosphere.jpg',
    surfaceTexture: './textures/2k_venus_surface.jpg',
    color: '#e3bb76',
    cameraDistance: 11,
    description: 'Frequentemente chamado de "gêmeo da Terra" em tamanho, Vênus possui uma atmosfera densa de dióxido de carbono com nuvens de ácido sulfúrico, criando um efeito estufa descontrolado.',
    facts: {
      diameter: '12.104 km (0,95x a Terra)',
      realDistance: '108,2 milhões de km (0,72 UA)',
      orbitalPeriod: '224,7 dias terrestres',
      dayDuration: '243 dias terrestres (retrógrado)',
      moons: '0',
      temperature: '465 °C (o mais quente do sistema)'
    }
  },
  {
    id: 'earth',
    name: 'Terra',
    type: 'Planeta Telúrico',
    radius: 4.0,
    distance: 70,
    orbitSpeed: 0.018,
    rotationSpeed: 0.015,
    axialTilt: 23.44,
    texture: './textures/earth_day.jpg',
    nightTexture: './textures/earth_night.jpg',
    cloudsTexture: './textures/earth_clouds.jpg',
    color: '#4b9cd3',
    cameraDistance: 13,
    hasMoon: true,
    description: 'Nosso lar no cosmos. A Terra é o único planeta conhecido a abrigar vida, com oceanos de água líquida cobrindo 71% de sua superfície e uma atmosfera protetora rica em nitrogênio e oxigênio.',
    facts: {
      diameter: '12.742 km',
      realDistance: '149,6 milhões de km (1,00 UA)',
      orbitalPeriod: '365,25 dias',
      dayDuration: '23h 56m 4s',
      moons: '1 (A Lua)',
      temperature: 'Média de 15 °C (-89 °C a 58 °C)'
    }
  },
  {
    id: 'moon',
    name: 'Lua',
    type: 'Satélite Natural',
    radius: 1.2,
    distance: 8.5, // Distância em relação à Terra
    orbitSpeed: 0.05,
    rotationSpeed: 0.01,
    axialTilt: 1.54,
    texture: './textures/moon.jpg',
    color: '#c2c2c2',
    cameraDistance: 4.5,
    isMoon: true,
    parentBody: 'earth',
    description: 'O único satélite natural da Terra e o quinto maior satélite do Sistema Solar. Sua atração gravitacional modula a inclinação do eixo da Terra e dita o ritmo das marés oceânicas.',
    facts: {
      diameter: '3.474 km (0,27x a Terra)',
      realDistance: '384.400 km da Terra',
      orbitalPeriod: '27,3 dias terrestres',
      dayDuration: 'Acoplamento de maré (rotação síncrona)',
      moons: '0',
      temperature: '-130 °C a 120 °C'
    }
  },
  {
    id: 'mars',
    name: 'Marte',
    type: 'Planeta Telúrico',
    radius: 2.7,
    distance: 95,
    orbitSpeed: 0.013,
    rotationSpeed: 0.014,
    axialTilt: 25.19,
    texture: './textures/2k_mars.jpg',
    color: '#c1440e',
    cameraDistance: 9,
    description: 'O "Planeta Vermelho" deve sua cor ao óxido de ferro abundante em seu solo. Abriga o Monte Olimpo (o maior vulcão do Sistema Solar) e vales fluviais antigos que indicam um passado com água líquida abundante.',
    facts: {
      diameter: '6.779 km (0,53x a Terra)',
      realDistance: '227,9 milhões de km (1,52 UA)',
      orbitalPeriod: '687 dias terrestres',
      dayDuration: '24h 37m (1 sol)',
      moons: '2 (Fobos e Deimos)',
      temperature: '-140 °C a 20 °C'
    }
  },
  {
    id: 'jupiter',
    name: 'Júpiter',
    type: 'Gigante Gasoso',
    radius: 10.0,
    distance: 135,
    orbitSpeed: 0.007,
    rotationSpeed: 0.035, // Rotação rápida
    axialTilt: 3.13,
    texture: './textures/2k_jupiter.jpg',
    color: '#d4a373',
    cameraDistance: 28,
    description: 'O maior planeta do Sistema Solar, com massa mais de duas vezes superior à de todos os outros planetas combinados. Conhecido por suas faixas atmosféricas dinâmicas e pela lendária Grande Mancha Vermelha.',
    facts: {
      diameter: '139.820 km (11x a Terra)',
      realDistance: '778,5 milhões de km (5,20 UA)',
      orbitalPeriod: '11,86 anos terrestres',
      dayDuration: '9h 55m (dia mais curto)',
      moons: '95 conhecidas (Io, Europa, Ganimedes, Calisto...)',
      temperature: '-110 °C (Topo das nuvens)'
    }
  },
  {
    id: 'saturn',
    name: 'Saturno',
    type: 'Gigante Gasoso',
    radius: 8.5,
    distance: 185,
    orbitSpeed: 0.0048,
    rotationSpeed: 0.032,
    axialTilt: 26.73,
    texture: './textures/2k_saturn.jpg',
    ringTexture: './textures/2k_saturn_ring_alpha.png',
    hasRings: true,
    ringInnerRadius: 11.5,
    ringOuterRadius: 21.0,
    color: '#e2bf7d',
    cameraDistance: 32,
    description: 'Famoso por seu deslumbrante e complexo sistema de anéis composto por bilhões de partículas de gelo e rocha. É o segundo maior planeta e tem densidade média menor que a da água.',
    facts: {
      diameter: '116.460 km (9,1x a Terra)',
      realDistance: '1,43 bilhão de km (9,58 UA)',
      orbitalPeriod: '29,45 anos terrestres',
      dayDuration: '10h 33m',
      moons: '146 conhecidas (Titã, Encélado, Mimas...)',
      temperature: '-140 °C'
    }
  },
  {
    id: 'uranus',
    name: 'Urano',
    type: 'Gigante de Gelo',
    radius: 5.8,
    distance: 235,
    orbitSpeed: 0.0032,
    rotationSpeed: 0.02,
    axialTilt: 97.77, // Rola de lado
    texture: './textures/2k_uranus.jpg',
    color: '#70d6ff',
    cameraDistance: 18,
    description: 'Um gigante de gelo com atmosfera de hidrogênio, hélio e metano que lhe confere um tom azul-esverdeado pálido. Gira praticamente "deitado", com uma inclinação axial única de quase 98 graus.',
    facts: {
      diameter: '50.724 km (4x a Terra)',
      realDistance: '2,87 bilhões de km (19,2 UA)',
      orbitalPeriod: '84 anos terrestres',
      dayDuration: '17h 14m (retrógrado)',
      moons: '28 conhecidas (Titânia, Oberon, Miranda...)',
      temperature: '-224 °C (a atmosfera mais fria)'
    }
  },
  {
    id: 'neptune',
    name: 'Netuno',
    type: 'Gigante de Gelo',
    radius: 5.6,
    distance: 285,
    orbitSpeed: 0.0022,
    rotationSpeed: 0.022,
    axialTilt: 28.32,
    texture: './textures/2k_neptune.jpg',
    color: '#4361ee',
    cameraDistance: 18,
    description: 'O planeta mais distante do Sol. Netuno é um mundo dinâmico e gelado, varrido pelos ventos mais velozes do Sistema Solar, que podem ultrapassar 2.100 km/h.',
    facts: {
      diameter: '49.244 km (3,86x a Terra)',
      realDistance: '4,50 bilhões de km (30,1 UA)',
      orbitalPeriod: '164,8 anos terrestres',
      dayDuration: '16h 06m',
      moons: '16 conhecidas (Tritão, Proteu...)',
      temperature: '-214 °C'
    }
  }
];
