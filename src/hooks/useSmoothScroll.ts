import { useEffect, useRef } from 'react';

export function useSmoothScroll(lerpFactor = 0.08) {
  const scrollData = useRef({
    current: window.scrollY,
    target: window.scrollY,
    isScrolling: false,
  });

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleWheel = (e: WheelEvent) => {
      // Allow native scrolling inside scrollable containers (modals, dropdowns, lists)
      let target = e.target as HTMLElement | null;
      while (target && target !== document.body && target !== document.documentElement) {
        const style = window.getComputedStyle(target);
        const isScrollableY = target.scrollHeight > target.clientHeight && 
          (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll');
        const isScrollableX = target.scrollWidth > target.clientWidth && 
          (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll');
        
        if (isScrollableY || isScrollableX) {
          return; // Allow native scrolling of the container
        }
        target = target.parentElement;
      }

      // Direct prevent default to intercept default browser wheel scroll
      e.preventDefault();
      scrollData.current.target += e.deltaY;
      
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollData.current.target = Math.max(0, Math.min(scrollData.current.target, maxScroll));
      
      if (!scrollData.current.isScrolling) {
        scrollData.current.isScrolling = true;
        updateScroll();
      }
    };

    const updateScroll = () => {
      const { current, target } = scrollData.current;
      const diff = target - current;
      
      if (Math.abs(diff) < 0.5) {
        scrollData.current.current = target;
        window.scrollTo(0, target);
        scrollData.current.isScrolling = false;
      } else {
        const next = current + diff * lerpFactor;
        scrollData.current.current = next;
        window.scrollTo(0, next);
        requestAnimationFrame(updateScroll);
      }
    };

    // Sync targets on keyboard navigation or scrollbar clicks
    const handleScrollSync = () => {
      if (!scrollData.current.isScrolling) {
        scrollData.current.current = window.scrollY;
        scrollData.current.target = window.scrollY;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScrollSync, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScrollSync);
    };
  }, [lerpFactor]);
}
