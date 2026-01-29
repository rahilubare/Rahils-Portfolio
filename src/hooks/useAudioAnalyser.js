import { useState, useEffect, useRef } from 'react';

export const useAudioAnalyser = (soundEnabled) => {
    const audioCtx = useRef(null);
    const analyser = useRef(null);
    const source = useRef(null);
    const dataArray = useRef(null);
    const bgMusic = useRef(null);

    useEffect(() => {
        if (!bgMusic.current) {
            bgMusic.current = new Audio('/assets/music.mp3');
            bgMusic.current.loop = true;
            bgMusic.current.volume = 0.4;
        }

        if (soundEnabled) {
            if (!audioCtx.current) {
                audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
                analyser.current = audioCtx.current.createAnalyser();
                analyser.current.fftSize = 256;
                const bufferLength = analyser.current.frequencyBinCount;
                dataArray.current = new Uint8Array(bufferLength);
                source.current = audioCtx.current.createMediaElementSource(bgMusic.current);
                source.current.connect(analyser.current);
                analyser.current.connect(audioCtx.current.destination);
            }

            if (audioCtx.current.state === 'suspended') {
                audioCtx.current.resume();
            }
            bgMusic.current.play().catch(err => console.log("Audio play blocked:", err));
        } else {
            bgMusic.current.pause();
        }
    }, [soundEnabled]);

    return { analyser: analyser.current, dataArray: dataArray.current };
};
