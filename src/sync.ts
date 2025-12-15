import * as Y from 'yjs';
import PartyKitProvider from 'y-partykit/provider';
import { INSTRUMENTS } from './types';

export interface SyncConfig {
  roomId: string;
  partyKitHost: string;
}

export interface ConnectionStatus {
  connected: boolean;
  synced: boolean;
}

export class SyncManager {
  private ydoc: Y.Doc;
  private provider: PartyKitProvider;
  private instruments!: Y.Map<any>;
  private bpm!: Y.Map<any>;
  private kit!: Y.Map<any>;
  private connectionCallbacks: ((status: ConnectionStatus) => void)[] = [];
  private connectionStatus: ConnectionStatus = { connected: false, synced: false };

  constructor(config: SyncConfig) {
    // Initialize Yjs document
    this.ydoc = new Y.Doc();

    // Connect to PartyKit server FIRST before initializing data
    this.provider = new PartyKitProvider(
      config.partyKitHost,
      config.roomId,
      this.ydoc,
      {
        connect: true,
      }
    );

    // Set up connection status listeners
    this.provider.on('status', (event: { status: string }) => {
      this.connectionStatus.connected = event.status === 'connected';
      this.notifyConnectionChange(this.connectionStatus);
    });

    this.provider.on('sync', (synced: boolean) => {
      this.connectionStatus.synced = synced;

      // After sync, refresh our references to ensure we have the latest data
      if (synced) {
        this.refreshReferences();
      }

      this.notifyConnectionChange(this.connectionStatus);
    });

    // Initialize default data (will be overridden by remote state if room exists)
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize instruments map
    this.instruments = this.ydoc.getMap('instruments');

    // Initialize drums instrument
    if (!this.instruments.has('drums')) {
      const drumsMap = new Y.Map();
      const gridArray = new Y.Array<Y.Array<number>>();
      for (let i = 0; i < 8; i++) {
        const row = new Y.Array<number>();
        for (let j = 0; j < 16; j++) {
          row.push([0]);
        }
        gridArray.push([row]);
      }
      drumsMap.set('grid', gridArray);

      this.instruments.set('drums', drumsMap);
    }

    // Initialize kit map (shared across the app, not per-instrument)
    this.kit = this.ydoc.getMap('kit');
    if (!this.kit.has('name')) {
      this.kit.set('name', 'kit_a');
    }

    // Initialize lead1 instrument
    if (!this.instruments.has('lead1')) {
      const lead1Map = new Y.Map();
      const gridArray = new Y.Array<Y.Array<number>>();
      for (let i = 0; i < 8; i++) {
        const row = new Y.Array<number>();
        for (let j = 0; j < 16; j++) {
          row.push([0]);
        }
        gridArray.push([row]);
      }
      lead1Map.set('grid', gridArray);

      this.instruments.set('lead1', lead1Map);
    }

    // Initialize BPM at root level (shared across all instruments)
    this.bpm = this.ydoc.getMap('bpm');
    if (!this.bpm.has('value')) {
      this.bpm.set('value', 120);
    }
  }

  private refreshReferences() {
    // Refresh references after sync to ensure we have the latest data
    this.instruments = this.ydoc.getMap('instruments');
    this.bpm = this.ydoc.getMap('bpm');
    this.kit = this.ydoc.getMap('kit');
  }

