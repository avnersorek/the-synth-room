/**
 * Factory for creating bass synth instruments based on preset configurations
 */

import * as Tone from 'tone';
import type { BassType } from '../types';

export class BassSynthFactory {
  /**
   * Create a bass synth based on the specified preset type
   */
  static createSynth(bassType: BassType): Tone.MonoSynth {
    switch (bassType) {
      case 'Guitar':
        return this.createGuitarSynth();
      case 'Bassy':
        return this.createBassySynth();
      default:
        // Default to Guitar preset
        return this.createGuitarSynth();
    }
  }

  /**
   * Guitar preset: Bass Guitar MonoSynth from Tone.js presets
   * Uses FM synthesis with frequency modulation for rich harmonic content
   */
  private static createGuitarSynth(): Tone.MonoSynth {
    return new Tone.MonoSynth({
      oscillator: {
        type: "fmsquare5",
        modulationType: "triangle",
        modulationIndex: 2,
        harmonicity: 0.501
      },
      filter: {
        Q: 1,
        type: "lowpass",
        rolloff: -24
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.4,
        release: 2
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 1.5,
        baseFrequency: 50,
        octaves: 4.4
      }
    });
  }

  /**
   * Bassy preset: Warm evolving bass with harmonic partials
   * Uses custom harmonic oscillator with controlled filter movement
   */
  private static createBassySynth(): Tone.MonoSynth {
    return new Tone.MonoSynth({
      portamento: 0.08,
      oscillator: {
        partials: [2, 1, 3, 2, 0.4]
      },
      filter: {
        Q: 4,
        type: "lowpass",
        rolloff: -48
      },
      envelope: {
        attack: 0.04,
        decay: 0.06,
        sustain: 0.4,
        release: 1
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.6,
        release: 1.5,
        baseFrequency: 50,
        octaves: 3.4
      }
    });
  }
}
