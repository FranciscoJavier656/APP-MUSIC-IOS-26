const fs = require('fs');
const path = 'src/components/LiquidTabBar.tsx';

const newContent = `
import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
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
  
  // Springs tuned for heavy liquid/water physics
  const smoothDropX = useSpring(dropX, { stiffness: 140, damping: 18, mass: 1.1 });
  const smoothDropWidth = useSpring(dropWidth, { stiffness: 180, damping: 20, mass: 1 });
  
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
          const targetWidth = measures[activeIdx].width + 12; // Extra padding for bubble
          const targetX = measures[activeIdx].x - 6;
          dropX.set(targetX);
          dropWidth.set(targetWidth);
        }
      }
    };
    
    updateMeasurements();
    setTimeout(updateMeasurements, 100);
    window.addEventListener('resize', updateMeasurements);
    return () => window.removeEventListener('resize', updateMeasurements);
  }, [activeTab]);

  useEffect(() => {
    if (isDragging.current || tabMeasurements.length === 0) return;
    const activeIdx = TABS.findIndex(t => t.id === activeTab);
    if (tabMeasurements[activeIdx]) {
      const targetWidth = tabMeasurements[activeIdx].width + 12;
      const targetX = tabMeasurements[activeIdx].x - 6;
      dropX.set(targetX);
      dropWidth.set(targetWidth);
    }
  }, [activeTab, tabMeasurements, dropX, dropWidth]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    isDragging.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    
    // Stretch wide like a puddle when pressed
    const stretchWidth = 140;
    dropX.set(localX - stretchWidth / 2);
    dropWidth.set(stretchWidth);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let localX = e.clientX - rect.left;
    localX = Math.max(0, Math.min(localX, rect.width));
    
    const stretchWidth = 140;
    dropX.set(localX - stretchWidth / 2); 
    dropWidth.set(stretchWidth);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    isDragging.current = false;
    
    const rect = containerRef.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    
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
    
    const activeIdx = TABS.findIndex(t => t.id === closestTab);
    if (tabMeasurements[activeIdx]) {
      const targetWidth = tabMeasurements[activeIdx].width + 12;
      const targetX = tabMeasurements[activeIdx].x - 6;
      dropX.set(targetX);
      dropWidth.set(targetWidth);
    }
  };

  const isIOS = Capacitor.getPlatform() === 'ios';

  return (
    <div className={\`fixed left-0 w-full flex justify-center z-[100] pointer-events-none \${isIOS ? 'bottom-8' : 'bottom-6'}\`}>
      <nav 
        className="relative w-[95%] max-w-[420px] h-[78px] rounded-[39px] pointer-events-none"
      >
        {/* Main Bar Background - Dark Translucent */}
        <div className="absolute inset-0 bg-[#141414]/50 dark:bg-black/60 backdrop-blur-[24px] saturate-[1.8] rounded-[39px] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.4)] pointer-events-auto" />
        
        {/* The Liquid Bubble - Taller than the bar, full chromatic aberration */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-[96px] rounded-[48px] pointer-events-none z-10"
          style={{
            left: smoothDropX,
            width: smoothDropWidth,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.0) 100%)',
            backdropFilter: 'blur(8px) brightness(1.2) saturate(1.4)',
            WebkitBackdropFilter: 'blur(8px) brightness(1.2) saturate(1.4)',
            boxShadow: \`
              inset 0px 8px 12px -4px rgba(0,0,0,0.9),
              inset 0px -8px 12px -4px rgba(0,0,0,0.9),
              inset 3px 0px 8px -1px rgba(0, 255, 255, 0.9),
              inset 6px 0px 12px -2px rgba(255, 255, 0, 0.6),
              inset -3px 0px 8px -1px rgba(255, 0, 255, 0.9),
              inset -6px 0px 12px -2px rgba(0, 0, 255, 0.6),
              inset 0px 0px 4px 1px rgba(255, 255, 255, 0.3),
              inset 0px 1px 1px rgba(255,255,255,0.9),
              0px 12px 24px -4px rgba(0, 0, 0, 0.7)
            \`,
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}
        />

        {/* Foreground Icons & Text */}
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
                className="tab-btn relative flex flex-col items-center justify-center gap-1 w-[72px] h-full transition-colors duration-300"
              >
                <Icon 
                  size={26} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={\`relative z-10 transition-colors duration-300 \${isActive ? 'text-white drop-shadow-md' : 'text-white/60'}\`} 
                />
                <span className={\`text-[11px] font-medium tracking-wide transition-colors duration-300 \${isActive ? 'text-white drop-shadow-md' : 'text-white/60'}\`}>
                  {tab.label}
                </span>
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
console.log("Written 1:1 Clone of LiquidTabBar!");
