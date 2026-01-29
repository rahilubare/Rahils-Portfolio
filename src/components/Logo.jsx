import React from 'react';

const Logo = () => {
    return (
        <div className="site-logo magnetic" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="logo-box">
                <span className="logo-text">RU</span>
            </div>
            <span className="logo-name">Rahil Ubare</span>
        </div>
    );
};

export default Logo;
