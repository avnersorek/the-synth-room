/**
 * Central registry for all instruments
 * Provides unified access and iteration over instruments
 */

import { AbstractGridInstrument } from '../../components/base/AbstractGridInstrument';
import { DrumInstrument } from '../../components/DrumInstrument';
import { LeadInstrument } from '../../components/LeadInstrument';
import { BassInstrument } from '../../components/BassInstrument';

export class InstrumentRegistry {
  private instruments: Map<string, AbstractGridInstrument>;
  private drumInstrument: DrumInstrument;
  private leadInstrument: LeadInstrument;
  private lead2Instrument: LeadInstrument;
  private bassInstrument: BassInstrument;

  constructor(
    drumInstrument: DrumInstrument,
    leadInstrument: LeadInstrument,
    lead2Instrument: LeadInstrument,
    bassInstrument: BassInstrument
  ) {
    this.drumInstrument = drumInstrument;
    this.leadInstrument = leadInstrument;
    this.lead2Instrument = lead2Instrument;
    this.bassInstrument = bassInstrument;

    this.instruments = new Map<string, AbstractGridInstrument>([
      ['drums', drumInstrument as AbstractGridInstrument],
      ['lead1', leadInstrument as AbstractGridInstrument],
      ['lead2', lead2Instrument as AbstractGridInstrument],
      ['bass', bassInstrument as AbstractGridInstrument],
    ]);
  }

  /**
   * Get a specific instrument by ID
   */
  getInstrument(instrumentId: string): AbstractGridInstrument | undefined {
    return this.instruments.get(instrumentId);
  }

  /**
   * Get all instruments as a Map
   */
  getAllInstruments(): Map<string, AbstractGridInstrument> {
    return this.instruments;
  }

  /**
   * Get all instrument IDs
   */
  getInstrumentIds(): string[] {
    return Array.from(this.instruments.keys());
  }

  /**
   * Update a selector for a specific instrument
   * Encapsulates instrument-specific selector logic
   */
  updateSelector(instrumentId: string, container: HTMLElement, value: string): void {
    switch (instrumentId) {
      case 'drums':
        this.drumInstrument.updateKitSelector(container, value);
        break;
      case 'lead1':
        this.leadInstrument.updateSynthSelector(container, value);
        break;
      case 'lead2':
        this.lead2Instrument.updateSynthSelector(container, value);
        break;
      case 'bass':
        this.bassInstrument.updateBassTypeSelector(container, value);
        break;
      default:
        console.warn(`Unknown instrument ID: ${instrumentId}`);
    }
  }

  /**
   * Get instrument content for rendering
   */
  getInstrumentContent(instrumentId: string): string {
    const instrument = this.instruments.get(instrumentId);
    return instrument ? instrument.render() : '';
  }
}
