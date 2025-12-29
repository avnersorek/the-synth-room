/**
 * Coordinates sync listeners for instrument-related changes
 * Replaces repetitive if/else chains with registry-based dispatch
 */

import { InstrumentRegistry } from './InstrumentRegistry';
import { SyncUIManager } from './SyncUIManager';
import { Sequencer } from '../../sequencer';

export class InstrumentSyncCoordinator {
  private registry: InstrumentRegistry;
  private container: HTMLElement;
  private sequencer: Sequencer;

  constructor(
    registry: InstrumentRegistry,
    container: HTMLElement,
    sequencer: Sequencer
  ) {
    this.registry = registry;
    this.container = container;
    this.sequencer = sequencer;
  }

  /**
   * Setup listener for remote grid changes
   */
  setupGridChangeListener(syncUIManager: SyncUIManager): void {
    syncUIManager.setupGridChangeListener((instrumentId, row, col, value) => {
      const instrumentContainer = this.getInstrumentContainer(instrumentId);
      if (instrumentContainer) {
        const cell = instrumentContainer.querySelector(
          `.cell[data-row="${row}"][data-col="${col}"]`
        );
        if (cell) {
          cell.classList.toggle('active', value);
        } else {
          console.warn(`UI: Cell not found for [${row}, ${col}]`);
        }
      }
    });
  }

  /**
   * Setup listener for remote volume changes
   */
  setupVolumeChangeListener(syncUIManager: SyncUIManager): void {
    syncUIManager.setupVolumeChangeListener((instrumentId, _value) => {
      const instrument = this.registry.getInstrument(instrumentId);
      const instrumentContainer = this.getInstrumentContainer(instrumentId);
      if (instrument && instrumentContainer) {
        instrument.updateVolumeDisplay(instrumentContainer);
      }
    });
  }

  /**
   * Setup listener for remote effect send changes
   */
  setupEffectSendChangeListener(syncUIManager: SyncUIManager): void {
    syncUIManager.setupEffectSendChangeListener((instrumentId, _value) => {
      const instrument = this.registry.getInstrument(instrumentId);
      const instrumentContainer = this.getInstrumentContainer(instrumentId);
      if (instrument && instrumentContainer) {
        instrument.updateEffectSendDisplay(instrumentContainer);
      }
    });
  }

  /**
   * Setup listener for step updates (playback position)
   */
  setupStepUpdateListener(): void {
    this.sequencer.onStep((currentStep: number) => {
      this.registry.getAllInstruments().forEach((instrument, instrumentId) => {
        const instrumentContainer = this.getInstrumentContainer(instrumentId);
        if (instrumentContainer) {
          instrument.updateCurrentStep(instrumentContainer, currentStep);
        }
      });
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
