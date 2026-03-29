/**
 * 8-bit 像素风格音频引擎 v2
 * BGM: 外部 CC0 音频文件（HTMLAudioElement 循环播放）
 * SFX: 程序化 Web Audio API，每类 2-3 个变体随机播放
 *
 * BGM 来源（均为 CC0）：
 * - home.ogg: "Flowerbed Fields" by Zane Little Music (OpenGameArt)
 * - forge.mp3: "[Chiptune] Medieval: The Old Tower Inn" by RandomMind (OpenGameArt)
 * - battle.ogg: "8-Bit Battle Loop" by Wolfgang_ (OpenGameArt)
 */

// ─── BGM 文件映射 ───
const BGM_FILES: Record<string, string> = {
  home: "/audio/home.ogg",
  forge: "/audio/forge.mp3",
  battle: "/audio/battle.ogg",
};

// ─── SFX 类型 ───
type SfxName =
  | "attack" | "crit" | "miss" | "skill" | "item"
  | "victory" | "defeat" | "click" | "intro" | "death"
  | "chime";

interface NoteEvent {
  freq: number;
  duration: number;
  wave?: OscillatorType;
  volume?: number;
}

// ─── SFX 变体定义（每类 1-3 个变体，播放时随机选取）───
const SFX_VARIANTS: Record<SfxName, NoteEvent[][]> = {
  attack: [
    // V1: DQ 风格短促下行
    [
      { freq: 300, duration: 0.04, wave: "sawtooth", volume: 0.4 },
      { freq: 500, duration: 0.03, wave: "square", volume: 0.3 },
      { freq: 200, duration: 0.05, wave: "sawtooth", volume: 0.2 },
    ],
    // V2: 利刃斩击
    [
      { freq: 800, duration: 0.02, wave: "sawtooth", volume: 0.35 },
      { freq: 400, duration: 0.04, wave: "sawtooth", volume: 0.3 },
      { freq: 150, duration: 0.06, wave: "sawtooth", volume: 0.2 },
    ],
    // V3: 重锤打击
    [
      { freq: 200, duration: 0.03, wave: "square", volume: 0.4 },
      { freq: 350, duration: 0.03, wave: "sawtooth", volume: 0.35 },
      { freq: 120, duration: 0.08, wave: "square", volume: 0.25 },
    ],
  ],

  crit: [
    // V1: 上行闪光爆发
    [
      { freq: 400, duration: 0.03, wave: "square", volume: 0.5 },
      { freq: 800, duration: 0.04, wave: "square", volume: 0.5 },
      { freq: 1200, duration: 0.06, wave: "square", volume: 0.4 },
      { freq: 1600, duration: 0.08, wave: "sawtooth", volume: 0.3 },
    ],
    // V2: 双重打击
    [
      { freq: 600, duration: 0.03, wave: "sawtooth", volume: 0.45 },
      { freq: 1000, duration: 0.03, wave: "square", volume: 0.5 },
      { freq: 500, duration: 0.02, wave: "sawtooth", volume: 0.3 },
      { freq: 1400, duration: 0.08, wave: "square", volume: 0.4 },
    ],
  ],

  miss: [
    // V1: 柔和下行滑音
    [
      { freq: 600, duration: 0.06, wave: "triangle", volume: 0.2 },
      { freq: 400, duration: 0.08, wave: "triangle", volume: 0.15 },
      { freq: 200, duration: 0.1, wave: "triangle", volume: 0.1 },
    ],
    // V2: 快速闪身
    [
      { freq: 500, duration: 0.05, wave: "triangle", volume: 0.18 },
      { freq: 350, duration: 0.06, wave: "triangle", volume: 0.12 },
      { freq: 250, duration: 0.08, wave: "triangle", volume: 0.08 },
    ],
  ],

  skill: [
    // V1: 大三和弦 fanfare
    [
      { freq: 523.25, duration: 0.06, wave: "square", volume: 0.3 },
      { freq: 659.25, duration: 0.06, wave: "square", volume: 0.35 },
      { freq: 783.99, duration: 0.06, wave: "square", volume: 0.4 },
      { freq: 1046.5, duration: 0.1, wave: "square", volume: 0.35 },
    ],
    // V2: 力量和弦冲击
    [
      { freq: 440, duration: 0.05, wave: "square", volume: 0.3 },
      { freq: 587.33, duration: 0.05, wave: "square", volume: 0.35 },
      { freq: 880, duration: 0.08, wave: "square", volume: 0.4 },
      { freq: 1046.5, duration: 0.1, wave: "sawtooth", volume: 0.3 },
    ],
  ],

  item: [
    [
      { freq: 392, duration: 0.08, wave: "triangle", volume: 0.3 },
      { freq: 493.88, duration: 0.08, wave: "triangle", volume: 0.3 },
      { freq: 587.33, duration: 0.1, wave: "triangle", volume: 0.35 },
    ],
  ],

  victory: [
    // DQ 胜利 fanfare（上行大三和弦）
    [
      { freq: 523.25, duration: 0.15, wave: "square", volume: 0.4 },
      { freq: 659.25, duration: 0.15, wave: "square", volume: 0.4 },
      { freq: 783.99, duration: 0.15, wave: "square", volume: 0.4 },
      { freq: 1046.5, duration: 0.3, wave: "square", volume: 0.45 },
      { freq: 0, duration: 0.1 },
      { freq: 783.99, duration: 0.1, wave: "square", volume: 0.35 },
      { freq: 1046.5, duration: 0.4, wave: "square", volume: 0.5 },
    ],
  ],

  defeat: [
    // 下行小调终止
    [
      { freq: 329.63, duration: 0.2, wave: "triangle", volume: 0.35 },
      { freq: 293.66, duration: 0.2, wave: "triangle", volume: 0.3 },
      { freq: 261.63, duration: 0.3, wave: "triangle", volume: 0.25 },
      { freq: 246.94, duration: 0.5, wave: "triangle", volume: 0.2 },
    ],
  ],

  click: [
    [
      { freq: 1000, duration: 0.03, wave: "square", volume: 0.15 },
      { freq: 1400, duration: 0.02, wave: "square", volume: 0.1 },
    ],
  ],

  intro: [
    [
      { freq: 261.63, duration: 0.15, wave: "square", volume: 0.3 },
      { freq: 329.63, duration: 0.15, wave: "square", volume: 0.3 },
      { freq: 392, duration: 0.2, wave: "square", volume: 0.35 },
    ],
  ],

  death: [
    // 低频衰减
    [
      { freq: 300, duration: 0.1, wave: "sawtooth", volume: 0.4 },
      { freq: 200, duration: 0.15, wave: "sawtooth", volume: 0.3 },
      { freq: 100, duration: 0.2, wave: "sawtooth", volume: 0.2 },
      { freq: 50, duration: 0.3, wave: "sawtooth", volume: 0.1 },
    ],
  ],

  chime: [
    // 开机音 — 首次取消静音时播放
    [
      { freq: 783.99, duration: 0.08, wave: "triangle", volume: 0.3 },
      { freq: 1046.5, duration: 0.12, wave: "triangle", volume: 0.35 },
    ],
  ],
};

