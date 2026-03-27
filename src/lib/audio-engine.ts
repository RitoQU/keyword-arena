/**
 * 8-bit 像素风格音频引擎
 * 使用 Web Audio API 程序化生成 chiptune 音效和 BGM
 * 零外部依赖，零音频文件
 */

// ─── 音符频率表（C3-C6）───
const NOTE: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50,
};

// ─── 类型定义 ───
type WaveType = "square" | "sawtooth" | "triangle";

interface NoteEvent {
  freq: number;
  duration: number; // 秒
  wave?: WaveType;
  volume?: number;  // 0-1
}

interface BgmPattern {
  bpm: number;
  melody: NoteEvent[];
  bass?: NoteEvent[];
}

// ─── BGM 曲谱定义 ───
const BGM_PATTERNS: Record<string, BgmPattern> = {
  // 首页/登录：轻快 chiptune
  home: {
    bpm: 120,
    melody: [
      { freq: NOTE.E4, duration: 0.25 }, { freq: NOTE.G4, duration: 0.25 },
      { freq: NOTE.A4, duration: 0.25 }, { freq: NOTE.B4, duration: 0.25 },
      { freq: NOTE.A4, duration: 0.25 }, { freq: NOTE.G4, duration: 0.25 },
      { freq: NOTE.E4, duration: 0.5 },
      { freq: NOTE.D4, duration: 0.25 }, { freq: NOTE.E4, duration: 0.25 },
      { freq: NOTE.G4, duration: 0.25 }, { freq: NOTE.A4, duration: 0.25 },
      { freq: NOTE.G4, duration: 0.25 }, { freq: NOTE.E4, duration: 0.25 },
      { freq: NOTE.D4, duration: 0.5 },
      { freq: NOTE.C4, duration: 0.25 }, { freq: NOTE.D4, duration: 0.25 },
      { freq: NOTE.E4, duration: 0.5 },
      { freq: NOTE.G4, duration: 0.25 }, { freq: NOTE.A4, duration: 0.25 },
      { freq: NOTE.G4, duration: 0.5 },
    ],
    bass: [
      { freq: NOTE.C3, duration: 0.5, wave: "triangle" }, { freq: NOTE.C3, duration: 0.5, wave: "triangle" },
      { freq: NOTE.G3, duration: 0.5, wave: "triangle" }, { freq: NOTE.G3, duration: 0.5, wave: "triangle" },
      { freq: NOTE.A3, duration: 0.5, wave: "triangle" }, { freq: NOTE.A3, duration: 0.5, wave: "triangle" },
      { freq: NOTE.G3, duration: 1.0, wave: "triangle" },
      { freq: NOTE.F3, duration: 0.5, wave: "triangle" }, { freq: NOTE.F3, duration: 0.5, wave: "triangle" },
      { freq: NOTE.C3, duration: 0.5, wave: "triangle" }, { freq: NOTE.C3, duration: 0.5, wave: "triangle" },
    ],
  },

  // 角色锻造：神秘氛围
  forge: {
    bpm: 80,
    melody: [
      { freq: NOTE.E4, duration: 0.5, wave: "triangle" },
      { freq: NOTE.G4, duration: 0.5, wave: "triangle" },
      { freq: NOTE.B4, duration: 0.75, wave: "triangle" },
      { freq: NOTE.A4, duration: 0.25, wave: "triangle" },
      { freq: NOTE.G4, duration: 0.5, wave: "triangle" },
      { freq: NOTE.F4, duration: 0.25, wave: "triangle" },
      { freq: NOTE.E4, duration: 0.75, wave: "triangle" },
      { freq: 0, duration: 0.5 }, // 休止
      { freq: NOTE.D4, duration: 0.5, wave: "triangle" },
      { freq: NOTE.E4, duration: 0.5, wave: "triangle" },
      { freq: NOTE.G4, duration: 0.75, wave: "triangle" },
      { freq: NOTE.A4, duration: 0.5, wave: "triangle" },
      { freq: NOTE.E4, duration: 0.75, wave: "triangle" },
    ],
    bass: [
      { freq: NOTE.E3, duration: 1.0, wave: "triangle" },
      { freq: NOTE.G3, duration: 1.0, wave: "triangle" },
      { freq: NOTE.A3, duration: 1.0, wave: "triangle" },
      { freq: NOTE.E3, duration: 1.0, wave: "triangle" },
      { freq: NOTE.D3, duration: 1.0, wave: "triangle" },
      { freq: NOTE.C3, duration: 1.0, wave: "triangle" },
      { freq: NOTE.E3, duration: 1.0, wave: "triangle" },
    ],
  },

  // 战斗：紧张快节奏
  battle: {
    bpm: 160,
    melody: [
      { freq: NOTE.A4, duration: 0.125 }, { freq: NOTE.A4, duration: 0.125 },
      { freq: NOTE.C5, duration: 0.125 }, { freq: NOTE.A4, duration: 0.125 },
      { freq: NOTE.E5, duration: 0.25 }, { freq: NOTE.D5, duration: 0.25 },
      { freq: NOTE.C5, duration: 0.125 }, { freq: NOTE.A4, duration: 0.125 },
      { freq: NOTE.G4, duration: 0.125 }, { freq: NOTE.A4, duration: 0.125 },
      { freq: NOTE.C5, duration: 0.25 }, { freq: NOTE.A4, duration: 0.25 },
      { freq: NOTE.G4, duration: 0.25 }, { freq: NOTE.E4, duration: 0.25 },
      { freq: NOTE.A4, duration: 0.125 }, { freq: NOTE.A4, duration: 0.125 },
      { freq: NOTE.C5, duration: 0.125 }, { freq: NOTE.D5, duration: 0.125 },
      { freq: NOTE.E5, duration: 0.25 }, { freq: NOTE.C5, duration: 0.25 },
      { freq: NOTE.A4, duration: 0.25 }, { freq: NOTE.G4, duration: 0.125 },
      { freq: NOTE.A4, duration: 0.375 },
    ],
    bass: [
      { freq: NOTE.A3, duration: 0.25, wave: "sawtooth" }, { freq: NOTE.A3, duration: 0.25, wave: "sawtooth" },
      { freq: NOTE.C3, duration: 0.25, wave: "sawtooth" }, { freq: NOTE.C3, duration: 0.25, wave: "sawtooth" },
      { freq: NOTE.D3, duration: 0.25, wave: "sawtooth" }, { freq: NOTE.D3, duration: 0.25, wave: "sawtooth" },
      { freq: NOTE.E3, duration: 0.5, wave: "sawtooth" },
      { freq: NOTE.A3, duration: 0.25, wave: "sawtooth" }, { freq: NOTE.A3, duration: 0.25, wave: "sawtooth" },
      { freq: NOTE.G3, duration: 0.25, wave: "sawtooth" }, { freq: NOTE.E3, duration: 0.25, wave: "sawtooth" },
      { freq: NOTE.A3, duration: 0.5, wave: "sawtooth" },
    ],
  },
};

