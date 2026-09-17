const fs = require('fs');
let code = fs.readFileSync('src/lib/DownloadManager.ts', 'utf8');

const targetCatch = `    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('download_error', { detail: { trackId, error: e.message || 'Error nativo' } }));
      delete downloadMap[url];
      throw e;
    }`;

const replaceCatch = `    } catch (e: any) {
      let errorMsg = e.message || 'Error nativo';
      const msgLower = errorMsg.toLowerCase();
      if (msgLower.includes('space') || msgLower.includes('quota') || msgLower.includes('full')) {
        errorMsg = "Almacenamiento lleno. Por favor, libera espacio.";
      }
      window.dispatchEvent(new CustomEvent('download_error', { detail: { trackId, error: errorMsg } }));
      delete downloadMap[url];
      throw e;
    }`;

code = code.replace(targetCatch, replaceCatch);
fs.writeFileSync('src/lib/DownloadManager.ts', code);
