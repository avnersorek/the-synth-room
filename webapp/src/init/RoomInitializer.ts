/**
 * Handles initialization of a room (synced or local)
 */

import { AudioEngine } from '../audio';
import { Sequencer } from '../sequencer';
import { UI } from '../ui/UI';
import { SyncManager } from '../sync/SyncManager';
import { ResourceLoader } from './ResourceLoader';
import type { SynthType, Lead2SynthType, BassType } from '../types';

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

    // Initialize lead2 synth with initial synth type from sync
    const initialLead2SynthType = sync.getLead2SynthType();
    const lead2Instrument = sequencer.getInstrument('lead2');
    if (lead2Instrument) {
      lead2Instrument.setParameter('synthType', initialLead2SynthType);
      audio.createSynth('lead2', initialLead2SynthType as Lead2SynthType);
      await lead2Instrument.loadSamples();
    }

    // Initialize bass synth with initial bass type from sync
    const initialBassType = sync.getBassType();
    const bassInstrument = sequencer.getInstrument('bass');
    if (bassInstrument) {
      bassInstrument.setParameter('bassType', initialBassType);
      audio.createBassMonoSynth('bass', initialBassType as BassType);
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

    // Handle lead2 synth type changes
    const onLead2SynthChange = (synthType: string) => {
      // Update sync if this is a local change
      if (!this.resourceLoader.isLoadingLead2SynthType()) {
        sync.setLead2SynthType(synthType);
      }
      this.resourceLoader.loadLead2SynthType(sequencer, audio, synthType);
    };

    // Handle bass type changes
    const onBassTypeChange = (bassType: string) => {
      // Update sync if this is a local change
      if (!this.resourceLoader.isLoadingBassType()) {
        sync.setBassType(bassType);
      }
      this.resourceLoader.loadBassType(sequencer, audio, bassType);
    };

    const ui = new UI(sequencer, app, onKitChange, onSynthChange, onLead2SynthChange, onBassTypeChange);

    // Listen to remote kit changes
    sync.onKitChange((kitName) => {
      console.log(`RoomInitializer: Remote kit change detected: "${kitName}"`);
      this.resourceLoader.setLoadingKit(true);
      void this.resourceLoader.loadKit(sequencer, kitName)
        .then(() => {
          // Update UI kit selector to reflect the change
          ui.updateKitSelector(kitName);
          console.log(`RoomInitializer: Kit "${kitName}" loaded successfully`);
        })
        .catch((error) => {
          console.error(`RoomInitializer: Error loading kit "${kitName}":`, error);
        })
        .finally(() => {
          this.resourceLoader.setLoadingKit(false);
        });
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

    // Listen to remote lead2 synth type changes
    sync.onLead2SynthTypeChange((type) => {
      console.log(`RoomInitializer: Remote lead2 synth type change detected: "${type}"`);
      this.resourceLoader.setLoadingLead2SynthType(true);
      try {
        this.resourceLoader.loadLead2SynthType(sequencer, audio, type);
        // Update UI lead2 synth selector to reflect the change
        ui.updateLead2SynthSelector(type);
        console.log(`RoomInitializer: Lead2 synth type "${type}" loaded successfully`);
      } catch (error) {
        console.error(`RoomInitializer: Error loading lead2 synth type "${type}":`, error);
      } finally {
        this.resourceLoader.setLoadingLead2SynthType(false);
      }
    });

    // Listen to remote bass type changes
    sync.onBassTypeChange((type) => {
      console.log(`RoomInitializer: Remote bass type change detected: "${type}"`);
      this.resourceLoader.setLoadingBassType(true);
      try {
        this.resourceLoader.loadBassType(sequencer, audio, type);
        // Update UI bass selector to reflect the change
        ui.updateBassTypeSelector(type);
        console.log(`RoomInitializer: Bass type "${type}" loaded successfully`);
      } catch (error) {
        console.error(`RoomInitializer: Error loading bass type "${type}":`, error);
      } finally {
        this.resourceLoader.setLoadingBassType(false);
      }
    });

    ui.render();

    // Update selectors to reflect initial state from sync
    ui.updateSynthSelector(initialSynthType);
    ui.updateLead2SynthSelector(initialLead2SynthType);
    ui.updateBassTypeSelector(initialBassType);
  }
}
