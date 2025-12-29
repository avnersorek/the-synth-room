/**
 * Manages all instrument UI updates using iteration
 * Eliminates repetitive code by iterating over instruments
 */

import { InstrumentRegistry } from './InstrumentRegistry';

export class InstrumentUIManager {
  private registry: InstrumentRegistry;
  private container: HTMLElement;

  constructor(registry: InstrumentRegistry, container: HTMLElement) {
    this.registry = registry;
    this.container = container;
  }

  /**
   * Attach events for all instruments
   * Replaces repetitive attachInstrumentEvents method
   */
  attachAllInstrumentEvents(): void {
    this.registry.getAllInstruments().forEach((instrument, instrumentId) => {
      const instrumentContainer = this.getInstrumentContainer(instrumentId);
      if (instrumentContainer) {
        instrument.attachEvents(instrumentContainer);
        instrument.updateGridDisplay(instrumentContainer);
      }
    });
  }

  /**
   * Update grid displays for all instruments
   * Replaces repetitive updateGridDisplay method
   */
  updateAllGridDisplays(): void {
    this.registry.getAllInstruments().forEach((instrument, instrumentId) => {
      const instrumentContainer = this.getInstrumentContainer(instrumentId);
      if (instrumentContainer) {
        instrument.updateGridDisplay(instrumentContainer);
      }
    });
  }

  /**
   * Update volume displays for all instruments
   * Replaces repetitive updateVolumeDisplays method
   */
  updateAllVolumeDisplays(): void {
    this.registry.getAllInstruments().forEach((instrument, instrumentId) => {
      const instrumentContainer = this.getInstrumentContainer(instrumentId);
      if (instrumentContainer) {
        instrument.updateVolumeDisplay(instrumentContainer);
      }
    });
  }

  /**
   * Update effect send displays for all instruments
   * Replaces repetitive updateEffectSendDisplays method
   */
  updateAllEffectSendDisplays(): void {
    this.registry.getAllInstruments().forEach((instrument, instrumentId) => {
      const instrumentContainer = this.getInstrumentContainer(instrumentId);
      if (instrumentContainer) {
        instrument.updateEffectSendDisplay(instrumentContainer);
      }
    });
  }

  /**
   * Get the container element for a specific instrument
   */
  private getInstrumentContainer(instrumentId: string): HTMLElement | null {
    return this.container.querySelector(
      `[data-instrument-id="${instrumentId}"] .instrument-card-content`
    ) as HTMLElement;
  }
}
