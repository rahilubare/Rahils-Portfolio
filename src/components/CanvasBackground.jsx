import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import gsap from 'gsap';

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
            float dist = distance(uv, uMouse * 0.5 + 0.5);
            float strength = smoothstep(0.5, 0.0, dist) * 0.05;
            uv.x += sin(uv.y * 10.0 + uTime) * strength;
            uv.y += cos(uv.x * 10.0 + uTime) * strength;
            uv.x += sin(uv.y * 5.0 + uTime * 0.5) * 0.002;
            uv.y += cos(uv.x * 5.0 + uTime * 0.5) * 0.002;
            vec4 color = texture2D(tDiffuse, uv);
            gl_FragColor = color;
        }
    `
};

const CanvasBackground = ({ theme, soundEnabled, analyser, dataArray, isGameActive, setIsGameActive, setGameScore }) => {
    const mountRef = useRef(null);
    const requestRef = useRef();
    const mouseRef = useRef(new THREE.Vector2(0, 0));
    const raycasterRef = useRef(new THREE.Raycaster());
    const cubesRef = useRef([]);
    const heroClicksRef = useRef(0);
    const clickTimerRef = useRef(null);

    useEffect(() => {
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x050505, 10, 60);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 15);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x050505, 1);
        mountRef.current.appendChild(renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        // Bloom & Liquid
        const renderPass = new RenderPass(scene, camera);
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.4, 0.85);
        bloomPass.threshold = 0.3;
        bloomPass.strength = 0.6;
        bloomPass.radius = 0.4;

        const composer = new EffectComposer(renderer);
        composer.addPass(renderPass);
        composer.addPass(bloomPass);

        const liquidPass = new ShaderPass(LiquidShader);
        composer.addPass(liquidPass);

        // Background Plane
        const bgUniforms = {
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uGlitch: { value: 0 }
        };
        const bgMat = new THREE.ShaderMaterial({
            uniforms: bgUniforms,
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
                    vec3 color = mix(vec3(0.00, 0.02, 0.05), vec3(0.5, 0.05, 0.2), vElevation * 0.5 + 0.5);
                    color += vec3(grid) * 0.2;
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            wireframe: true,
            transparent: true
        });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80, 64, 64), bgMat);
        plane.rotation.x = -Math.PI * 0.1;
        scene.add(plane);

        // Fallback Hero
        const heroGeo = new THREE.TorusKnotGeometry(1.5, 0.4, 100, 16);
        const heroMat = new THREE.MeshStandardMaterial({
            color: 0x050505,
            metalness: 1.0,
            roughness: 0.05,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.3,
            wireframe: true
        });
        const heroMesh = new THREE.Mesh(heroGeo, heroMat);
        scene.add(heroMesh);

        // Particles
        const pCount = 3000;
        const pPos = new Float32Array(pCount * 3);
        for (let i = 0; i < pCount * 3; i++) {
            pPos[i] = (Math.random() - 0.5) * 60;
        }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.05, color: 0xff3366, transparent: true, opacity: 0.8 }));
        scene.add(particles);

        const spawnCube = () => {
            const geo = new THREE.BoxGeometry(1, 1, 1);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00ff41, wireframe: true });
            const cube = new THREE.Mesh(geo, mat);
            cube.position.set((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 10);
            scene.add(cube);
            cubesRef.current.push(cube);
        };

        const handleClick = (e) => {
            raycasterRef.current.setFromCamera(mouseRef.current, camera);
            if (isGameActive) {
                const intersects = raycasterRef.current.intersectObjects(cubesRef.current);
                if (intersects.length > 0) {
                    const cube = intersects[0].object;
                    scene.remove(cube);
                    cubesRef.current = cubesRef.current.filter(c => c !== cube);
                    setGameScore(s => s + 1);
                    spawnCube();
                    spawnCube();
                    bgUniforms.uGlitch.value = 5.0;
                    setTimeout(() => { bgUniforms.uGlitch.value = 0; }, 200);
                }
                return;
            }

            const heroIntersects = raycasterRef.current.intersectObject(heroMesh, true);
            if (heroIntersects.length > 0) {
                heroClicksRef.current++;
                clearTimeout(clickTimerRef.current);
                if (heroClicksRef.current >= 3) {
                    setIsGameActive(true);
                    heroClicksRef.current = 0;
                    for (let i = 0; i < 5; i++) spawnCube();
                } else {
                    clickTimerRef.current = setTimeout(() => { heroClicksRef.current = 0; }, 500);
                    gsap.to(heroMesh.scale, { x: 1.5, y: 1.5, z: 1.5, duration: 0.2, yoyo: true, repeat: 1 });
                }
            }
        };

        const handleMouseMove = (e) => {
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            mouseRef.current.set(x, y);
        };

        const animate = () => {
            const time = performance.now() * 0.001;

            bgUniforms.uTime.value = time;
            bgUniforms.uMouse.value.copy(mouseRef.current);
            liquidPass.uniforms.uTime.value = time;
            liquidPass.uniforms.uMouse.value.copy(mouseRef.current);

            heroMesh.rotation.y += 0.005;
            heroMesh.rotation.z += 0.002;
            particles.rotation.y += 0.001;

            if (analyser && dataArray) {
                analyser.getByteFrequencyData(dataArray);
                let bass = dataArray[0] / 255;
                let high = dataArray[60] / 255;
                heroMesh.scale.setScalar(1 + bass * 0.3);
                particles.material.size = 0.05 + high * 0.1;
            }

            composer.render();
            requestRef.current = requestAnimationFrame(animate);
        };

        window.addEventListener('click', handleClick);
        window.addEventListener('mousemove', handleMouseMove);

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        animate();

        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(requestRef.current);
            renderer.dispose();
            mountRef.current?.removeChild(renderer.domElement);
        };
    }, [analyser, dataArray, isGameActive, setIsGameActive, setGameScore]);

    return <div id="canvas-container" ref={mountRef} />;
};

export default CanvasBackground;
