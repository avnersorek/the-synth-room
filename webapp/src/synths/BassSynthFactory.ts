/**
 * Factory for creating bass synth instruments
 */

import * as Tone from 'tone';
import type { BassOscillatorType } from '../types';

export class BassSynthFactory {
  /**
   * Create a bass mono synth with the specified oscillator type
   */
  static createSynth(oscillatorType: BassOscillatorType): Tone.MonoSynth {
    return new Tone.MonoSynth({
      oscillator: {
        type: oscillatorType
      },
      envelope: {
        attack: 0
      }
    });
  }
}
