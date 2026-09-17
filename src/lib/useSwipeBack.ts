import { useEffect } from 'react';

export function useSwipeBack(onBack: () => void) {
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Only register swipe if it starts from the left edge (first 40px)
      if (e.touches[0].clientX < 40) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (startX = 0) {
        const diffX = e.changedTouches[0].clientX - startX;
        const diffY = Math.abs(e.changedTouches[0].clientY - startY);
        // If swipe right is significant and mostly horizontal
        if (diffX > 60 && diffY < 50) {
          onBack();
        }
      }
      startX = 0;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onBack]);
}
