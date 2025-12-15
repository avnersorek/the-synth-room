import { Sequencer, SAMPLES } from './sequencer';
import { KITS } from './types';

export class UI {
  private sequencer: Sequencer;
  private container: HTMLElement;
  private onKitChange: (kit: string) => Promise<void>;
  private audioStarted: boolean = false;

  constructor(sequencer: Sequencer, container: HTMLElement, onKitChange: (kit: string) => Promise<void>) {
    this.sequencer = sequencer;
    this.container = container;
    this.onKitChange = onKitChange;
  }

  render() {
    const sync = this.sequencer.getSync();
    
    this.container.innerHTML = `
        <div class="header">
          <h1>The Synth Room</h1>
          ${sync ? `
          <div class="room-status-compact">
            <span class="status-indicator" id="status-indicator">●</span>
            <span id="connection-status">Connecting...</span>
            <span id="users-count"></span>
            <button id="copy-room" title="Copy room URL">📋</button>
          </div>
          ` : ''}
        </div>
        <div class="panel">
          <div class="controls">
            <button id="play">►</button>
            <button id="stop">⏹</button>
            <input type="range" id="volume" min="0" max="1" step="0.01" value="0.7" />
            <label for="volume">Volume</label>
          </div>
          <div>
            <input type="number" id="bpm" value="120" min="40" max="240" />
            <label for="bpm">BPM</label>
          </div>
        </div>

        <div class="instrument-panel grid panel">
          <div class="instrument-header">
            <h3>Instrument</h3>
            <select id="kit">
              ${KITS.map(kit => `<option value="${kit}">${kit}</option>`).join('')}
            </select>
          </div>
          <div class="grid" id="grid"></div>
          </div>
        </div>
    `;

    this.renderGrid();
    this.attachEvents();
    this.startUpdateLoop();
    this.setupSyncUI();
  }

  private renderGrid() {
    const grid = this.container.querySelector('#grid')!;
    let html = '';

    for (let row = 0; row < 8; row++) {
      html += `<div class="row">`;
      html += `<div class="label">${SAMPLES[row]}</div>`;
      for (let col = 0; col < 16; col++) {
        const beatGroup = Math.floor(col / 4);
        html += `<div class="cell beat-${beatGroup}" data-row="${row}" data-col="${col}"></div>`;
      }
      html += `</div>`;
    }

    grid.innerHTML = html;
  }

  private attachEvents() {
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains('cell')) {
        const row = parseInt(target.dataset.row!);
        const col = parseInt(target.dataset.col!);
        // Currently only showing drums instrument
        this.sequencer.toggle('drums', row, col);
        target.classList.toggle('active');
      }

      if (target.id === 'play') {
        // Start Tone.js audio context on first user interaction
        if (!this.audioStarted) {
          import('tone').then(async (Tone) => {
            await Tone.start();
            this.audioStarted = true;
            console.log('Tone.js audio context started');
            this.sequencer.play();
          });
        } else {
          this.sequencer.play();
        }
      }

      if (target.id === 'stop') {
        this.sequencer.stop();
      }
    });

    const bpmInput = this.container.querySelector('#bpm') as HTMLInputElement;
    bpmInput.addEventListener('input', () => {
      this.sequencer.setBpm(parseInt(bpmInput.value));
    });

    const volumeInput = this.container.querySelector('#volume') as HTMLInputElement;
    volumeInput.addEventListener('input', () => {
      this.sequencer.setVolume(parseFloat(volumeInput.value));
    });

    const kitSelect = this.container.querySelector('#kit') as HTMLSelectElement;
    kitSelect.addEventListener('change', () => {
      this.onKitChange(kitSelect.value);
    });
  }

  private startUpdateLoop() {
    setInterval(() => {
      const isPlaying = this.sequencer.isPlaying();
      const currentStep = this.sequencer.getCurrentStep();
      this.container.querySelectorAll('.cell').forEach((cell) => {
        const col = parseInt((cell as HTMLElement).dataset.col!);
        cell.classList.toggle('current', isPlaying && col === currentStep);
      });
    }, 50);
  }

  updateKitSelector(kitName: string) {
    const kitSelect = this.container.querySelector('#kit') as HTMLSelectElement;
    if (kitSelect) {
      kitSelect.value = kitName;
    }
  }

  private setupSyncUI() {
    const sync = this.sequencer.getSync();
    if (!sync) return;

    // Handle copy room URL button
    const copyButton = this.container.querySelector('#copy-room');
    if (copyButton) {
      copyButton.addEventListener('click', () => {
        const roomId = sync ? sync.getRoomId() : '';
        const roomUrl = roomId ? `${window.location.origin}${window.location.pathname}?room=${roomId}` : '';
        navigator.clipboard.writeText(roomUrl);
        copyButton.textContent = '✓';
        setTimeout(() => {
          copyButton.textContent = '📋';
        }, 2000);
      });
    }

    // Update connection status
    const updateConnectionStatus = () => {
      const status = sync.getConnectionStatus();
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
        const count = sync.getConnectedUsersCount();
        usersCount.textContent = count > 1 ? `(${count} users)` : '';
      }
    };

    // Listen to connection changes and update grid when synced
    sync.onConnectionChange((status) => {
      updateConnectionStatus();

      // When sync completes, update the grid display to reflect current state
      if (status.synced) {
        this.updateGridDisplay();
      }
    });

    // Listen to remote grid changes and update UI in real-time
    sync.onGridChange((instrumentId, row, col, value) => {
      // Currently only showing drums instrument in UI
      if (instrumentId !== 'drums') return;

      console.log(`UI: Grid change received [${instrumentId}, ${row}, ${col}] = ${value}`);
      const cell = this.container.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
      if (cell) {
        console.log(`UI: Updating cell visual`);
        cell.classList.toggle('active', value);
      } else {
        console.warn(`UI: Cell not found for [${row}, ${col}]`);
      }
    });

    // Listen to remote BPM changes and update UI
    sync.onBpmChange((bpm) => {
      const bpmInput = this.container.querySelector('#bpm') as HTMLInputElement;
      if (bpmInput) {
        bpmInput.value = bpm.toString();
      }
    });

    // Update status periodically
    setInterval(updateConnectionStatus, 1000);

    // Initial update
    updateConnectionStatus();
  }

  private updateGridDisplay() {
    // Update all cells to reflect current sequencer state
    // Currently only showing drums instrument
    this.container.querySelectorAll('.cell').forEach((cell) => {
      const row = parseInt((cell as HTMLElement).dataset.row!);
      const col = parseInt((cell as HTMLElement).dataset.col!);
      const isActive = this.sequencer.isActive('drums', row, col);
      cell.classList.toggle('active', isActive);
    });
  }
}
