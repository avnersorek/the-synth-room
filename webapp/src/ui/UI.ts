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
import { InstrumentRegistry } from './managers/InstrumentRegistry';
import { InstrumentUIManager } from './managers/InstrumentUIManager';
import { InstrumentSyncCoordinator } from './managers/InstrumentSyncCoordinator';

export class UI {
  private sequencer: Sequencer;
  private container: HTMLElement;
  private instrumentRegistry: InstrumentRegistry;
  private instrumentUIManager: InstrumentUIManager;
  private instrumentSyncCoordinator: InstrumentSyncCoordinator;
  private instrumentPanel: InstrumentPanel;
  private eventManager: EventManager;
  private syncUIManager: SyncUIManager | null = null;
  private animationController: StepAnimationController;

  constructor(sequencer: Sequencer, container: HTMLElement, onKitChange: (kit: string) => void, onSynthChange: (synthType: string) => void, onLead2SynthChange: (synthType: string) => void, onBassTypeChange: (bassType: string) => void) {
    this.sequencer = sequencer;
    this.container = container;

    // Initialize instrument components
    const drumInstrument = new DrumInstrument(sequencer, onKitChange);
    const leadInstrument = new LeadInstrument(sequencer, onSynthChange, 'lead1');
    const lead2Instrument = new LeadInstrument(sequencer, onLead2SynthChange, 'lead2');
    const bassInstrument = new BassInstrument(sequencer, onBassTypeChange);

    // Initialize instrument registry
    this.instrumentRegistry = new InstrumentRegistry(
      drumInstrument,
      leadInstrument,
      lead2Instrument,
      bassInstrument
    );

    // Initialize instrument managers
    this.instrumentUIManager = new InstrumentUIManager(this.instrumentRegistry, container);
    this.instrumentSyncCoordinator = new InstrumentSyncCoordinator(
      this.instrumentRegistry,
      container,
      sequencer
    );

    // Get all available instruments from config
    const instruments = Object.values(INSTRUMENTS);
    this.instrumentPanel = new InstrumentPanel(
      instruments,
      (instrumentId) => this.getInstrumentContent(instrumentId)
    );

    // Initialize other managers
    this.eventManager = new EventManager(sequencer, container, this.instrumentUIManager);
    this.animationController = new StepAnimationController(sequencer, container);

    // Initialize sync UI manager if sync is enabled
    const sync = sequencer.getSync();
    if (sync) {
      this.syncUIManager = new SyncUIManager(sync, container);
    }
  }

  private getInstrumentContent(instrumentId: string): string {
    return this.instrumentRegistry.getInstrumentContent(instrumentId);
  }

  render() {
    const sync = this.sequencer.getSync();

    this.container.innerHTML = `
        <div class="header">
          <h1>The Synth Room</h1>
          ${sync ? `
          <div class="room-status-compact">
            <span class="status-indicator" id="status-indicator" title="Connecting...">●</span>
            <span id="users-count"></span>
            <button id="copy-room" title="Copy room URL">📋</button>
            <button id="goto-lobby" title="Go to Lobby">Lobby</button>
          </div>
          ` : ''}
        </div>
        <div class="panel">
          <div class="controls">
            <span class="section-label">you</span>
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
          <div class="panel-divider"></div>
          <div class="control-panel">
            <span class="section-label">room</span>
            <label for="bpm">BPM</label>
            <input type="number" id="bpm" value="120" min="40" max="240" />
          </div>
          <div class="control-panel">
            <span class="section-label"></span>
            <label for="grid-cols">Beats</label>
            <select id="grid-cols">
              <option value="16">16</option>
              <option value="32">32</option>
            </select>
          </div>
        </div>

        ${this.instrumentPanel.render()}
    `;

    this.attachEvents();
    this.instrumentUIManager.attachAllInstrumentEvents();
    this.animationController.startUpdateLoop();

    if (this.syncUIManager) {
      this.setupSyncUI();
    }
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
      this.instrumentUIManager.updateAllGridDisplays();
      this.instrumentUIManager.updateAllVolumeDisplays();
      this.instrumentUIManager.updateAllEffectSendDisplays();
    });

    // Setup instrument sync listeners through coordinator
    this.instrumentSyncCoordinator.setupGridChangeListener(this.syncUIManager);
    this.instrumentSyncCoordinator.setupVolumeChangeListener(this.syncUIManager);
    this.instrumentSyncCoordinator.setupEffectSendChangeListener(this.syncUIManager);
    this.instrumentSyncCoordinator.setupStepUpdateListener();

    // Listen to remote BPM changes and update UI
    this.syncUIManager.setupBpmChangeListener((bpm) => {
      const bpmInput = this.container.querySelector('#bpm') as HTMLInputElement;
      if (bpmInput) {
        bpmInput.value = bpm.toString();
      }
    });

    // Listen to remote grid column count changes and update UI
    this.syncUIManager.setupGridColsChangeListener((gridCols) => {
      const gridColsSelect = this.container.querySelector('#grid-cols') as HTMLSelectElement;
      if (gridColsSelect) {
        gridColsSelect.value = gridCols.toString();
      }

      // Re-render all instrument grids with new column count
      // Note: Yjs will automatically sync the resized arrays from the remote user
      this.instrumentUIManager.reRenderAllInstruments();
    });
  }

  updateKitSelector(kitName: string) {
    const drumCard = this.container.querySelector(`[data-instrument-id="drums"] .instrument-card-content`) as HTMLElement;
    if (drumCard) {
      this.instrumentRegistry.updateSelector('drums', drumCard, kitName);
    }
  }

  updateSynthSelector(synthType: string) {
    const leadCard = this.container.querySelector(`[data-instrument-id="lead1"] .instrument-card-content`) as HTMLElement;
    if (leadCard) {
      this.instrumentRegistry.updateSelector('lead1', leadCard, synthType);
    }
  }

  updateLead2SynthSelector(synthType: string) {
    const lead2Card = this.container.querySelector(`[data-instrument-id="lead2"] .instrument-card-content`) as HTMLElement;
    if (lead2Card) {
      this.instrumentRegistry.updateSelector('lead2', lead2Card, synthType);
    }
  }

  updateBassTypeSelector(bassType: string) {
    const bassCard = this.container.querySelector(`[data-instrument-id="bass"] .instrument-card-content`) as HTMLElement;
    if (bassCard) {
      this.instrumentRegistry.updateSelector('bass', bassCard, bassType);
    }
  }
}
