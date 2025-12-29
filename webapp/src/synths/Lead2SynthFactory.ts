/**
 * Factory for creating Lead 2 synth instruments based on preset configurations
 */

import * as Tone from 'tone';
import type { Lead2SynthType } from '../types';

export class Lead2SynthFactory {
  /**
   * Create a Lead 2 synth based on the specified preset type
   */
  static createSynth(synthType: Lead2SynthType): Tone.PolySynth {
    switch (synthType) {
      case 'ElectricCello':
        return this.createElectricCelloSynth();
      case 'Kalimba':
        return this.createKalimbaSynth();
      case 'ThinSaws':
        return this.createThinSawsSynth();
      default:
        // Default to ElectricCello preset
        return this.createElectricCelloSynth();
    }
  }

  /**
   * ElectricCello preset: FM synthesis with triangle and square waves
   * Warm, evolving timbral characteristics typical of string instruments
   */
  private static createElectricCelloSynth(): Tone.PolySynth {
    return new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3.01,
      modulationIndex: 14,
      oscillator: {
        type: "triangle",
      },
      envelope: {
        attack: 0.2,
        decay: 0.3,
        sustain: 0.1,
        release: 1.2,
      },
      modulation: {
        type: "square",
      },
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0.2,
        release: 0.1,
      },
    });
  }

  /**
   * Kalimba preset: FM synthesis with sine and square waves
   * Warm, percussive sound with quick attack and extended decay
   */
  private static createKalimbaSynth(): Tone.PolySynth {
    return new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 8,
      modulationIndex: 2,
      oscillator: {
        type: "sine",
      },
      envelope: {
        attack: 0.001,
        decay: 2,
        sustain: 0.1,
        release: 2,
      },
      modulation: {
        type: "square",
      },
      modulationEnvelope: {
        attack: 0.002,
        decay: 0.2,
        sustain: 0,
        release: 0.2,
      },
    });
  }

  /**
   * ThinSaws preset: FM synthesis with sawtooth and triangle waves
   * Characteristic thin sawtooth sound with extended release
   */
  private static createThinSawsSynth(): Tone.PolySynth {
    return new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 0.5,
      modulationIndex: 1.2,
      oscillator: {
        type: "sawtooth",
      },
      envelope: {
        attack: 0.05,
        decay: 0.3,
        sustain: 0.1,
        release: 1.2,
      },
      modulation: {
        type: "triangle",
      },
      modulationEnvelope: {
        attack: 0.35,
        decay: 0.1,
        sustain: 1,
        release: 0.01,
      },
    });
  }
}
