/**
 * Base class for observable sync properties
 * Eliminates duplication of observer pattern setup across BPM, Kit, and SynthType managers
 */

import * as Y from 'yjs';
import { ConnectionStatus } from '../types';

export abstract class ObservableSync<T> {
  protected map: Y.Map<any>;
  protected key: string;
  protected onConnectionChangeCallbacks: ((status: ConnectionStatus) => void)[] = [];

  constructor(map: Y.Map<any>, key: string) {
    this.map = map;
    this.key = key;
  }

  /**
   * Get the current value
   */
  abstract get(): T;

  /**
   * Set a new value (marked as local change)
   */
  abstract set(value: T): void;

  /**
   * Observe changes from remote users
   * @param callback Function to call when remote changes occur
   * @param onConnectionChange Optional callback to register for connection status changes
   */
  onChange(callback: (value: T) => void, onConnectionChange?: (cb: (status: ConnectionStatus) => void) => void): void {
    const setupObserver = () => {
      console.log(`Setting up ${this.key} observer on`, this.map);
      this.map.observe((event) => {
        console.log(`${this.key} change event:`, event.transaction.origin, this.map.get(this.key));
        // Don't trigger callback for local changes
        if (event.transaction.origin === 'local') return;

        const value = this.get();
        if (value !== undefined && value !== null) {
          console.log(`on${this.key}Change: Calling callback with ${this.key} "${value}"`);
          callback(value);
        }
      });
    };

    // Set up observer immediately
    setupObserver();

    // Also set up observer after sync completes (to handle new reference)
    if (onConnectionChange) {
      onConnectionChange((status: ConnectionStatus) => {
        if (status.synced) {
          console.log(`Sync completed, re-setting up ${this.key} observer`);
          setupObserver();
        }
      });
    }
  }
}
