import React, { useRef, useLayoutEffect, useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'motion/react';
import { Home, Search, Library, Download, Settings as SettingsIcon } from 'lucide-react';

interface Tab {
  id: string;
  icon: React.ElementType;
  label: string;
}

const TABS: Tab[] = [
  { id: 'home', icon: Home, label: 'Inicio' },
  { id: 'search', icon: Search, label: 'Buscar' },
  { id: 'library', icon: Library, label: 'Librería' },
  { id: 'downloads', icon: Download, label: 'Descargas' },
  { id: 'settings', icon: SettingsIcon, label: 'Ajustes' },
];

// ─── Liquid spring configs (heavy, viscous like water) ───
const LIQUID_SPRING = { stiffness: 120, damping: 14, mass: 1.2 };
const STRETCH_SPRING = { stiffness: 200, damping: 18, mass: 0.9 };
const ICON_SPRING = { stiffness: 280, damping: 22, mass: 0.8 };

export const LiquidTabBar = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (id: string) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tabCenters, setTabCenters] = useState<number[]>([]);
  const prevTabRef = useRef(activeTab);

  // ─── Motion values for liquid physics ───
  const bubbleX = useMotionValue(0);
  const bubbleWidth = useMotionValue(56);
  const bubbleHeight = useMotionValue(56);
  const bubbleY = useMotionValue(-10);

  // Springs — heavy mass = water-like inertia & overshoot
  const smoothX = useSpring(bubbleX, LIQUID_SPRING);
  const smoothWidth = useSpring(bubbleWidth, STRETCH_SPRING);
  const smoothHeight = useSpring(bubbleHeight, STRETCH_SPRING);
  const smoothY = useSpring(bubbleY, LIQUID_SPRING);

  // Derived: stretch squishes vertically (conserves volume like water)
  const scaleY = useTransform(smoothWidth, [56, 140], [1, 0.7]);

  // ─── Measure tab positions ───
  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const btns = container.querySelectorAll<HTMLElement>('.ltb-tab');
    const containerRect = container.getBoundingClientRect();
    const centers: number[] = [];
    btns.forEach((btn) => {
      const r = btn.getBoundingClientRect();
      centers.push(r.left - containerRect.left + r.width / 2);
    });
    setTabCenters(centers);
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // ─── Liquid animation when tab changes ───
  useEffect(() => {
    const activeIdx = TABS.findIndex((t) => t.id === activeTab);
    const prevIdx = TABS.findIndex((t) => t.id === prevTabRef.current);
    if (tabCenters.length === 0 || activeIdx < 0) return;

    const targetX = tabCenters[activeIdx];
    const prevX = tabCenters[prevIdx] ?? targetX;
    const distance = Math.abs(targetX - prevX);
    const tabSpacing = tabCenters.length > 1 ? Math.abs(tabCenters[1] - tabCenters[0]) : 70;

    // Stretch proportional to distance (like water being pulled)
    const stretchFactor = Math.min(distance / tabSpacing, 3);
    const peakWidth = 56 + stretchFactor * 40; // Gets wider the further it travels

    if (distance > 5) {
      // Phase 1: Stretch wide, squish vertically (water blob deforming)
      bubbleWidth.set(peakWidth);
      bubbleHeight.set(56 * (56 / peakWidth)); // Conserve "volume"
      bubbleY.set(-10 + stretchFactor * 2); // Sinks slightly when stretched

      // Phase 2: After spring settles at new position, contract back
      const timer = setTimeout(() => {
        bubbleWidth.set(56);
        bubbleHeight.set(56);
        bubbleY.set(-10);
      }, 120 + stretchFactor * 30);

      // Move to target
      bubbleX.set(targetX);

      prevTabRef.current = activeTab;
      return () => clearTimeout(timer);
    } else {
      // Initial mount or same tab
      bubbleX.set(targetX);
      prevTabRef.current = activeTab;
    }
  }, [activeTab, tabCenters, bubbleX, bubbleWidth, bubbleHeight, bubbleY]);

  // Initial position (no animation on mount)
  useEffect(() => {
    if (tabCenters.length === 0) return;
    const idx = TABS.findIndex((t) => t.id === activeTab);
    if (idx >= 0 && tabCenters[idx]) {
      bubbleX.set(tabCenters[idx]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabCenters.length > 0]);

  return (
    <div
      className="fixed left-0 w-full flex justify-center z-[100] pointer-events-none"
      style={{ bottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}
    >
      {/* Hidden SVG filter for liquid goo/metaball merging effect */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="liquid-goo">
            {/* Blur shapes so their edges overlap softly */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            {/* Snap the blurred alpha back to sharp — creates liquid surface tension */}
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
              result="goo"
            />
            {/* Composite original graphics on top of the goo shape */}
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <nav
        className="relative w-[92%] max-w-[420px] pointer-events-auto"
        style={{ height: 72 }}
      >
        {/* ════════════════════════════════════════════════
            GOO SHAPE LAYER — Bar + Bubble merge like liquid
            The SVG filter makes adjacent shapes "melt" together
            ════════════════════════════════════════════════ */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            filter: 'url(#liquid-goo)',
            top: -28, // Extra space for bubble protrusion
            height: 100 + 28,
          }}
        >
          {/* Bar shape (solid for the goo filter) */}
          <div
            className="absolute rounded-[36px]"
            style={{
              top: 28,
              left: 0,
              right: 0,
              height: 72,
              background: 'rgba(28,28,30,0.65)',
              backdropFilter: 'blur(50px) saturate(190%) brightness(1.08)',
              WebkitBackdropFilter: 'blur(50px) saturate(190%) brightness(1.08)',
            }}
          />

          {/* Bubble shape (merges with bar via goo filter) */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: smoothWidth,
              height: smoothHeight,
              x: useTransform(smoothX, (v) => v - 28),
              y: useTransform(smoothY, (v) => v + 28),
              scaleY,
              background: 'rgba(28,28,30,0.65)',
              backdropFilter: 'blur(50px) saturate(200%) brightness(1.15)',
              WebkitBackdropFilter: 'blur(50px) saturate(200%) brightness(1.15)',
            }}
          />
        </div>

        {/* ════════════════════════════════
            GLASS HIGHLIGHTS & EDGES
            ════════════════════════════════ */}
        {/* Bar border — subtle top shine */}
        <div
          className="absolute inset-0 rounded-[36px] pointer-events-none"
          style={{
            boxShadow: `
              0 8px 40px rgba(0,0,0,0.45),
              0 1.5px 0 rgba(255,255,255,0.1) inset,
              0 -0.5px 0 rgba(255,255,255,0.05) inset
            `,
            border: '0.5px solid rgba(255,255,255,0.15)',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)',
          }}
        />

        {/* Bubble glass highlight (follows bubble) */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: smoothWidth,
            height: smoothHeight,
            left: useTransform(smoothX, (v) => v - 28),
            top: smoothY,
            scaleY,
            boxShadow: `
              inset 0 1px 1px rgba(255,255,255,0.2),
              inset 0 -1px 1px rgba(255,255,255,0.05),
              0 4px 20px rgba(0,0,0,0.3)
            `,
            border: '0.5px solid rgba(255,255,255,0.2)',
          }}
        >
          {/* Chromatic fringe on bubble edges */}
          <div
            className="absolute inset-[-1px] rounded-full pointer-events-none overflow-hidden"
            style={{
              background: `linear-gradient(135deg, 
                rgba(0,220,255,0.3) 0%, 
                transparent 30%, 
                rgba(255,0,200,0.25) 50%, 
                transparent 70%, 
                rgba(0,180,255,0.3) 100%
              )`,
              maskImage: 'radial-gradient(circle, transparent 55%, black 100%)',
              WebkitMaskImage: 'radial-gradient(circle, transparent 55%, black 100%)',
            }}
          />
        </motion.div>

        {/* ════════════════════════════════
            TAB ICONS & LABELS
            ════════════════════════════════ */}
        <div
          ref={containerRef}
          className="relative flex items-center justify-around w-full h-full px-1 z-10"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                className="ltb-tab flex flex-col items-center justify-center gap-[3px] flex-1 h-full bg-transparent border-none outline-none cursor-pointer relative"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                onClick={() => setActiveTab(tab.id)}
              >
                <motion.div
                  animate={{
                    y: isActive ? -14 : 0,
                    scale: isActive ? 1.15 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    ...ICON_SPRING,
                  }}
                  className="flex flex-col items-center gap-[3px]"
                >
                  <Icon
                    size={isActive ? 24 : 22}
                    strokeWidth={isActive ? 2.4 : 1.8}
                    className="transition-colors duration-200"
                    style={{
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.45)',
                      filter: isActive
                        ? 'drop-shadow(0 0 8px rgba(255,255,255,0.35))'
                        : 'none',
                    }}
                  />
                  <span
                    className="text-[10px] font-semibold tracking-wide transition-colors duration-200 leading-none whitespace-nowrap"
                    style={{
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {tab.label}
                  </span>
                </motion.div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
