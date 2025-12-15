/**
 * Shared types for sync modules
 */

export interface SyncConfig {
  roomId: string;
  partyKitHost: string;
}

export interface ConnectionStatus {
  connected: boolean;
  synced: boolean;
}
