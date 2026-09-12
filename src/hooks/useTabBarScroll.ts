import { useEffect, useRef } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const LiquidTabBarNative = isNative ? registerPlugin('LiquidTabBar') : null;

export function useTabBarScroll() {
  const lastScrollY = useRef(0);
  const isHidden = useRef(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isNative || !LiquidTabBarNative) return;

    const currentY = e.currentTarget.scrollTop;
    const deltaY = currentY - lastScrollY.current;
    
    // Don't hide if bouncing at top
    if (currentY <= 0) {
      lastScrollY.current = currentY;
      if (isHidden.current) {
        isHidden.current = false;
        LiquidTabBarNative.setHidden({ isHidden: false }).catch(() => {});
      }
      return;
    }

    if (deltaY > 10 && !isHidden.current) {
      // Scrolling down -> hide Tab Bar
      isHidden.current = true;
      LiquidTabBarNative.setHidden({ isHidden: true }).catch(() => {});
    } else if (deltaY < -10 && isHidden.current) {
      // Scrolling up -> show Tab Bar
      isHidden.current = false;
      LiquidTabBarNative.setHidden({ isHidden: false }).catch(() => {});
    }
    
    lastScrollY.current = currentY;
  };

  return handleScroll;
}
