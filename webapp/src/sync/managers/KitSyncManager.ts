/**
 * Manager for kit synchronization
 */

import * as Y from 'yjs';
import { ObservableSync } from '../utils/ObservableSync';
import { ConnectionStatus } from '../types';

export class KitSyncManager extends ObservableSync<string> {
  private ydoc: Y.Doc;

  constructor(ydoc: Y.Doc, kitMap: Y.Map<unknown>) {
    super(kitMap, 'name');
    this.ydoc = ydoc;
  }

  /**
   * Get current kit name
   */
  get(): string {
    return this.map.get(this.key) as string || 'kit_a';
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
  onKitChange(callback: (kitName: string) => void, onConnectionChange?: (cb: (status: ConnectionStatus) => void) => void): void {
    this.onChange(callback, onConnectionChange);
  }
}
