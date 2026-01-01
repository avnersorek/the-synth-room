import { InstrumentConfig, InstrumentParameters, InstrumentState, BassType, SynthType, Lead2SynthType } from './types';
import { AudioEngine } from './audio';

/**
 * Helper to create a 2D boolean array with proper typing
 */
function createGrid(rows: number, cols: number): boolean[][] {
  const grid: boolean[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < cols; j++) {
      row.push(false);
    }
    grid.push(row);
  }
  return grid;
}

export class Instrument {
  private config: InstrumentConfig;
  private state: InstrumentState;
  private audio: AudioEngine;

  constructor(config: InstrumentConfig, audio: AudioEngine) {
    this.config = config;
    this.audio = audio;
    this.state = {
      grid: createGrid(config.gridRows, config.gridCols),
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
      const newGrid = createGrid(this.config.gridRows, this.config.gridCols);

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

  updateGridCols(newCols: number): void {
    const oldGrid = this.state.grid;
    const oldCols = this.config.gridCols;
    const rows = this.config.gridRows;

    // Create new grid with resized data
    const newGrid = createGrid(rows, newCols);

    // Copy overlapping data
    const overlapCols = Math.min(oldCols, newCols);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < overlapCols; col++) {
        newGrid[row][col] = oldGrid[row][col];
      }
      // If expanding, remaining cells are already false
      // If shrinking, columns beyond overlap are discarded
    }

    // Update config and state
    this.config.gridCols = newCols;
    this.state.grid = newGrid;
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

  setParameter(key: string, value: unknown): void {
    this.state.parameters[key] = value;
  }

  /**
   * Helper to safely get bass type from parameters
   */
  private getBassType(): BassType {
    const bassType = this.state.parameters['bassType'];
    if (typeof bassType === 'string' && (bassType === 'Guitar' || bassType === 'Bassy' || bassType === 'Lectric')) {
      return bassType as BassType;
    }
    return 'Guitar'; // Default
  }

  /**
   * Helper to safely get synth type from parameters
   */
  private getSynthType(): SynthType | Lead2SynthType {
    const synthType = this.state.parameters['synthType'];
    // Check if it's a valid SynthType or Lead2SynthType
    if (typeof synthType === 'string') {
      if (synthType === 'Jump' || synthType === 'Polly' || synthType === 'Tiny') {
        return synthType as SynthType;
      }
      if (synthType === 'ElectricCello' || synthType === 'Kalimba' || synthType === 'ThinSaws') {
        return synthType as Lead2SynthType;
      }
    }
    return 'Jump'; // Default
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

  loadSamples(kitName?: string): void {
    const samples = this.config.samples;

    if (this.config.type === 'drums' && kitName) {
      // For drums, load from kit folder
      samples.forEach((sample) => {
        const path = `/sounds/${kitName}/${sample.name}.wav`;
        this.audio.loadSample(sample.name, path, this.config.id);
      });
      this.state.currentKit = kitName;
    } else if (this.config.type === 'lead') {
      // For bass, create a MonoSynth with bass type
      if (this.config.id === 'bass') {
        const bassType = this.getBassType();
        this.audio.createBassMonoSynth(this.config.id, bassType);
        console.log(`Bass instrument ${this.config.id} ready with ${bassType} preset`);
      } else {
        // For other lead synths, create the poly synth
        const synthType = this.getSynthType();
        this.audio.createSynth(this.config.id, synthType);
        console.log(`Lead instrument ${this.config.id} ready (synthesis mode)`);
      }
    }
  }

  getState(): InstrumentState {
    return this.state;
  }

  setState(state: InstrumentState): void {
    this.state = state;
  }
}
