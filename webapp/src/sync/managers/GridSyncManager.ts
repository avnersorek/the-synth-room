/**
 * Manager for grid synchronization across all instruments
 */

import * as Y from 'yjs';
import { INSTRUMENTS } from '../../types';
import { ConnectionStatus } from '../types';

/**
 * Yjs delta change interface (since Yjs doesn't export proper types for this)
 * Note: insert can be string, number, array, or other types depending on the Y.Array content type
 */
interface YjsDeltaChange {
  retain?: number;
  delete?: number;
  insert?: unknown;
}

/**
 * Helper to create a 2D boolean array with proper typing
 */
function createGridFromYjs(rows: number, cols: number): boolean[][] {
  const grid: boolean[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < cols; j++) {
      row.push(false);
    }
    grid.push(row);
  }
  return grid;
}

export class GridSyncManager {
  private ydoc: Y.Doc;
  private instruments: Y.Map<unknown>;

  constructor(ydoc: Y.Doc, instruments: Y.Map<unknown>) {
    this.ydoc = ydoc;
    this.instruments = instruments;
  }

  /**
   * Get current grid state for an instrument
   */
  getGrid(instrumentId: string): boolean[][] {
    // Get dimensions from instrument config
    const config = INSTRUMENTS[instrumentId];
    const defaultRows = config?.gridRows || 8;
    const defaultCols = config?.gridCols || 16;

    const instrument = this.instruments.get(instrumentId) as Y.Map<unknown>;
    if (!instrument) {
      return createGridFromYjs(defaultRows, defaultCols);
    }

    const grid = instrument.get('grid') as Y.Array<Y.Array<number>>;
    if (!grid) {
      return createGridFromYjs(defaultRows, defaultCols);
    }

    const result: boolean[][] = [];
    for (let i = 0; i < grid.length; i++) {
      const row = grid.get(i);
      const rowArray: boolean[] = [];
      for (let j = 0; j < row.length; j++) {
        rowArray.push(row.get(j) === 1);
      }
      result.push(rowArray);
    }
    return result;
  }

  /**
   * Toggle a grid cell
   */
  toggleCell(instrumentId: string, row: number, col: number): void {
    const instrument = this.instruments.get(instrumentId) as Y.Map<unknown>;
    if (!instrument) {
      console.warn(`Instrument ${instrumentId} not found`);
      return;
    }

    const grid = instrument.get('grid') as Y.Array<Y.Array<number>>;
    if (!grid || grid.length === 0) {
      console.warn('Grid not initialized yet, skipping toggle');
      return;
    }

    const rowArray = grid.get(row);
    if (!rowArray) {
      console.warn(`Row ${row} not found in grid`);
      return;
    }

    // Use a transaction with origin to mark this as a local change
    const currentValue = rowArray.get(col);
    console.log(`toggleCell[${instrumentId}, ${row}, ${col}]: ${currentValue} -> ${currentValue === 1 ? 0 : 1}`);

    this.ydoc.transact(() => {
      rowArray.delete(col, 1);
      rowArray.insert(col, [currentValue === 1 ? 0 : 1]);
    }, 'local');
  }

  /**
   * Resize grid to match new column count
   */
  resizeGrid(instrumentId: string, newColCount: number): void {
    const instrument = this.instruments.get(instrumentId) as Y.Map<unknown>;
    if (!instrument) {
      console.warn(`Instrument ${instrumentId} not found`);
      return;
    }

    const grid = instrument.get('grid') as Y.Array<Y.Array<number>>;
    if (!grid || grid.length === 0) {
      console.warn(`Grid not initialized for ${instrumentId}`);
      return;
    }

    this.ydoc.transact(() => {
      // Resize each row
      for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
        const rowArray = grid.get(rowIndex);
        const currentCols = rowArray.length;

        if (newColCount > currentCols) {
          // Add new columns (fill with 0)
          for (let col = currentCols; col < newColCount; col++) {
            rowArray.push([0]);
          }
        } else if (newColCount < currentCols) {
          // Remove columns from the end
          rowArray.delete(newColCount, currentCols - newColCount);
        }
      }
    }, 'local');
  }

  /**
   * Set entire grid state (for initialization)
   */
  setGrid(instrumentId: string, grid: boolean[][]): void {
    const instrument = this.instruments.get(instrumentId) as Y.Map<unknown>;
    if (!instrument) {
      console.warn(`Instrument ${instrumentId} not found`);
      return;
    }

    const gridArray = instrument.get('grid') as Y.Array<Y.Array<number>>;
    if (!gridArray) {return;}

    // Use the actual grid dimensions from config instead of hardcoded values
    const config = INSTRUMENTS[instrumentId];
    const maxRows = config?.gridRows || gridArray.length;
    const maxCols = config?.gridCols || 16;

    this.ydoc.transact(() => {
      for (let i = 0; i < Math.min(grid.length, maxRows); i++) {
        const rowArray = gridArray.get(i);
        for (let j = 0; j < Math.min(grid[i].length, maxCols); j++) {
          rowArray.delete(j, 1);
          rowArray.insert(j, [grid[i][j] ? 1 : 0]);
        }
      }
    }, 'local');
  }

  /**
   * Listen to grid changes from remote users
   */
  onGridChange(callback: (instrumentId: string, row: number, col: number, value: boolean) => void, onConnectionChange?: (cb: (status: ConnectionStatus) => void) => void): void {
    const setupObservers = () => {
      // Use Object.keys to get all instruments from config dynamically
      Object.keys(INSTRUMENTS).forEach((instrumentId) => {
        const instrument = this.instruments.get(instrumentId) as Y.Map<unknown>;
        if (!instrument) {return;}

        const grid = instrument.get('grid') as Y.Array<Y.Array<number>>;
        if (!grid || grid.length === 0) {
          console.warn(`Grid not ready for ${instrumentId}`);
          return;
        }

        // Observe changes within each row
        for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
          const rowArray = grid.get(rowIndex);
          if (!rowArray) {continue;}

          rowArray.observe((event) => {
            // Don't trigger callback for local changes (origin === 'local')
            if (event.transaction.origin === 'local') {return;}

            console.log(`Grid change detected in ${instrumentId} row ${rowIndex}`, event.changes.delta);

            // Check what changed in this row using the delta
            let position = 0;
            event.changes.delta.forEach((change: YjsDeltaChange) => {
              if (change.retain !== undefined) {
                // Skip retained items
                position += change.retain;
              } else if (change.delete !== undefined) {
                // Items were deleted - skip to next position
                // position stays the same because items are deleted
              } else if (change.insert !== undefined) {
                // Items were inserted - these are the changes we care about
                const insertedItems = Array.isArray(change.insert) ? change.insert : [change.insert];
                insertedItems.forEach((item: unknown) => {
                  // Validate that item is a number (0 or 1)
                  if (typeof item === 'number') {
                    const value = item === 1;
                    console.log(`Calling callback for cell [${instrumentId}, ${rowIndex}, ${position}] = ${value}`);
                    callback(instrumentId, rowIndex, position, value);
                    position++;
                  }
                });
              }
            });
          });
        }
      });
    };

    // Set up observers immediately
    setupObservers();

    // Also set up observers after sync completes (in case grid wasn't ready)
    if (onConnectionChange) {
      onConnectionChange((status: ConnectionStatus) => {
        if (status.synced) {
          console.log('Sync completed, setting up observers');
          setupObservers();
        }
      });
    }
  }
}
