
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// -- Global Variables --
let scene, camera, renderer, composer;
let uniforms;
let liquidPass;
let particles;
let heroObject; // The main 3D character/object
let heroMixer; // For GLTF animations if any
let soundEnabled = false;
let audioCtx;
let masterGain;
let oscillators = [];
let cursorRAF;
let lastScrollY = window.scrollY;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// -- Audio Analysis --
let analyser, dataArray;
let audioSource;
let bassIntensity = 0;
let midIntensity = 0;
let highIntensity = 0;

// -- Cursor Trails --
let cursorTrails = [];
const MAX_TRAILS = 20;

// -- Mini-Game State --
let score = 0;
let isGameActive = false;
let gameCubes = [];
let heroClicks = 0;
let clickTimer = null;

// -- Audio (Music Playback) --
let bgMusic = null;

function initAudio() {
    try {
        if (!bgMusic) {
            bgMusic = new Audio('assets/music.mp3');
            bgMusic.loop = true;
            bgMusic.volume = 0.4;

            // Setup Analyser
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (!audioSource && audioCtx) {
                audioSource = audioCtx.createMediaElementSource(bgMusic);
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 256;
                const bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);

                audioSource.connect(analyser);
                analyser.connect(audioCtx.destination);
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    } catch (e) {
        console.warn("Audio Context init failed:", e);
    }
}

function playSound() {
    initAudio();
    if (bgMusic) {
        bgMusic.play().catch(err => console.log("Audio play blocked:", err));
    }
}

function stopSound() {
    if (bgMusic) {
        bgMusic.pause();
    }
}



function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundBtn');
    const icon = document.getElementById('soundIcon');

    if (soundEnabled) {
        playSound();
        if (icon) icon.classList.add('active');
        if (btn) btn.querySelector('.label').style.color = 'var(--secondary)';
    } else {
        stopSound();
        if (icon) icon.classList.remove('active');
        if (btn) btn.querySelector('.label').style.color = 'inherit';
    }
}

// -- Cursor trails logic --
class CursorTrailParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 10 + 5; // Larger
        this.opacity = 1;
        this.el = document.createElement('div');
        this.el.className = 'cursor-trail';
        document.body.appendChild(this.el);
        this.update();
    }
    update() {
        this.opacity -= 0.03; // Slower fade
        this.size -= 0.2;
        this.el.style.transform = `translate(${this.x - this.size / 2}px, ${this.y - this.size / 2}px)`; // Center it
        this.el.style.opacity = this.opacity;
        this.el.style.width = `${this.size}px`;
        this.el.style.height = `${this.size}px`;
    }
}

// -- Custom Cursor --
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');
const cursorLabel = document.querySelector('.cursor-label');

let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;
let dotX = 0, dotY = 0;

