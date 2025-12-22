/**
 * Manages sync-related UI elements (connection status, room URL, user count)
 */

import { SyncManager } from '../../sync/SyncManager';

export class SyncUIManager {
  private sync: SyncManager;
  private container: HTMLElement;

  constructor(sync: SyncManager, container: HTMLElement) {
    this.sync = sync;
    this.container = container;
  }

  /**
   * Set up all sync UI elements and listeners
   */
  setupSyncUI(onGridUpdate: () => void): void {
    this.setupCopyRoomButton();
    this.setupGotoLobbyButton();
    this.setupConnectionStatusUpdates(onGridUpdate);
    this.startPeriodicUpdates();
    this.updateConnectionStatus();
  }

  /**
   * Handle copy room URL button
   */
  private setupCopyRoomButton(): void {
    const copyButton = this.container.querySelector('#copy-room');
    if (copyButton) {
      copyButton.addEventListener('click', () => {
        const roomId = this.sync.getRoomId();
        const roomUrl = roomId ? `${window.location.origin}${window.location.pathname}?room=${roomId}` : '';
        navigator.clipboard.writeText(roomUrl);
        copyButton.textContent = '✓';
        setTimeout(() => {
          copyButton.textContent = '📋';
        }, 2000);
      });
    }
  }

  /**
   * Handle goto lobby button
   */
  private setupGotoLobbyButton(): void {
    const gotoLobbyButton = this.container.querySelector('#goto-lobby');
    if (gotoLobbyButton) {
      gotoLobbyButton.addEventListener('click', () => {
        window.location.href = window.location.pathname;
      });
    }
  }

  /**
   * Set up connection status updates and sync listeners
   */
  private setupConnectionStatusUpdates(onGridUpdate: () => void): void {
    // Listen to connection changes and update grid when synced
    this.sync.onConnectionChange((status) => {
      this.updateConnectionStatus();

      // When sync completes, update the grid display to reflect current state
      if (status.synced) {
        onGridUpdate();
      }
    });
  }

  /**
   * Update connection status display
   */
  private updateConnectionStatus(): void {
    const status = this.sync.getConnectionStatus();
    const statusIndicator = this.container.querySelector('#status-indicator') as HTMLElement;
    const statusText = this.container.querySelector('#connection-status') as HTMLElement;
    const usersCount = this.container.querySelector('#users-count') as HTMLElement;

    if (statusIndicator && statusText) {
      if (status.synced) {
        statusIndicator.style.color = '#00ff00';
        statusText.textContent = 'Connected';
      } else if (status.connected) {
        statusIndicator.style.color = '#ffaa00';
        statusText.textContent = 'Syncing...';
      } else {
        statusIndicator.style.color = '#ff0000';
        statusText.textContent = 'Disconnected';
      }
    }

    if (usersCount) {
      const count = this.sync.getConnectedUsersCount();
      usersCount.textContent = count > 1 ? `(${count} users)` : '';
    }
  }

  /**
   * Start periodic status updates
   */
  private startPeriodicUpdates(): void {
    setInterval(() => this.updateConnectionStatus(), 1000);
  }

  /**
   * Set up grid change listener
   */
  setupGridChangeListener(callback: (instrumentId: string, row: number, col: number, value: boolean) => void): void {
    this.sync.onGridChange(callback);
  }

  /**
   * Set up BPM change listener
   */
  setupBpmChangeListener(callback: (bpm: number) => void): void {
    this.sync.onBpmChange(callback);
  }

  /**
   * Set up volume change listener
   */
  setupVolumeChangeListener(callback: (instrumentId: string, value: number) => void): void {
    this.sync.onInstrumentVolumeChange(callback);
  }

  /**
   * Set up effect send change listener
   */
  setupEffectSendChangeListener(callback: (instrumentId: string, value: number) => void): void {
    this.sync.onEffectSendChange(callback);
  }
}
