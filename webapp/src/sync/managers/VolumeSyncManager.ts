/**
 * Manager for per-instrument volume synchronization
 */

import * as Y from 'yjs';
import { INSTRUMENTS } from '../../types';
import { ConnectionStatus } from '../types';

export class VolumeSyncManager {
  private ydoc: Y.Doc;
  private instruments: Y.Map<unknown>;

  constructor(ydoc: Y.Doc, instruments: Y.Map<unknown>) {
    this.ydoc = ydoc;
    this.instruments = instruments;
  }

  /**
   * Get volume for a specific instrument
   */
  getVolume(instrumentId: string): number {
    const instrument = this.instruments.get(instrumentId) as Y.Map<unknown>;
    if (!instrument) {
      // Return default volume from config
      const config = INSTRUMENTS[instrumentId];
      return config?.parameters.volume ?? 0.5;
    }

    const volume = instrument.get('volume') as number;
    if (volume === undefined || volume === null) {
      // Return default volume from config
      const config = INSTRUMENTS[instrumentId];
      return config?.parameters.volume ?? 0.5;
    }

    return volume;
  }

  /**
   * Set volume for a specific instrument (marked as local change)
   */
  setVolume(instrumentId: string, value: number): void {
    const instrument = this.instruments.get(instrumentId) as Y.Map<unknown>;
    if (!instrument) {
      console.warn(`Instrument ${instrumentId} not found`);
      return;
    }

    this.ydoc.transact(() => {
      instrument.set('volume', value);
    }, 'local');
  }

  /**
   * Listen to volume changes from remote users for all instruments
   */
  onVolumeChange(
    callback: (instrumentId: string, value: number) => void,
    onConnectionChange?: (cb: (status: ConnectionStatus) => void) => void
  ): void {
    const setupObservers = () => {
      // Observe volume changes for each instrument
      Object.keys(INSTRUMENTS).forEach((instrumentId) => {
        const instrument = this.instruments.get(instrumentId) as Y.Map<unknown>;
        if (!instrument) {return;}

        // Observe changes to the instrument map
        instrument.observe((event) => {
          // Don't trigger callback for local changes
          if (event.transaction.origin === 'local') {return;}

          // Check if volume changed
          const changes = event.changes.keys;
          if (changes.has('volume')) {
            const value = instrument.get('volume') as number;
            console.log(`Volume change detected for ${instrumentId}: ${value}`);
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
          console.log('Sync completed, setting up volume observers');
          setupObservers();
        }
      });
    }
  }
}
