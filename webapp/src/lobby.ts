import { generateRoomName } from './utils/roomNameGenerator';
import './styles/lobby-background.css';

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
    // Add class to body for lobby-specific styling
    document.body.classList.remove('room-page');
    document.body.classList.add('lobby-page');

    this.container.innerHTML = `
      <!-- Animated blob background SVG -->
      <svg class="lobby-background-svg" preserveAspectRatio="xMidYMid slice" viewBox="10 10 80 80">
        <defs>
          <style>
            @keyframes rotate {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
            .lobby-blob-out-top {
              animation: rotate 20s linear infinite;
              transform-origin: 13px 25px;
            }
            .lobby-blob-in-top {
              animation: rotate 10s linear infinite;
              transform-origin: 13px 25px;
            }
            .lobby-blob-out-bottom {
              animation: rotate 25s linear infinite;
              transform-origin: 84px 93px;
            }
            .lobby-blob-in-bottom {
              animation: rotate 15s linear infinite;
              transform-origin: 84px 93px;
            }
          </style>
        </defs>
        <path fill="#6b21a8" class="lobby-blob-out-top" d="M37-5C25.1-14.7,5.7-19.1-9.2-10-28.5,1.8-32.7,31.1-19.8,49c15.5,21.5,52.6,22,67.2,2.3C59.4,35,53.7,8.5,37-5Z"/>
        <path fill="#a855f7" class="lobby-blob-in-top" d="M20.6,4.1C11.6,1.5-1.9,2.5-8,11.2-16.3,23.1-8.2,45.6,7.4,50S42.1,38.9,41,24.5C40.2,14.1,29.4,6.6,20.6,4.1Z"/>
        <path fill="#be185d" class="lobby-blob-out-bottom" d="M105.9,48.6c-12.4-8.2-29.3-4.8-39.4.8-23.4,12.8-37.7,51.9-19.1,74.1s63.9,15.3,76-5.6c7.6-13.3,1.8-31.1-2.3-43.8C117.6,63.3,114.7,54.3,105.9,48.6Z"/>
        <path fill="#ec4899" class="lobby-blob-in-bottom" d="M102,67.1c-9.6-6.1-22-3.1-29.5,2-15.4,10.7-19.6,37.5-7.6,47.8s35.9,3.9,44.5-12.5C115.5,92.6,113.9,74.6,102,67.1Z"/>
      </svg>

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
          <a href="https://www.github.com/avnersorek/the-synth-room" target="_blank">Github</a>
          <span class="debug-hash" title="${__COMMIT_HASH__} - ${this.escapeHtml(__COMMIT_MESSAGE__)}">#️</span>
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
    if (!roomsList) { return; }

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
    // Remove lobby-specific body class
    document.body.classList.remove('lobby-page');

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}
