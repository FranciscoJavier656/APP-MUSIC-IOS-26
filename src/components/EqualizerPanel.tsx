import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Power } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { QobuzAudio } from '../lib/QobuzAudioPlugin';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const isNative = Capacitor.isNativePlatform();

// ── Band Configuration ──
const BANDS = [
  { freq: 32,    label: '32' },
  { freq: 64,    label: '64' },
  { freq: 125,   label: '125' },
  { freq: 250,   label: '250' },
  { freq: 500,   label: '500' },
  { freq: 1000,  label: '1K' },
  { freq: 2000,  label: '2K' },
  { freq: 4000,  label: '4K' },
  { freq: 8000,  label: '8K' },
  { freq: 16000, label: '16K' },
];

const PRESETS: { id: string; name: string; gains: number[] }[] = [
  { id: 'flat',         name: 'Flat',        gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { id: 'bass_boost',   name: 'Bass',        gains: [6, 5, 3, 1, 0, 0, 0, 0, 0, 0] },
  { id: 'treble_boost', name: 'Agudos',      gains: [0, 0, 0, 0, 0, 0, 1, 3, 5, 6] },
  { id: 'vocal',        name: 'Vocal',       gains: [-2, -1, 0, 2, 4, 4, 2, 0, -1, -2] },
  { id: 'rock',         name: 'Rock',        gains: [4, 3, 0, -2, -1, 1, 3, 4, 4, 3] },
  { id: 'jazz',         name: 'Jazz',        gains: [3, 2, 0, 1, -1, 0, 1, 2, 3, 4] },
  { id: 'electronic',   name: 'Electrónica', gains: [5, 4, 1, 0, -2, 0, 1, 3, 4, 5] },
  { id: 'acoustic',     name: 'Acústico',    gains: [0, 0, 1, 2, 1, 0, 1, 2, 3, 2] },
  { id: 'late_night',   name: 'Nocturno',    gains: [3, 2, 0, 0, 1, 1, 0, -1, -2, -3] },
  { id: 'hires',        name: 'Hi-Res',      gains: [-1, 0, 0, 0, 0, 0, 1, 2, 3, 4] },
];

const DB_MIN = -12;
const DB_MAX = 12;

interface EqualizerPanelProps {
  isVisible: boolean;
  onClose: () => void;
  dominantColor: string | null;
}

export default function EqualizerPanel({ isVisible, onClose, dominantColor }: EqualizerPanelProps) {
  const [eqEnabled, setEqEnabled] = useState(false);
  const [gains, setGains] = useState<number[]>(new Array(10).fill(0));
  const [activePreset, setActivePreset] = useState('flat');
  const curveCanvasRef = useRef<HTMLCanvasElement>(null);
  const presetsScrollRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Accent color
  const accent = dominantColor || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgb(255,255,255)' : 'rgb(0,0,0)');

  // ── Load EQ state on mount ──
  useEffect(() => {
    if (!isVisible) return;
    if (isNative) {
      QobuzAudio.getEQState().then((state) => {
        setEqEnabled(state.enabled);
        if (state.gains?.length === 10) setGains(state.gains);
        setActivePreset(state.preset || 'flat');
      }).catch(() => {});
    }
  }, [isVisible]);

  // ── Draw EQ response curve ──
  const drawCurve = useCallback(() => {
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const midY = h / 2;
    const maxDeviation = midY - 8;

    // Grid lines
    ctx.strokeStyle = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let db = -12; db <= 12; db += 6) {
      const y = midY - (db / DB_MAX) * maxDeviation;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Zero line
    ctx.strokeStyle = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    // Spline curve through gain points
    const points: [number, number][] = gains.map((g, i) => {
      const x = (i / (gains.length - 1)) * w;
      const y = midY - (g / DB_MAX) * maxDeviation;
      return [x, y];
    });

    // Extend edges for natural curve
    points.unshift([-20, points[0][1]]);
    points.push([w + 20, points[points.length - 1][1]]);

    // Catmull-Rom spline
    ctx.beginPath();
    for (let i = 1; i < points.length - 2; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2];

      for (let t = 0; t <= 1; t += 0.02) {
        const t2 = t * t;
        const t3 = t2 * t;
        const x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
        const y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
        if (i === 1 && t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    }

    // Stroke curve
    ctx.strokeStyle = eqEnabled ? accent : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)');
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Fill gradient under curve
    if (eqEnabled) {
      ctx.lineTo(w + 20, h);
      ctx.lineTo(-20, h);
      ctx.closePath();

      const match = accent.match(/(\d+)/g);
      const [r, g, b] = match ? match.map(Number) : [128, 128, 128];
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.25)`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.0)`);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Draw dots at each band
    for (let i = 0; i < gains.length; i++) {
      const x = (i / (gains.length - 1)) * w;
      const y = midY - (gains[i] / DB_MAX) * maxDeviation;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = eqEnabled ? accent : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)');
      ctx.fill();
    }
  }, [gains, eqEnabled, accent]);

  useEffect(() => {
    drawCurve();
  }, [drawCurve]);

  // ── Send gain to native (debounced) ──
  const sendGainToNative = useCallback((band: number, gain: number) => {
    if (!isNative) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      QobuzAudio.setEQBand({ band, gain: Math.round(gain * 10) / 10 }).catch(() => {});
    }, 16);
  }, []);

  // ── Toggle EQ ──
  const toggleEQ = useCallback(() => {
    const newVal = !eqEnabled;
    setEqEnabled(newVal);
    if (isNative) {
      QobuzAudio.setEQEnabled({ enabled: newVal }).catch(() => {});
    }
    try {
      if (isNative) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    } catch {}
  }, [eqEnabled]);

  // ── Select Preset ──
  const selectPreset = useCallback((preset: typeof PRESETS[0]) => {
    setActivePreset(preset.id);
    setGains([...preset.gains]);
    if (isNative) {
      QobuzAudio.setEQPreset({ preset: preset.id }).catch(() => {});
    }
    try {
      if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch {}
  }, []);

  // ── Slider interaction handler ──
  const handleSliderChange = useCallback((band: number, newGain: number) => {
    setGains(prev => {
      const updated = [...prev];
      updated[band] = Math.round(newGain * 10) / 10;
      return updated;
    });
    setActivePreset('custom');
    sendGainToNative(band, newGain);
  }, [sendGainToNative]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="absolute inset-0 z-50 flex flex-col"
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-white dark:bg-[#121212]" />
          
          {/* Accent glow */}
          {dominantColor && (
            <div
              className="absolute inset-0 opacity-[0.06] dark:opacity-[0.12] mix-blend-screen dark:mix-blend-lighten pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 0%, ${dominantColor} 0%, transparent 70%)` }}
            />
          )}

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full pt-14 pb-8 px-6">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-black dark:text-white tracking-tight">Ecualizador</h3>
                <button
                  onClick={toggleEQ}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                    eqEnabled 
                      ? 'shadow-lg' 
                      : 'bg-black/5 dark:bg-white/10'
                  }`}
                  style={eqEnabled ? { backgroundColor: accent } : undefined}
                >
                  <Power className={`w-4 h-4 ${eqEnabled ? 'text-white' : 'text-black/40 dark:text-white/40'}`} />
                </button>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white transition-colors"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            {/* Presets Carousel */}
            <div 
              ref={presetsScrollRef}
              className="flex gap-2 overflow-x-auto pb-4 -mx-6 px-6"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => selectPreset(preset)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold tracking-wide transition-all duration-300 ${
                    activePreset === preset.id
                      ? 'text-white shadow-md'
                      : 'bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/15'
                  }`}
                  style={activePreset === preset.id ? { backgroundColor: accent } : undefined}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* Response Curve */}
            <div className="h-24 w-full mb-4 relative">
              <span className="absolute left-0 top-0 text-[9px] font-mono text-black/30 dark:text-white/25">+12</span>
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[9px] font-mono text-black/30 dark:text-white/25">0</span>
              <span className="absolute left-0 bottom-0 text-[9px] font-mono text-black/30 dark:text-white/25">-12</span>
              <canvas
                ref={curveCanvasRef}
                className="w-full h-full"
                style={{ display: 'block' }}
              />
            </div>

            {/* Vertical Sliders */}
            <div className="flex-1 flex items-stretch gap-0 min-h-0">
              {BANDS.map((band, i) => (
                <EQSlider
                  key={band.freq}
                  label={band.label}
                  value={gains[i]}
                  onChange={(v) => handleSliderChange(i, v)}
                  accent={accent}
                  enabled={eqEnabled}
                />
              ))}
            </div>

            {/* Footer hint */}
            <p className="text-center text-[11px] text-black/30 dark:text-white/25 mt-4 font-medium tracking-wide">
              {eqEnabled ? 'Filtros biquad IIR • Procesamiento en tiempo real' : 'Toca el botón de encendido para activar'}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


