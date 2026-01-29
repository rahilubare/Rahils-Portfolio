import React, { useState, useEffect } from 'react';
import gsap from 'gsap';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Projects from './components/Projects';
import Contact from './components/Contact';
import CanvasBackground from './components/CanvasBackground';
import LoadingScreen from './components/LoadingScreen';
import Cursor from './components/Cursor';
import CommandCenter from './components/CommandCenter';
import MenuOverlay from './components/MenuOverlay';
import ProjectModal from './components/ProjectModal';
import GameUI from './components/GameUI';
import Logo from './components/Logo';
import { useAudioAnalyser } from './hooks/useAudioAnalyser';
import { useScrollAnimations } from './hooks/useScrollAnimations';
import { useMagnetic } from './hooks/useMagnetic';

function App() {
    const [loading, setLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [theme, setTheme] = useState('cyberpunk');
    const [selectedProject, setSelectedProject] = useState(null);
    const [isGameActive, setIsGameActive] = useState(false);
    const [gameScore, setGameScore] = useState(0);
    const [menuActive, setMenuActive] = useState(false);

    const { analyser, dataArray } = useAudioAnalyser(soundEnabled);
    useScrollAnimations(loading);
    useMagnetic(loading);

    useEffect(() => {
        document.body.className = `theme-${theme}`;
    }, [theme]);

    const playShutterEffect = (callback) => {
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
    };

    return (
        <div className={`app-container theme-${theme}`}>
            <LoadingScreen onStart={() => setLoading(false)} />
            <Cursor />
            {!loading && (
                <>
                    <Logo />
                    <Navbar
                        soundEnabled={soundEnabled}
                        setSoundEnabled={setSoundEnabled}
                        setMenuActive={setMenuActive}
                    />
                </>
            )}
            <ProjectModal
                project={selectedProject}
                onClose={() => setSelectedProject(null)}
            />
            <GameUI
                score={gameScore}
                isActive={isGameActive}
                onExit={() => {
                    setIsGameActive(false);
                    setGameScore(0);
                }}
            />
            <div id="noise-overlay"></div>
            <div id="page-transition"></div>

            <CanvasBackground
                theme={theme}
                soundEnabled={soundEnabled}
                analyser={analyser}
                dataArray={dataArray}
                isGameActive={isGameActive}
                setIsGameActive={setIsGameActive}
                setGameScore={setGameScore}
            />

            <main>
                <Hero />
                <About />
                <Skills />
                <Experience />
                <Projects
                    onProjectSelect={setSelectedProject}
                />
                <Contact />
            </main>

            <CommandCenter setTheme={setTheme} />
            <MenuOverlay
                active={menuActive}
                setActive={setMenuActive}
                playShutter={playShutterEffect}
            />

            <div className="progress-bar" id="progressBar"></div>
        </div>
    );
}

export default App;
