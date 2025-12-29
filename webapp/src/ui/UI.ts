/**
 * Main UI orchestrator
 * Manages component rendering and coordination between managers
 */

import { Sequencer } from '../sequencer';
import { INSTRUMENTS } from '../types';
import { InstrumentPanel } from '../components/InstrumentPanel';
import { DrumInstrument } from '../components/DrumInstrument';
import { LeadInstrument } from '../components/LeadInstrument';
import { BassInstrument } from '../components/BassInstrument';
import { EventManager } from './managers/EventManager';
import { SyncUIManager } from './managers/SyncUIManager';
import { StepAnimationController } from './managers/StepAnimationController';
import { SelectorUpdater } from './utils/SelectorUpdater';

export class UI {
  private sequencer: Sequencer;
  private container: HTMLElement;
  private currentInstrumentId: string = 'drums';
  private drumInstrument: DrumInstrument;
  private leadInstrument: LeadInstrument;
  private bassInstrument: BassInstrument;
  private instrumentPanel: InstrumentPanel;
  private eventManager: EventManager;
  private syncUIManager: SyncUIManager | null = null;
  private animationController: StepAnimationController;

  constructor(sequencer: Sequencer, container: HTMLElement, onKitChange: (kit: string) => Promise<void>, onSynthChange: (synthType: string) => void, onBassTypeChange: (bassType: string) => void) {
    this.sequencer = sequencer;
    this.container = container;

    // Initialize components
    this.drumInstrument = new DrumInstrument(sequencer, onKitChange);
    this.leadInstrument = new LeadInstrument(sequencer, onSynthChange);
    this.bassInstrument = new BassInstrument(sequencer, onBassTypeChange);

    // Get all available instruments from config
    const instruments = Object.values(INSTRUMENTS);
    this.instrumentPanel = new InstrumentPanel(
      instruments,
      this.currentInstrumentId,
      (instrumentId) => this.onInstrumentChange(instrumentId),
      (instrumentId) => this.getInstrumentContent(instrumentId)
    );

    // Initialize managers
    this.eventManager = new EventManager(sequencer, container);
    this.animationController = new StepAnimationController(sequencer, container);

    // Initialize sync UI manager if sync is enabled
    const sync = sequencer.getSync();
    if (sync) {
      this.syncUIManager = new SyncUIManager(sync, container);
    }
  }

