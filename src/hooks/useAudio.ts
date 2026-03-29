"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getAudioEngine, type SfxName } from "@/lib/audio-engine";

// 外部 store 订阅机制（让 React 响应 muted 状态变化）
let _listeners: (() => void)[] = [];
let _snapshot = true; // 默认静音

function subscribe(cb: () => void) {
  _listeners.push(cb);
  return () => { _listeners = _listeners.filter(l => l !== cb); };
}

function getSnapshot() { return _snapshot; }
function getServerSnapshot() { return true; } // SSR 默认静音

function notifyMuteChange(muted: boolean) {
  _snapshot = muted;
  for (const l of _listeners) l();
}

// 初始化（客户端）
if (typeof window !== "undefined") {
  _snapshot = getAudioEngine().muted;
}

/** 音频控制 Hook */
export function useAudio() {
  const muted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleMute = useCallback(() => {
    const engine = getAudioEngine();
    const newMuted = engine.toggleMute();
    notifyMuteChange(newMuted);
  }, []);

  const playSfx = useCallback((name: SfxName) => {
    getAudioEngine().playSfx(name);
  }, []);

  const playBgm = useCallback((scene: string) => {
    getAudioEngine().playBgm(scene);
  }, []);

  const stopBgm = useCallback(() => {
    getAudioEngine().stopBgm();
  }, []);

  const setBgmVolume = useCallback((v: number) => {
    getAudioEngine().setBgmVolume(v);
  }, []);

  return { muted, toggleMute, playSfx, playBgm, stopBgm, setBgmVolume };
}
