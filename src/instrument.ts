import { InstrumentConfig, InstrumentParameters, InstrumentState } from './types';
import { AudioEngine } from './audio';

export class Instrument {
  private config: InstrumentConfig;
  private state: InstrumentState;
  private audio: AudioEngine;

  constructor(config: InstrumentConfig, audio: AudioEngine) {
    this.config = config;
    this.audio = audio;
    this.state = {
      grid: Array(config.gridRows)
        .fill(null)
        .map(() => Array(config.gridCols).fill(false)),
      parameters: { ...config.parameters },
    };
  }

  getId(): string {
    return this.config.id;
  }

  getName(): string {
    return this.config.name;
  }

  getConfig(): InstrumentConfig {
    return this.config;
  }

  getGrid(): boolean[][] {
    return this.state.grid;
  }

  setGrid(grid: boolean[][]) {
    this.state.grid = grid;
  }

  toggle(row: number, col: number): void {
    if (row < 0 || row >= this.config.gridRows || col < 0 || col >= this.config.gridCols) {
      return;
    }
    this.state.grid[row][col] = !this.state.grid[row][col];
  }

  isActive(row: number, col: number): boolean {
    if (row < 0 || row >= this.config.gridRows || col < 0 || col >= this.config.gridCols) {
      return false;
    }
    return this.state.grid[row][col];
  }

  getParameters(): InstrumentParameters {
    return this.state.parameters;
  }

  setParameter(key: string, value: any): void {
    this.state.parameters[key] = value;
  }

  getCurrentKit(): string | undefined {
    return this.state.currentKit;
  }

  setCurrentKit(kit: string): void {
    this.state.currentKit = kit;
  }

  playStep(step: number): void {
    for (let row = 0; row < this.config.gridRows; row++) {
      if (this.state.grid[row][step]) {
        const sampleName = this.config.samples[row].name;
        this.audio.play(sampleName);
      }
    }
  }

  async loadSamples(kitName?: string): Promise<void> {
    const samples = this.config.samples;

    if (this.config.type === 'drums' && kitName) {
      // For drums, load from kit folder
      await Promise.all(
        samples.map(async (sample) => {
          const path = `/sounds/${kitName}/${sample.name}.wav`;
          await this.audio.loadSample(sample.name, path);
        })
      );
      this.state.currentKit = kitName;
    } else if (this.config.type === 'lead') {
      // For lead synth, we might load different samples or use synthesis
      // For now, just a placeholder - we'll implement synthesis later
      console.log(`Lead instrument ${this.config.id} ready (synthesis mode)`);
    }
  }

  getState(): InstrumentState {
    return this.state;
  }

  setState(state: InstrumentState): void {
    this.state = state;
  }
}
