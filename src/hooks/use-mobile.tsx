import { useState, useEffect } from 'react';

const useMobile = (query: string = '(max-width: 768px)') => {
  const [isMobile, setIsMobile] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = () => setIsMobile(mediaQuery.matches);
    
    // Add listener
    mediaQuery.addEventListener('change', handler);
    
    // Cleanup
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return isMobile;
};

export { useMobile };