if (window.matchMedia("(min-width: 769px)").matches) {
    document.body.classList.add('custom-cursor-active');
    if (cursor) cursor.style.display = 'block';
    if (cursorFollower) cursorFollower.style.display = 'flex';

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Instant update for dot
        if (cursor) {
            cursor.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
        }

        // Pass to shader
        if (uniforms) {
            uniforms.uMouse.value.x = (mouseX / window.innerWidth) * 2 - 1;
            uniforms.uMouse.value.y = -(mouseY / window.innerHeight) * 2 + 1;
        }

        // Spawn Trail
        if (cursorTrails.length < MAX_TRAILS) {
            cursorTrails.push(new CursorTrailParticle(e.clientX, e.clientY));
        }
    });

    function setCursorLabel(text) {
        if (!cursorFollower || !cursorLabel) return;
        if (text) {
            cursorLabel.textContent = text;
            cursorFollower.classList.add('has-label');
        } else {
            cursorFollower.classList.remove('has-label');
        }
    }

    // Smooth follower using Lerp
    function animateCursor() {
        // Dot follows with slight weight
        dotX += (mouseX - dotX) * 0.4;
        dotY += (mouseY - dotY) * 0.4;

        // Follower follows with more weight/lag
        followerX += (mouseX - followerX) * 0.12;
        followerY += (mouseY - followerY) * 0.12;

        if (cursor) {
            cursor.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;
        }

        if (cursorFollower) {
            const fw = cursorFollower.offsetWidth / 2;
            const fh = cursorFollower.offsetHeight / 2;
            cursorFollower.style.transform = `translate(${followerX - fw}px, ${followerY - fh}px)`;
        }

        // Update Trails
        cursorTrails.forEach((trail, index) => {
            trail.update();
            if (trail.opacity <= 0) {
                trail.el.remove();
                cursorTrails.splice(index, 1);
            }
        });

        cursorRAF = requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Context Listeners
    document.querySelectorAll('section').forEach(section => {
        section.addEventListener('mouseenter', () => {
            if (section.id === 'section-0') setCursorLabel('SCROLL');
            else if (section.id === 'section-5') setCursorLabel('PROJECTS');
            else if (section.id === 'section-6') setCursorLabel('CONTACT');
            else setCursorLabel('');
        });
    });

    document.querySelectorAll('a, button, .project-card, .nav-item, .reveal-text, .section-text, .skill-item').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorFollower.classList.add('active');
            if (el.classList.contains('project-card')) setCursorLabel('VIEW');
            else if (el.classList.contains('reveal-text')) setCursorLabel('READ');
            else if (el.classList.contains('section-text')) setCursorLabel('INFO');
            else if (el.classList.contains('skill-item')) setCursorLabel('SKILL');
            else if (el.tagName === 'A' || el.tagName === 'BUTTON') setCursorLabel('ENTER');
        });
        el.addEventListener('mouseleave', () => {
            cursorFollower.classList.remove('active');
            setCursorLabel('');
        });
    });
}

// -- Loading --
const counter = document.getElementById('counter');
let count = 0;
const targetCount = 100;
const counterInterval = setInterval(() => {
    count += 1.5;
    if (count >= targetCount) {
        count = targetCount;
        clearInterval(counterInterval);
        const sb = document.getElementById('startBtn');
        if (sb) {
            sb.style.opacity = '1';
            sb.style.pointerEvents = 'all';
        }
    }
    if (counter) counter.textContent = String(Math.floor(count)).padStart(3, '0') + '%';
}, 16);

const startBtn = document.getElementById('startBtn');
const loadingScreen = document.getElementById('loadingScreen');

if (startBtn) {
    startBtn.addEventListener('click', () => {
        if (typeof gsap !== 'undefined') {
            gsap.to(loadingScreen, {
                opacity: 0,
                duration: 1,
                onComplete: () => {
                    loadingScreen.style.display = 'none';
                    initThree();
                    initScrollAnimations();
                }
            });
        }

        // Init Audio Context (must be user gesture)
        const audioCtxState = initAudio();

        // Init magnetic after loading
        initMagneticElements();
    });
}

// -- Command Center (Ctrl+K) --
const commandCenter = document.getElementById('command-center');
const ccInput = document.getElementById('cc-input');
const ccResults = document.getElementById('cc-results');

const commands = [
    { name: '/about', action: () => document.getElementById('section-1').scrollIntoView({ behavior: 'smooth' }) },
    { name: '/skills', action: () => document.getElementById('section-2').scrollIntoView({ behavior: 'smooth' }) },
    { name: '/projects', action: () => document.getElementById('section-5').scrollIntoView({ behavior: 'smooth' }) },
    { name: '/contact', action: () => document.getElementById('section-6').scrollIntoView({ behavior: 'smooth' }) },
    {
        name: '/cyberpunk', action: () => {
            document.body.className = '';
            applyThemeColors(0xff3366, 0x00d4ff);
        }
    },
    {
        name: '/matrix', action: () => {
            document.body.className = 'theme-matrix';
            applyThemeColors(0x00ff41, 0x008f11);
        }
    },
    {
        name: '/minimalist', action: () => {
            document.body.className = 'theme-minimalist';
            applyThemeColors(0x000000, 0x444444);
        }
    },
    { name: '/game', action: () => startMiniGame() }
];

