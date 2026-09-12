const fs = require('fs');
const path = 'src/components/LiquidTabBar.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update imports
if (!content.includes('useTransform')) {
  content = content.replace("useSpring, animate, AnimatePresence", "useSpring, animate, AnimatePresence, useTransform, useAnimationFrame");
}

// Write the entire file for the advanced fluid mechanics
const newContent = `
import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence, useTransform } from 'framer-motion';
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

export const LiquidTabBar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (id: string) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tabMeasurements, setTabMeasurements] = useState<{ x: number, width: number }[]>([]);
  const isDragging = useRef(false);
  
  // Motion values
  const dropX = useMotionValue(0);
  const dropWidth = useMotionValue(0);
  const pointerX = useMotionValue(0);
  
  // Springs for fluid physics
  const smoothDropX = useSpring(dropX, { stiffness: 200, damping: 20, mass: 1 });
  const smoothDropWidth = useSpring(dropWidth, { stiffness: 250, damping: 25, mass: 1 });
  
  // Measure tabs on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const updateMeasurements = () => {
      const tabs = Array.from(containerRef.current!.querySelectorAll('.tab-btn')) as HTMLElement[];
      const measures = tabs.map(tab => ({
        x: tab.offsetLeft,
        width: tab.offsetWidth,
      }));
      setTabMeasurements(measures);
      
      const activeIdx = TABS.findIndex(t => t.id === activeTab);
      if (measures[activeIdx]) {
        dropX.set(measures[activeIdx].x);
        dropWidth.set(measures[activeIdx].width);
      }
    };
    
    updateMeasurements();
    // A small delay to ensure rendering is complete
    setTimeout(updateMeasurements, 100);
    window.addEventListener('resize', updateMeasurements);
    return () => window.removeEventListener('resize', updateMeasurements);
  }, [activeTab]);

  // Sync active tab to drop position when not dragging
  useEffect(() => {
    if (isDragging.current || tabMeasurements.length === 0) return;
    const activeIdx = TABS.findIndex(t => t.id === activeTab);
    if (tabMeasurements[activeIdx]) {
      dropX.set(tabMeasurements[activeIdx].x);
      dropWidth.set(tabMeasurements[activeIdx].width);
    }
  }, [activeTab, tabMeasurements, dropX, dropWidth]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    isDragging.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    pointerX.set(localX);
    
    // Stretch to finger
    const activeIdx = TABS.findIndex(t => t.id === activeTab);
    if (tabMeasurements[activeIdx]) {
       const tabCenter = tabMeasurements[activeIdx].x + (tabMeasurements[activeIdx].width / 2);
       // Move center towards finger slightly and stretch
       dropX.set(localX - 25);
       dropWidth.set(50);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let localX = e.clientX - rect.left;
    localX = Math.max(0, Math.min(localX, rect.width));
    
    pointerX.set(localX);
    
    // The drop follows the finger
    dropX.set(localX - 25); // center the 50px drop
    dropWidth.set(50);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    isDragging.current = false;
    
    const rect = containerRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    
    // Find closest tab
    let closestTab = TABS[0].id;
    let minDistance = Infinity;
    
    tabMeasurements.forEach((m, idx) => {
      const center = m.x + m.width / 2;
      const dist = Math.abs(center - localX);
      if (dist < minDistance) {
        minDistance = dist;
        closestTab = TABS[idx].id;
      }
    });
    
    setActiveTab(closestTab);
    
    // Snap physically
    const activeIdx = TABS.findIndex(t => t.id === closestTab);
    if (tabMeasurements[activeIdx]) {
      dropX.set(tabMeasurements[activeIdx].x);
      dropWidth.set(tabMeasurements[activeIdx].width);
    }
  };

  return (
    <>
      <svg width="0" height="0" className="absolute hidden">
        <defs>
          <filter id="gooey" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="
              1 0 0 0 0  
              0 1 0 0 0  
              0 0 1 0 0  
              0 0 0 25 -12" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      <nav 
        className="fixed bottom-0 left-0 w-full h-[85px] z-50 pb-[env(safe-area-inset-bottom)] pointer-events-none"
      >
        {/* Liquid Glass Background */}
        <div className="absolute inset-0 bg-white/5 dark:bg-black/5 backdrop-blur-[20px] saturate-[1.8] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] pointer-events-auto" />
        
        {/* Gooey Layer for the drop and tab anchors */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ filter: "url('#gooey')" }}
        >
          <div className="relative flex items-center justify-between w-full max-w-[450px] mx-auto h-full px-3">
             {/* Stationary Anchors (helps gooey effect melt onto tabs) */}
             {tabMeasurements.map((m, i) => (
                <div 
                  key={i} 
                  className="absolute top-1/2 -translate-y-1/2 h-[10px] rounded-full bg-[#007AFF]/20 transition-all duration-300"
                  style={{ left: m.x + m.width/2 - 5, width: 10, opacity: activeTab === TABS[i].id ? 0 : 0 }}
                />
             ))}

             {/* The moving fluid drop */}
             <motion.div
               className="absolute top-1/2 -translate-y-1/2 h-[44px] rounded-full bg-[#007AFF] shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),_inset_0_-2px_4px_rgba(0,0,0,0.2),_0_4px_10px_rgba(0,122,255,0.4)]"
               style={{
                 left: 0,
                 x: smoothDropX,
                 width: smoothDropWidth
               }}
             />
          </div>
        </div>

        {/* Foreground Layer (Icons & Interaction) */}
        <div 
          ref={containerRef}
          className="relative flex items-center justify-between w-full max-w-[450px] mx-auto px-3 h-full pointer-events-auto select-none touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <div
                key={tab.id}
                className="tab-btn relative flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-full transition-colors duration-300 z-10"
              >
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={\`relative z-10 transition-colors duration-300 \${isActive ? 'text-white drop-shadow-md' : 'text-gray-500 dark:text-gray-400'}\`} 
                />
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span 
                      layout
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
                      className="relative z-10 text-[12px] font-bold tracking-wide overflow-hidden text-white drop-shadow-md"
                    >
                      <span className="pl-1 block whitespace-nowrap">{tab.label}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
};
`;

fs.writeFileSync(path, newContent, 'utf8');
console.log("Updated LiquidTabBar!");
