class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureCtx(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.08,
    delay = 0
  ) {
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
    }

    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  jump() {
    this.playTone(260, 580, 0.14, 'square', 0.06);
  }

  collectSafe() {
    this.playTone(784, 784, 0.07, 'square', 0.07, 0);
    this.playTone(1046.5, 1046.5, 0.14, 'square', 0.07, 0.07);
  }

  powerUp() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => this.playTone(n, n, 0.08, 'triangle', 0.1, idx * 0.06));
  }

  bumpBlock() {
    this.playTone(220, 140, 0.09, 'triangle', 0.09);
  }

  stomp() {
    this.playTone(420, 140, 0.12, 'sawtooth', 0.08);
    this.playTone(540, 740, 0.09, 'square', 0.06, 0.06);
  }

  shoot() {
    this.playTone(880, 320, 0.11, 'triangle', 0.08);
  }

  hurt() {
    this.playTone(300, 95, 0.24, 'sawtooth', 0.09);
    this.playTone(210, 75, 0.25, 'square', 0.06, 0.05);
  }

  bossHit() {
    this.playTone(180, 80, 0.18, 'sawtooth', 0.11);
    this.playTone(520, 780, 0.14, 'square', 0.08, 0.07);
  }

  quizCorrect() {
    this.playTone(587.33, 587.33, 0.08, 'triangle', 0.1, 0);
    this.playTone(783.99, 783.99, 0.08, 'triangle', 0.1, 0.08);
    this.playTone(1174.66, 1174.66, 0.2, 'triangle', 0.1, 0.16);
  }

  quizWrong() {
    this.playTone(240, 180, 0.18, 'sawtooth', 0.08, 0);
    this.playTone(180, 130, 0.22, 'sawtooth', 0.08, 0.16);
  }

  levelClear() {
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    const times = [0, 0.1, 0.2, 0.3, 0.45, 0.56];
    melody.forEach((f, i) => {
      this.playTone(f, f, i === melody.length - 1 ? 0.35 : 0.1, 'square', 0.07, times[i]);
    });
  }

  victory() {
    const melody = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    melody.forEach((f, i) => {
      this.playTone(f, f, i === melody.length - 1 ? 0.45 : 0.11, 'triangle', 0.1, i * 0.1);
    });
  }
}

export const sound = new SoundEngine();
