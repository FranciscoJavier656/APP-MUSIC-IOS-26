import { useEffect, useRef } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const LiquidTabBarNative = isNative ? registerPlugin('LiquidTabBar') : null;

export function useTabBarScroll() {
  const lastScrollY = useRef(0);
  const isHidden = useRef(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentY = e.currentTarget.scrollTop;
    const deltaY = currentY - lastScrollY.current;
    
    // Don't hide if bouncing at top
    if (currentY <= 0) {
      lastScrollY.current = currentY;
      if (isHidden.current) {
        isHidden.current = false;
        if (isNative && LiquidTabBarNative) {
            LiquidTabBarNative.setHidden({ isHidden: false }).catch(() => {});
        } else {
            window.dispatchEvent(new CustomEvent('tabbar:show'));
        }
      }
      return;
    }

    if (deltaY > 10 && !isHidden.current) {
      // Scrolling down -> hide Tab Bar
      isHidden.current = true;
      if (isNative && LiquidTabBarNative) {
          LiquidTabBarNative.setHidden({ isHidden: true }).catch(() => {});
      } else {
          window.dispatchEvent(new CustomEvent('tabbar:hide'));
      }
    } else if (deltaY < -10 && isHidden.current) {
      // Scrolling up -> show Tab Bar
      isHidden.current = false;
      if (isNative && LiquidTabBarNative) {
          LiquidTabBarNative.setHidden({ isHidden: false }).catch(() => {});
      } else {
          window.dispatchEvent(new CustomEvent('tabbar:show'));
      }
    }
    
    lastScrollY.current = currentY;
  };

  return handleScroll;
}
