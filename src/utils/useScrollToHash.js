import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollToHash() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (!hash) {
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hash, pathname]);
}
