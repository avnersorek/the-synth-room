/**
 * Manager for bass type synchronization
 */

import * as Y from 'yjs';
import { InstrumentTypeSyncManager } from './InstrumentTypeSyncManager';
import { ConnectionStatus } from '../types';

export class BassTypeSyncManager extends InstrumentTypeSyncManager {
  constructor(ydoc: Y.Doc, bassTypeMap: Y.Map<unknown>) {
    super(ydoc, bassTypeMap, 'Guitar', 'Bass');
  }

  /**
   * Listen to bass type changes from remote users
   */
  onBassTypeChange(callback: (type: string) => void, onConnectionChange?: (cb: (status: ConnectionStatus) => void) => void): void {
    this.onTypeChange(callback, onConnectionChange);
  }
}
