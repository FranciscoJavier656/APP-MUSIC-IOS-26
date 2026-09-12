const fs = require('fs');
const path = 'src/components/LiquidTabBar.tsx';

const newContent = `
import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { Home, Search, Library, Download, Settings as SettingsIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

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
  
  // Springs for fluid water physics
  const smoothDropX = useSpring(dropX, { stiffness: 250, damping: 24, mass: 0.9 });
  const smoothDropWidth = useSpring(dropWidth, { stiffness: 300, damping: 22, mass: 0.9 });
  
  useEffect(() => {
    if (!containerRef.current) return;
    const updateMeasurements = () => {
      const tabs = Array.from(containerRef.current!.querySelectorAll('.tab-btn')) as HTMLElement[];
      const measures = tabs.map(tab => ({
        x: tab.offsetLeft,
        width: tab.offsetWidth,
      }));
      setTabMeasurements(measures);
      
      if (!isDragging.current) {
        const activeIdx = TABS.findIndex(t => t.id === activeTab);
        if (measures[activeIdx]) {
          dropX.set(measures[activeIdx].x);
          dropWidth.set(measures[activeIdx].width);
        }
      }
    };
    
    updateMeasurements();
    setTimeout(updateMeasurements, 150);
    window.addEventListener('resize', updateMeasurements);
    return () => window.removeEventListener('resize', updateMeasurements);
  }, [activeTab]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    isDragging.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    
    // Stretch like a water drop when touched
    dropX.set(localX - 40);
    dropWidth.set(80);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let localX = e.clientX - rect.left;
    localX = Math.max(0, Math.min(localX, rect.width));
    
    // Follow the finger exactly, keeping a widened water drop shape
    dropX.set(localX - 40); 
    dropWidth.set(80);
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
    
    // Snap physically to target
    const activeIdx = TABS.findIndex(t => t.id === closestTab);
    if (tabMeasurements[activeIdx]) {
      dropX.set(tabMeasurements[activeIdx].x);
      dropWidth.set(tabMeasurements[activeIdx].width);
    }
  };

  // Safe area padding for iOS
  const isIOS = Capacitor.getPlatform() === 'ios';

  return (
    <div className={\`fixed left-0 w-full flex justify-center z-[100] pointer-events-none \${isIOS ? 'bottom-8' : 'bottom-6'}\`}>
      <nav 
        className="relative w-[92%] max-w-[420px] h-[72px] rounded-full pointer-events-none"
      >
        {/* Main Pill Background (Highly transparent) */}
        <div className="absolute inset-0 bg-[#F2F2F7]/20 dark:bg-black/30 backdrop-blur-[24px] saturate-[1.8] rounded-full border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.25)] pointer-events-auto" />
        
        {/* The Liquid Glass Bubble (Active Indicator) */}
        {/* We use chromatic aberration box-shadows to simulate light passing through water */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-[56px] rounded-full pointer-events-none z-10"
          style={{
            left: smoothDropX,
            width: smoothDropWidth,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(16px) brightness(1.3) saturate(1.4)',
            WebkitBackdropFilter: 'blur(16px) brightness(1.3) saturate(1.4)',
            boxShadow: \`
              inset 0px 2px 4px rgba(255, 255, 255, 0.7),
              inset 2px 0px 6px rgba(0, 255, 255, 0.4),
              inset -2px 0px 6px rgba(255, 0, 128, 0.4),
              inset 0px -2px 6px rgba(200, 255, 0, 0.2),
              0px 4px 16px rgba(0, 0, 0, 0.25)
            \`,
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}
        />

        {/* Foreground Icons */}
        <div 
          ref={containerRef}
          className="relative flex items-center justify-between w-full h-full px-2 pointer-events-auto select-none touch-none z-20"
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
                className="tab-btn relative flex items-center justify-center gap-1.5 px-4 py-3 rounded-full transition-colors duration-300"
              >
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={\`relative z-10 transition-colors duration-300 \${isActive ? 'text-black dark:text-white drop-shadow-md' : 'text-black/60 dark:text-white/50'}\`} 
                />
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.span 
                      layout
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
                      className="relative z-10 text-[13px] font-bold tracking-wide overflow-hidden text-black dark:text-white drop-shadow-md"
                    >
                      <span className="pl-1.5 block whitespace-nowrap">{tab.label}</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
`

fs.writeFileSync(path, newContent, 'utf8');
console.log("Rewritten LiquidTabBar to match iOS 26 Bubble!");
