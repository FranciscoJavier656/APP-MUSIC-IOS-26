import { registerPlugin } from '@capacitor/core';

export interface QobuzAudioPlugin {
  play(options: { url: string }): Promise<void>;
  pause(): Promise<void>;
  embedLyrics(options: { path: string, lyrics: string }): Promise<void>;
  setupRemoteControls(): Promise<void>;
  updateMetadata(options: { title: string, artist?: string, album?: string, coverUrl?: string, duration?: number }): Promise<void>;
  resume(): Promise<void>;
  seek(options: { time: number }): Promise<void>;
  addListener(eventName: 'onFftData', listenerFunc: (info: { data: number[] }) => void): any;
  addListener(eventName: 'onTimeUpdate', listenerFunc: (info: { currentTime: number, duration: number }) => void): any;
  addListener(eventName: 'onEnded', listenerFunc: () => void): any;
  addListener(eventName: 'onRemotePlay', listenerFunc: () => void): any;
  addListener(eventName: 'onRemotePause', listenerFunc: () => void): any;
  addListener(eventName: 'onRemoteNext', listenerFunc: () => void): any;
  addListener(eventName: 'onRemotePrev', listenerFunc: () => void): any;
  addListener(eventName: 'onRemoteSeek', listenerFunc: (info: { time: number }) => void): any;
  addListener(eventName: 'onDebugLog', listenerFunc: (info: { message: string }) => void): any;
}

export const QobuzAudio = registerPlugin<QobuzAudioPlugin>('QobuzAudio');
