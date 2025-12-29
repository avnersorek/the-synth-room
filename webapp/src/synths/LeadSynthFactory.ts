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
      case 'Tiny':
        return this.createTinySynth();
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

  /**
   * Tiny preset: AM synthesis for bell-like tones
   * Uses amplitude modulation with fast attack and long decay
   */
  private static createTinySynth(): Tone.PolySynth {
    return new Tone.PolySynth(Tone.AMSynth, {
      harmonicity: 2,
      oscillator: {
        type: "amsine2",
        modulationType: "sine",
        harmonicity: 1.01
      },
      envelope: {
        attack: 0.006,
        decay: 4,
        sustain: 0.04,
        release: 1.2
      },
      modulation: {
        volume: 13,
        type: "amsine2",
        modulationType: "sine",
        harmonicity: 12
      },
      modulationEnvelope: {
        attack: 0.006,
        decay: 0.2,
        sustain: 0.2,
        release: 0.4
      }
    });
  }
}
