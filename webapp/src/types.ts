export type InstrumentType = 'drums' | 'lead';

export type GridColumnCount = 16 | 32 | 64 | 8;

export const GRID_COLUMN_COUNTS: GridColumnCount[] = [16, 32];

export interface InstrumentSample {
  name: string;
  path: string;
}

export interface InstrumentConfig {
  id: string;
  type: InstrumentType;
  name: string;
  samples: InstrumentSample[];
  gridRows: number;
  gridCols: number;
  parameters: InstrumentParameters;
}

export interface InstrumentParameters {
  volume?: number;
  [key: string]: unknown;
}

export type SynthType = 'Jump' | 'Polly' | 'Tiny';
export type Lead2SynthType = 'ElectricCello' | 'Kalimba' | 'ThinSaws';
export type BassType = 'Guitar' | 'Bassy' | 'Lectric';

export interface InstrumentState {
  grid: boolean[][];
  parameters: InstrumentParameters;
  currentKit?: string;
}

export const DRUM_SAMPLES = [
  'kick', 'snare', 'hihat', 'openhat', 'clap', 'boom', 'ride', 'tink'
];

export const LEAD_NOTES = [
  'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
  'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
  'C4'
];

export const BASS_NOTES = [
  'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1', 'G1', 'G#1', 'A1', 'A#1', 'B1',
  'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
  'C3'
];

export const KITS = ['kit_cr78', 'kit_real', 'kit_80s', 'kit_lofi'];

export const SYNTH_TYPES: SynthType[] = ['Jump', 'Polly', 'Tiny'];
export const LEAD2_SYNTH_TYPES: Lead2SynthType[] = ['ElectricCello', 'Kalimba', 'ThinSaws'];
export const BASS_TYPES: BassType[] = ['Guitar', 'Bassy', 'Lectric'];

export const INSTRUMENTS: { [key: string]: InstrumentConfig } = {
  drums: {
    id: 'drums',
    type: 'drums',
    name: 'Drums',
    samples: DRUM_SAMPLES.map(name => ({ name, path: '' })),
    gridRows: 8,
    gridCols: 16,
    parameters: {
      volume: 0.7,
    }
  },
  lead1: {
    id: 'lead1',
    type: 'lead',
    name: 'Lead 1',
    samples: LEAD_NOTES.map(note => ({ name: note, path: '' })),
    gridRows: 25,
    gridCols: 16,
    parameters: {
      volume: 0.5,
      synthType: 'Jump',
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.3,
      cutoff: 2000,
      resonance: 1,
    }
  },
  lead2: {
    id: 'lead2',
    type: 'lead',
    name: 'Lead 2',
    samples: LEAD_NOTES.map(note => ({ name: note, path: '' })),
    gridRows: 25,
    gridCols: 16,
    parameters: {
      volume: 0.5,
      synthType: 'ElectricCello',
      attack: 0.2,
      decay: 0.3,
      sustain: 0.1,
      release: 1.2,
      cutoff: 2000,
      resonance: 1,
    }
  },
  bass: {
    id: 'bass',
    type: 'lead',
    name: 'Bass',
    samples: BASS_NOTES.map(note => ({ name: note, path: '' })),
    gridRows: 25,
    gridCols: 16,
    parameters: {
      volume: 0.5,
      bassType: 'Guitar',
      attack: 0.01,
      decay: 0.1,
      sustain: 0.4,
      release: 2,
    }
  }
};
