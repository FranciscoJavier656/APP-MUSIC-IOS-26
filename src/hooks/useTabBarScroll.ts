import { useRef } from 'react';

export function useTabBarScroll() {
  const lastScrollY = useRef(0);
  const isHidden = useRef(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Disable JS scroll hiding on native platforms since iOS handles it natively
    if ((window as any).Capacitor?.isNativePlatform?.()) return;

    const currentY = e.currentTarget.scrollTop;
    const deltaY = currentY - lastScrollY.current;
    
    // Don't hide if bouncing at top
    if (currentY <= 0) {
      lastScrollY.current = currentY;
      if (isHidden.current) {
        isHidden.current = false;
        window.dispatchEvent(new CustomEvent('tabbar:show'));
      }
      return;
    }

    if (deltaY > 10 && !isHidden.current) {
      // Scrolling down -> hide Tab Bar
      isHidden.current = true;
      window.dispatchEvent(new CustomEvent('tabbar:hide'));
    } else if (deltaY < -10 && isHidden.current) {
      // Scrolling up -> show Tab Bar
      isHidden.current = false;
      window.dispatchEvent(new CustomEvent('tabbar:show'));
    }
    
    lastScrollY.current = currentY;
  };

  return handleScroll;
}