// ─── 音效定义 ───
type SfxName = "attack" | "crit" | "miss" | "skill" | "item" | "victory" | "defeat" | "click" | "intro" | "death";

const SFX_DEFS: Record<SfxName, NoteEvent[]> = {
  attack: [
    { freq: 300, duration: 0.04, wave: "sawtooth", volume: 0.4 },
    { freq: 500, duration: 0.03, wave: "square", volume: 0.3 },
    { freq: 200, duration: 0.05, wave: "sawtooth", volume: 0.2 },
  ],
  crit: [
    { freq: 400, duration: 0.03, wave: "square", volume: 0.5 },
    { freq: 800, duration: 0.04, wave: "square", volume: 0.5 },
    { freq: 1200, duration: 0.06, wave: "square", volume: 0.4 },
    { freq: 1600, duration: 0.08, wave: "sawtooth", volume: 0.3 },
  ],
  miss: [
    { freq: 600, duration: 0.06, wave: "triangle", volume: 0.2 },
    { freq: 400, duration: 0.08, wave: "triangle", volume: 0.15 },
    { freq: 200, duration: 0.1, wave: "triangle", volume: 0.1 },
  ],
  skill: [
    { freq: NOTE.C5, duration: 0.06, wave: "square", volume: 0.3 },
    { freq: NOTE.E5, duration: 0.06, wave: "square", volume: 0.35 },
    { freq: NOTE.G5, duration: 0.06, wave: "square", volume: 0.4 },
    { freq: NOTE.C6, duration: 0.1, wave: "square", volume: 0.35 },
  ],
  item: [
    { freq: NOTE.G4, duration: 0.08, wave: "triangle", volume: 0.3 },
    { freq: NOTE.B4, duration: 0.08, wave: "triangle", volume: 0.3 },
    { freq: NOTE.D5, duration: 0.1, wave: "triangle", volume: 0.35 },
  ],
  victory: [
    { freq: NOTE.C5, duration: 0.15, wave: "square", volume: 0.4 },
    { freq: NOTE.E5, duration: 0.15, wave: "square", volume: 0.4 },
    { freq: NOTE.G5, duration: 0.15, wave: "square", volume: 0.4 },
    { freq: NOTE.C6, duration: 0.3, wave: "square", volume: 0.45 },
    { freq: 0, duration: 0.1 },
    { freq: NOTE.G5, duration: 0.1, wave: "square", volume: 0.35 },
    { freq: NOTE.C6, duration: 0.4, wave: "square", volume: 0.5 },
  ],
  defeat: [
    { freq: NOTE.E4, duration: 0.2, wave: "triangle", volume: 0.35 },
    { freq: NOTE.D4, duration: 0.2, wave: "triangle", volume: 0.3 },
    { freq: NOTE.C4, duration: 0.3, wave: "triangle", volume: 0.25 },
    { freq: NOTE.B3, duration: 0.5, wave: "triangle", volume: 0.2 },
  ],
  click: [
    { freq: 1000, duration: 0.03, wave: "square", volume: 0.15 },
    { freq: 1400, duration: 0.02, wave: "square", volume: 0.1 },
  ],
  intro: [
    { freq: NOTE.C4, duration: 0.15, wave: "square", volume: 0.3 },
    { freq: NOTE.E4, duration: 0.15, wave: "square", volume: 0.3 },
    { freq: NOTE.G4, duration: 0.2, wave: "square", volume: 0.35 },
  ],
  death: [
    { freq: 300, duration: 0.1, wave: "sawtooth", volume: 0.4 },
    { freq: 200, duration: 0.15, wave: "sawtooth", volume: 0.3 },
    { freq: 100, duration: 0.2, wave: "sawtooth", volume: 0.2 },
    { freq: 50, duration: 0.3, wave: "sawtooth", volume: 0.1 },
  ],
};

