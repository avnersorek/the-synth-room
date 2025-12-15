import { AudioEngine } from './audio';
import { SyncManager } from './sync';
import { Instrument } from './instrument';
import { INSTRUMENTS, DRUM_SAMPLES } from './types';

export const SAMPLES = DRUM_SAMPLES;

export class Sequencer {
  private audio: AudioEngine;
  private instruments: Map<string, Instrument>;
  private currentStep: number;
  private intervalId: number | null;
  private bpm: number;
  private sync: SyncManager | null;

  constructor(audio: AudioEngine, sync?: SyncManager) {
    this.audio = audio;
    this.sync = sync || null;
    this.instruments = new Map();
    this.currentStep = 0;
    this.intervalId = null;
    this.bpm = 120;

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
    const wasPlaying = this.intervalId !== null;
    if (wasPlaying) this.stop();
    this.bpm = bpm;

    // Sync to other users if collaborative mode is enabled
    if (this.sync) {
      this.sync.setBpm(bpm);
    }

    if (wasPlaying) this.play();
  }

  setVolume(value: number) {
    this.audio.setVolume(value);
  }

  play() {
    if (this.intervalId) return;

    const interval = (60 / this.bpm) * 1000 / 4;
    this.intervalId = window.setInterval(() => this.tick(), interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentStep = 0;
  }

  getCurrentStep() {
    return this.currentStep;
  }

  isPlaying() {
    return this.intervalId !== null;
  }

  private tick() {
    // Play all instruments
    this.instruments.forEach((instrument) => {
      instrument.playStep(this.currentStep);
    });
    this.currentStep = (this.currentStep + 1) % 16;
  }

  getSync(): SyncManager | null {
    return this.sync;
  }
}
