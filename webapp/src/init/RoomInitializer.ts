/**
 * Handles initialization of a room (synced or local)
 */

import { AudioEngine } from '../audio';
import { Sequencer } from '../sequencer';
import { UI } from '../ui/UI';
import { SyncManager } from '../sync/SyncManager';
import { ResourceLoader } from './ResourceLoader';
import type { SynthType } from '../types';

export class RoomInitializer {
  private resourceLoader: ResourceLoader;

  constructor() {
    this.resourceLoader = new ResourceLoader();
  }

  /**
   * Initialize a room with the given room ID and PartyKit host
   */
  async initRoom(roomId: string, partyKitHost: string): Promise<void> {
    const audio = new AudioEngine();
    audio.setVolume(0.7);

    // Initialize room and sync
    const sync = new SyncManager({
      roomId,
      partyKitHost,
    });

    // Create sequencer with sync enabled
    const sequencer = new Sequencer(audio, sync);

    // Load initial kit from sync or default
    const initialKit = sync.getKit();
    await this.resourceLoader.loadKit(sequencer, initialKit);

    // Initialize lead synth with initial synth type from sync
    const initialSynthType = sync.getSynthType();
    const lead1Instrument = sequencer.getInstrument('lead1');
    if (lead1Instrument) {
      lead1Instrument.setParameter('synthType', initialSynthType);
      audio.createSynth('lead1', initialSynthType as SynthType);
      await lead1Instrument.loadSamples();
    }

    // Initialize bass synth with MonoSynth and square oscillator
    const bassInstrument = sequencer.getInstrument('bass');
    if (bassInstrument) {
      bassInstrument.setParameter('oscillatorType', 'square');
      audio.createBassMonoSynth('bass', 'square');
      await bassInstrument.loadSamples();
    }

    const app = document.querySelector<HTMLDivElement>('#app')!;

    // Handle kit changes
    const onKitChange = async (kit: string) => {
      // Update sync if this is a local change
      if (!this.resourceLoader.isLoadingKit()) {
        sync.setKit(kit);
      }
      await this.resourceLoader.loadKit(sequencer, kit);
    };

    // Handle synth type changes
    const onSynthChange = (synthType: string) => {
      // Update sync if this is a local change
      if (!this.resourceLoader.isLoadingSynthType()) {
        sync.setSynthType(synthType);
      }
      this.resourceLoader.loadSynthType(sequencer, audio, synthType);
    };

    // Handle bass oscillator type changes
    const onBassOscillatorChange = (oscillatorType: string) => {
      const bassInstrument = sequencer.getInstrument('bass');
      if (bassInstrument) {
        bassInstrument.setParameter('oscillatorType', oscillatorType);
        audio.createBassMonoSynth('bass', oscillatorType as any);
      }
    };

    const ui = new UI(sequencer, app, onKitChange, onSynthChange, onBassOscillatorChange);

    // Listen to remote kit changes
    sync.onKitChange(async (kitName) => {
      console.log(`RoomInitializer: Remote kit change detected: "${kitName}"`);
      this.resourceLoader.setLoadingKit(true);
      try {
        await this.resourceLoader.loadKit(sequencer, kitName);
        // Update UI kit selector to reflect the change
        ui.updateKitSelector(kitName);
        console.log(`RoomInitializer: Kit "${kitName}" loaded successfully`);
      } catch (error) {
        console.error(`RoomInitializer: Error loading kit "${kitName}":`, error);
      } finally {
        this.resourceLoader.setLoadingKit(false);
      }
    });

    // Listen to remote synth type changes
    sync.onSynthTypeChange((type) => {
      console.log(`RoomInitializer: Remote synth type change detected: "${type}"`);
      this.resourceLoader.setLoadingSynthType(true);
      try {
        this.resourceLoader.loadSynthType(sequencer, audio, type);
        // Update UI synth selector to reflect the change
        ui.updateSynthSelector(type);
        console.log(`RoomInitializer: Synth type "${type}" loaded successfully`);
      } catch (error) {
        console.error(`RoomInitializer: Error loading synth type "${type}":`, error);
      } finally {
        this.resourceLoader.setLoadingSynthType(false);
      }
    });

    ui.render();

    // Update selectors to reflect initial state from sync
    ui.updateSynthSelector(initialSynthType);
  }
}
