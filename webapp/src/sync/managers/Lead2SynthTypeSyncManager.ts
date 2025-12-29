/**
 * Manager for Lead 2 synth type synchronization
 */

import * as Y from 'yjs';
import { InstrumentTypeSyncManager } from './InstrumentTypeSyncManager';
import { ConnectionStatus } from '../types';

export class Lead2SynthTypeSyncManager extends InstrumentTypeSyncManager {
  constructor(ydoc: Y.Doc, lead2SynthTypeMap: Y.Map<unknown>) {
    super(ydoc, lead2SynthTypeMap, 'ElectricCello', 'Lead2Synth');
  }

  /**
   * Listen to lead2 synth type changes from remote users
   */
  onLead2SynthTypeChange(callback: (type: string) => void, onConnectionChange?: (cb: (status: ConnectionStatus) => void) => void): void {
    this.onTypeChange(callback, onConnectionChange);
  }
}
