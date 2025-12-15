export type InstrumentType = 'drums' | 'lead';

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
  [key: string]: any;
}

export interface DrumParameters extends InstrumentParameters {
  volume: number;
}

export interface LeadParameters extends InstrumentParameters {
  volume: number;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  cutoff?: number;
  resonance?: number;
}

export interface InstrumentState {
  grid: boolean[][];
  parameters: InstrumentParameters;
  currentKit?: string;
}

export const DRUM_SAMPLES = [
  'kick', 'snare', 'hihat', 'openhat', 'clap', 'boom', 'ride', 'tink'
];

export const LEAD_NOTES = [
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'
];

export const KITS = ['kit_a', 'kit_b', 'kit_c'];

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
    gridRows: 8,
    gridCols: 16,
    parameters: {
      volume: 0.5,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.3,
      cutoff: 2000,
      resonance: 1,
    }
  }
};