console.log("Global Commands:", commands.map(c => c.name));

function applyThemeColors(primary, secondary) {
    console.log("Applying theme colors:", primary, secondary);
    if (particles) {
        particles.material.color.setHex(primary);
    }
}

function toggleCommandCenter(show) {
    if (show) {
        commandCenter.classList.add('active');
        ccInput.focus();
    } else {
        commandCenter.classList.remove('active');
        ccInput.value = '';
    }
}

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        toggleCommandCenter(true);
    }
    if (e.key === 'Escape') {
        toggleCommandCenter(false);
    }
});

ccInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const val = ccInput.value.trim().toLowerCase();
        console.log("Executing command search for:", val);
        const cmd = commands.find(c => c.name === val);
        if (cmd) {
            console.log("Executing:", cmd.name);
            cmd.action();
            toggleCommandCenter(false);
        } else if (val.startsWith('/')) {
            console.error("UNKNOWN COMMAND FAIL:", val, "Available:", commands.map(c => c.name));
            alert('Unknown command: ' + val);
        }
    }
});

// -- Magnetic Effect --
function initMagneticElements() {
    const magnets = document.querySelectorAll('.magnetic');

    magnets.forEach(magnet => {
        magnet.addEventListener('mousemove', (e) => {
            const rect = magnet.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(magnet, {
                x: x * 0.4,
                y: y * 0.4,
                duration: 0.3,
                ease: "power2.out"
            });
        });

        magnet.addEventListener('mouseleave', () => {
            gsap.to(magnet, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });
}

// -- UI Initialization (Run immediately) --
function initUI() {
    // Setup toggle listener
    const soundBtn = document.getElementById('soundBtn');
    if (soundBtn) {
        soundBtn.addEventListener('click', toggleSound);
    }

    // Menu listener
    const menuBtn = document.getElementById('menuBtn');
    const menuOverlay = document.getElementById('menuOverlay');
    const menuClose = document.getElementById('menuClose');
    const menuLinks = document.querySelectorAll('.menu-link');

    function toggleMenu(isOpen) {
        if (!menuOverlay) return;

        if (isOpen) {
            menuOverlay.classList.add('active');
            if (typeof gsap !== 'undefined') {
                gsap.fromTo('.menu-link',
                    { y: 50, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
                );
            }
        } else {
            menuOverlay.classList.remove('active');
        }
    }

    if (menuBtn) {
        menuBtn.addEventListener('click', () => toggleMenu(true));
    }
    if (menuClose) {
        menuClose.addEventListener('click', () => toggleMenu(false));
    }

    // Handle link clicks
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            toggleMenu(false);

            playShutterEffect(() => {
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    });

    // Logo listener
    const sceneLabel = document.getElementById('sceneLabel');
    if (sceneLabel) {
        sceneLabel.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // -- Mini-Game Click Listener --
    window.addEventListener('click', (e) => {
        if (!camera) return;
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        if (isGameActive) {
            const intersects = raycaster.intersectObjects(gameCubes);
            if (intersects.length > 0) {
                shootCube(intersects[0].object);
            }
            return;
        }

        if (heroObject) {
            const intersects = raycaster.intersectObject(heroObject, true);
            if (intersects.length > 0) {
                handleHeroClick();
            }
        }
    });
}

// Run UI Init
initUI();

// -- Mini-Game Functions --
function handleHeroClick() {
    heroClicks++;
    clearTimeout(clickTimer);

    if (heroClicks >= 3) {
        startMiniGame();
        heroClicks = 0;
    } else {
        clickTimer = setTimeout(() => { heroClicks = 0; }, 500);
        // Visual feedback
        gsap.to(heroObject.scale, { x: '+=0.2', y: '+=0.2', z: '+=0.2', duration: 0.1, yoyo: true, repeat: 1 });
    }
}

function startMiniGame() {
    if (isGameActive) return;
    isGameActive = true;
    score = 0;

    // UI Overlay for game
    const gameUI = document.createElement('div');
    gameUI.id = 'game-ui';
    gameUI.innerHTML = `
        <div class="game-score">SCORE: 0</div>
        <div class="game-hint">SHOOT THE GLITCHES!</div>
    `;
    document.body.appendChild(gameUI);

    // Spawn initial cubes
    for (let i = 0; i < 5; i++) spawnCube();
}

function spawnCube() {
    if (!isGameActive) return;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff41, wireframe: true });
    const cube = new THREE.Mesh(geometry, material);

    cube.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10
    );

    scene.add(cube);
    gameCubes.push(cube);
}

function shootCube(cube) {
    scene.remove(cube);
    gameCubes = gameCubes.filter(c => c !== cube);
    score++;

    const scoreUI = document.querySelector('.game-score');
    if (scoreUI) scoreUI.textContent = `SCORE: ${score}`;

    // Spawn more
    spawnCube();
    spawnCube();

    // Effect
    if (uniforms) uniforms.uGlitch.value = 5.0;
    setTimeout(() => { if (uniforms) uniforms.uGlitch.value = 0; }, 200);
}

// -- Liquid Distortion Shader --
const LiquidShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "uTime": { value: 0 },
        "uMouse": { value: new THREE.Vector2(0, 0) }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform vec2 uMouse;
        varying vec2 vUv;
        void main() {
            vec2 uv = vUv;
            
            // Mouse distance distortion
            float dist = distance(uv, uMouse * 0.5 + 0.5);
            float strength = smoothstep(0.5, 0.0, dist) * 0.05;
            
            // Liquid wavy movement
            uv.x += sin(uv.y * 10.0 + uTime) * strength;
            uv.y += cos(uv.x * 10.0 + uTime) * strength;
            
            // Global organic pulse
            uv.x += sin(uv.y * 5.0 + uTime * 0.5) * 0.002;
            uv.y += cos(uv.x * 5.0 + uTime * 0.5) * 0.002;

            vec4 color = texture2D(tDiffuse, uv);
            gl_FragColor = color;
        }
    `
};

// -- Three.js Scene --
function initThree() {
    const canvasContainer = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050505, 10, 60);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 15);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x050505, 1);
    canvasContainer.appendChild(renderer.domElement);

    // -- Bloom --
    if (RenderPass && UnrealBloomPass && EffectComposer) {
        const renderPass = new RenderPass(scene, camera);
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, 0.4, 0.85
        );
        bloomPass.threshold = 0.2;
        bloomPass.strength = 1.5;
        bloomPass.radius = 0.8;

        composer = new EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(bloomPass);

        // Add Liquid Pass
        liquidPass = new ShaderPass(LiquidShader);
        composer.addPass(liquidPass);
    }

    // -- Background Shader --
    const geometry = new THREE.PlaneGeometry(80, 80, 64, 64);
    uniforms = {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uGlitch: { value: 0 }
    };
    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
            uniform float uTime;
            uniform vec2 uMouse;
            varying vec2 vUv;
            varying float vElevation;
            void main() {
                vUv = uv;
                vec3 pos = position;
                float d = distance(uv, uMouse * 0.5 + 0.5);
                float elevation = sin(pos.x * 0.5 + uTime) * sin(pos.y * 0.5 + uTime) * 0.5;
                float distortion = smoothstep(0.5, 0.0, d) * 2.0;
                pos.z += elevation + distortion;
                
                // Simple glitch displacement
                if (uGlitch > 0.1) {
                    pos.x += sin(pos.y * 100.0 + uTime * 10.0) * uGlitch * 0.1;
                }

                vElevation = pos.z;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `,
        fragmentShader: `
            uniform float uTime;
            varying vec2 vUv;
            varying float vElevation;
            void main() {
                float gridX = step(0.98, mod(vUv.x * 40.0, 1.0));
                float gridY = step(0.98, mod(vUv.y * 40.0, 1.0));
                float grid = max(gridX, gridY);
                vec3 color = mix(vec3(0.0, 0.1, 0.2), vec3(1.0, 0.2, 0.4), vElevation * 0.5 + 0.5);
                color += vec3(grid) * 0.5;
                gl_FragColor = vec4(color, 1.0);
            }
        `,
        wireframe: true,
        transparent: true
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI * 0.1;
    scene.add(plane);

    // -- Hero Model --
    // We use the procedural fallback by default to avoid 404 console errors
    // If you add a 'assets/hero.glb', you can uncomment loadHeroModel()
    createFallbackHero();
    // loadHeroModel();

    // -- Particles --
    createParticles();

    // -- Lights --
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(2, 5, 5);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Colorful rim lights for the hero
    const pointLight1 = new THREE.PointLight(0xff3366, 2, 20);
    pointLight1.position.set(-5, 2, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00d4ff, 2, 20);
    pointLight2.position.set(5, -2, 5);
    scene.add(pointLight2);

    animate();
    window.addEventListener('resize', onWindowResize);
}

function loadHeroModel() {
    const loader = new GLTFLoader();

    // Attempt to load 'assets/hero.glb'
    loader.load(
        'assets/hero.glb',
        (gltf) => {
            heroObject = gltf.scene;
            heroObject.scale.set(2, 2, 2); // Adjust scale as needed
            heroObject.position.set(0, 0, 0);

            heroObject.traverse((node) => {
                if (node.isMesh) {
                    node.material = new THREE.MeshStandardMaterial({
                        color: 0x222222,
                        metalness: 0.9,
                        roughness: 0.1,
                        emissive: 0x111111
                    });
                }
            });
            scene.add(heroObject);
            if (gltf.animations.length > 0) {
                heroMixer = new THREE.AnimationMixer(heroObject);
                heroMixer.clipAction(gltf.animations[0]).play();
            }
            initHeroScrollTrigger();
        },
        undefined,
        (error) => {
            console.log('No custom hero model found, using fallback.');
            createFallbackHero();
        }
    );
}

function createFallbackHero() {
    const geometry = new THREE.TorusKnotGeometry(1.5, 0.4, 100, 16);
    const material = new THREE.MeshStandardMaterial({
        color: 0x111111,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x00d4ff,
        emissiveIntensity: 1.5,
        wireframe: true
    });

    const coreGeometry = new THREE.TorusKnotGeometry(1.4, 0.2, 100, 16);
    const coreMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        metalness: 1.0,
        roughness: 0.0
    });

    heroObject = new THREE.Group();
    heroObject.add(new THREE.Mesh(geometry, material));
    heroObject.add(new THREE.Mesh(coreGeometry, coreMaterial));
    scene.add(heroObject);
    initHeroScrollTrigger();
}

