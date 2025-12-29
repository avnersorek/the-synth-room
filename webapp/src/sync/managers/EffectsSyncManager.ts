/**
 * Manager for per-instrument effect send synchronization
 */

import * as Y from 'yjs';
import { INSTRUMENTS } from '../../types';
import { ConnectionStatus } from '../types';

export class EffectsSyncManager {
  private ydoc: Y.Doc;
  private instruments: Y.Map<unknown>;

  constructor(ydoc: Y.Doc, instruments: Y.Map<unknown>) {
    this.ydoc = ydoc;
    this.instruments = instruments;
  }

  /**
   * Get effect send value for a specific instrument
   */
  getEffectSend(instrumentId: string): number {
    const instrument = this.instruments.get(instrumentId) as Y.Map<unknown>;
    if (!instrument) {
      return 0; // Default: no effect send
    }

    const effectSend = instrument.get('effectSend') as number;
    if (effectSend === undefined || effectSend === null) {
      return 0; // Default: no effect send
    }

    return effectSend;
  }

  /**
   * Set effect send value for a specific instrument (marked as local change)
   */
  setEffectSend(instrumentId: string, value: number): void {
    const instrument = this.instruments.get(instrumentId) as Y.Map<unknown>;
    if (!instrument) {
      console.warn(`Instrument ${instrumentId} not found`);
      return;
    }

    this.ydoc.transact(() => {
      instrument.set('effectSend', value);
    }, 'local');
  }

  /**
   * Listen to effect send changes from remote users for all instruments
   */
  onEffectSendChange(
    callback: (instrumentId: string, value: number) => void,
    onConnectionChange?: (cb: (status: ConnectionStatus) => void) => void
  ): void {
    const setupObservers = () => {
      // Observe effect send changes for each instrument
      Object.keys(INSTRUMENTS).forEach((instrumentId) => {
        const instrument = this.instruments.get(instrumentId) as Y.Map<unknown>;
        if (!instrument) {return;}

        // Observe changes to the instrument map
        instrument.observe((event) => {
          // Don't trigger callback for local changes
          if (event.transaction.origin === 'local') {return;}

          // Check if effectSend changed
          const changes = event.changes.keys;
          if (changes.has('effectSend')) {
            const value = (instrument.get('effectSend') as number) ?? 0;
            console.log(`Effect send change detected for ${instrumentId}: ${value}`);
            callback(instrumentId, value);
          }
        });
      });
    };

    // Set up observers immediately
    setupObservers();

    // Also set up observers after sync completes (in case instruments weren't ready)
    if (onConnectionChange) {
      onConnectionChange((status: ConnectionStatus) => {
        if (status.synced) {
          console.log('Sync completed, setting up effect send observers');
          setupObservers();
        }
      });
    }
  }
}
