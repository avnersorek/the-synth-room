import * as Tone from 'tone';
import { AudioEngine } from './audio';
import { SyncManager } from './sync';
import { Instrument } from './instrument';
import { INSTRUMENTS, DRUM_SAMPLES } from './types';

export const SAMPLES = DRUM_SAMPLES;

export class Sequencer {
  private audio: AudioEngine;
  private instruments: Map<string, Instrument>;
  private currentStep: number;
  private loopId: number | null;
  private bpm: number;
  private sync: SyncManager | null;
  private onStepCallbacks: Array<(step: number) => void>;

  constructor(audio: AudioEngine, sync?: SyncManager) {
    this.audio = audio;
    this.sync = sync || null;
    this.instruments = new Map();
    this.currentStep = 0;
    this.loopId = null;
    this.bpm = 120;
    this.onStepCallbacks = [];

    // Set initial BPM in Tone.Transport
    Tone.getTransport().bpm.value = this.bpm;

    // Initialize instruments
    this.initializeInstruments();

    // If sync is provided, initialize from synced state and set up listeners
    if (this.sync) {
      this.initializeFromSync();
    }
  }

  private initializeInstruments() {
    // Create drum instrument
    const drumsInstrument = new Instrument(INSTRUMENTS.drums, this.audio);
    this.instruments.set('drums', drumsInstrument);

    // Create lead1 instrument
    const lead1Instrument = new Instrument(INSTRUMENTS.lead1, this.audio);
    this.instruments.set('lead1', lead1Instrument);
  }

  private initializeFromSync() {
    if (!this.sync) return;

    // Listen for connection status changes to refresh state when synced
    this.sync.onConnectionChange((status) => {
      if (status.synced) {
        // Reload state after sync completes
        const drumsGrid = this.sync!.getGrid('drums');
        const lead1Grid = this.sync!.getGrid('lead1');
        this.bpm = this.sync!.getBpm();

        const drumsInstrument = this.instruments.get('drums');
        const lead1Instrument = this.instruments.get('lead1');

        if (drumsInstrument) drumsInstrument.setGrid(drumsGrid);
        if (lead1Instrument) lead1Instrument.setGrid(lead1Grid);
      }
    });

    // Load initial state from Yjs
    const drumsGrid = this.sync.getGrid('drums');
    const lead1Grid = this.sync.getGrid('lead1');
    this.bpm = this.sync.getBpm();

    const drumsInstrument = this.instruments.get('drums');
    const lead1Instrument = this.instruments.get('lead1');

    if (drumsInstrument) drumsInstrument.setGrid(drumsGrid);
    if (lead1Instrument) lead1Instrument.setGrid(lead1Grid);

    // Listen to remote grid changes
    this.sync.onGridChange((instrumentId, row, col, value) => {
      const instrument = this.instruments.get(instrumentId);
      if (instrument) {
        const grid = instrument.getGrid();
        grid[row][col] = value;
      }
    });

    // Listen to remote BPM changes
    this.sync.onBpmChange((value) => {
      this.bpm = value;
      Tone.getTransport().bpm.value = value;
      // If playing, restart with new BPM
      if (this.isPlaying()) {
        this.stop();
        this.play();
      }
    });
  }

  getInstrument(id: string): Instrument | undefined {
    return this.instruments.get(id);
  }

  getAllInstruments(): Instrument[] {
    return Array.from(this.instruments.values());
  }

  toggle(instrumentId: string, row: number, col: number) {
    const instrument = this.instruments.get(instrumentId);
    if (!instrument) return;

    instrument.toggle(row, col);

    // Sync to other users if collaborative mode is enabled
    if (this.sync) {
      this.sync.toggleCell(instrumentId, row, col);
    }
  }

  isActive(instrumentId: string, row: number, col: number) {
    const instrument = this.instruments.get(instrumentId);
    return instrument ? instrument.isActive(row, col) : false;
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
    Tone.getTransport().bpm.value = bpm;

    // Sync to other users if collaborative mode is enabled
    if (this.sync) {
      this.sync.setBpm(bpm);
    }
  }

  setVolume(value: number) {
    this.audio.setVolume(value);
  }

  play() {
    if (this.loopId !== null) return;

    const transport = Tone.getTransport();

    // Schedule a repeating event on Tone.Transport
    this.loopId = transport.scheduleRepeat((time: number) => {
      // Play all instruments at the scheduled time
      this.instruments.forEach((instrument) => {
        instrument.playStep(this.currentStep, time);
      });

      // Update step counter immediately (works even when tab is not focused)
      const nextStep = (this.currentStep + 1) % 16;
      this.currentStep = nextStep;

      // Notify all listeners of the step change using requestAnimationFrame
      // This ensures visual updates sync with browser paint when tab is visible
      // When tab is not visible, this will queue but the audio continues playing
      requestAnimationFrame(() => {
        this.onStepCallbacks.forEach(callback => callback(nextStep));
      });
    }, '16n');

    transport.start();
  }

  stop() {
    const transport = Tone.getTransport();

    if (this.loopId !== null) {
      transport.clear(this.loopId);
      this.loopId = null;
    }
    transport.stop();
    this.currentStep = 0;
    // Notify listeners of reset
    this.onStepCallbacks.forEach(callback => callback(this.currentStep));
  }

  getCurrentStep() {
    return this.currentStep;
  }

  isPlaying() {
    return this.loopId !== null && Tone.getTransport().state === 'started';
  }

  onStep(callback: (step: number) => void) {
    this.onStepCallbacks.push(callback);
  }

  getSync(): SyncManager | null {
    return this.sync;
  }
}
