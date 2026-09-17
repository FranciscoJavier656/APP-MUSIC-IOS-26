import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Home, Search, Library, Download, Settings as SettingsIcon } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const TABS = [
  { id: 'home',      icon: Home,          label: 'Inicio'    },
  { id: 'search',    icon: Search,        label: 'Buscar'    },
  { id: 'library',   icon: Library,       label: 'Librería'  },
  { id: 'downloads', icon: Download,      label: 'Descargas' },
  { id: 'settings',  icon: SettingsIcon,  label: 'Ajustes'   },
] as const;

export const LiquidTabBar = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (id: string) => void;
}) => {
  // On native iOS, the SwiftUI TabView handles the tab bar — don't render React version
  if (Capacitor.isNativePlatform()) return null;

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

  return (
    <motion.div
      initial={false}
      animate={{ 
        y: isHidden ? 100 : 0,
        opacity: isHidden ? 0 : 1,
        scale: isHidden ? 0.95 : 1
      }}
      transition={{ type: "spring", damping: 25, stiffness: 350 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        paddingLeft: 16,
        paddingRight: 16,
        zIndex: 50,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 420,
          height: 64,
          borderRadius: 32,
          background: 'rgba(25, 25, 25, 0.85)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          pointerEvents: 'auto',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                position: 'relative',
                flex: 1,
                height: 48,
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
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 24,
                    background: 'rgba(255, 255, 255, 0.12)',
                    zIndex: -1,
                  }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                style={{
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  transition: 'color 0.2s, stroke-width 0.2s',
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
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
