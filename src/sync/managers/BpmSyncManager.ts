/**
 * Manager for BPM synchronization
 */

import * as Y from 'yjs';
import { ObservableSync } from '../utils/ObservableSync';

export class BpmSyncManager extends ObservableSync<number> {
  private ydoc: Y.Doc;

  constructor(ydoc: Y.Doc, bpmMap: Y.Map<any>) {
    super(bpmMap, 'value');
    this.ydoc = ydoc;
  }

  /**
   * Get current BPM
   */
  get(): number {
    return this.map.get(this.key) || 120;
  }

  /**
   * Set BPM (marked as local change)
   */
  set(value: number): void {
    this.ydoc.transact(() => {
      this.map.set(this.key, value);
    }, 'local');
  }

  /**
   * Listen to BPM changes from remote users
   */
  onBpmChange(callback: (value: number) => void, onConnectionChange?: (cb: any) => void): void {
    this.onChange(callback, onConnectionChange);
  }
}
