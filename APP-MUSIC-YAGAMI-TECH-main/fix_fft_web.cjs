const fs = require('fs');
let code = fs.readFileSync('src/components/ExpandedPlayer.tsx', 'utf8');

const injection = `
      if (Capacitor.isNativePlatform()) {
        listener = await QobuzAudio.addListener('onFftData', (info) => {
         if (canvasRef.current && info.data) {
            (canvasRef.current as any).nativeFftData = info.data;
         }
      });
      } else {
        const webListener = (e: any) => {
          if (canvasRef.current && e.detail.data) {
             (canvasRef.current as any).nativeFftData = e.detail.data;
          }
        };
        window.addEventListener('fft_data', webListener);
        listener = { remove: () => window.removeEventListener('fft_data', webListener) };
      }
`;

code = code.replace(/if \(Capacitor\.isNativePlatform\(\)\) \{[\s\S]+?\}\s+?\}\;/m, injection + '\n    };');
fs.writeFileSync('src/components/ExpandedPlayer.tsx', code);
console.log('done');
