import * as Y from 'yjs';
import PartyKitProvider from 'y-partykit/provider';

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
  private drums: Y.Map<any>;
  private grid!: Y.Array<Y.Array<number>>;
  private kit!: Y.Map<any>;
  private bpm!: Y.Map<any>;
  private connectionCallbacks: ((status: ConnectionStatus) => void)[] = [];
  private connectionStatus: ConnectionStatus = { connected: false, synced: false };

  constructor(config: SyncConfig) {
    // Initialize Yjs document
    this.ydoc = new Y.Doc();

    // Initialize shared types with new structure:
    // drums: { grid, kit }
    // bpm: { value }
    this.drums = this.ydoc.getMap('drums');

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
    // Initialize grid inside drums
    if (!this.drums.has('grid')) {
      const gridArray = new Y.Array<Y.Array<number>>();
      // Create 8 rows of 16 columns
      for (let i = 0; i < 8; i++) {
        const row = new Y.Array<number>();
        for (let j = 0; j < 16; j++) {
          row.push([0]); // 0 = inactive, 1 = active
        }
        gridArray.push([row]);
      }
      this.drums.set('grid', gridArray);
    }
    this.grid = this.drums.get('grid') as Y.Array<Y.Array<number>>;

    // Initialize kit inside drums
    if (!this.drums.has('kit')) {
      const kitMap = new Y.Map();
      kitMap.set('name', 'kit_a');
      this.drums.set('kit', kitMap);
    }
    this.kit = this.drums.get('kit') as Y.Map<any>;

    // Initialize BPM at root level (shared across all instruments)
    this.bpm = this.ydoc.getMap('bpm');
    if (!this.bpm.has('value')) {
      this.bpm.set('value', 120);
    }
  }

  private refreshReferences() {
    // Refresh references after sync to ensure we have the latest data
    this.grid = this.drums.get('grid') as Y.Array<Y.Array<number>>;
    this.kit = this.drums.get('kit') as Y.Map<any>;
    this.bpm = this.ydoc.getMap('bpm');
  }

  // Get current grid state (8x16 boolean array)
  getGrid(): boolean[][] {
    const result: boolean[][] = [];
    for (let i = 0; i < this.grid.length; i++) {
      const row = this.grid.get(i);
      const rowArray: boolean[] = [];
      for (let j = 0; j < row.length; j++) {
        rowArray.push(row.get(j) === 1);
      }
      result.push(rowArray);
    }
    return result;
  }

  // Toggle a grid cell
  toggleCell(row: number, col: number) {
    if (!this.grid || this.grid.length === 0) {
      console.warn('Grid not initialized yet, skipping toggle');
      return;
    }

    const rowArray = this.grid.get(row);

    if (!rowArray) {
      console.warn(`Row ${row} not found in grid, reinitializing`);
      this.refreshReferences();
      return;
    }

    // Use a transaction with origin to mark this as a local change
    const currentValue = rowArray.get(col);
    console.log(`toggleCell[${row}, ${col}]: ${currentValue} -> ${currentValue === 1 ? 0 : 1}`);

    this.ydoc.transact(() => {
      rowArray.delete(col, 1);
      rowArray.insert(col, [currentValue === 1 ? 0 : 1]);
    }, 'local');
  }

  // Set entire grid state (for initialization)
  setGrid(grid: boolean[][]) {
    this.ydoc.transact(() => {
      for (let i = 0; i < Math.min(grid.length, 8); i++) {
        const rowArray = this.grid.get(i);
        for (let j = 0; j < Math.min(grid[i].length, 16); j++) {
          rowArray.delete(j, 1);
          rowArray.insert(j, [grid[i][j] ? 1 : 0]);
        }
      }
    }, 'local');
  }

  // Listen to grid changes from remote users
  onGridChange(callback: (row: number, col: number, value: boolean) => void) {
    // Set up a deep observer on the entire grid
    const setupObservers = () => {
      if (!this.grid || this.grid.length === 0) {
        console.warn('Grid not ready for observers');
        return;
      }

      // Observe changes within each row
      for (let rowIndex = 0; rowIndex < this.grid.length; rowIndex++) {
        const rowArray = this.grid.get(rowIndex);
        if (!rowArray) continue;

        rowArray.observe((event) => {
          // Don't trigger callback for local changes (origin === 'local')
          if (event.transaction.origin === 'local') return;

          console.log(`Grid change detected in row ${rowIndex}`, event.changes.delta);

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
                console.log(`Calling callback for cell [${rowIndex}, ${position}] = ${value}`);
                callback(rowIndex, position, value);
                position++;
              });
            }
          });
        });
      }
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
