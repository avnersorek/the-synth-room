import * as Tone from 'tone';
import type { SynthType, Lead2SynthType, BassType } from './types';
import { EffectsController } from './effects/EffectsController';
import { LeadSynthFactory } from './synths/LeadSynthFactory';
import { Lead2SynthFactory } from './synths/Lead2SynthFactory';
import { BassSynthFactory } from './synths/BassSynthFactory';
import { DrumSamplerFactory } from './synths/DrumSamplerFactory';

export class AudioEngine {
  private samplers: Map<string, Tone.Sampler>;
  private synths: Map<string, Tone.PolySynth>;
  private monoSynths: Map<string, Tone.MonoSynth>;
  private volume: Tone.Volume;
  private instrumentVolumes: Map<string, Tone.Volume>;
  private effects: EffectsController;
  private loadedSamples: Set<string>;

  constructor() {
    this.samplers = new Map();
    this.synths = new Map();
    this.monoSynths = new Map();
    this.volume = new Tone.Volume(0).toDestination();
    this.instrumentVolumes = new Map();
    this.effects = new EffectsController(this.volume);
    this.loadedSamples = new Set();
  }

  private getOrCreateInstrumentVolume(instrumentId: string): Tone.Volume {
    let vol = this.instrumentVolumes.get(instrumentId);
    if (!vol) {
      // Create volume node that connects to BOTH main output and effect send
      vol = new Tone.Volume(0);
      vol.connect(this.volume); // Main output
      vol.connect(this.effects.getEffectSendNode(instrumentId)); // Effect send
      this.instrumentVolumes.set(instrumentId, vol);
    }
    return vol;
  }

  loadSample(name: string, url: string, instrumentId: string = 'drums') {
    // Create a sampler for this specific sample
    const instrumentVolume = this.getOrCreateInstrumentVolume(instrumentId);
    const sampler = DrumSamplerFactory.createSampler(name, url, () => {
      // Mark sample as loaded when it finishes loading
      this.loadedSamples.add(name);
      console.log(`Sample ${name} loaded and ready`);
    }).connect(instrumentVolume);

    this.samplers.set(name, sampler);
  }

  createSynth(instrumentId: string, synthType: SynthType | Lead2SynthType) {
    // Dispose of existing synth if it exists
    const existingSynth = this.synths.get(instrumentId);
    if (existingSynth) {
      existingSynth.dispose();
    }

    const instrumentVolume = this.getOrCreateInstrumentVolume(instrumentId);

    // Create synth using appropriate factory based on instrument ID
    let synth: Tone.PolySynth;
    if (instrumentId === 'lead2') {
      synth = Lead2SynthFactory.createSynth(synthType as Lead2SynthType).connect(instrumentVolume);
    } else {
      synth = LeadSynthFactory.createSynth(synthType as SynthType).connect(instrumentVolume);
    }

    this.synths.set(instrumentId, synth);
    console.log(`Created ${synthType} preset for ${instrumentId}`);
  }

  createBassMonoSynth(instrumentId: string, bassType: BassType) {
    // Dispose of existing mono synth if it exists
    const existingMonoSynth = this.monoSynths.get(instrumentId);
    if (existingMonoSynth) {
      existingMonoSynth.dispose();
    }

    const instrumentVolume = this.getOrCreateInstrumentVolume(instrumentId);

    // Create MonoSynth using factory
    const monoSynth = BassSynthFactory.createSynth(bassType).connect(instrumentVolume);

    this.monoSynths.set(instrumentId, monoSynth);
    console.log(`Created ${bassType} preset for ${instrumentId}`);
  }

  play(name: string, time?: number) {
    const sampler = this.samplers.get(name);
    if (!sampler) {return;}

    // Check if sample has finished loading
    if (!this.loadedSamples.has(name)) {
      console.warn(`Sample ${name} not loaded yet, skipping playback`);
      return;
    }

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
    if (!synth) {return;}

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

  setInstrumentVolume(instrumentId: string, value: number) {
    const instrumentVolume = this.getOrCreateInstrumentVolume(instrumentId);
    // Convert 0-1 range to decibels
    if (value === 0) {
      instrumentVolume.volume.value = -Infinity;
    } else {
      instrumentVolume.volume.value = Tone.gainToDb(value);
    }
  }

  getInstrumentVolume(instrumentId: string): number {
    const instrumentVolume = this.instrumentVolumes.get(instrumentId);
    if (!instrumentVolume) {return 0.5;} // Default volume
    const dbValue = instrumentVolume.volume.value;
    if (dbValue === -Infinity) {return 0;}
    return Tone.dbToGain(dbValue);
  }

  setEffectSend(instrumentId: string, value: number) {
    this.effects.setEffectSend(instrumentId, value);
  }

  getEffectSend(instrumentId: string): number {
    return this.effects.getEffectSend(instrumentId);
  }

  clear() {
    this.samplers.forEach(sampler => sampler.dispose());
    this.samplers.clear();
    this.synths.forEach(synth => synth.dispose());
    this.synths.clear();
    this.monoSynths.forEach(monoSynth => monoSynth.dispose());
    this.monoSynths.clear();
    this.instrumentVolumes.forEach(vol => vol.dispose());
    this.instrumentVolumes.clear();
    this.loadedSamples.clear();
    this.effects.dispose();
  }

  async start() {
    await Tone.start();
    console.log('Tone.js audio context started');
  }
}
