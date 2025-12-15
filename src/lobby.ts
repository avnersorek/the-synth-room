export interface Room {
  id: string;
  connectedUsers: number;
  lastActivity: number;
  metadata?: any;
}

export class Lobby {
  private container: HTMLElement;
  private partyKitHost: string;
  private refreshInterval: number | null = null;

  constructor(container: HTMLElement, partyKitHost: string) {
    this.container = container;
    this.partyKitHost = partyKitHost;
  }

  async render() {
    this.container.innerHTML = `
      <div class="lobby">
        <h1>The Synth Room - Lobby</h1>
        <div class="lobby-actions">
          <button id="create-room" class="action-button">Create New Room</button>
          <button id="refresh-rooms" class="action-button">Refresh</button>
        </div>
        <div id="rooms-list" class="rooms-list">
          <p class="loading">Loading rooms...</p>
        </div>
      </div>
    `;

    this.attachEvents();
    await this.loadRooms();

    // Auto-refresh every 5 seconds
    this.refreshInterval = window.setInterval(() => {
      this.loadRooms();
    }, 5000);
  }

  private attachEvents() {
    const createButton = this.container.querySelector('#create-room');
    if (createButton) {
      createButton.addEventListener('click', () => {
        const roomId = Math.random().toString(36).substring(2, 10);
        window.location.href = `${window.location.pathname}?room=${roomId}`;
      });
    }

    const refreshButton = this.container.querySelector('#refresh-rooms');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.loadRooms();
      });
    }
  }

  private async loadRooms() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const url = `${protocol}//${this.partyKitHost}/parties/main/rooms`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch rooms: ${response.statusText}`);
      }

      const rooms: Room[] = await response.json();
      this.renderRoomsList(rooms);
    } catch (error) {
      console.error('Error loading rooms:', error);
      const roomsList = this.container.querySelector('#rooms-list');
      if (roomsList) {
        roomsList.innerHTML = `
          <p class="error">Failed to load rooms. Make sure PartyKit server is running.</p>
          <p class="error-detail">Try running: <code>npx partykit dev</code></p>
        `;
      }
    }
  }

  private renderRoomsList(rooms: Room[]) {
    const roomsList = this.container.querySelector('#rooms-list');
    if (!roomsList) return;

    if (rooms.length === 0) {
      roomsList.innerHTML = `
        <div class="no-rooms">
          <p>No active rooms found.</p>
          <p>Create a new room to start jamming!</p>
        </div>
      `;
      return;
    }

    const roomsHtml = rooms
      .map(
        (room) => `
        <div class="room-card" data-room-id="${room.id}">
          <div class="room-header">
            <h3 class="room-id">Room: ${room.id}</h3>
            <span class="user-count">${room.connectedUsers} ${room.connectedUsers === 1 ? 'user' : 'users'}</span>
          </div>
          <div class="room-footer">
            <span class="last-activity">Active ${this.formatRelativeTime(room.lastActivity)}</span>
            <button class="join-button" data-room-id="${room.id}">Join Room</button>
          </div>
        </div>
      `
      )
      .join('');

    roomsList.innerHTML = roomsHtml;

    // Attach join button events
    roomsList.querySelectorAll('.join-button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const roomId = (e.target as HTMLElement).dataset.roomId;
        if (roomId) {
          window.location.href = `${window.location.pathname}?room=${roomId}`;
        }
      });
    });
  }

  private formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    if (seconds > 0) return `${seconds}s ago`;
    return 'just now';
  }

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}
