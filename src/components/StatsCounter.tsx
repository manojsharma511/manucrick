import { useEffect, useState, useRef } from 'react';

interface StatsCounterProps {
  targetValue: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export function StatsCounter({ targetValue, duration = 1800, prefix = '', suffix = '' }: StatsCounterProps) {
  const [value, setValue] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !animatedRef.current) {
        animatedRef.current = true;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing outQuad
          const ease = progress * (2 - progress);
          const currentVal = Math.floor(ease * targetValue);
          
          setValue(currentVal);

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setValue(targetValue);
          }
        };

        requestAnimationFrame(animate);
        observer.unobserve(entry.target);
      }
    }, {
      threshold: 0.1,
    });

    const el = elementRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, [targetValue, duration]);

  return (
    <div ref={elementRef} style={{ display: 'inline-block' }}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </div>
  );
}
