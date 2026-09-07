import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface StaggerOptions {
  stagger?: number;
  y?: number;
  duration?: number;
  childSelector?: string;
}

export function useStaggerChildren<T extends HTMLElement = HTMLDivElement>(
  options: StaggerOptions = {}
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !ref.current) return;

    const { stagger = 0.1, y = 30, duration = 0.6, childSelector = ':scope > *' } = options;
    const el = ref.current;
    const children = el.querySelectorAll(childSelector);
    if (!children.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(
              children,
              { y, opacity: 0 },
              { y: 0, opacity: 1, duration, stagger, ease: 'power3.out' }
            );
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.05 }
    );

    gsap.set(children, { opacity: 0, y });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return ref;
}
