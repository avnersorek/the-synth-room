import * as Tone from 'tone';

export class AudioEngine {
  private samplers: Map<string, Tone.Sampler>;
  private volume: Tone.Volume;

  constructor() {
    this.samplers = new Map();
    this.volume = new Tone.Volume(0).toDestination();
  }

  async loadSample(name: string, url: string) {
    // Create a sampler for this specific sample
    const sampler = new Tone.Sampler({
      urls: {
        'C3': url.replace('/sounds/', './sounds/'),
      },
      onload: () => {
        console.log(`Sample ${name} loaded`);
      },
    }).connect(this.volume);

    this.samplers.set(name, sampler);
  }

  play(name: string, time?: number) {
    const sampler = this.samplers.get(name);
    if (!sampler) return;

    // Play the sample at C3 (the note we loaded it at)
    // If time is provided, schedule it; otherwise play immediately
    if (time !== undefined) {
      sampler.triggerAttackRelease('C3', '16n', time);
    } else {
      sampler.triggerAttackRelease('C3', '16n');
    }
  }

  setVolume(value: number) {
    // Convert 0-1 range to decibels
    // 0.7 -> ~-3dB, 1.0 -> 0dB, 0 -> -Infinity
    if (value === 0) {
      this.volume.volume.value = -Infinity;
    } else {
      this.volume.volume.value = Tone.gainToDb(value);
    }
  }

  clear() {
    this.samplers.forEach(sampler => sampler.dispose());
    this.samplers.clear();
  }

  async start() {
    await Tone.start();
    console.log('Tone.js audio context started');
  }
}
