export class BloodFortressAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private droneOscillators: OscillatorNode[] = [];
  private bossIntensity = 0;
  private nextHeartbeatAt = 0;

  unlock() {
    if (this.context) {
      return;
    }

    const audioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!audioContextConstructor) {
      return;
    }

    this.context = new audioContextConstructor();
    this.master = this.context.createGain();
    this.master.gain.value = 0.22;
    this.master.connect(this.context.destination);

    this.droneGain = this.context.createGain();
    this.droneGain.gain.value = 0.08;
    this.droneGain.connect(this.master);

    [48, 72, 96].forEach((frequency) => {
      if (!(this.context && this.droneGain)) {
        return;
      }

      const oscillator = this.context.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = frequency;

      const gain = this.context.createGain();
      gain.gain.value = frequency === 48 ? 0.28 : 0.12;
      oscillator.connect(gain);
      gain.connect(this.droneGain);
      oscillator.start();
      this.droneOscillators.push(oscillator);
    });
  }

  private scheduleTone(
    startAt: number,
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType,
    slideTo?: number,
  ) {
    if (!(this.context && this.master)) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);

    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(slideTo, startAt + duration);
    }

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.05);
  }

  playCoin() {
    if (!this.context) {
      return;
    }

    const now = this.context.currentTime;
    this.scheduleTone(now, 740, 0.11, 0.14, 'triangle', 1180);
    this.scheduleTone(now + 0.04, 960, 0.12, 0.1, 'triangle', 1520);
  }

  playDash() {
    if (!this.context) {
      return;
    }

    const now = this.context.currentTime;
    this.scheduleTone(now, 240, 0.16, 0.11, 'sawtooth', 110);
  }

  playSlash() {
    if (!this.context) {
      return;
    }

    const now = this.context.currentTime;
    this.scheduleTone(now, 280, 0.09, 0.12, 'square', 90);
  }

  playHit() {
    if (!this.context) {
      return;
    }

    const now = this.context.currentTime;
    this.scheduleTone(now, 180, 0.22, 0.15, 'sawtooth', 70);
  }

  playCheckpoint() {
    if (!this.context) {
      return;
    }

    const now = this.context.currentTime;
    this.scheduleTone(now, 220, 0.36, 0.12, 'triangle', 440);
    this.scheduleTone(now + 0.08, 330, 0.28, 0.1, 'triangle', 520);
  }

  playBossRoar() {
    if (!this.context) {
      return;
    }

    const now = this.context.currentTime;
    this.scheduleTone(now, 120, 0.44, 0.18, 'sawtooth', 42);
    this.scheduleTone(now + 0.06, 180, 0.32, 0.08, 'square', 66);
  }

  setBossIntensity(intensity: number) {
    this.bossIntensity = intensity;
  }

  tick(lowHealthFactor: number) {
    if (!(this.context && this.droneGain)) {
      return;
    }

    this.droneGain.gain.value = 0.06 + this.bossIntensity * 0.05 + lowHealthFactor * 0.04;

    if (this.bossIntensity > 0.1 && this.context.currentTime >= this.nextHeartbeatAt) {
      this.nextHeartbeatAt = this.context.currentTime + 0.82 - this.bossIntensity * 0.28;
      this.scheduleTone(this.context.currentTime, 72, 0.16, 0.16, 'triangle', 52);
      this.scheduleTone(this.context.currentTime + 0.07, 58, 0.12, 0.1, 'triangle', 46);
    }
  }

  destroy() {
    this.droneOscillators.forEach((oscillator) => oscillator.stop());
    this.droneOscillators = [];
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.droneGain = null;
  }
}
