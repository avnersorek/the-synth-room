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
    // Validate grid dimensions match config
    if (grid.length !== this.config.gridRows ||
        (grid.length > 0 && grid[0].length !== this.config.gridCols)) {
      console.warn(`Grid dimension mismatch for ${this.config.id}. Expected ${this.config.gridRows}x${this.config.gridCols}, got ${grid.length}x${grid[0]?.length || 0}. Recreating grid.`);

      // Create a new grid with correct dimensions
      const newGrid = Array(this.config.gridRows)
        .fill(null)
        .map(() => Array(this.config.gridCols).fill(false));

      // Copy over valid data from old grid
      for (let row = 0; row < Math.min(grid.length, this.config.gridRows); row++) {
        for (let col = 0; col < Math.min(grid[row]?.length || 0, this.config.gridCols); col++) {
          newGrid[row][col] = grid[row][col];
        }
      }

      this.state.grid = newGrid;
    } else {
      this.state.grid = grid;
    }
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

  playStep(step: number, time?: number): void {
    for (let row = 0; row < this.config.gridRows; row++) {
      if (this.state.grid[row][step]) {
        if (this.config.type === 'drums') {
          const sampleName = this.config.samples[row].name;
          this.audio.play(sampleName, time);
        } else if (this.config.type === 'lead') {
          // For lead instruments, only trigger note at the START of a span
          const isStartOfSpan = step === 0 || !this.state.grid[row][step - 1];

          if (isStartOfSpan) {
            // Calculate span duration by counting consecutive active beats
            let spanLength = 1;
            for (let i = step + 1; i < this.config.gridCols; i++) {
              if (this.state.grid[row][i]) {
                spanLength++;
              } else {
                break;
              }
            }

            const duration = `0:0:${spanLength}`; //BARS:QUARTERS:SIXTEENTHS
            const noteName = this.config.samples[row].name;
            this.audio.playNote(this.config.id, noteName, time, duration);
          }
          // If not start of span, do nothing (note continues playing)
        }
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
      // For lead synth, create the synth
      const synthType = (this.state.parameters as any).synthType || 'Synth';
      this.audio.createSynth(this.config.id, synthType);
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