// ─── 音频引擎单例 ───
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private bgmNodes: OscillatorNode[] = [];
  private bgmGainNodes: GainNode[] = [];
  private bgmTimers: ReturnType<typeof setTimeout>[] = [];
  private currentBgm: string | null = null;
  private bgmLoopTimer: ReturnType<typeof setTimeout> | null = null;

  private _muted = true; // 默认静音
  private _bgmVolume = 0.3;
  private _sfxVolume = 0.5;

  constructor() {
    if (typeof window !== "undefined") {
      this._muted = localStorage.getItem("audio_muted") !== "false";
      this._bgmVolume = parseFloat(localStorage.getItem("audio_bgm_vol") || "0.3");
      this._sfxVolume = parseFloat(localStorage.getItem("audio_sfx_vol") || "0.5");
    }
  }

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._muted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this._bgmVolume;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this._sfxVolume;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // ─── 音效播放 ───
  playSfx(name: SfxName) {
    if (this._muted) return;
    const notes = SFX_DEFS[name];
    if (!notes) return;

    const ctx = this.ensureContext();
    let offset = ctx.currentTime;

    for (const note of notes) {
      if (note.freq <= 0) {
        offset += note.duration;
        continue;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = note.wave || "square";
      osc.frequency.value = note.freq;
      gain.gain.setValueAtTime(note.volume ?? 0.3, offset);
      gain.gain.exponentialRampToValueAtTime(0.001, offset + note.duration);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(offset);
      osc.stop(offset + note.duration + 0.01);
      offset += note.duration;
    }
  }

  // ─── BGM 播放 ───
  playBgm(scene: string) {
    if (scene === this.currentBgm) return;
    this.stopBgm();
    this.currentBgm = scene;
    if (this._muted) return;
    this._startBgmLoop(scene);
  }

  private _startBgmLoop(scene: string) {
    const pattern = BGM_PATTERNS[scene];
    if (!pattern) return;

    const ctx = this.ensureContext();
    const loopDuration = this._schedulePattern(ctx, pattern);

    // 循环播放
    this.bgmLoopTimer = setTimeout(() => {
      if (this.currentBgm === scene) {
        this._cleanupBgmNodes();
        this._startBgmLoop(scene);
      }
    }, loopDuration * 1000);
  }

  private _schedulePattern(ctx: AudioContext, pattern: BgmPattern): number {
    const now = ctx.currentTime + 0.05; // 小延迟避免爆音
    let melodyDur = 0;
    let bassDur = 0;

    // 旋律声部
    let offset = now;
    for (const note of pattern.melody) {
      if (note.freq > 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = note.wave || "square";
        osc.frequency.value = note.freq;
        const vol = (note.volume ?? 0.25) * this._bgmVolume;
        gain.gain.setValueAtTime(vol, offset);
        gain.gain.setValueAtTime(vol * 0.8, offset + note.duration * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, offset + note.duration);
        osc.connect(gain);
        gain.connect(this.bgmGain!);
        osc.start(offset);
        osc.stop(offset + note.duration + 0.01);
        this.bgmNodes.push(osc);
        this.bgmGainNodes.push(gain);
      }
      offset += note.duration;
      melodyDur += note.duration;
    }

    // 低音声部
    if (pattern.bass) {
      offset = now;
      for (const note of pattern.bass) {
        if (note.freq > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = note.wave || "triangle";
          osc.frequency.value = note.freq;
          const vol = (note.volume ?? 0.15) * this._bgmVolume;
          gain.gain.setValueAtTime(vol, offset);
          gain.gain.setValueAtTime(vol * 0.7, offset + note.duration * 0.7);
          gain.gain.exponentialRampToValueAtTime(0.001, offset + note.duration);
          osc.connect(gain);
          gain.connect(this.bgmGain!);
          osc.start(offset);
          osc.stop(offset + note.duration + 0.01);
          this.bgmNodes.push(osc);
          this.bgmGainNodes.push(gain);
        }
        offset += note.duration;
        bassDur += note.duration;
      }
    }

    return Math.max(melodyDur, bassDur);
  }

  stopBgm() {
    this._cleanupBgmNodes();
    if (this.bgmLoopTimer) {
      clearTimeout(this.bgmLoopTimer);
      this.bgmLoopTimer = null;
    }
    this.currentBgm = null;
  }

  private _cleanupBgmNodes() {
    for (const osc of this.bgmNodes) {
      try { osc.stop(); } catch { /* already stopped */ }
    }
    this.bgmNodes = [];
    this.bgmGainNodes = [];
    for (const t of this.bgmTimers) clearTimeout(t);
    this.bgmTimers = [];
  }

  // ─── 音量控制 ───
  get muted() { return this._muted; }

  toggleMute(): boolean {
    this._muted = !this._muted;
    localStorage.setItem("audio_muted", this._muted ? "true" : "false");

    if (this.masterGain) {
      this.masterGain.gain.value = this._muted ? 0 : 1;
    }

    // 静音时停止 BGM 节点，取消静音时恢复
    if (this._muted) {
      this._cleanupBgmNodes();
      if (this.bgmLoopTimer) {
        clearTimeout(this.bgmLoopTimer);
        this.bgmLoopTimer = null;
      }
    } else if (this.currentBgm) {
      this._startBgmLoop(this.currentBgm);
    }

    return this._muted;
  }

  setBgmVolume(v: number) {
    this._bgmVolume = Math.max(0, Math.min(1, v));
    localStorage.setItem("audio_bgm_vol", String(this._bgmVolume));
    if (this.bgmGain) this.bgmGain.gain.value = this._bgmVolume;
  }

  setSfxVolume(v: number) {
    this._sfxVolume = Math.max(0, Math.min(1, v));
    localStorage.setItem("audio_sfx_vol", String(this._sfxVolume));
    if (this.sfxGain) this.sfxGain.gain.value = this._sfxVolume;
  }

  get bgmVolume() { return this._bgmVolume; }
  get sfxVolume() { return this._sfxVolume; }
}

// 全局单例
let _engine: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!_engine) {
    _engine = new AudioEngine();
  }
  return _engine;
}

export type { SfxName };
