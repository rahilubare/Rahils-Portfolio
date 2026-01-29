import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ onStart }) => {
    const [count, setCount] = useState(0);
    const [visible, setVisible] = useState(true);
    const [btnReady, setBtnReady] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setBtnReady(true);
                    return 100;
                }
                return prev + 1.5;
            });
        }, 16);

        return () => clearInterval(interval);
    }, []);

    const handleEnter = () => {
        setVisible(false);
        setTimeout(onStart, 1000);
    };

    if (!visible) return null;

    return (
        <div className="loading-screen" id="loadingScreen">
            <div className="loader">
                <div className="loader-ring"></div>
                <div className="loader-ring"></div>
                <div className="loader-ring"></div>
            </div>
            <div className="counter">{String(Math.floor(count)).padStart(3, '0')}%</div>
            <div className="loading-text">LOADING EXPERIENCE</div>
            <button
                className="start-btn"
                style={{
                    opacity: btnReady ? 1 : 0,
                    pointerEvents: btnReady ? 'all' : 'none'
                }}
                onClick={handleEnter}
            >
                ENTER
            </button>
            <div className="notice">
                For the best experience<br />
                Use headphones and fullscreen mode<br />
                Works best on desktop
            </div>
        </div>
    );
};

export default LoadingScreen;
