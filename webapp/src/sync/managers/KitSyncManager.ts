/**
 * Manager for kit synchronization
 */

import * as Y from 'yjs';
import { ObservableSync } from '../utils/ObservableSync';

export class KitSyncManager extends ObservableSync<string> {
  private ydoc: Y.Doc;

  constructor(ydoc: Y.Doc, kitMap: Y.Map<any>) {
    super(kitMap, 'name');
    this.ydoc = ydoc;
  }

  /**
   * Get current kit name
   */
  get(): string {
    return this.map.get(this.key) || 'kit_a';
  }

  /**
   * Set kit name (marked as local change)
   */
  set(kitName: string): void {
    console.log(`setKit called with: ${kitName}`);
    this.ydoc.transact(() => {
      this.map.set(this.key, kitName);
    }, 'local');
  }

  /**
   * Listen to kit changes from remote users
   */
  onKitChange(callback: (kitName: string) => void, onConnectionChange?: (cb: any) => void): void {
    this.onChange(callback, onConnectionChange);
  }
}
