let singleton: ImmersiveSoundscape | null = null;

export class ImmersiveSoundscape {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private padOsc: OscillatorNode | null = null;
  private padGain: GainNode | null = null;
  private arpeggioOsc: OscillatorNode | null = null;
  private arpGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private pulseValue = 0;

  async arm() {
    if (this.ctx) return;
    const contextWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AudioCtx = window.AudioContext || contextWindow.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);

    const shimmer = this.ctx.createDelay();
    shimmer.delayTime.value = 0.18;
    shimmer.connect(this.master);

    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 1400;
    padFilter.Q.value = 0.7;
    padFilter.connect(this.master);

    this.padOsc = this.ctx.createOscillator();
    this.padOsc.type = "sawtooth";
    this.padOsc.frequency.value = 90;
    this.padGain = this.ctx.createGain();
    this.padGain.gain.value = 0.08;
    this.padOsc.connect(this.padGain).connect(padFilter);
    this.padOsc.start();

    this.arpeggioOsc = this.ctx.createOscillator();
    this.arpeggioOsc.type = "triangle";
    this.arpeggioOsc.frequency.value = 220;
    this.arpGain = this.ctx.createGain();
    this.arpGain.gain.value = 0.02;
    const arpFilter = this.ctx.createBiquadFilter();
    arpFilter.type = "bandpass";
    arpFilter.frequency.value = 1800;
    arpFilter.Q.value = 4;
    this.arpeggioOsc.connect(this.arpGain).connect(arpFilter).connect(this.master);
    this.arpeggioOsc.start();

    const shimmerOsc = this.ctx.createOscillator();
    shimmerOsc.type = "sine";
    shimmerOsc.frequency.value = 440;
    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.value = 0.015;
    shimmerOsc.connect(shimmerGain).connect(shimmer);
    shimmerOsc.start();

    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.value = 0.5;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.4;
    this.lfo.connect(lfoGain);
    lfoGain.connect(padFilter.frequency);
    this.lfo.start();
  }

  get ready() {
    return Boolean(this.ctx && this.ctx.state === "running");
  }

  async resume() {
    if (!this.ctx) return;
    if (this.ctx.state !== "running") {
      await this.ctx.resume();
    }
  }

  pulse(strength = 1) {
    if (!this.ctx || !this.master) return;
    this.pulseValue = Math.min(1.5, this.pulseValue + strength * 0.6);
    const hit = this.ctx.createOscillator();
    hit.type = "square";
    hit.frequency.setValueAtTime(80, this.ctx.currentTime);
    hit.frequency.exponentialRampToValueAtTime(420, this.ctx.currentTime + 0.3);
    const hitGain = this.ctx.createGain();
    hitGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    hitGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    hit.connect(hitGain).connect(this.master);
    hit.start();
    hit.stop(this.ctx.currentTime + 0.4);
  }

  energySample() {
    if (!this.ctx) return 0;
    const base = (Math.sin(this.ctx.currentTime * 1.3) + 1) / 2;
    this.pulseValue = Math.max(0, this.pulseValue - 0.02);
    return Math.min(1, base * 0.7 + this.pulseValue);
  }
}

export const getSoundscape = () => {
  if (typeof window === "undefined") return null;
  if (!singleton) {
    singleton = new ImmersiveSoundscape();
  }
  return singleton;
};
