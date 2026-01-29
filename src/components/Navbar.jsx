import React from 'react';

const Navbar = ({ soundEnabled, setSoundEnabled, setMenuActive }) => {
    return (
        <div className="header-controls">
            <button
                className="control-item magnetic"
                onClick={() => setMenuActive(true)}
                data-cursor="MENU"
            >
                <div className="icon-hamburger">
                    <span></span><span></span><span></span>
                </div>
                <span className="label">menu</span>
            </button>

            <button
                className={`control-item magnetic ${soundEnabled ? 'active' : ''}`}
                onClick={() => setSoundEnabled(!soundEnabled)}
                data-cursor="SOUND"
            >
                <div className={`icon-sound ${soundEnabled ? 'active' : ''}`}>
                    <span></span><span></span><span></span>
                </div>
                <span className="label" style={{ color: soundEnabled ? 'var(--secondary)' : 'inherit' }}>
                    sound
                </span>
            </button>
        </div>
    );
};

export default Navbar;
