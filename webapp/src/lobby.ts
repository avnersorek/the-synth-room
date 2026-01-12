import { generateRoomName } from './utils/roomNameGenerator';

export interface Room {
  roomId: string;
  connectionCount: number;
}

interface RoomsResponse {
  roomsList: Room[];
}

function isRoomsResponse(data: unknown): data is RoomsResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'roomsList' in data &&
    Array.isArray((data as RoomsResponse).roomsList)
  );
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
        <p class="lobby-description">
          The Synth Room is a synth sampler playground for jamming together.<br/>
          Everything is public and you can jam together in rooms on a 16/32 beat 4 instrument loop.<br/>
          I built this as a side project and I hope you enjoy it.
        </p>
        <div class="lobby-actions">
          <button id="create-room" class="action-button">Create New Room</button>
          <button id="refresh-rooms" class="action-button">Refresh</button>
        </div>
        <div id="rooms-list" class="rooms-list">
          <p class="loading">Loading rooms...</p>
        </div>
        <div class="debug-info">
          <span class="debug-label">Debug:</span>
          <span class="debug-hash">${__COMMIT_HASH__}</span>
          <span class="debug-message">"${this.escapeHtml(__COMMIT_MESSAGE__)}</span>"
        </div>
      </div>
    `;

    this.attachEvents();
    await this.loadRooms();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private attachEvents() {
    const createButton = this.container.querySelector('#create-room');
    if (createButton) {
      createButton.addEventListener('click', () => {
        const roomId = generateRoomName();
        window.location.href = `${window.location.pathname}?room=${roomId}`;
      });
    }

    const refreshButton = this.container.querySelector('#refresh-rooms');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        void this.loadRooms().catch((error) => {
          console.error('Failed to load rooms:', error);
        });
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

      const data: unknown = await response.json();
      if (!isRoomsResponse(data)) {
        throw new Error('Invalid response format from server');
      }

      this.renderRoomsList(data.roomsList);
    } catch (error) {
      console.error('Error loading rooms:', error);
      const roomsList = this.container.querySelector('#rooms-list');
      if (roomsList) {
        roomsList.innerHTML = `
          <p class="error">Failed to load rooms. Make sure PartyKit server is running. <br/> Try running: <br/> <code>npx partykit dev</code></p>
        `;
      }
    }
  }

  private renderRoomsList(rooms: Room[]) {
    const roomsList = this.container.querySelector('#rooms-list');
    if (!roomsList) {return;}

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
        <div class="room-card" data-room-id="${room.roomId}">
          <h3 class="room-id">${room.roomId}</h3>
          <div class="room-footer">
            <span class="user-count">${room.connectionCount} ${room.connectionCount === 1 ? 'user' : 'users'}</span>
            <button class="join-button" data-room-id="${room.roomId}">Join Room</button>
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

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}
