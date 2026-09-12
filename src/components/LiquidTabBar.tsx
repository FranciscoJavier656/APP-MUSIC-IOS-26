import React, {
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { motion, useMotionValue, useSpring, animate } from 'motion/react';
import { Home, Search, Library, Download, Settings as SettingsIcon } from 'lucide-react';

const TABS = [
  { id: 'home',      icon: Home,          label: 'Inicio'    },
  { id: 'search',    icon: Search,        label: 'Buscar'    },
  { id: 'library',   icon: Library,       label: 'Librería'  },
  { id: 'downloads', icon: Download,      label: 'Descargas' },
  { id: 'settings',  icon: SettingsIcon,  label: 'Ajustes'   },
] as const;

const BAR_H = 64;
const SNAP_SPRING = { stiffness: 400, damping: 30, mass: 1 };
const STRETCH_SPRING = { stiffness: 300, damping: 25, mass: 1 };

export const LiquidTabBar = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (id: string) => void;
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  
  const [centers, setCenters] = useState<number[]>([]);
  const [tabWidth, setTabWidth] = useState(0);
  
  const bubbleX = useMotionValue(0);
  const stretchFactor = useMotionValue(0);
  
  const smoothX = useSpring(bubbleX, SNAP_SPRING);
  const smoothStretch = useSpring(stretchFactor, STRETCH_SPRING);

  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const handleHide = () => setIsHidden(true);
    const handleShow = () => setIsHidden(false);
    
    window.addEventListener('tabbar:hide', handleHide);
    window.addEventListener('tabbar:show', handleShow);
    
    return () => {
      window.removeEventListener('tabbar:hide', handleHide);
      window.removeEventListener('tabbar:show', handleShow);
    };
  }, []);

  const measure = useCallback(() => {
    const bar = barRef.current;
    if (!bar) return;
    const barRect = bar.getBoundingClientRect();
    const btns = bar.querySelectorAll<HTMLElement>('[data-tab]');
    const cs: number[] = [];
    btns.forEach(btn => {
      const r = btn.getBoundingClientRect();
      cs.push(r.left - barRect.left + r.width / 2);
    });
    setCenters(cs);
    setTabWidth(barRect.width / TABS.length);
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (barRef.current) ro.observe(barRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Snap to active tab
  useEffect(() => {
    if (isDragging.current || !centers.length) return;
    const idx = TABS.findIndex(t => t.id === activeTab);
    if (idx >= 0 && centers[idx] != null) {
      animate(bubbleX, centers[idx], SNAP_SPRING as any);
      animate(stretchFactor, 0, STRETCH_SPRING as any);
    }
  }, [activeTab, centers, bubbleX, stretchFactor]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const bar = barRef.current;
    if (!bar) return;
    
    isDragging.current = true;
    bar.setPointerCapture(e.pointerId);
    
    let startX = e.clientX;
    let initialBubbleX = bubbleX.get();

    const onMove = (ev: PointerEvent) => {
      const deltaX = ev.clientX - startX;
      
      // Calculate new X position
      const rect = bar.getBoundingClientRect();
      const localX = ev.clientX - rect.left;
      const clampedX = Math.max(tabWidth / 2, Math.min(rect.width - tabWidth / 2, localX));
      
      bubbleX.set(clampedX);
      
      // Calculate stretch based on distance
      const stretchAmount = Math.min(Math.abs(deltaX) * 0.4, 40); // Max stretch of 40px
      stretchFactor.set(stretchAmount);
    };

    const onUp = (ev: PointerEvent) => {
      isDragging.current = false;
      bar.removeEventListener('pointermove', onMove);
      bar.removeEventListener('pointerup', onUp);
      bar.removeEventListener('pointercancel', onUp);
      
      if (!centers.length) return;
      const rect = bar.getBoundingClientRect();
      const localX = ev.clientX - rect.left;
      
      let nearestIdx = 0;
      let minDist = Infinity;
      centers.forEach((c, i) => {
        const d = Math.abs(c - localX);
        if (d < minDist) { minDist = d; nearestIdx = i; }
      });
      
      const snappedTab = TABS[nearestIdx].id;
      setActiveTab(snappedTab);
      
      animate(bubbleX, centers[nearestIdx], SNAP_SPRING as any);
      animate(stretchFactor, 0, STRETCH_SPRING as any);
    };

    bar.addEventListener('pointermove', onMove);
    bar.addEventListener('pointerup', onUp);
    bar.addEventListener('pointercancel', onUp);
  }, [centers, tabWidth, bubbleX, stretchFactor, setActiveTab]);

  return (
    <motion.div
      initial={false}
      animate={{ 
        y: isHidden ? 150 : 0,
        opacity: isHidden ? 0 : 1
      }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        paddingLeft: 16,
        paddingRight: 16,
        zIndex: 50,
      }}
    >
      <div
        ref={barRef}
        onPointerDown={handlePointerDown}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 460,
          height: BAR_H,
          borderRadius: BAR_H / 2,
          background: 'rgba(30, 30, 32, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          pointerEvents: 'auto',
          touchAction: 'none',
          cursor: 'grab',
          overflow: 'hidden'
        }}
      >
        {/* Active Pill Indicator (Squishes on drag) */}
        <motion.div
          style={{
            position: 'absolute',
            top: 4,
            bottom: 4,
            width: tabWidth > 20 ? tabWidth - 12 : 58,
            borderRadius: BAR_H / 2,
            background: 'rgba(255, 255, 255, 0.2)',
            x: smoothX,
            translateX: '-50%',
            scaleX: motion.useTransform(smoothStretch, s => 1 + (s / 58)),
            scaleY: motion.useTransform(smoothStretch, s => 1 - (s / 150)),
            transformOrigin: 'center'
          }}
        />

        {TABS.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(tab.id);
                if (centers[idx] != null) {
                  animate(bubbleX, centers[idx], SNAP_SPRING as any);
                  animate(stretchFactor, 0, STRETCH_SPRING as any);
                }
              }}
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                background: 'none',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                padding: 0,
                zIndex: 2,
              }}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.45)',
                  transition: 'color 0.2s, stroke-width 0.2s',
                  transform: isActive ? 'translateY(-2px)' : 'translateY(0px)',
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.45)',
                  transition: 'color 0.2s',
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