function createParticles() {
    const isMobile = window.innerWidth < 768;
    const pCount = isMobile ? 800 : 3000;

    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) {
        pPos[i] = (Math.random() - 0.5) * 60;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
        size: isMobile ? 0.08 : 0.05,
        color: 0xff3366,
        transparent: true,
        opacity: 0.8
    });
    particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
}

function animate() {
    requestAnimationFrame(animate);
    const delta = 0.016; // Approx

    // -- Audio Reactivity --
    if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);

        let bassSum = 0;
        let midSum = 0;
        let highSum = 0;

        for (let i = 0; i < 3; i++) bassSum += dataArray[i];
        for (let i = 10; i < 30; i++) midSum += dataArray[i];
        for (let i = 40; i < 100; i++) highSum += dataArray[i];

        bassIntensity = bassSum / (3 * 255);
        midIntensity = midSum / (20 * 255);
        highIntensity = highSum / (60 * 255);

        // Pulse Hero Object
        if (heroObject) {
            const baseScale = window.scrollY > 1000 ? 3 : 2; // Skills section scale vs Hero
            let pulse = 1 + (bassIntensity || 0) * 0.3;
            if (isNaN(pulse)) pulse = 1;
            heroObject.scale.set(baseScale * pulse, baseScale * pulse, baseScale * pulse);
        }

        // React Particles
        if (particles) {
            particles.material.size = 0.05 + highIntensity * 0.1;
            particles.rotation.y += 0.001 + bassIntensity * 0.01;
        }
    }

    if (uniforms) {
        uniforms.uTime.value += 0.01;
        // Glitch Effect logic
        if (window.scrollY !== lastScrollY) {
            const delta = Math.abs(window.scrollY - lastScrollY);
            if (delta > 50) {
                uniforms.uGlitch = { value: delta * 0.01 };
            }
            lastScrollY = window.scrollY;
        }
    }

    if (particles && !analyser) {
        particles.rotation.y += 0.001;
        particles.rotation.x += 0.0005;
    }

    if (heroObject) {
        heroObject.rotation.y += 0.002;
        heroObject.rotation.z += 0.001;
    }

    if (heroMixer) {
        heroMixer.update(delta);
    }

    if (composer) {
        if (liquidPass) {
            liquidPass.uniforms.uTime.value += 0.02;
            liquidPass.uniforms.uMouse.value.x = (mouseX / window.innerWidth) * 2 - 1;
            liquidPass.uniforms.uMouse.value.y = -(mouseY / window.innerHeight) * 2 + 1;
        }
        composer.render();
    }
    else if (renderer) renderer.render(scene, camera);
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (composer) composer.setSize(window.innerWidth, window.innerHeight);
    }
}

