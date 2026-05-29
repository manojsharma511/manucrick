import { useEffect } from 'react';

export function useIntersectionObserver(options?: IntersectionObserverInit) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    const observeElements = () => {
      const elements = document.querySelectorAll('.scroll-animate, .reveal-text');
      elements.forEach((el) => {
        if (!el.classList.contains('visible')) {
          observer.observe(el);
        }
      });
    };

    // Run initially
    observeElements();

    // Watch for tab views mount/unmount in the DOM
    const mutationObserver = new MutationObserver(() => {
      observeElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [options]);

  // Return a dummy registrar to avoid breaking existing ref bindings
  return () => {};
}
