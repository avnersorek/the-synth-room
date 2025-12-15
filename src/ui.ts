import { Sequencer } from './sequencer';
import { INSTRUMENTS } from './types';
import { InstrumentPanel } from './components/InstrumentPanel';
import { DrumInstrument } from './components/DrumInstrument';
import { LeadInstrument } from './components/LeadInstrument';

export class UI {
  private sequencer: Sequencer;
  private container: HTMLElement;
  private audioStarted: boolean = false;
  private currentInstrumentId: string = 'drums';
  private drumInstrument: DrumInstrument;
  private leadInstrument: LeadInstrument;
  private instrumentPanel: InstrumentPanel;

  constructor(sequencer: Sequencer, container: HTMLElement, onKitChange: (kit: string) => Promise<void>, onSynthChange: (synthType: string) => void) {
    this.sequencer = sequencer;
    this.container = container;

    // Initialize components
    this.drumInstrument = new DrumInstrument(sequencer, onKitChange);
    this.leadInstrument = new LeadInstrument(sequencer, onSynthChange);

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
      return this.leadInstrument.render();
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
            <button id="play">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none;">
                <path d="M20.4086 9.35258C22.5305 10.5065 22.5305 13.4935 20.4086 14.6474L7.59662 21.6145C5.53435 22.736 3 21.2763 3 18.9671L3 5.0329C3 2.72368 5.53435 1.26402 7.59661 2.38548L20.4086 9.35258Z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </button>
            <button id="stop">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none;">
                <path d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </button>
            <input type="range" id="volume" min="0" max="1" step="0.01" value="0.7" />
            <label for="volume">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none;">
                <path d="M6 1H8V15H6L2 11H0V5H2L6 1Z" fill="currentColor"/>
                <path d="M14 8C14 5.79086 12.2091 4 10 4V2C13.3137 2 16 4.68629 16 8C16 11.3137 13.3137 14 10 14V12C12.2091 12 14 10.2091 14 8Z" fill="currentColor"/>
                <path d="M12 8C12 9.10457 11.1046 10 10 10V6C11.1046 6 12 6.89543 12 8Z" fill="currentColor"/>
              </svg>
            </label>
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

    // Always attach lead1 events since lead1 is always visible
    const leadCard = this.container.querySelector(`[data-instrument-id="lead1"] .instrument-card-content`) as HTMLElement;
    if (leadCard) {
      this.leadInstrument.attachEvents(leadCard);
      this.leadInstrument.updateGridDisplay(leadCard);
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
    let lastStep = -1;

    setInterval(() => {
      const currentStep = this.sequencer.getCurrentStep();

      // Pulse play button every 4 beats (on the downbeat) when playing
      if (this.sequencer.isPlaying() && currentStep % 4 === 0 && currentStep !== lastStep) {
        const playButton = this.container.querySelector('#play') as HTMLElement;
        if (playButton) {
          // Remove and re-add class to restart animation
          playButton.classList.remove('playing');
          // Force reflow to restart animation
          void playButton.offsetWidth;
          playButton.classList.add('playing');
        }
        lastStep = currentStep;
      } else if (currentStep % 4 !== 0) {
        lastStep = -1; // Reset tracker when not on downbeat
      }

      // Always update drums since they're always visible
      const drumCard = this.container.querySelector(`[data-instrument-id="drums"] .instrument-card-content`) as HTMLElement;
      if (drumCard) {
        this.drumInstrument.updateCurrentStep(drumCard, currentStep);
      }

      // Always update lead1 since it's always visible
      const leadCard = this.container.querySelector(`[data-instrument-id="lead1"] .instrument-card-content`) as HTMLElement;
      if (leadCard) {
        this.leadInstrument.updateCurrentStep(leadCard, currentStep);
      }
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
      // Only update if this is an always-visible instrument (drums, lead1) or the currently displayed instrument
      if (instrumentId !== 'drums' && instrumentId !== 'lead1' && instrumentId !== this.currentInstrumentId) return;

      console.log(`UI: Grid change received [${instrumentId}, ${row}, ${col}] = ${value}`);

      const instrumentCard = this.container.querySelector(`[data-instrument-id="${instrumentId}"] .instrument-card-content`);
      if (instrumentCard) {
        const cell = instrumentCard.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
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

    // Always update lead1 grid since lead1 is always visible
    const leadCard = this.container.querySelector(`[data-instrument-id="lead1"] .instrument-card-content`) as HTMLElement;
    if (leadCard) {
      this.leadInstrument.updateGridDisplay(leadCard);
    }
  }
}
