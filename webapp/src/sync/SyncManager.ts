/**
 * Main synchronization manager
 * Orchestrates domain-specific sync managers for grid, BPM, kit, and synth type
 */

import * as Y from 'yjs';
import PartyKitProvider from 'y-partykit/provider';
import { INSTRUMENTS } from '../types';
import { SyncConfig, ConnectionStatus } from './types';
import { GridSyncManager } from './managers/GridSyncManager';
import { BpmSyncManager } from './managers/BpmSyncManager';
import { KitSyncManager } from './managers/KitSyncManager';
import { SynthTypeSyncManager } from './managers/SynthTypeSyncManager';
import { BassTypeSyncManager } from './managers/BassTypeSyncManager';
import { VolumeSyncManager } from './managers/VolumeSyncManager';
import { EffectsSyncManager } from './managers/EffectsSyncManager';

export class SyncManager {
  private ydoc: Y.Doc;
  private provider: PartyKitProvider;
  private instruments!: Y.Map<unknown>;
  private connectionCallbacks: ((status: ConnectionStatus) => void)[] = [];
  private connectionStatus: ConnectionStatus = { connected: false, synced: false };

  // Domain-specific managers
  private gridManager!: GridSyncManager;
  private bpmManager!: BpmSyncManager;
  private kitManager!: KitSyncManager;
  private synthTypeManager!: SynthTypeSyncManager;
  private bassTypeManager!: BassTypeSyncManager;
  private volumeManager!: VolumeSyncManager;
  private effectsManager!: EffectsSyncManager;

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
    this.initializeManagers();
  }

  private initializeDefaultData() {
    // Initialize instruments map
    this.instruments = this.ydoc.getMap('instruments');

    // Initialize each instrument from the INSTRUMENTS config
    Object.keys(INSTRUMENTS).forEach((instrumentId) => {
      if (!this.instruments.has(instrumentId)) {
        const config = INSTRUMENTS[instrumentId];
        const instrumentMap = new Y.Map();
        const gridArray = new Y.Array<Y.Array<number>>();

        // Use config dimensions instead of hardcoded values
        const rows = config.gridRows;
        const cols = config.gridCols;

        for (let i = 0; i < rows; i++) {
          const row = new Y.Array<number>();
          for (let j = 0; j < cols; j++) {
            row.push([0]);
          }
          gridArray.push([row]);
        }
        instrumentMap.set('grid', gridArray);

        // Initialize volume from config
        const defaultVolume = config.parameters.volume ?? 0.5;
        instrumentMap.set('volume', defaultVolume);

        this.instruments.set(instrumentId, instrumentMap);
      }
    });

    // Initialize kit map (shared across the app, not per-instrument)
    const kit = this.ydoc.getMap('kit');
    if (!kit.has('name')) {
      kit.set('name', 'kit_a');
    }

    // Initialize synth type map (for lead instrument)
    const synthType = this.ydoc.getMap('synthType');
    if (!synthType.has('type')) {
      synthType.set('type', 'Synth');
    }

    // Initialize bass type map (for bass instrument)
    const bassType = this.ydoc.getMap('bassType');
    if (!bassType.has('type')) {
      bassType.set('type', 'Guitar');
    }

    // Initialize BPM at root level (shared across all instruments)
    const bpm = this.ydoc.getMap('bpm');
    if (!bpm.has('value')) {
      bpm.set('value', 120);
    }
  }

  private initializeManagers() {
    // Initialize domain-specific managers
    this.gridManager = new GridSyncManager(this.ydoc, this.instruments);
    this.bpmManager = new BpmSyncManager(this.ydoc, this.ydoc.getMap('bpm'));
    this.kitManager = new KitSyncManager(this.ydoc, this.ydoc.getMap('kit'));
    this.synthTypeManager = new SynthTypeSyncManager(this.ydoc, this.ydoc.getMap('synthType'));
    this.bassTypeManager = new BassTypeSyncManager(this.ydoc, this.ydoc.getMap('bassType'));
    this.volumeManager = new VolumeSyncManager(this.ydoc, this.instruments);
    this.effectsManager = new EffectsSyncManager(this.ydoc, this.instruments);
  }

  private refreshReferences() {
    // Refresh references after sync to ensure we have the latest data
    this.instruments = this.ydoc.getMap('instruments');

    // Re-initialize managers with fresh references
    this.initializeManagers();
  }

  // Grid operations - delegate to GridSyncManager
  getGrid(instrumentId: string): boolean[][] {
    return this.gridManager.getGrid(instrumentId);
  }

  toggleCell(instrumentId: string, row: number, col: number) {
    this.gridManager.toggleCell(instrumentId, row, col);
  }

  setGrid(instrumentId: string, grid: boolean[][]) {
    this.gridManager.setGrid(instrumentId, grid);
  }

  onGridChange(callback: (instrumentId: string, row: number, col: number, value: boolean) => void) {
    this.gridManager.onGridChange(callback, (cb) => this.onConnectionChange(cb));
  }

  // BPM operations - delegate to BpmSyncManager
  getBpm(): number {
    return this.bpmManager.get();
  }

  setBpm(value: number) {
    this.bpmManager.set(value);
  }

  onBpmChange(callback: (value: number) => void) {
    this.bpmManager.onBpmChange(callback, (cb) => this.onConnectionChange(cb));
  }

  // Kit operations - delegate to KitSyncManager
  getKit(): string {
    return this.kitManager.get();
  }

  setKit(kitName: string) {
    this.kitManager.set(kitName);
  }

  onKitChange(callback: (kitName: string) => void) {
    this.kitManager.onKitChange(callback, (cb) => this.onConnectionChange(cb));
  }

  // Synth type operations - delegate to SynthTypeSyncManager
  getSynthType(): string {
    return this.synthTypeManager.get();
  }

  setSynthType(type: string) {
    this.synthTypeManager.set(type);
  }

  onSynthTypeChange(callback: (type: string) => void) {
    this.synthTypeManager.onSynthTypeChange(callback, (cb) => this.onConnectionChange(cb));
  }

  // Bass type operations - delegate to BassTypeSyncManager
  getBassType(): string {
    return this.bassTypeManager.get();
  }

  setBassType(type: string) {
    this.bassTypeManager.set(type);
  }

  onBassTypeChange(callback: (type: string) => void) {
    this.bassTypeManager.onBassTypeChange(callback, (cb) => this.onConnectionChange(cb));
  }

  // Volume operations - delegate to VolumeSyncManager
  getInstrumentVolume(instrumentId: string): number {
    return this.volumeManager.getVolume(instrumentId);
  }

  setInstrumentVolume(instrumentId: string, value: number) {
    this.volumeManager.setVolume(instrumentId, value);
  }

  onInstrumentVolumeChange(callback: (instrumentId: string, value: number) => void) {
    this.volumeManager.onVolumeChange(callback, (cb) => this.onConnectionChange(cb));
  }

  // Effect send operations - delegate to EffectsSyncManager
  getEffectSend(instrumentId: string): number {
    return this.effectsManager.getEffectSend(instrumentId);
  }

  setEffectSend(instrumentId: string, value: number) {
    this.effectsManager.setEffectSend(instrumentId, value);
  }

  onEffectSendChange(callback: (instrumentId: string, value: number) => void) {
    this.effectsManager.onEffectSendChange(callback, (cb) => this.onConnectionChange(cb));
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

// Re-export types for convenience
export type { SyncConfig, ConnectionStatus };