// ─── 音频引擎单例 ───
class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;

  private bgmAudio: HTMLAudioElement | null = null;
  private currentBgm: string | null = null;

  private _muted = true; // 默认静音
  private _bgmVolume = 0.3;
  private _sfxVolume = 0.5;

  constructor() {
    if (typeof window !== "undefined") {
      // 始终默认静音，避免浏览器 Autoplay Policy 导致图标与实际状态不一致
      this._muted = true;
      this._bgmVolume = parseFloat(localStorage.getItem("audio_bgm_vol") || "0.3");
      this._sfxVolume = parseFloat(localStorage.getItem("audio_sfx_vol") || "0.5");

      // 手机切后台再回来时，AudioContext 会被系统挂起，需要自动恢复
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && !this._muted) {
          // 恢复 AudioContext
          if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
          }
          // 恢复 BGM（HTMLAudioElement 可能被系统 pause）
          if (this.bgmAudio && this.bgmAudio.paused && this.currentBgm) {
            this.bgmAudio.play().catch(() => {});
          }
        }
      });
    }
  }

  private async ensureContext(): Promise<AudioContext> {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this._sfxVolume;
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    return this.ctx;
  }

  // ─── 音效播放（程序化生成 + 随机变体）───
  async playSfx(name: SfxName) {
    if (this._muted) return;
    const variants = SFX_VARIANTS[name];
    if (!variants || variants.length === 0) return;

    const notes = variants[Math.floor(Math.random() * variants.length)];
    const ctx = await this.ensureContext();
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

  // ─── BGM 播放（外部音频文件）───
  playBgm(scene: string) {
    if (scene === this.currentBgm) return;
    this.stopBgm();
    this.currentBgm = scene;
    if (this._muted) return;
    this._startBgm(scene);
  }

  private _startBgm(scene: string) {
    const file = BGM_FILES[scene];
    if (!file) return;

    const audio = new Audio(file);
    audio.loop = true;
    audio.volume = this._bgmVolume;
    audio.play().catch(() => {
      // 浏览器可能需要用户交互后才允许播放，监听一次交互后重试
      const retry = () => {
        if (this.bgmAudio === audio && !this._muted) {
          audio.play().catch(() => {});
        }
        document.removeEventListener("click", retry);
        document.removeEventListener("touchstart", retry);
      };
      document.addEventListener("click", retry, { once: true });
      document.addEventListener("touchstart", retry, { once: true });
    });
    this.bgmAudio = audio;
  }

  stopBgm() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.src = "";
      this.bgmAudio = null;
    }
    this.currentBgm = null;
  }

  // ─── 静音控制 ───
  get muted() { return this._muted; }

  toggleMute(): boolean {
    this._muted = !this._muted;
    localStorage.setItem("audio_muted", this._muted ? "true" : "false");

    if (this._muted) {
      // 静音：暂停 BGM
      if (this.bgmAudio) {
        this.bgmAudio.pause();
        this.bgmAudio.src = "";
        this.bgmAudio = null;
      }
    } else {
      // 取消静音：播放开机音 + 恢复 BGM
      this.playSfx("chime");
      if (this.currentBgm) {
        this._startBgm(this.currentBgm);
      }
    }

    return this._muted;
  }

  setBgmVolume(v: number) {
    this._bgmVolume = Math.max(0, Math.min(1, v));
    localStorage.setItem("audio_bgm_vol", String(this._bgmVolume));
    if (this.bgmAudio) this.bgmAudio.volume = this._bgmVolume;
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