  private getInstrumentContent(instrumentId: string): string {
    if (instrumentId === 'drums') {
      return this.drumInstrument.render();
    } else if (instrumentId === 'lead1') {
      return this.leadInstrument.render();
    } else if (instrumentId === 'bass') {
      return this.bassInstrument.render();
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
            <button id="goto-lobby" title="Go to Lobby">🏠</button>
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
          <div class="bpm-panel">
            <label for="bpm">BPM</label>
            <input type="number" id="bpm" value="120" min="40" max="240" />
          </div>
        </div>

        ${this.instrumentPanel.render()}
    `;

    this.attachEvents();
    this.attachInstrumentEvents();
    this.animationController.startUpdateLoop();

    if (this.syncUIManager) {
      this.setupSyncUI();
    }
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

    // Always attach bass events since bass is always visible
    const bassCard = this.container.querySelector(`[data-instrument-id="bass"] .instrument-card-content`) as HTMLElement;
    if (bassCard) {
      this.bassInstrument.attachEvents(bassCard);
      this.bassInstrument.updateGridDisplay(bassCard);
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

    // Attach all event handlers through EventManager
    this.eventManager.attachEvents();
  }

  private setupSyncUI() {
    if (!this.syncUIManager) {return;}

    // Setup sync UI with grid, volume, and effect send update callback
    this.syncUIManager.setupSyncUI(() => {
      this.updateGridDisplay();
      this.updateVolumeDisplays();
      this.updateEffectSendDisplays();
    });

    // Listen to remote grid changes and update UI in real-time
    this.syncUIManager.setupGridChangeListener((instrumentId, row, col, value) => {
      // Only update if this is an always-visible instrument (drums, lead1, bass) or the currently displayed instrument
      if (instrumentId !== 'drums' && instrumentId !== 'lead1' && instrumentId !== 'bass' && instrumentId !== this.currentInstrumentId) {return;}
      const instrumentCard = this.container.querySelector(`[data-instrument-id="${instrumentId}"] .instrument-card-content`);
      if (instrumentCard) {
        const cell = instrumentCard.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
          cell.classList.toggle('active', value);
        } else {
          console.warn(`UI: Cell not found for [${row}, ${col}]`);
        }
      }
    });

    // Listen to remote BPM changes and update UI
    this.syncUIManager.setupBpmChangeListener((bpm) => {
      const bpmInput = this.container.querySelector('#bpm') as HTMLInputElement;
      if (bpmInput) {
        bpmInput.value = bpm.toString();
      }
    });

    // Listen to remote volume changes and update UI
    this.syncUIManager.setupVolumeChangeListener((instrumentId, _value) => {
      // Only update if this is an always-visible instrument (drums, lead1, bass) or the currently displayed instrument
      if (instrumentId !== 'drums' && instrumentId !== 'lead1' && instrumentId !== 'bass' && instrumentId !== this.currentInstrumentId) {return;}
      const instrumentCard = this.container.querySelector(`[data-instrument-id="${instrumentId}"] .instrument-card-content`) as HTMLElement;
      if (instrumentCard) {
        if (instrumentId === 'drums') {
          this.drumInstrument.updateVolumeDisplay(instrumentCard);
        } else if (instrumentId === 'lead1') {
          this.leadInstrument.updateVolumeDisplay(instrumentCard);
        } else if (instrumentId === 'bass') {
          this.bassInstrument.updateVolumeDisplay(instrumentCard);
        }
      }
    });

    // Listen to remote effect send changes and update UI
    this.syncUIManager.setupEffectSendChangeListener((instrumentId, _value) => {
      // Only update if this is an always-visible instrument (drums, lead1, bass) or the currently displayed instrument
      if (instrumentId !== 'drums' && instrumentId !== 'lead1' && instrumentId !== 'bass' && instrumentId !== this.currentInstrumentId) {return;}
      const instrumentCard = this.container.querySelector(`[data-instrument-id="${instrumentId}"] .instrument-card-content`) as HTMLElement;
      if (instrumentCard) {
        if (instrumentId === 'drums') {
          this.drumInstrument.updateEffectSendDisplay(instrumentCard);
        } else if (instrumentId === 'lead1') {
          this.leadInstrument.updateEffectSendDisplay(instrumentCard);
        } else if (instrumentId === 'bass') {
          this.bassInstrument.updateEffectSendDisplay(instrumentCard);
        }
      }
    });

    // Update step displays for instruments
    this.sequencer.onStep((currentStep: number) => {
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

      // Always update bass since it's always visible
      const bassCard = this.container.querySelector(`[data-instrument-id="bass"] .instrument-card-content`) as HTMLElement;
      if (bassCard) {
        this.bassInstrument.updateCurrentStep(bassCard, currentStep);
      }
    });
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

    // Always update bass grid since bass is always visible
    const bassCard = this.container.querySelector(`[data-instrument-id="bass"] .instrument-card-content`) as HTMLElement;
    if (bassCard) {
      this.bassInstrument.updateGridDisplay(bassCard);
    }
  }

  private updateVolumeDisplays() {
    // Always update drums volume since drums are always visible
    const drumCard = this.container.querySelector(`[data-instrument-id="drums"] .instrument-card-content`) as HTMLElement;
    if (drumCard) {
      this.drumInstrument.updateVolumeDisplay(drumCard);
    }

    // Always update lead1 volume since lead1 is always visible
    const leadCard = this.container.querySelector(`[data-instrument-id="lead1"] .instrument-card-content`) as HTMLElement;
    if (leadCard) {
      this.leadInstrument.updateVolumeDisplay(leadCard);
    }

    // Always update bass volume since bass is always visible
    const bassCard = this.container.querySelector(`[data-instrument-id="bass"] .instrument-card-content`) as HTMLElement;
    if (bassCard) {
      this.bassInstrument.updateVolumeDisplay(bassCard);
    }
  }

  private updateEffectSendDisplays() {
    // Always update drums effect send since drums are always visible
    const drumCard = this.container.querySelector(`[data-instrument-id="drums"] .instrument-card-content`) as HTMLElement;
    if (drumCard) {
      this.drumInstrument.updateEffectSendDisplay(drumCard);
    }

    // Always update lead1 effect send since lead1 is always visible
    const leadCard = this.container.querySelector(`[data-instrument-id="lead1"] .instrument-card-content`) as HTMLElement;
    if (leadCard) {
      this.leadInstrument.updateEffectSendDisplay(leadCard);
    }

    // Always update bass effect send since bass is always visible
    const bassCard = this.container.querySelector(`[data-instrument-id="bass"] .instrument-card-content`) as HTMLElement;
    if (bassCard) {
      this.bassInstrument.updateEffectSendDisplay(bassCard);
    }
  }

  updateKitSelector(kitName: string) {
    // Always update drums kit selector since drums are always visible
    const drumCard = this.container.querySelector(`[data-instrument-id="drums"] .instrument-card-content`) as HTMLElement;
    if (drumCard) {
      SelectorUpdater.updateSelector(drumCard, 'kit', kitName);
    }
  }

  updateSynthSelector(synthType: string) {
    // Always update lead1 synth selector since lead1 is always visible
    const leadCard = this.container.querySelector(`[data-instrument-id="lead1"] .instrument-card-content`) as HTMLElement;
    if (leadCard) {
      SelectorUpdater.updateSelector(leadCard, 'synth-type', synthType);
    }
  }

  updateBassTypeSelector(bassType: string) {
    // Always update bass type selector since bass is always visible
    const bassCard = this.container.querySelector(`[data-instrument-id="bass"] .instrument-card-content`) as HTMLElement;
    if (bassCard) {
      SelectorUpdater.updateSelector(bassCard, 'bass-type', bassType);
    }
  }
}
