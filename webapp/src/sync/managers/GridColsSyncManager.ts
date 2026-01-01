/**
 * Manager for grid column count synchronization
 */

import * as Y from 'yjs';
import { ObservableSync } from '../utils/ObservableSync';
import { ConnectionStatus } from '../types';
import type { GridColumnCount } from '../../types';

export class GridColsSyncManager extends ObservableSync<GridColumnCount> {
  private ydoc: Y.Doc;

  constructor(ydoc: Y.Doc, gridColsMap: Y.Map<unknown>) {
    super(gridColsMap, 'value');
    this.ydoc = ydoc;
  }

  /**
   * Get current grid column count
   */
  get(): GridColumnCount {
    return (this.map.get(this.key) as GridColumnCount) || 16;
  }

  /**
   * Set grid column count (marked as local change)
   */
  set(value: GridColumnCount): void {
    this.ydoc.transact(() => {
      this.map.set(this.key, value);
    }, 'local');
  }

  /**
   * Listen to grid column count changes from remote users
   */
  onGridColsChange(callback: (value: GridColumnCount) => void, onConnectionChange?: (cb: (status: ConnectionStatus) => void) => void): void {
    this.onChange(callback, onConnectionChange);
  }
}
