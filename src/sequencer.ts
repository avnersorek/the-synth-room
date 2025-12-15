import { AudioEngine } from './audio';
import { SyncManager } from './sync';

export const SAMPLES = [
  'kick', 'snare', 'hihat', 'openhat', 'clap', 'boom', 'ride', 'tink'
];

export class Sequencer {
  private audio: AudioEngine;
  private grid: boolean[][];
  private currentStep: number;
  private intervalId: number | null;
  private bpm: number;
  private sync: SyncManager | null;

  constructor(audio: AudioEngine, sync?: SyncManager) {
    this.audio = audio;
    this.sync = sync || null;
    this.grid = Array(8).fill(null).map(() => Array(16).fill(false));
    this.currentStep = 0;
    this.intervalId = null;
    this.bpm = 120;

    // If sync is provided, initialize from synced state and set up listeners
    if (this.sync) {
      this.initializeFromSync();
    }
  }

  private initializeFromSync() {
    if (!this.sync) return;

    // Listen for connection status changes to refresh grid when synced
    this.sync.onConnectionChange((status) => {
      if (status.synced) {
        // Reload grid state after sync completes
        this.grid = this.sync!.getGrid();
        this.bpm = this.sync!.getBpm();
      }
    });

    // Load initial state from Yjs
    this.grid = this.sync.getGrid();
    this.bpm = this.sync.getBpm();

    // Listen to remote grid changes
    this.sync.onGridChange((row, col, value) => {
      this.grid[row][col] = value;
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

  toggle(row: number, col: number) {
    this.grid[row][col] = !this.grid[row][col];

    // Sync to other users if collaborative mode is enabled
    if (this.sync) {
      this.sync.toggleCell(row, col);
    }
  }

  isActive(row: number, col: number) {
    return this.grid[row][col];
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
    for (let row = 0; row < 8; row++) {
      if (this.grid[row][this.currentStep]) {
        this.audio.play(SAMPLES[row]);
      }
    }
    this.currentStep = (this.currentStep + 1) % 16;
  }

  getSync(): SyncManager | null {
    return this.sync;
  }
}
