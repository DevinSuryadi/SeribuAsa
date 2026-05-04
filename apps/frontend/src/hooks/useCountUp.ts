import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface CountUpOptions {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
}

export function useCountUp(options: CountUpOptions) {
  const { end, duration = 2, prefix = '', suffix = '', decimals = 0, separator = '.' } = options;
  const [display, setDisplay] = useState(`${prefix}0${suffix}`);
  const ref = useRef<HTMLElement>(null);
  const counterRef = useRef({ value: 0 });

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplay(`${prefix}${formatNumber(end, decimals, separator)}${suffix}`);
      return;
    }
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.to(counterRef.current, {
        value: end,
        duration,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: ref.current!,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        onUpdate: () => {
          setDisplay(`${prefix}${formatNumber(counterRef.current.value, decimals, separator)}${suffix}`);
        },
      });
    });

    return () => ctx.revert();
  }, [end]);

  return { ref, display };
}

function formatNumber(num: number, decimals: number, separator: string): string {
  const fixed = num.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return decPart ? `${formatted},${decPart}` : formatted;
}
