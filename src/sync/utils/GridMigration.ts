/**
 * Grid migration utilities for handling dimension changes
 */

import * as Y from 'yjs';
import { INSTRUMENTS } from '../../types';

export class GridMigration {
  /**
   * Migrate existing grids to match current config dimensions
   * This is needed when the config changes (e.g., lead1 went from 8 to 25 rows)
   */
  static migrateGridDimensions(ydoc: Y.Doc, instruments: Y.Map<any>): void {
    Object.keys(INSTRUMENTS).forEach((instrumentId) => {
      const config = INSTRUMENTS[instrumentId];
      const instrument = instruments.get(instrumentId) as Y.Map<any>;

      if (!instrument) {
        console.log(`Migration: Instrument ${instrumentId} not found, will be created on next init`);
        return;
      }

      const grid = instrument.get('grid') as Y.Array<Y.Array<number>>;
      if (!grid) {
        console.log(`Migration: Grid for ${instrumentId} not found`);
        return;
      }

      const currentRows = grid.length;
      const currentCols = grid.length > 0 ? grid.get(0).length : 0;
      const targetRows = config.gridRows;
      const targetCols = config.gridCols;

      console.log(`Migration: ${instrumentId} - current: ${currentRows}x${currentCols}, target: ${targetRows}x${targetCols}`);

      // Expand rows if needed
      if (currentRows < targetRows) {
        console.log(`Migration: Expanding ${instrumentId} from ${currentRows} to ${targetRows} rows`);
        ydoc.transact(() => {
          for (let i = currentRows; i < targetRows; i++) {
            const row = new Y.Array<number>();
            for (let j = 0; j < targetCols; j++) {
              row.push([0]);
            }
            grid.push([row]);
          }
        }, 'migration');
      }

      // Expand columns if needed (for all rows including newly added ones)
      if (currentCols < targetCols) {
        console.log(`Migration: Expanding ${instrumentId} columns from ${currentCols} to ${targetCols}`);
        ydoc.transact(() => {
          for (let i = 0; i < grid.length; i++) {
            const row = grid.get(i);
            const rowLength = row.length;
            for (let j = rowLength; j < targetCols; j++) {
              row.push([0]);
            }
          }
        }, 'migration');
      }
    });
  }
}