function initHeroScrollTrigger() {
    if (!heroObject) return;

    gsap.to(heroObject.rotation, {
        y: Math.PI * 4,
        ease: "none",
        scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            scrub: 1
        }
    });

    gsap.to(heroObject.position, {
        z: 0,
        scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            onUpdate: (self) => {
                heroObject.position.x = Math.sin(self.progress * Math.PI * 2) * 2;
                heroObject.position.y = Math.cos(self.progress * Math.PI * 2) * 1;
            }
        }
    });
}

function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Camera move on scroll
    gsap.to(camera.position, {
        z: 5,
        ease: "none",
        scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            scrub: 1
        }
    });

    // -- ReactBits Style Scroll Reveal --

    // Reveal Text (Blur, Rotate, Opacity)
    document.querySelectorAll('.reveal-text').forEach(el => {
        gsap.fromTo(el,
            {
                opacity: 0.1,
                filter: 'blur(10px)',
                rotateX: '15deg',
                y: 30
            },
            {
                opacity: 1,
                filter: 'blur(0px)',
                rotateX: '0deg',
                y: 0,
                duration: 1.2,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 90%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });

    // -- 3D Timeline Animations --
    const timelineLine = document.querySelector('.timeline-line');
    if (timelineLine) {
        gsap.to(timelineLine, {
            height: '100%',
            ease: 'none',
            scrollTrigger: {
                trigger: '.timeline-container',
                start: 'top 80%',
                end: 'bottom 80%',
                scrub: true
            }
        });
    }

    document.querySelectorAll('.timeline-node').forEach(node => {
        gsap.fromTo(node,
            {
                opacity: 0,
                x: 100,
                rotateY: -20,
                perspective: 1000
            },
            {
                opacity: 1,
                x: 0,
                rotateY: 0,
                duration: 1,
                scrollTrigger: {
                    trigger: node,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });

    // Reveal Items (Staggered scale/fade)
    const revealItems = document.querySelectorAll('.reveal-item');
    if (revealItems.length > 0) {
        gsap.fromTo(revealItems,
            {
                opacity: 0.1,
                scale: 0.8,
                y: 50
            },
            {
                opacity: 1,
                scale: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: "back.out(1.7)",
                scrollTrigger: {
                    trigger: revealItems[0].parentElement,
                    start: "top 85%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    }

    // -- Section Transformations --
    // Transform Torus to more complex shape on Skills section
    ScrollTrigger.create({
        trigger: "#section-2",
        start: "top center",
        onEnter: () => {
            if (heroObject) {
                gsap.to(heroObject.scale, { x: 3, y: 3, z: 3, duration: 1 });
            }
        },
        onLeaveBack: () => {
            if (heroObject) {
                gsap.to(heroObject.scale, { x: 2, y: 2, z: 2, duration: 1 });
            }
        }
    });

    gsap.to('#progressBar', {
        width: '100%',
        ease: 'none',
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 0 }
    });
}

// -- Page Transition Shutter --
function playShutterEffect(callback) {
    const shutter = document.getElementById('page-transition');
    if (!shutter) {
        if (callback) callback();
        return;
    }

    gsap.set(shutter, { translateY: '100%' });
    gsap.to(shutter, {
        translateY: '0%',
        duration: 0.5,
        ease: 'power4.inOut',
        onComplete: () => {
            if (callback) callback();
            gsap.to(shutter, {
                translateY: '-100%',
                duration: 0.5,
                delay: 0.2,
                ease: 'power4.inOut'
            });
        }
    });
}

// -- Scene Label Logic --
const labels = ['RAHIL UBARE', 'ABOUT', 'SKILLS', 'EXPERIENCE', 'ACHIEVEMENTS', 'PROJECTS', 'CONTACT'];
const sceneLabel = document.getElementById('sceneLabel');

function updateSceneLabel() {
    if (!sceneLabel) return;
    const scrollY = window.scrollY;
    const h = window.innerHeight;
    const currentIndex = Math.min(labels.length - 1, Math.floor((scrollY + h / 3) / h));
    sceneLabel.textContent = labels[currentIndex] || '';
}

window.addEventListener('scroll', updateSceneLabel);
window.addEventListener('resize', updateSceneLabel);

const soundToggle = document.getElementById('soundToggle');
if (soundToggle) soundToggle.addEventListener('click', toggleSound);

document.querySelectorAll('a, button, .nav-item, .view-btn, .modal-close').forEach(el => {
    // Existing mouseenter logic removed, handled in custom cursor section
});

// -- Project Modals Logic --
const projectData = {
    'devpal': {
        title: 'DevPal - AI Chat Assistant',
        desc: 'Built a full-stack AI chatbot using FastAPI and React. Integrated Ollama (LLaMA2) for conversational intelligence. Implemented real-time messaging, retry-based error handling, and responsive UI animations for a ChatGPT-like experience.',
        tags: ['FastAPI', 'React', 'Ollama', 'LLaMA2', 'WebSockets', 'TailwindCSS'],
        details: '<p>Impact:</p><ul><li>Secure, local inference</li><li>Real-time responsiveness</li></ul>'
    },
    'inventory': {
        title: 'Inventory Tracking Application',
        desc: 'Developed a real-time inventory system with stock monitoring, alerts, and usage reporting. Used AI prompting and zero-code tools to improve system accuracy and responsiveness.',
        tags: ['No-Code', 'AI Prompting', 'Real-time DB'],
        details: '<p>Timeline:</p><p>May 2025 – Jun 2025</p>'
    },
    'habit': {
        title: 'Habit Tracking Application',
        desc: 'Designed and delivered a user-centric habit tracking app using optimized AI prompts and no-code tools.',
        tags: ['No-Code', 'AI Design', 'UX/UI'],
        details: '<p>Timeline:</p><p>Jul 2025 – Aug 2025</p>'
    }
};

const modalOverlay = document.getElementById('projectModal');
const modalClose = document.querySelector('.modal-close');
const modalTitle = document.querySelector('.modal-title');
const modalDesc = document.querySelector('.modal-desc');
const modalTags = document.querySelector('.modal-tags');
const modalDetails = document.querySelector('.modal-details');

if (modalOverlay) {
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.getAttribute('data-id');
            const data = projectData[id];

            if (data) {
                modalTitle.textContent = data.title;
                modalDesc.textContent = data.desc;
                modalTags.innerHTML = data.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
                modalDetails.innerHTML = data.details || '';

                modalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = 'auto'; // Re-enable scroll
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });
}
