/**
 * Manager for synth type synchronization
 */

import * as Y from 'yjs';
import { ObservableSync } from '../utils/ObservableSync';

export class SynthTypeSyncManager extends ObservableSync<string> {
  private ydoc: Y.Doc;

  constructor(ydoc: Y.Doc, synthTypeMap: Y.Map<any>) {
    super(synthTypeMap, 'type');
    this.ydoc = ydoc;
  }

  /**
   * Get current synth type
   */
  get(): string {
    return this.map.get(this.key) || 'Synth';
  }

  /**
   * Set synth type (marked as local change)
   */
  set(type: string): void {
    console.log(`setSynthType called with: ${type}`);
    this.ydoc.transact(() => {
      this.map.set(this.key, type);
    }, 'local');
  }

  /**
   * Listen to synth type changes from remote users
   */
  onSynthTypeChange(callback: (type: string) => void, onConnectionChange?: (cb: any) => void): void {
    this.onChange(callback, onConnectionChange);
  }
}
