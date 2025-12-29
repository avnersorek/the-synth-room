/**
 * Factory for creating lead synth instruments based on preset configurations
 */

import * as Tone from 'tone';
import type { SynthType } from '../types';

export class LeadSynthFactory {
  /**
   * Create a lead synth based on the specified preset type
   */
  static createSynth(synthType: SynthType): Tone.PolySynth {
    switch (synthType) {
      case 'Jump':
        return this.createJumpSynth();
      case 'Polly':
        return this.createPollySynth();
      default:
        // Default to Jump preset
        return this.createJumpSynth();
    }
  }

  /**
   * Jump preset: Fat sawtooth with exponential envelope
   */
  private static createJumpSynth(): Tone.PolySynth {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "fatsawtooth",
        count: 3,
        spread: 30,
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.4,
        attackCurve: "exponential",
      },
    });
  }

  /**
   * Polly preset: Additive synthesis with partials
   */
  private static createPollySynth(): Tone.PolySynth {
    return new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        partials: [0, 2, 3, 4],
      },
    });
  }
}
