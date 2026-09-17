import React from 'react';
import { useLocalImage } from '../lib/useLocalImage';

export function OfflineImage({ localPath, remoteUrl, className, alt, ...props }: any) {
  const src = useLocalImage(localPath, remoteUrl);
  return <img src={src || ""} alt={alt} className={className} {...props} />;
}
