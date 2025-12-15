import { Sequencer } from './sequencer';
import { INSTRUMENTS } from './types';
import { InstrumentPanel } from './components/InstrumentPanel';
import { DrumInstrument } from './components/DrumInstrument';

export class UI {
  private sequencer: Sequencer;
  private container: HTMLElement;
  private audioStarted: boolean = false;
  private currentInstrumentId: string = 'drums';
  private drumInstrument: DrumInstrument;
  private instrumentPanel: InstrumentPanel;

  constructor(sequencer: Sequencer, container: HTMLElement, onKitChange: (kit: string) => Promise<void>) {
    this.sequencer = sequencer;
    this.container = container;

    // Initialize components
    this.drumInstrument = new DrumInstrument(sequencer, onKitChange);

    // Get all available instruments from config
    const instruments = Object.values(INSTRUMENTS);
    this.instrumentPanel = new InstrumentPanel(
      instruments,
      this.currentInstrumentId,
      (instrumentId) => this.onInstrumentChange(instrumentId),
      (instrumentId) => this.getInstrumentContent(instrumentId)
    );
  }

  private getInstrumentContent(instrumentId: string): string {
    if (instrumentId === 'drums') {
      return this.drumInstrument.render();
    } else if (instrumentId === 'lead1') {
      return `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 300px; opacity: 0.5;">
          <p style="font-size: 1.2rem; text-align: center;">Lead synth coming soon...</p>
        </div>
      `;
    }
    return '';
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

        ${this.instrumentPanel.render()}
    `;

    this.attachEvents();
    this.attachInstrumentEvents();
    this.startUpdateLoop();
    this.setupSyncUI();
  }

  private attachInstrumentEvents() {
    // Always attach drum events since drums are always visible
    const drumCard = this.container.querySelector(`[data-instrument-id="drums"] .instrument-card-content`) as HTMLElement;
    if (drumCard) {
      this.drumInstrument.attachEvents(drumCard);
      this.drumInstrument.updateGridDisplay(drumCard);
    }

    // Attach events for other active instruments
    if (this.currentInstrumentId === 'lead1') {
      // Future: attach lead1 events
    }
  }

  private onInstrumentChange(instrumentId: string) {
    this.currentInstrumentId = instrumentId;
    this.instrumentPanel.updateActiveCard(instrumentId);
    // Re-attach events after panel updates
    setTimeout(() => this.attachInstrumentEvents(), 0);
  }

  private attachEvents() {
    // Attach instrument panel events
    this.instrumentPanel.attachEvents(this.container);

    // Play/Stop button handlers
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

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

    // Spacebar to toggle play/stop
    document.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); // Prevent page scroll

        if (this.sequencer.isPlaying()) {
          this.sequencer.stop();
        } else {
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
      }
    });

    // BPM control
    const bpmInput = this.container.querySelector('#bpm') as HTMLInputElement;
    bpmInput.addEventListener('input', () => {
      this.sequencer.setBpm(parseInt(bpmInput.value));
    });

    // Volume control
    const volumeInput = this.container.querySelector('#volume') as HTMLInputElement;
    volumeInput.addEventListener('input', () => {
      this.sequencer.setVolume(parseFloat(volumeInput.value));
    });
  }

  private startUpdateLoop() {
    setInterval(() => {
      const currentStep = this.sequencer.getCurrentStep();

      // Always update drums since they're always visible
      const drumCard = this.container.querySelector(`[data-instrument-id="drums"] .instrument-card-content`) as HTMLElement;
      if (drumCard) {
        this.drumInstrument.updateCurrentStep(drumCard, currentStep);
      }

      // Update other active instruments
      // Future: if (this.currentInstrumentId === 'lead1') { ... }
    }, 50);
  }

  updateKitSelector(kitName: string) {
    // Always update drums kit selector since drums are always visible
    const drumCard = this.container.querySelector(`[data-instrument-id="drums"] .instrument-card-content`) as HTMLElement;
    if (drumCard) {
      this.drumInstrument.updateKitSelector(drumCard, kitName);
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
      // Only update if this is the currently displayed instrument
      if (instrumentId !== this.currentInstrumentId) return;

      console.log(`UI: Grid change received [${instrumentId}, ${row}, ${col}] = ${value}`);

      if (this.currentInstrumentId === 'drums') {
        const cell = this.container.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          console.log(`UI: Updating cell visual`);
          cell.classList.toggle('active', value);
        } else {
          console.warn(`UI: Cell not found for [${row}, ${col}]`);
        }
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
    // Always update drums grid since drums are always visible
    const drumCard = this.container.querySelector(`[data-instrument-id="drums"] .instrument-card-content`) as HTMLElement;
    if (drumCard) {
      this.drumInstrument.updateGridDisplay(drumCard);
    }

    // Update other active instruments if needed
    // Future: if (this.currentInstrumentId === 'lead1') { ... }
  }
}
