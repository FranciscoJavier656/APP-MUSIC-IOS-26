const fs = require('fs');
let code = fs.readFileSync('src/components/PlayerContext.tsx', 'utf8');

const injection = `
    let audioCtx: any = null;
    let analyserNode: any = null;
    let animationFrameId: number;
    let sourceNode: any = null;

    if (!Capacitor.isNativePlatform()) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx = new AudioContextClass();
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;
        
        sourceNode = audioCtx.createMediaElementSource(audio);
        sourceNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);
        
        const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
        
        const dispatchFft = () => {
          if (!audio.paused && analyserNode) {
            analyserNode.getByteFrequencyData(dataArray);
            window.dispatchEvent(new CustomEvent('fft_data', { detail: { data: Array.from(dataArray) } }));
          }
          animationFrameId = requestAnimationFrame(dispatchFft);
        };
        dispatchFft();

        audio.addEventListener('play', () => {
          if (audioCtx?.state === 'suspended') {
            audioCtx.resume();
          }
        });
      } catch (e) {
        console.warn("Web Audio API FFT failed", e);
      }
    }

    const updateTime = () => {};
`;

code = code.replace(/const updateTime = \(\) => \{\};/, injection);
fs.writeFileSync('src/components/PlayerContext.tsx', code);
console.log('done');
