import { AudioEngine } from './audio';

export const SAMPLES = [
  'kick', 'snare', 'hihat', 'openhat', 'clap', 'boom', 'ride', 'tink'
];

export class Sequencer {
  private audio: AudioEngine;
  private grid: boolean[][];
  private currentStep: number;
  private intervalId: number | null;
  private bpm: number;

  constructor(audio: AudioEngine) {
    this.audio = audio;
    this.grid = Array(8).fill(null).map(() => Array(16).fill(false));
    this.currentStep = 0;
    this.intervalId = null;
    this.bpm = 120;
  }

  toggle(row: number, col: number) {
    this.grid[row][col] = !this.grid[row][col];
  }

  isActive(row: number, col: number) {
    return this.grid[row][col];
  }

  setBpm(bpm: number) {
    const wasPlaying = this.intervalId !== null;
    if (wasPlaying) this.stop();
    this.bpm = bpm;
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
}
