import { useEffect } from 'react';
import gsap from 'gsap';

export const useMagnetic = (loading) => {
    useEffect(() => {
        if (loading) return;

        const magnets = document.querySelectorAll('.magnetic');

        const handleMouseMove = (e) => {
            const magnet = e.currentTarget;
            const rect = magnet.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            gsap.to(magnet, {
                x: x * 0.4,
                y: y * 0.4,
                duration: 0.3,
                ease: "power2.out"
            });
        };

        const handleMouseLeave = (e) => {
            const magnet = e.currentTarget;
            gsap.to(magnet, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: "elastic.out(1, 0.3)"
            });
        };

        magnets.forEach(magnet => {
            magnet.addEventListener('mousemove', handleMouseMove);
            magnet.addEventListener('mouseleave', handleMouseLeave);
        });

        return () => {
            magnets.forEach(magnet => {
                magnet.removeEventListener('mousemove', handleMouseMove);
                magnet.removeEventListener('mouseleave', handleMouseLeave);
            });
        };
    }, [loading]);
};