  // Get current grid state for an instrument
  getGrid(instrumentId: string): boolean[][] {
    // Get dimensions from instrument config
    const config = INSTRUMENTS[instrumentId];
    const defaultRows = config?.gridRows || 8;
    const defaultCols = config?.gridCols || 16;

    const instrument = this.instruments.get(instrumentId) as Y.Map<any>;
    if (!instrument) {
      return Array(defaultRows).fill(null).map(() => Array(defaultCols).fill(false));
    }

    const grid = instrument.get('grid') as Y.Array<Y.Array<number>>;
    if (!grid) {
      return Array(defaultRows).fill(null).map(() => Array(defaultCols).fill(false));
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

  // Toggle a grid cell
  toggleCell(instrumentId: string, row: number, col: number) {
    const instrument = this.instruments.get(instrumentId) as Y.Map<any>;
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
      console.warn(`Row ${row} not found in grid, reinitializing`);
      this.refreshReferences();
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

  // Set entire grid state (for initialization)
  setGrid(instrumentId: string, grid: boolean[][]) {
    const instrument = this.instruments.get(instrumentId) as Y.Map<any>;
    if (!instrument) {
      console.warn(`Instrument ${instrumentId} not found`);
      return;
    }

    const gridArray = instrument.get('grid') as Y.Array<Y.Array<number>>;
    if (!gridArray) return;

    this.ydoc.transact(() => {
      for (let i = 0; i < Math.min(grid.length, 8); i++) {
        const rowArray = gridArray.get(i);
        for (let j = 0; j < Math.min(grid[i].length, 16); j++) {
          rowArray.delete(j, 1);
          rowArray.insert(j, [grid[i][j] ? 1 : 0]);
        }
      }
    }, 'local');
  }

  // Listen to grid changes from remote users
  onGridChange(callback: (instrumentId: string, row: number, col: number, value: boolean) => void) {
    // Set up a deep observer on all instruments
    const setupObservers = () => {
      ['drums', 'lead1'].forEach((instrumentId) => {
        const instrument = this.instruments.get(instrumentId) as Y.Map<any>;
        if (!instrument) return;

        const grid = instrument.get('grid') as Y.Array<Y.Array<number>>;
        if (!grid || grid.length === 0) {
          console.warn(`Grid not ready for ${instrumentId}`);
          return;
        }

        // Observe changes within each row
        for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
          const rowArray = grid.get(rowIndex);
          if (!rowArray) continue;

          rowArray.observe((event: any) => {
            // Don't trigger callback for local changes (origin === 'local')
            if (event.transaction.origin === 'local') return;

            console.log(`Grid change detected in ${instrumentId} row ${rowIndex}`, event.changes.delta);

            // Check what changed in this row using the delta
            let position = 0;
            event.changes.delta.forEach((change: any) => {
              if (change.retain !== undefined) {
                // Skip retained items
                position += change.retain;
              } else if (change.delete !== undefined) {
                // Items were deleted - skip to next position
                // position stays the same because items are deleted
              } else if (change.insert !== undefined) {
                // Items were inserted - these are the changes we care about
                const insertedItems = Array.isArray(change.insert) ? change.insert : [change.insert];
                insertedItems.forEach((item: number) => {
                  const value = item === 1;
                  console.log(`Calling callback for cell [${instrumentId}, ${rowIndex}, ${position}] = ${value}`);
                  callback(instrumentId, rowIndex, position, value);
                  position++;
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
    this.onConnectionChange((status) => {
      if (status.synced) {
        console.log('Sync completed, setting up observers');
        setupObservers();
      }
    });
  }

  // Get current BPM
  getBpm(): number {
    return this.bpm.get('value') || 120;
  }

  // Set BPM
  setBpm(value: number) {
    this.ydoc.transact(() => {
      this.bpm.set('value', value);
    }, 'local');
  }

  // Listen to BPM changes from remote users
  onBpmChange(callback: (value: number) => void) {
    this.bpm.observe((event) => {
      if (event.transaction.origin === 'local') return;
      const value = this.bpm.get('value');
      if (value !== undefined) {
        callback(value);
      }
    });
  }

  // Get current kit
  getKit(): string {
    return this.kit.get('name') || 'kit_a';
  }

  // Set kit
  setKit(kitName: string) {
    console.log(`setKit called with: ${kitName}`);
    this.ydoc.transact(() => {
      this.kit.set('name', kitName);
    }, 'local');
  }

  // Listen to kit changes from remote users
  onKitChange(callback: (kitName: string) => void) {
    const setupKitObserver = () => {
      console.log('Setting up kit observer on', this.kit);
      this.kit.observe((event) => {
        console.log('Kit change event:', event.transaction.origin, this.kit.get('name'));
        if (event.transaction.origin === 'local') return;
        const kitName = this.kit.get('name');
        if (kitName) {
          console.log(`onKitChange: Calling callback with kit "${kitName}"`);
          callback(kitName);
        }
      });
    };

    // Set up observer immediately
    setupKitObserver();

    // Also set up observer after sync completes (to handle new reference)
    this.onConnectionChange((status) => {
      if (status.synced) {
        console.log('Sync completed, re-setting up kit observer');
        setupKitObserver();
      }
    });
  }

  // Connection status
  onConnectionChange(callback: (status: ConnectionStatus) => void) {
    this.connectionCallbacks.push(callback);
  }

  private notifyConnectionChange(status: ConnectionStatus) {
    this.connectionCallbacks.forEach((cb) => cb(status));
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  // Disconnect and cleanup
  disconnect() {
    this.provider.disconnect();
    this.ydoc.destroy();
  }

  // Get room ID
  getRoomId(): string {
    return this.provider.roomname;
  }

  // Get connected users count (awareness feature)
  getConnectedUsersCount(): number {
    return this.provider.awareness.getStates().size;
  }
}
