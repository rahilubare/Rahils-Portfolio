import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useScrollAnimations = (loading) => {
    useEffect(() => {
        if (loading) return;

        // -- Reveal Text (Blur, Rotate, Opacity) --
        const revealTexts = document.querySelectorAll('.reveal-text');
        revealTexts.forEach(el => {
            gsap.fromTo(el,
                {
                    opacity: 0,
                    filter: 'blur(10px)',
                    rotateX: '15deg',
                    y: 30
                },
                {
                    opacity: 1,
                    filter: 'blur(0px)',
                    rotateX: '0deg',
                    y: 0,
                    duration: 1.2,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: el,
                        start: "top 90%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });

        // -- 3D Timeline Animations --
        const timelineLine = document.querySelector('.timeline-line');
        if (timelineLine) {
            gsap.to(timelineLine, {
                height: '100%',
                ease: 'none',
                scrollTrigger: {
                    trigger: '.timeline-container',
                    start: 'top 80%',
                    end: 'bottom 80%',
                    scrub: true
                }
            });
        }

        const nodes = document.querySelectorAll('.timeline-node');
        nodes.forEach(node => {
            gsap.fromTo(node,
                {
                    opacity: 0,
                    x: 100,
                    rotateY: -20,
                },
                {
                    opacity: 1,
                    x: 0,
                    rotateY: 0,
                    duration: 1,
                    scrollTrigger: {
                        trigger: node,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        });

        // -- Reveal Items (Staggered scale/fade) --
        const revealItems = document.querySelectorAll('.reveal-item');
        if (revealItems.length > 0) {
            gsap.fromTo(revealItems,
                {
                    opacity: 0,
                    scale: 0.8,
                    y: 50
                },
                {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: "back.out(1.7)",
                    scrollTrigger: {
                        trigger: revealItems[0].parentElement,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }

        // -- Progress Bar --
        gsap.to('#progressBar', {
            width: '100%',
            ease: 'none',
            scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 0.3 }
        });

        return () => {
            ScrollTrigger.getAll().forEach(t => t.kill());
        };
    }, [loading]);
};
