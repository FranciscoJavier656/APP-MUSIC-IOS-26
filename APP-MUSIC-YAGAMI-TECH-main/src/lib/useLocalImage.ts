import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

export function useLocalImage(localPath?: string, remoteUrl?: string) {
  const [src, setSrc] = useState<string | undefined>(remoteUrl);

  useEffect(() => {
    let mounted = true;
    if (Capacitor.isNativePlatform() && localPath) {
      Filesystem.getUri({
        directory: Directory.Data,
        path: localPath.replace('file://', '')
      }).then(res => {
        if (mounted) setSrc(Capacitor.convertFileSrc(res.uri));
      }).catch(e => {
        console.warn("Could not get local image URI", e);
        if (mounted) setSrc(remoteUrl);
      });
    } else {
      setSrc(remoteUrl);
    }
    return () => { mounted = false; };
  }, [localPath, remoteUrl]);

  return src;
}
