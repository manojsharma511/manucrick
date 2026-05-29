import { useEffect, useRef } from 'react';

const KONAMI_CODE = [
  'arrowup', 'arrowup',
  'arrowdown', 'arrowdown',
  'arrowleft', 'arrowright',
  'arrowleft', 'arrowright',
  'b', 'a'
];

export function useKonamiCode(onMatch: () => void) {
  const inputSequence = useRef<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key) return;
      const key = e.key.toLowerCase();
      const expectedKey = KONAMI_CODE[inputSequence.current.length];

      if (key === expectedKey) {
        inputSequence.current.push(key);
        if (inputSequence.current.length === KONAMI_CODE.length) {
          onMatch();
          inputSequence.current = [];
        }
      } else {
        inputSequence.current = [];
        // Check if this key could be the first key of a new sequence
        if (key === KONAMI_CODE[0]) {
          inputSequence.current.push(key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onMatch]);
}
