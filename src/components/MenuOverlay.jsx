import React, { useEffect } from 'react';
import gsap from 'gsap';

const MenuOverlay = ({ active, setActive, playShutter }) => {
    const links = [
        { label: "HOME", href: "#section-0" },
        { label: "ABOUT", href: "#section-1" },
        { label: "SKILLS", href: "#section-2" },
        { label: "EXPERIENCE", href: "#section-3" },
        { label: "PROJECTS", href: "#section-5" },
        { label: "CONTACT", href: "#section-6" }
    ];

    useEffect(() => {
        if (active) {
            gsap.fromTo('.menu-link',
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
            );
        }
    }, [active]);

    const handleLinkClick = (e, href) => {
        e.preventDefault();
        setActive(false);
        playShutter(() => {
            const element = document.querySelector(href);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        });
    };

    return (
        <div className={`menu-overlay ${active ? 'active' : ''}`} id="menuOverlay">
            <button className="menu-close" id="menuClose" onClick={() => setActive(false)}>&times;</button>
            <div className="menu-links">
                {links.map((link, i) => (
                    <a key={i} href={link.href} className="menu-link" onClick={(e) => handleLinkClick(e, link.href)}>
                        {link.label}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default MenuOverlay;
