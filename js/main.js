
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// -- Global Variables --
let scene, camera, renderer, composer;
let uniforms;
let particles;
let heroObject; // The main 3D character/object
let heroMixer; // For GLTF animations if any
let soundEnabled = false;
let audioCtx;
let masterGain;
let oscillators = [];
let cursorRAF;

// -- Audio (Web Audio API - No External Files) --
// Drone-like ambient sound using oscillators
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3; // Low volume
        masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function createOscillator(freq, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(masterGain);
    return { osc, gain };
}

function playSound() {
    initAudio();
    if (oscillators.length > 0) return; // Already playing

    // Base drone (Low Freq)
    const osc1 = createOscillator(110, 'sine'); // A2
    const osc2 = createOscillator(164.81, 'triangle'); // E3
    const osc3 = createOscillator(220, 'sine'); // A3

    // Detune for organic feel
    osc2.osc.detune.value = 5;
    osc3.osc.detune.value = -5;

    // Fade in
    const now = audioCtx.currentTime;
    osc1.gain.gain.setValueAtTime(0, now);
    osc1.gain.gain.linearRampToValueAtTime(0.5, now + 2);
    osc1.osc.start();

    osc2.gain.gain.setValueAtTime(0, now);
    osc2.gain.gain.linearRampToValueAtTime(0.3, now + 3);
    osc2.osc.start();

    osc3.gain.gain.setValueAtTime(0, now);
    osc3.gain.gain.linearRampToValueAtTime(0.2, now + 4);
    osc3.osc.start();

    oscillators = [osc1, osc2, osc3];
}

function stopSound() {
    if (oscillators.length === 0) return;

    const now = audioCtx.currentTime;
    oscillators.forEach(o => {
        o.gain.gain.cancelScheduledValues(now);
        o.gain.gain.linearRampToValueAtTime(0, now + 1);
        o.osc.stop(now + 1.1);
    });
    oscillators = [];
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

// Deprecated oscillator functions kept empty
function playDrone() { }
function stopDrone() { }

// -- Custom Cursor --
// -- Custom Cursor --
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');

let mouseX = 0;
let mouseY = 0;
let followerX = 0;
let followerY = 0;

if (window.matchMedia("(min-width: 769px)").matches) {
    document.body.classList.add('custom-cursor-active');
    if (cursor) cursor.style.display = 'block';
    if (cursorFollower) cursorFollower.style.display = 'block';

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Instant update for dot
        if (cursor) {
            cursor.style.transform = `translate(${mouseX - 10}px, ${mouseY - 10}px)`;
        }

        // Pass to shader
        if (uniforms) {
            uniforms.uMouse.value.x = (mouseX / window.innerWidth) * 2 - 1;
            uniforms.uMouse.value.y = -(mouseY / window.innerHeight) * 2 + 1;
        }
    });

    // Smooth follower using Lerp
    function animateCursor() {
        followerX += (mouseX - followerX) * 0.15; // 0.15 = smooth factor
        followerY += (mouseY - followerY) * 0.15;

        if (cursorFollower) {
            cursorFollower.style.transform = `translate(${followerX - 20}px, ${followerY - 20}px)`;
        }
        cursorRAF = requestAnimationFrame(animateCursor);
    }
    animateCursor();
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
        initAudio();
        // Setup toggle listener
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', toggleSound);
        }
        // Menu listener
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                // For now, toggle nav or scroll to top
                document.querySelector('.nav').classList.toggle('active');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    });
}

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
    }

    // -- Background Shader --
    const geometry = new THREE.PlaneGeometry(80, 80, 64, 64);
    uniforms = {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) }
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
        color: 0x000000,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0xff3366,
        emissiveIntensity: 0.2,
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

    if (uniforms) uniforms.uTime.value += 0.01;

    if (particles) {
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

    if (composer) composer.render();
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

    const sections = document.querySelectorAll('.content-section');
    sections.forEach((section) => {
        const title = section.querySelector('.section-title');
        const text = section.querySelector('.section-text');

        if (title) {
            gsap.fromTo(title,
                { y: 100, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 1,
                    scrollTrigger: { trigger: section, start: "top 80%", end: "top 40%", scrub: 1 }
                }
            );
        }
    });

    gsap.to('#progressBar', {
        width: '100%',
        ease: 'none',
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 0 }
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
    el.addEventListener('mouseenter', () => {
        if (typeof gsap !== 'undefined') gsap.to(cursor, { scale: 2, mixBlendMode: 'normal', borderColor: '#fff' });
    });
    el.addEventListener('mouseleave', () => {
        if (typeof gsap !== 'undefined') gsap.to(cursor, { scale: 1, mixBlendMode: 'difference', borderColor: '#ff3366' });
    });
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
