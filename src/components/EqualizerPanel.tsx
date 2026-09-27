import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Power, Zap, Filter } from 'lucide-react';
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
const CROSSOVER_MIN_HZ = 80;
const CROSSOVER_MAX_HZ = 250;
const CROSSOVER_DEFAULT_HZ = 80;

interface EqualizerPanelProps {
  isVisible: boolean;
  onClose: () => void;
  dominantColor: string | null;
}

export default function EqualizerPanel({ isVisible, onClose, dominantColor }: EqualizerPanelProps) {
  const [eqEnabled, setEqEnabled] = useState(false);
  const [gains, setGains] = useState<number[]>(new Array(10).fill(0));
  const [activePreset, setActivePreset] = useState('flat');
  const [pureGain, setPureGain] = useState<number>(0);

  // Crossover state
  const [crossoverEnabled, setCrossoverEnabled] = useState<boolean>(false);
  const [crossoverFreq, setCrossoverFreq] = useState<number>(CROSSOVER_DEFAULT_HZ);

  const curveCanvasRef = useRef<HTMLCanvasElement>(null);
  const presetsScrollRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Pure Gain refs for throttling and interaction
  const pureGainTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingPureGain = useRef(false);
  const lastPureGainTap = useRef(0);
  const previousPureGain = useRef(0);
  const lastDispatchTimeRef = useRef<number>(0);
  const pendingPreampRef = useRef<number | null>(null);
  const throttleTimerRef = useRef<any>(null);

  // Crossover refs for throttling and interaction
  const crossoverTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingCrossover = useRef(false);
  const lastCrossoverTap = useRef(0);
  const previousCrossoverFreq = useRef(CROSSOVER_DEFAULT_HZ);
  const lastCrossoverDispatchTimeRef = useRef<number>(0);
  const pendingCrossoverFreqRef = useRef<number | null>(null);
  const crossoverThrottleTimerRef = useRef<any>(null);

  // Accent color
  const accent = dominantColor || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgb(255,255,255)' : 'rgb(0,0,0)');

  // ── Load EQ state on mount / visibility ──
  useEffect(() => {
    if (!isVisible) return;
    if (isNative) {
      QobuzAudio.getEQState().then((state) => {
        setEqEnabled(state.enabled);
        if (state.gains?.length === 10) setGains(state.gains);
        setActivePreset(state.preset || 'flat');
        if (typeof state.preamp === 'number' && !isDraggingPureGain.current) {
          const val = Math.max(DB_MIN, Math.min(DB_MAX, state.preamp));
          setPureGain(val);
          try {
            localStorage.setItem('eq_preamp', String(val));
          } catch {}
        }
        if (typeof state.crossoverEnabled === 'boolean') {
          setCrossoverEnabled(state.crossoverEnabled);
          try {
            localStorage.setItem('eq_crossover_enabled', String(state.crossoverEnabled));
          } catch {}
        } else {
          const savedCrossoverEnabled = localStorage.getItem('eq_crossover_enabled');
          if (savedCrossoverEnabled !== null) {
            setCrossoverEnabled(savedCrossoverEnabled === 'true');
          }
        }
        if (typeof state.crossoverFrequency === 'number' && !isDraggingCrossover.current) {
          const freq = Math.max(CROSSOVER_MIN_HZ, Math.min(CROSSOVER_MAX_HZ, state.crossoverFrequency));
          setCrossoverFreq(freq);
          previousCrossoverFreq.current = freq;
          try {
            localStorage.setItem('eq_crossover_freq', String(freq));
          } catch {}
        } else {
          const savedCrossoverFreq = localStorage.getItem('eq_crossover_freq');
          if (savedCrossoverFreq !== null) {
            const parsed = parseFloat(savedCrossoverFreq);
            if (!isNaN(parsed)) {
              const freq = Math.max(CROSSOVER_MIN_HZ, Math.min(CROSSOVER_MAX_HZ, parsed));
              setCrossoverFreq(freq);
              previousCrossoverFreq.current = freq;
            }
          }
        }
        try {
          localStorage.setItem('eq_enabled', String(state.enabled));
          if (state.gains) localStorage.setItem('eq_gains', JSON.stringify(state.gains));
          if (state.preset) localStorage.setItem('eq_preset', state.preset);
        } catch {}
      }).catch(() => {});
    } else {
      try {
        const savedPreamp = localStorage.getItem('eq_preamp');
        if (savedPreamp !== null) {
          let val = parseFloat(savedPreamp);
          if (!isNaN(val)) {
            val = Math.max(DB_MIN, Math.min(DB_MAX, val));
            setPureGain(val);
          }
        }
        const savedCrossoverEnabled = localStorage.getItem('eq_crossover_enabled');
        if (savedCrossoverEnabled !== null) {
          setCrossoverEnabled(savedCrossoverEnabled === 'true');
        }
        const savedCrossoverFreq = localStorage.getItem('eq_crossover_freq');
        if (savedCrossoverFreq !== null) {
          const parsed = parseFloat(savedCrossoverFreq);
          if (!isNaN(parsed)) {
            const freq = Math.max(CROSSOVER_MIN_HZ, Math.min(CROSSOVER_MAX_HZ, parsed));
            setCrossoverFreq(freq);
            previousCrossoverFreq.current = freq;
          }
        }
        const savedEnabled = localStorage.getItem('eq_enabled');
        if (savedEnabled !== null) {
          setEqEnabled(savedEnabled === 'true');
        }
        const savedGains = localStorage.getItem('eq_gains');
        if (savedGains) {
          const parsed = JSON.parse(savedGains);
          if (Array.isArray(parsed) && parsed.length === 10) {
            setGains(parsed);
          }
        }
        const savedPreset = localStorage.getItem('eq_preset');
        if (savedPreset) {
          setActivePreset(savedPreset);
        }
      } catch {}
    }
  }, [isVisible]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
      if (crossoverThrottleTimerRef.current) clearTimeout(crossoverThrottleTimerRef.current);
    };
  }, []);

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
      let effectiveGain = g;
      if (crossoverEnabled && eqEnabled) {
        const f = BANDS[i].freq;
        const ratio = f / crossoverFreq;
        const ratio4 = Math.pow(ratio, 4);
        const hpfAttenDb = 10 * Math.log10(ratio4 / (1 + ratio4));
        effectiveGain = Math.max(-12, Math.min(12, g + hpfAttenDb));
      }
      const x = (i / (gains.length - 1)) * w;
      const y = midY - (effectiveGain / DB_MAX) * maxDeviation;
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
      let effectiveGain = gains[i];
      if (crossoverEnabled && eqEnabled) {
        const f = BANDS[i].freq;
        const ratio = f / crossoverFreq;
        const ratio4 = Math.pow(ratio, 4);
        const hpfAttenDb = 10 * Math.log10(ratio4 / (1 + ratio4));
        effectiveGain = Math.max(-12, Math.min(12, gains[i] + hpfAttenDb));
      }
      const x = (i / (gains.length - 1)) * w;
      const y = midY - (effectiveGain / DB_MAX) * maxDeviation;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = eqEnabled ? accent : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)');
      ctx.fill();
    }
  }, [gains, eqEnabled, accent, crossoverEnabled, crossoverFreq]);

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

  // ── Bridge trailing throttle dispatcher for Pre-amp / Pure Gain (~25ms interval / ~40Hz max rate) ──
  const dispatchPreamp = useCallback((val: number) => {
    if (isNative) {
      QobuzAudio.setPreampGain({ gain: val }).catch(() => {
        QobuzAudio.setEQPreamp({ gain: val }).catch(() => {});
      });
    }
    try {
      localStorage.setItem('eq_preamp', String(val));
    } catch {}
    lastDispatchTimeRef.current = Date.now();
    pendingPreampRef.current = null;
  }, []);

  const sendPreampToNative = useCallback((gain: number, forceImmediate = false) => {
    const rounded = Math.round(gain * 10) / 10;
    pendingPreampRef.current = rounded;

    if (forceImmediate) {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      dispatchPreamp(rounded);
      return;
    }

    const now = Date.now();
    const elapsed = now - lastDispatchTimeRef.current;
    const THROTTLE_INTERVAL_MS = 25; // ~40Hz max rate

    if (elapsed >= THROTTLE_INTERVAL_MS) {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      dispatchPreamp(rounded);
    } else if (!throttleTimerRef.current) {
      throttleTimerRef.current = setTimeout(() => {
        throttleTimerRef.current = null;
        if (pendingPreampRef.current !== null) {
          dispatchPreamp(pendingPreampRef.current);
        }
      }, THROTTLE_INTERVAL_MS - elapsed);
    }
  }, [dispatchPreamp]);

  // ── Pure Gain Touch & Interaction Handlers ──
  const calcGainFromX = useCallback((clientX: number) => {
    const track = pureGainTrackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return 0;
    const ratio = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    const rawGain = DB_MIN + clamped * (DB_MAX - DB_MIN);
    // Snap to 0 if within +/- 0.25 dB for easy tactile zeroing
    if (Math.abs(rawGain) < 0.25) return 0;
    return Math.round(rawGain * 10) / 10;
  }, []);

  const handlePureGainTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    // Double tap within 300ms resets to 0
    if (now - lastPureGainTap.current < 300) {
      setPureGain(0);
      previousPureGain.current = 0;
      sendPreampToNative(0, true);
      try {
        if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      } catch {}
      return;
    }
    lastPureGainTap.current = now;

    isDraggingPureGain.current = true;
    const gain = calcGainFromX(e.touches[0].clientX);
    previousPureGain.current = gain;
    setPureGain(gain);
    sendPreampToNative(gain, false);
  }, [calcGainFromX, sendPreampToNative]);

  const handlePureGainTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDraggingPureGain.current) return;
    const gain = calcGainFromX(e.touches[0].clientX);

    // Haptic tick when crossing 0dB
    if ((previousPureGain.current < 0 && gain >= 0) || (previousPureGain.current > 0 && gain <= 0)) {
      try {
        if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      } catch {}
    }

    previousPureGain.current = gain;
    setPureGain(gain);
    sendPreampToNative(gain, false);
  }, [calcGainFromX, sendPreampToNative]);

  const handlePureGainTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    isDraggingPureGain.current = false;
    // Immediately flush on touch release
    sendPreampToNative(previousPureGain.current, true);
  }, [sendPreampToNative]);

  const handlePureGainMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const gain = calcGainFromX(e.clientX);
    setPureGain(gain);
    previousPureGain.current = gain;
    sendPreampToNative(gain, false);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const g = calcGainFromX(moveEvent.clientX);
      setPureGain(g);
      previousPureGain.current = g;
      sendPreampToNative(g, false);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      sendPreampToNative(previousPureGain.current, true);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [calcGainFromX, sendPreampToNative]);

  const handleResetPureGain = useCallback(() => {
    setPureGain(0);
    previousPureGain.current = 0;
    sendPreampToNative(0, true);
    try {
      if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch {}
  }, [sendPreampToNative]);

  // ── Bridge trailing throttle dispatcher for Crossover Frequency (~25ms interval / ~40Hz max rate) ──
  const dispatchCrossoverFreq = useCallback((freq: number) => {
    if (isNative) {
      QobuzAudio.setCrossoverFrequency({ frequency: freq }).catch(() => {});
    }
    try {
      localStorage.setItem('eq_crossover_freq', String(freq));
    } catch {}
    lastCrossoverDispatchTimeRef.current = Date.now();
    pendingCrossoverFreqRef.current = null;
  }, []);

  const sendCrossoverFreqToNative = useCallback((freq: number, forceImmediate = false) => {
    const rounded = Math.round(freq);
    pendingCrossoverFreqRef.current = rounded;

    if (forceImmediate) {
      if (crossoverThrottleTimerRef.current) {
        clearTimeout(crossoverThrottleTimerRef.current);
        crossoverThrottleTimerRef.current = null;
      }
      dispatchCrossoverFreq(rounded);
      return;
    }

    const now = Date.now();
    const elapsed = now - lastCrossoverDispatchTimeRef.current;
    const THROTTLE_INTERVAL_MS = 25; // ~40Hz max rate

    if (elapsed >= THROTTLE_INTERVAL_MS) {
      if (crossoverThrottleTimerRef.current) {
        clearTimeout(crossoverThrottleTimerRef.current);
        crossoverThrottleTimerRef.current = null;
      }
      dispatchCrossoverFreq(rounded);
    } else if (!crossoverThrottleTimerRef.current) {
      crossoverThrottleTimerRef.current = setTimeout(() => {
        crossoverThrottleTimerRef.current = null;
        if (pendingCrossoverFreqRef.current !== null) {
          dispatchCrossoverFreq(pendingCrossoverFreqRef.current);
        }
      }, THROTTLE_INTERVAL_MS - elapsed);
    }
  }, [dispatchCrossoverFreq]);

  // ── Crossover Touch & Interaction Handlers ──
  const calcFreqFromX = useCallback((clientX: number) => {
    const track = crossoverTrackRef.current;
    if (!track) return CROSSOVER_DEFAULT_HZ;
    const rect = track.getBoundingClientRect();
    if (rect.width === 0) return CROSSOVER_DEFAULT_HZ;
    const ratio = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    const rawFreq = CROSSOVER_MIN_HZ + clamped * (CROSSOVER_MAX_HZ - CROSSOVER_MIN_HZ);
    // Step in 5 Hz increments for smooth yet discrete adjustment
    const stepped = Math.round(rawFreq / 5) * 5;
    return Math.max(CROSSOVER_MIN_HZ, Math.min(CROSSOVER_MAX_HZ, stepped));
  }, []);

  const toggleCrossover = useCallback(() => {
    const next = !crossoverEnabled;
    setCrossoverEnabled(next);
    if (isNative) {
      QobuzAudio.setCrossoverEnabled({ enabled: next }).catch(() => {});
    }
    try {
      localStorage.setItem('eq_crossover_enabled', String(next));
    } catch {}
    try {
      if (isNative) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    } catch {}
  }, [crossoverEnabled]);

  const handleCrossoverTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const now = Date.now();
    // Double tap within 300ms resets to 80 Hz
    if (now - lastCrossoverTap.current < 300) {
      setCrossoverFreq(CROSSOVER_DEFAULT_HZ);
      previousCrossoverFreq.current = CROSSOVER_DEFAULT_HZ;
      sendCrossoverFreqToNative(CROSSOVER_DEFAULT_HZ, true);
      try {
        if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      } catch {}
      return;
    }
    lastCrossoverTap.current = now;

    isDraggingCrossover.current = true;
    const freq = calcFreqFromX(e.touches[0].clientX);
    previousCrossoverFreq.current = freq;
    setCrossoverFreq(freq);
    sendCrossoverFreqToNative(freq, false);
  }, [calcFreqFromX, sendCrossoverFreqToNative]);

  const handleCrossoverTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (!isDraggingCrossover.current) return;
    const freq = calcFreqFromX(e.touches[0].clientX);

    // Haptic tick on key frequency milestones
    if (freq !== previousCrossoverFreq.current && (freq % 50 === 0 || freq === 80 || freq === 120)) {
      try {
        if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      } catch {}
    }

    previousCrossoverFreq.current = freq;
    setCrossoverFreq(freq);
    sendCrossoverFreqToNative(freq, false);
  }, [calcFreqFromX, sendCrossoverFreqToNative]);

  const handleCrossoverTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    isDraggingCrossover.current = false;
    // Immediately flush on touch release
    sendCrossoverFreqToNative(previousCrossoverFreq.current, true);
  }, [sendCrossoverFreqToNative]);

  const handleCrossoverMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const freq = calcFreqFromX(e.clientX);
    setCrossoverFreq(freq);
    previousCrossoverFreq.current = freq;
    sendCrossoverFreqToNative(freq, false);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const f = calcFreqFromX(moveEvent.clientX);
      setCrossoverFreq(f);
      previousCrossoverFreq.current = f;
      sendCrossoverFreqToNative(f, false);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      sendCrossoverFreqToNative(previousCrossoverFreq.current, true);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [calcFreqFromX, sendCrossoverFreqToNative]);

  const handleResetCrossover = useCallback(() => {
    setCrossoverFreq(CROSSOVER_DEFAULT_HZ);
    previousCrossoverFreq.current = CROSSOVER_DEFAULT_HZ;
    sendCrossoverFreqToNative(CROSSOVER_DEFAULT_HZ, true);
    try {
      if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch {}
  }, [sendCrossoverFreqToNative]);

  // ── Toggle EQ ──
  const toggleEQ = useCallback(() => {
    const newVal = !eqEnabled;
    setEqEnabled(newVal);
    if (isNative) {
      QobuzAudio.setEQEnabled({ enabled: newVal }).catch(() => {});
    }
    try {
      localStorage.setItem('eq_enabled', String(newVal));
    } catch {}
    try {
      if (isNative) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    } catch {}
  }, [eqEnabled]);

  // ── Select Preset (Does NOT clobber Pure Gain) ──
  const selectPreset = useCallback((preset: typeof PRESETS[0]) => {
    setActivePreset(preset.id);
    setGains([...preset.gains]);
    if (isNative) {
      QobuzAudio.setEQPreset({ preset: preset.id }).catch(() => {});
    }
    try {
      localStorage.setItem('eq_preset', preset.id);
      localStorage.setItem('eq_gains', JSON.stringify(preset.gains));
    } catch {}
    try {
      if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    } catch {}
  }, []);

  // ── Slider interaction handler ──
  const handleSliderChange = useCallback((band: number, newGain: number) => {
    setGains(prev => {
      const updated = [...prev];
      updated[band] = Math.round(newGain * 10) / 10;
      try {
        localStorage.setItem('eq_gains', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setActivePreset('custom');
    try {
      localStorage.setItem('eq_preset', 'custom');
    } catch {}
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
            <div className="h-20 sm:h-24 w-full mb-3 relative">
              <span className="absolute left-0 top-0 text-[9px] font-mono text-black/30 dark:text-white/25">+12</span>
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[9px] font-mono text-black/30 dark:text-white/25">0</span>
              <span className="absolute left-0 bottom-0 text-[9px] font-mono text-black/30 dark:text-white/25">-12</span>
              <canvas
                ref={curveCanvasRef}
                className="w-full h-full"
                style={{ display: 'block' }}
              />
            </div>

            {/* ── Pure Gain (Ganancia Pura • Pre-amp) ── */}
            <div className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] rounded-2xl p-2.5 mb-2.5 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className={`w-3.5 h-3.5 transition-colors duration-200 ${
                    pureGain !== 0 && eqEnabled ? 'text-amber-400' : 'text-black/40 dark:text-white/40'
                  }`} />
                  <span className="text-xs font-bold tracking-tight text-black dark:text-white">
                    Ganancia Pura
                  </span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-black/50 dark:text-white/40 tracking-wider">
                    Pre-amp
                  </span>
                  {pureGain > 0 && eqEnabled && (
                    <span className="text-[9px] font-medium text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                      • Limiter
                    </span>
                  )}
                </div>
                
                {/* Formatted dB display & Reset button */}
                <button
                  type="button"
                  onClick={handleResetPureGain}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
                  title="Toca para reiniciar a 0.0 dB"
                >
                  <span className={`text-xs font-bold tabular-nums font-mono transition-colors duration-200 ${
                    pureGain !== 0 && eqEnabled ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40'
                  }`}>
                    {pureGain > 0 ? `+${pureGain.toFixed(1)}` : pureGain.toFixed(1)} dB
                  </span>
                </button>
              </div>

              {/* Bidirectional Slider Track */}
              <div
                ref={pureGainTrackRef}
                className="relative h-6 flex items-center cursor-pointer select-none"
                style={{ touchAction: 'none' }}
                onTouchStart={handlePureGainTouchStart}
                onTouchMove={handlePureGainTouchMove}
                onTouchEnd={handlePureGainTouchEnd}
                onMouseDown={handlePureGainMouseDown}
              >
                {/* Rail */}
                <div className="relative w-full h-2 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                  {/* Zero Center Divider Notch */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] -translate-x-1/2 bg-black/25 dark:bg-white/30 z-10" />

                  {/* Fill from Center (Bidirectional) */}
                  <div
                    className="absolute top-0 bottom-0 rounded-full transition-all duration-75"
                    style={{
                      left: pureGain >= 0 ? '50%' : `${((pureGain - DB_MIN) / (DB_MAX - DB_MIN)) * 100}%`,
                      width: `${(Math.abs(pureGain) / (DB_MAX - DB_MIN)) * 100}%`,
                      backgroundColor: eqEnabled ? (pureGain !== 0 ? accent : 'transparent') : 'transparent',
                      opacity: eqEnabled ? 0.85 : 0.3
                    }}
                  />
                </div>

                {/* Draggable Thumb */}
                <div
                  className="absolute top-1/2 w-4 h-4 rounded-full shadow-md -translate-y-1/2 -translate-x-1/2 transition-transform duration-75 pointer-events-none"
                  style={{
                    left: `${((pureGain - DB_MIN) / (DB_MAX - DB_MIN)) * 100}%`,
                    backgroundColor: eqEnabled ? accent : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)'),
                  }}
                />
              </div>

              {/* Scale Labels */}
              <div className="flex justify-between text-[9px] font-mono text-black/30 dark:text-white/25 mt-1 px-1">
                <span>-12 dB</span>
                <span className="text-black/50 dark:text-white/45 font-bold">0 dB</span>
                <span>+12 dB</span>
              </div>
            </div>

            {/* ── Crossover (Paso Alto • High-Pass Filter) ── */}
            <div className="bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] rounded-2xl p-2.5 mb-2.5 backdrop-blur-md">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Filter className={`w-3.5 h-3.5 transition-colors duration-200 ${
                    crossoverEnabled && eqEnabled ? 'text-cyan-400' : 'text-black/40 dark:text-white/40'
                  }`} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold tracking-tight text-black dark:text-white">
                        Crossover
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-black/50 dark:text-white/40 tracking-wider">
                        Paso Alto (HPF)
                      </span>
                      {crossoverEnabled && eqEnabled && (
                        <span className="text-[9px] font-medium text-cyan-500 dark:text-cyan-400 flex items-center gap-1">
                          • 12 dB/oct
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-black/40 dark:text-white/35 block leading-tight">
                      Protección de satélites RCA
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Cutoff frequency readout & tactile reset */}
                  <button
                    type="button"
                    onClick={handleResetCrossover}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
                    title="Toca para reiniciar a 80 Hz"
                  >
                    <span className={`text-xs font-bold tabular-nums font-mono transition-colors duration-200 ${
                      crossoverEnabled && eqEnabled ? 'text-cyan-500 dark:text-cyan-400' : 'text-black/40 dark:text-white/40'
                    }`}>
                      {crossoverFreq} Hz
                    </span>
                  </button>

                  {/* iOS Toggle Switch */}
                  <button
                    type="button"
                    onClick={toggleCrossover}
                    className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                      crossoverEnabled
                        ? (eqEnabled ? 'bg-cyan-500 justify-end' : 'bg-black/30 dark:bg-white/30 justify-end')
                        : 'bg-black/15 dark:bg-white/15 justify-start'
                    }`}
                    title={crossoverEnabled ? "Desactivar Crossover" : "Activar Crossover"}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-white shadow-sm block" />
                  </button>
                </div>
              </div>

              {/* Slider Track */}
              <div
                ref={crossoverTrackRef}
                className="relative h-6 flex items-center cursor-pointer select-none"
                style={{ touchAction: 'none' }}
                onTouchStart={handleCrossoverTouchStart}
                onTouchMove={handleCrossoverTouchMove}
                onTouchEnd={handleCrossoverTouchEnd}
                onMouseDown={handleCrossoverMouseDown}
              >
                {/* Rail */}
                <div className="relative w-full h-2 rounded-full overflow-hidden bg-black/10 dark:bg-white/10">
                  {/* Active Fill from 80Hz (left) */}
                  <div
                    className="absolute top-0 bottom-0 left-0 rounded-full transition-all duration-75"
                    style={{
                      width: `${((crossoverFreq - CROSSOVER_MIN_HZ) / (CROSSOVER_MAX_HZ - CROSSOVER_MIN_HZ)) * 100}%`,
                      backgroundColor: crossoverEnabled && eqEnabled ? '#06b6d4' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                      opacity: crossoverEnabled && eqEnabled ? 0.9 : 0.4
                    }}
                  />
                </div>

                {/* Draggable Thumb */}
                <div
                  className="absolute top-1/2 w-4 h-4 rounded-full shadow-md -translate-y-1/2 -translate-x-1/2 transition-transform duration-75 pointer-events-none"
                  style={{
                    left: `${((crossoverFreq - CROSSOVER_MIN_HZ) / (CROSSOVER_MAX_HZ - CROSSOVER_MIN_HZ)) * 100}%`,
                    backgroundColor: crossoverEnabled && eqEnabled ? '#06b6d4' : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'),
                  }}
                />
              </div>

              {/* Scale Reference Labels */}
              <div className="flex justify-between text-[9px] font-mono text-black/30 dark:text-white/25 mt-0.5 px-1">
                <span className={crossoverFreq === 80 && crossoverEnabled && eqEnabled ? 'text-cyan-500 font-bold' : ''}>80 Hz (Satélites)</span>
                <span>120 Hz</span>
                <span>180 Hz</span>
                <span className={crossoverFreq === 250 && crossoverEnabled && eqEnabled ? 'text-cyan-500 font-bold' : ''}>250 Hz</span>
              </div>
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
