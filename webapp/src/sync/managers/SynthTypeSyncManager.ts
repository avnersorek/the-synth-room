/**
 * Manager for synth type synchronization
 */

import * as Y from 'yjs';
import { InstrumentTypeSyncManager } from './InstrumentTypeSyncManager';
import { ConnectionStatus } from '../types';

export class SynthTypeSyncManager extends InstrumentTypeSyncManager {
  constructor(ydoc: Y.Doc, synthTypeMap: Y.Map<unknown>) {
    super(ydoc, synthTypeMap, 'Synth', 'Synth');
  }

  /**
   * Listen to synth type changes from remote users
   */
  onSynthTypeChange(callback: (type: string) => void, onConnectionChange?: (cb: (status: ConnectionStatus) => void) => void): void {
    this.onTypeChange(callback, onConnectionChange);
  }
}
