/**
 * Manages loading of resources (kits, synth types) with internal state management
 * Eliminates the need for global loading flags
 */

import { Sequencer } from '../sequencer';
import { AudioEngine } from '../audio';
import type { SynthType, Lead2SynthType, BassType } from '../types';

export class ResourceLoader {
  private isLoadingKitFromSync = false;
  private isLoadingSynthTypeFromSync = false;
  private isLoadingLead2SynthTypeFromSync = false;
  private isLoadingBassTypeFromSync = false;

  /**
   * Load a drum kit
   */
  loadKit(sequencer: Sequencer, kit: string): void {
    console.log(`loadKit: Loading kit "${kit}"`);

    try {
      const drumsInstrument = sequencer.getInstrument('drums');
      if (drumsInstrument) {
        drumsInstrument.loadSamples(kit);
        console.log(`loadKit: All samples loaded for kit "${kit}"`);
      }
    } catch (error) {
      console.error(`loadKit: Error loading kit "${kit}":`, error);
      throw error;
    }
  }

  /**
   * Load a synth type for the lead instrument
   */
  loadSynthType(sequencer: Sequencer, audio: AudioEngine, synthType: string): void {
    const lead1 = sequencer.getInstrument('lead1');
    if (lead1) {
      lead1.setParameter('synthType', synthType);
      audio.createSynth('lead1', synthType as SynthType);
    }
  }

  /**
   * Load a synth type for the lead2 instrument
   */
  loadLead2SynthType(sequencer: Sequencer, audio: AudioEngine, synthType: string): void {
    const lead2 = sequencer.getInstrument('lead2');
    if (lead2) {
      lead2.setParameter('synthType', synthType);
      audio.createSynth('lead2', synthType as Lead2SynthType);
    }
  }

  /**
   * Load a bass type for the bass instrument
   */
  loadBassType(sequencer: Sequencer, audio: AudioEngine, bassType: string): void {
    const bass = sequencer.getInstrument('bass');
    if (bass) {
      bass.setParameter('bassType', bassType);
      audio.createBassMonoSynth('bass', bassType as BassType);
    }
  }

  /**
   * Check if currently loading kit from sync
   */
  isLoadingKit(): boolean {
    return this.isLoadingKitFromSync;
  }

  /**
   * Check if currently loading synth type from sync
   */
  isLoadingSynthType(): boolean {
    return this.isLoadingSynthTypeFromSync;
  }

  /**
   * Check if currently loading lead2 synth type from sync
   */
  isLoadingLead2SynthType(): boolean {
    return this.isLoadingLead2SynthTypeFromSync;
  }

  /**
   * Check if currently loading bass type from sync
   */
  isLoadingBassType(): boolean {
    return this.isLoadingBassTypeFromSync;
  }

  /**
   * Set loading kit flag
   */
  setLoadingKit(loading: boolean): void {
    this.isLoadingKitFromSync = loading;
  }

  /**
   * Set loading synth type flag
   */
  setLoadingSynthType(loading: boolean): void {
    this.isLoadingSynthTypeFromSync = loading;
  }

  /**
   * Set loading lead2 synth type flag
   */
  setLoadingLead2SynthType(loading: boolean): void {
    this.isLoadingLead2SynthTypeFromSync = loading;
  }

  /**
   * Set loading bass type flag
   */
  setLoadingBassType(loading: boolean): void {
    this.isLoadingBassTypeFromSync = loading;
  }
}
