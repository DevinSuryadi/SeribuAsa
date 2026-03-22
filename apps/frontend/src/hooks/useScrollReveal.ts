import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface ScrollRevealOptions {
  y?: number;
  x?: number;
  duration?: number;
  delay?: number;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !ref.current) return;

    const { y = 40, x = 0, duration = 0.8, delay = 0 } = options;
    const el = ref.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(
              el,
              { y, x, opacity: 0 },
              { y: 0, x: 0, opacity: 1, duration, delay, ease: 'power3.out' }
            );
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );

    gsap.set(el, { opacity: 0, y, x });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return ref;
}
