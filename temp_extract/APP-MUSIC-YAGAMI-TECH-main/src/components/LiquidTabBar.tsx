/**
 * LiquidTabBar — iOS 26 style (WhatsApp / Apple Music reference)
 *
 * Visually matches the WhatsApp/Apple Music iOS 26 tab bar:
 * - Solid dark pill bar at the bottom
 * - Active bubble protrudes ABOVE the bar (metaball goo merge)
 * - Bubble follows your finger while dragging (interactive)
 * - Icons always visible in a completely separate DOM layer
 */

import React, {
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { motion, useMotionValue, useSpring, animate } from 'motion/react';
import { Home, Search, Library, Download, Settings as SettingsIcon } from 'lucide-react';

// ─── Tab definitions ────────────────────────────────────────────
const TABS = [
  { id: 'home',      icon: Home,          label: 'Inicio'    },
  { id: 'search',    icon: Search,        label: 'Buscar'    },
  { id: 'library',   icon: Library,       label: 'Librería'  },
  { id: 'downloads', icon: Download,      label: 'Descargas' },
  { id: 'settings',  icon: SettingsIcon,  label: 'Ajustes'   },
] as const;
type TabId = typeof TABS[number]['id'];

// ─── Constants ──────────────────────────────────────────────────
const BAR_H       = 64;   // height of the pill bar
const BUBBLE_D    = 62;   // diameter of the active bubble
const BUBBLE_UP   = 18;   // how much bubble protrudes above bar
const SNAP_SPRING = { stiffness: 320, damping: 26, mass: 0.85 };

// ────────────────────────────────────────────────────────────────
export const LiquidTabBar = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (id: string) => void;
}) => {
  // Refs
  const barRef    = useRef<HTMLDivElement>(null);   // for measuring tab centers
  const isDragging = useRef(false);

  // Tab center positions (measured from barRef)
  const [centers, setCenters] = useState<number[]>([]);

  // Bubble X position (follows finger or snaps to active tab)
  const bubbleX = useMotionValue(0);
  const smoothX = useSpring(bubbleX, SNAP_SPRING);

  // Measure tab button centers relative to bar container
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
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (barRef.current) ro.observe(barRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Snap bubble to active tab (when tab changes without dragging)
  useEffect(() => {
    if (isDragging.current || !centers.length) return;
    const idx = TABS.findIndex(t => t.id === activeTab);
    if (idx >= 0 && centers[idx] != null) {
      animate(bubbleX, centers[idx], SNAP_SPRING as any);
    }
  }, [activeTab, centers, bubbleX]);

  // ── Touch / pointer drag: bubble follows finger ──────────────
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const bar = barRef.current;
    if (!bar) return;

    isDragging.current = true;
    bar.setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const rect = bar.getBoundingClientRect();
      const localX = ev.clientX - rect.left;
      // Clamp to bar bounds
      const clamped = Math.max(BUBBLE_D / 2, Math.min(rect.width - BUBBLE_D / 2, localX));
      bubbleX.set(clamped);
    };

    const onUp = (ev: PointerEvent) => {
      isDragging.current = false;
      bar.removeEventListener('pointermove', onMove);
      bar.removeEventListener('pointerup', onUp);
      bar.removeEventListener('pointercancel', onUp);

      // Find nearest tab center and snap to it
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
    };

    bar.addEventListener('pointermove', onMove);
    bar.addEventListener('pointerup',   onUp);
    bar.addEventListener('pointercancel', onUp);
  }, [centers, bubbleX, setActiveTab]);

  // ── Active icon lift animation ───────────────────────────────
  const activeIdx = TABS.findIndex(t => t.id === activeTab);

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          SVG GOO FILTER — makes bar + bubble merge like liquid
          ══════════════════════════════════════════════════════ */}
      <svg
        aria-hidden="true"
        style={{ position: 'fixed', width: 0, height: 0, top: 0, left: 0, zIndex: -1 }}
      >
        <defs>
          {/* stdDeviation controls how "liquid" the merge looks */}
          <filter id="ltb-goo" x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
            <feColorMatrix
              in="blur" mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* ══════════════════════════════════════════════════════
          LAYER A — BAR + BUBBLE (solid shapes, goo filter)
          z-index: 9000
          ── RULE: NO icons inside here. No backdrop-filter.
          ── Goo filter needs solid/opaque backgrounds to work.
          ══════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: 'env(safe-area-inset-bottom, 6px)',
          paddingLeft: 14,
          paddingRight: 14,
          zIndex: 9000,
          pointerEvents: 'none',
          // Extra top padding so the protruding bubble isn't clipped
          paddingTop: BUBBLE_UP + 4,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 460,
            height: BAR_H + BUBBLE_UP + 4,
          }}
        >
          {/* Goo container: ONLY solid shapes go here */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              filter: 'url(#ltb-goo)',
              isolation: 'isolate',
              overflow: 'visible',
            }}
          >
            {/* Pill bar — solid, opaque */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: BAR_H,
                borderRadius: BAR_H / 2,
                background: 'rgb(26, 26, 28)',
              }}
            />

            {/* Bubble — solid, slightly lighter, protrudes above bar */}
            <motion.div
              style={{
                position: 'absolute',
                bottom: BAR_H - BUBBLE_D + BUBBLE_UP,
                width: BUBBLE_D,
                height: BUBBLE_D,
                borderRadius: '50%',
                background: 'rgb(44, 44, 48)',
                x: smoothX,
                translateX: '-50%',
              }}
            />
          </div>

          {/* Top highlight on bar (NOT inside goo filter) */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: BAR_H,
              borderRadius: BAR_H / 2,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.07) 0%, transparent 50%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          LAYER B — ICONS ONLY
          z-index: 9001 — completely separate from Layer A.
          No filter, no backdrop-filter anywhere in ancestors.
          Icons are ALWAYS painted on top and clearly visible.
          ══════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: 'env(safe-area-inset-bottom, 6px)',
          paddingLeft: 14,
          paddingRight: 14,
          zIndex: 9001,
          pointerEvents: 'none',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0 4px',
            pointerEvents: 'auto',
            touchAction: 'none',
            cursor: 'grab',
          }}
        >
          {TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (centers[idx] != null) {
                    animate(bubbleX, centers[idx], SNAP_SPRING as any);
                  }
                }}
                style={{
                  flex: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  padding: 0,
                  // Lift active icon above bar to sit inside the bubble
                  transform: isActive ? `translateY(-${BUBBLE_UP - 2}px)` : 'translateY(0)',
                  transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <Icon
                  size={isActive ? 25 : 22}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  style={{
                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
                    transition: 'color 0.2s, width 0.2s',
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
      </div>
    </>
  );
};
