# NASA Eyes — Sistema Solar 3D Interativo (Three.js + Vite)

Uma aplicação web 3D interativa do Sistema Solar inspirada na plataforma **NASA Eyes**, construída com **Three.js** e empacotada com **Vite**.

## 🚀 Como Executar

### Pré-requisitos
- Node.js instalado (v18+)
- npm instalado

### Desenvolvimento local
```bash
# Iniciar o servidor de desenvolvimento
npm run dev
```
Abra o navegador no endereço indicado (geralmente `http://localhost:3000`).

### Compilação de Produção
```bash
# Gerar o bundle de produção otimizado na pasta dist/
npm run build

# Pré-visualizar a versão de produção localmente
npm run preview
```

---

## 🌟 Funcionalidades e Arquitetura

### 1. Iluminação e Sol
- **Sol**: Esfera 3D texturizada com `2k_sun.jpg` e `MeshBasicMaterial` para manter o brilho natural sem sofrer sombras.
- **Corona Solar**: Halo estelar sutil em volta do Sol com mesclagem aditiva.
- **PointLight**: Posicionado no centro exato do Sol `(0, 0, 0)` para iluminar os planetas realisticamente, criando o terminador dia/noite.
- **AmbientLight**: Luz ambiente calibrada para manter o relevo e silhueta do lado escuro visíveis contra o espaço.

### 2. Planetas, Luas e Anéis
- **Planetas**: Mercúrio, Vênus, Terra, Marte, Júpiter, Saturno, Urano e Netuno, além da Lua terrestre.
- **Material Realista**: Todos os planetas usam `MeshStandardMaterial` reagindo fisicamente à luz solar.
- **Nuvens da Terra**: Camada esférica atmosférica secundária animada com `2k_earth_clouds.jpg`.
- **Anéis de Saturno**: Geometria `RingGeometry` com mapeamento UV radial personalizado que distribui perfeitamente a textura `2k_saturn_ring_alpha.png` ao redor da circunferência.
- **Órbitas Visíveis**: Linhas discretas e translúcidas em `LineBasicMaterial` com opção de alternância.
- **Dinâmica Orbital**: Translação heliocêntrica proporcional e rotação no próprio eixo com as respectivas inclinações axiais (incluindo Urano rolando de lado e Vênus com rotação retrógrada).

### 3. Experiência de Câmera "NASA Eyes"
- **OrbitControls com Damping**: Rotação, pan e zoom suaves com inércia ativada (`dampingFactor: 0.05`).
- **Transição Cinematográfica**: Ao selecionar qualquer astro (via menu ou clicando diretamente no corpo 3D com raycaster), a câmera voa suavemente com interpolação cúbica até o corpo celeste.
- **Modo de Acompanhamento (Tracking)**: A câmera e o ponto de foco acompanham o planeta em sua órbita em tempo real enquanto permite ao usuário rotacionar livremente em 360°.
- **Fundo Cósmico Duplo**: Esfera celeste da Via Láctea combinada com campo de partículas de estrelas tridimensional para sensação de profundidade e paralaxe.

### 4. Interface HUD & Telemetria
- **Seletor Celestial**: Botões rápidos para Sol, planetas, Lua e Visão Geral.
- **Cartão de Telemetria**: Diâmetro, distância média, período orbital, duração do dia, número de luas conhecidas, temperatura e descrição astronômica.
- **Controles de Simulação**: Play/Pause, controle de velocidade (0.2x a 5.0x), alternar linhas de órbita, alternar nuvens e modo cinema (ocultar HUD).