// ═══════════════════════════════════════
// ── Vertical EQ Slider Component ──
// ═══════════════════════════════════════

function EQSlider({ 
  label, value, onChange, accent, enabled 
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void; 
  accent: string; 
  enabled: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastTap = useRef(0);
  const previousValue = useRef(value);

  const calcGainFromY = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = 1 - ((clientY - rect.top) / rect.height);
    const clamped = Math.max(0, Math.min(1, ratio));
    return DB_MIN + clamped * (DB_MAX - DB_MIN);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    
    // Double tap to reset
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onChange(0);
      try {
        if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      } catch {}
      return;
    }
    lastTap.current = now;

    isDragging.current = true;
    const gain = calcGainFromY(e.touches[0].clientY);
    previousValue.current = value;
    onChange(gain);
  }, [calcGainFromY, onChange, value]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDragging.current) return;
    const gain = calcGainFromY(e.touches[0].clientY);
    
    // Haptic tick when crossing 0dB
    if ((previousValue.current < 0 && gain >= 0) || (previousValue.current > 0 && gain <= 0)) {
       try {
         if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
       } catch {}
    }
    
    previousValue.current = gain;
    onChange(gain);
  }, [calcGainFromY, onChange]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    isDragging.current = false;
  }, []);

  const fillPercent = ((value - DB_MIN) / (DB_MAX - DB_MIN)) * 100;
  const isPositive = value > 0.5;
  const isNegative = value < -0.5;

  return (
    <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
      {/* dB value */}
      <span className={`text-[10px] font-bold tabular-nums transition-colors duration-200 ${
        enabled && (isPositive || isNegative) ? 'text-black dark:text-white' : 'text-black/30 dark:text-white/30'
      }`}>
        {value > 0 ? '+' : ''}{Math.round(value * 10) / 10}
      </span>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative w-[6px] flex-1 rounded-full overflow-hidden cursor-pointer"
        style={{ 
          backgroundColor: window.matchMedia('(prefers-color-scheme: dark)').matches 
            ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Fill from bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full"
          style={{
            height: `${fillPercent}%`,
            backgroundColor: enabled 
              ? (isPositive || isNegative ? accent : 'transparent')
              : 'transparent',
            opacity: enabled ? 0.8 : 0.3,
            transition: 'background-color 0.2s, opacity 0.2s'
          }}
        />

        {/* Center line (0 dB) */}
        <div 
          className="absolute left-0 right-0 h-[1.5px]"
          style={{ 
            top: '50%', 
            backgroundColor: window.matchMedia('(prefers-color-scheme: dark)').matches 
              ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'
          }}
        />

        {/* Thumb */}
        <div
          className="absolute left-1/2 w-3.5 h-3.5 rounded-full shadow-md"
          style={{
            bottom: `calc(${fillPercent}% - 7px)`,
            backgroundColor: enabled ? accent : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)'),
            transform: 'translateX(-50%)',
            transition: 'background-color 0.2s'
          }}
        />
      </div>

      {/* Frequency label */}
      <span className="text-[9px] font-semibold text-black/40 dark:text-white/35 tracking-tight">
        {label}
      </span>
    </div>
  );
}
