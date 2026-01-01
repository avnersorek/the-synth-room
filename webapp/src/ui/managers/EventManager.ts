/**
 * Manages all UI event handlers (play/stop, keyboard, BPM, volume)
 */

import { Sequencer } from '../../sequencer';
import { AudioInitializer } from '../../utils/AudioInitializer';
import { InstrumentUIManager } from './InstrumentUIManager';

export class EventManager {
  private sequencer: Sequencer;
  private container: HTMLElement;
  private instrumentUIManager: InstrumentUIManager;

  constructor(sequencer: Sequencer, container: HTMLElement, instrumentUIManager: InstrumentUIManager) {
    this.sequencer = sequencer;
    this.container = container;
    this.instrumentUIManager = instrumentUIManager;
  }

  /**
   * Attach all event handlers
   */
  attachEvents(): void {
    this.attachPlayStopEvents();
    this.attachKeyboardEvents();
    this.attachBpmControl();
    this.attachVolumeControl();
    this.attachGridColsControl();
  }

  /**
   * Attach play/stop button click handlers
   */
  private attachPlayStopEvents(): void {
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.id === 'play') {
        void AudioInitializer.startAudioContext()
          .then(() => this.sequencer.play())
          .catch((error) => console.error('Failed to start audio:', error));
      }

      if (target.id === 'stop') {
        this.sequencer.stop();
      }
    });
  }

  /**
   * Attach keyboard shortcuts (spacebar for play/stop)
   */
  private attachKeyboardEvents(): void {
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
          void AudioInitializer.startAudioContext()
            .then(() => this.sequencer.play())
            .catch((error) => console.error('Failed to start audio:', error));
        }
      }
    });
  }

  /**
   * Attach BPM control input handler
   */
  private attachBpmControl(): void {
    const bpmInput = this.container.querySelector('#bpm') as HTMLInputElement;
    if (bpmInput) {
      bpmInput.addEventListener('input', () => {
        this.sequencer.setBpm(parseInt(bpmInput.value));
      });
    }
  }

  /**
   * Attach volume control input handler
   */
  private attachVolumeControl(): void {
    const volumeInput = this.container.querySelector('#volume') as HTMLInputElement;
    if (volumeInput) {
      volumeInput.addEventListener('input', () => {
        this.sequencer.setVolume(parseFloat(volumeInput.value));
      });
    }
  }

  /**
   * Attach grid column count control handler
   */
  private attachGridColsControl(): void {
    const gridColsSelect = this.container.querySelector('#grid-cols') as HTMLSelectElement;
    if (gridColsSelect) {
      gridColsSelect.addEventListener('change', () => {
        const value = parseInt(gridColsSelect.value);
        this.sequencer.setGridCols(value);

        const sync = this.sequencer.getSync();
        if (sync) {
          // Resize all instrument grids in Yjs before re-rendering
          const instruments = ['drums', 'lead1', 'lead2', 'bass'];
          instruments.forEach((instrumentId) => {
            sync.resizeGrid(instrumentId, value);
          });

          sync.setGridCols(value);
        }

        // Re-render all instrument grids with new column count
        this.instrumentUIManager.reRenderAllInstruments();
      });
    }
  }
}
