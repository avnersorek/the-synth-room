/**
 * Generic manager for instrument type synchronization
 * Base class for SynthTypeSyncManager and BassTypeSyncManager to eliminate duplication
 */

import * as Y from 'yjs';
import { ObservableSync } from '../utils/ObservableSync';
import { ConnectionStatus } from '../types';

export class InstrumentTypeSyncManager extends ObservableSync<string> {
  private ydoc: Y.Doc;
  private defaultValue: string;
  private instrumentName: string;

  constructor(ydoc: Y.Doc, typeMap: Y.Map<unknown>, defaultValue: string, instrumentName: string) {
    super(typeMap, 'type');
    this.ydoc = ydoc;
    this.defaultValue = defaultValue;
    this.instrumentName = instrumentName;
  }

  /**
   * Get current instrument type
   */
  get(): string {
    return this.map.get(this.key) as string || this.defaultValue;
  }

  /**
   * Set instrument type (marked as local change)
   */
  set(type: string): void {
    console.log(`set${this.instrumentName}Type called with: ${type}`);
    this.ydoc.transact(() => {
      this.map.set(this.key, type);
    }, 'local');
  }

  /**
   * Listen to instrument type changes from remote users
   */
  onTypeChange(callback: (type: string) => void, onConnectionChange?: (cb: (status: ConnectionStatus) => void) => void): void {
    this.onChange(callback, onConnectionChange);
  }
}
