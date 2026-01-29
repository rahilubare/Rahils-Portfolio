import React, { useEffect, useRef, useState } from 'react';

const Cursor = () => {
    const cursorRef = useRef(null);
    const followerRef = useRef(null);
    const labelRef = useRef(null);
    const trailsRef = useRef([]);
    const requestRef = useRef();

    const [label, setLabel] = useState('');

    useEffect(() => {
        let mouseX = 0, mouseY = 0;
        let followerX = 0, followerY = 0;
        let dotX = 0, dotY = 0;

        const handleMouseMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Spawn trail
            if (trailsRef.current.length < 20) {
                const trail = new CursorTrailParticle(e.clientX, e.clientY);
                trailsRef.current.push(trail);
            }
        };

        const animate = () => {
            dotX += (mouseX - dotX) * 0.4;
            dotY += (mouseY - dotY) * 0.4;
            followerX += (mouseX - followerX) * 0.12;
            followerY += (mouseY - followerY) * 0.12;

            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;
            }
            if (followerRef.current) {
                const fw = followerRef.current.offsetWidth / 2;
                const fh = followerRef.current.offsetHeight / 2;
                followerRef.current.style.transform = `translate(${followerX - fw}px, ${followerY - fh}px)`;
            }

            // Update trails
            trailsRef.current.forEach((trail, index) => {
                trail.update();
                if (trail.opacity <= 0) {
                    trail.el.remove();
                    trailsRef.current.splice(index, 1);
                }
            });

            requestRef.current = requestAnimationFrame(animate);
        };

        window.addEventListener('mousemove', handleMouseMove);
        requestRef.current = requestAnimationFrame(animate);

        // Global hover listeners
        const handleEnter = (e) => {
            const el = e.target.closest('[data-cursor]');
            if (el) {
                const text = el.getAttribute('data-cursor');
                setLabel(text);
                followerRef.current?.classList.add('active');
            }
        };

        const handleLeave = () => {
            setLabel('');
            followerRef.current?.classList.remove('active');
        };

        document.addEventListener('mouseover', handleEnter);
        document.addEventListener('mouseout', handleLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseover', handleEnter);
            document.removeEventListener('mouseout', handleLeave);
            cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <>
            <div className="cursor" ref={cursorRef}></div>
            <div className={`cursor-follower ${label ? 'has-label' : ''}`} ref={followerRef}>
                <span className="cursor-label" ref={labelRef}>{label}</span>
            </div>
        </>
    );
};

class CursorTrailParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 10 + 5;
        this.opacity = 1;
        this.el = document.createElement('div');
        this.el.className = 'cursor-trail';
        document.body.appendChild(this.el);
        this.update();
    }
    update() {
        this.opacity -= 0.03;
        this.size -= 0.2;
        this.el.style.transform = `translate(${this.x - this.size / 2}px, ${this.y - this.size / 2}px)`;
        this.el.style.opacity = this.opacity;
        this.el.style.width = `${this.size}px`;
        this.el.style.height = `${this.size}px`;
    }
}

export default Cursor;
