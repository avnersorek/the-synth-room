import * as Tone from 'tone';
import type { SynthType, BassOscillatorType } from './types';

export class AudioEngine {
  private samplers: Map<string, Tone.Sampler>;
  private synths: Map<string, Tone.PolySynth>;
  private monoSynths: Map<string, Tone.MonoSynth>;
  private volume: Tone.Volume;

  constructor() {
    this.samplers = new Map();
    this.synths = new Map();
    this.monoSynths = new Map();
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

  createSynth(instrumentId: string, synthType: SynthType, oscillatorType?: string) {
    // Dispose of existing synth if it exists
    const existingSynth = this.synths.get(instrumentId);
    if (existingSynth) {
      existingSynth.dispose();
    }

    // Create the appropriate synth type
    let synth: Tone.PolySynth;
    switch (synthType) {
      case 'FMSynth':
        synth = new Tone.PolySynth(Tone.FMSynth).connect(this.volume);
        break;
      case 'AMSynth':
        synth = new Tone.PolySynth(Tone.AMSynth).connect(this.volume);
        break;
      case 'Synth':
        synth = new Tone.PolySynth(Tone.Synth).connect(this.volume);
        // Set oscillator type if specified (only works with basic Synth)
        if (oscillatorType) {
          synth.set({ oscillator: { type: oscillatorType as any } });
        }
        break;
      default:
        synth = new Tone.PolySynth(Tone.FMSynth).connect(this.volume);
    }

    this.synths.set(instrumentId, synth);
    console.log(`Created ${synthType} for ${instrumentId}${oscillatorType ? ` with ${oscillatorType} oscillator` : ''}`);
  }

  createBassMonoSynth(instrumentId: string, oscillatorType: BassOscillatorType) {
    // Dispose of existing mono synth if it exists
    const existingMonoSynth = this.monoSynths.get(instrumentId);
    if (existingMonoSynth) {
      existingMonoSynth.dispose();
    }

    // Create MonoSynth with specified oscillator type
    const monoSynth = new Tone.MonoSynth({
      oscillator: {
        type: oscillatorType as any
      },
      envelope: {
        attack: 0
      }
    }).connect(this.volume);

    this.monoSynths.set(instrumentId, monoSynth);
    console.log(`Created MonoSynth for ${instrumentId} with ${oscillatorType} oscillator`);
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

  playNote(instrumentId: string, note: string, time?: number, duration: string = '16n') {
    // Check for mono synth first (for bass)
    const monoSynth = this.monoSynths.get(instrumentId);
    if (monoSynth) {
      // Play the note with the mono synth
      if (time !== undefined) {
        monoSynth.triggerAttackRelease(note, duration, time);
      } else {
        monoSynth.triggerAttackRelease(note, duration);
      }
      return;
    }

    // Otherwise use poly synth
    const synth = this.synths.get(instrumentId);
    if (!synth) return;

    // Play the note with the synth
    if (time !== undefined) {
      synth.triggerAttackRelease(note, duration, time);
    } else {
      synth.triggerAttackRelease(note, duration);
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
    this.synths.forEach(synth => synth.dispose());
    this.synths.clear();
    this.monoSynths.forEach(monoSynth => monoSynth.dispose());
    this.monoSynths.clear();
  }

  async start() {
    await Tone.start();
    console.log('Tone.js audio context started');
  }
}
