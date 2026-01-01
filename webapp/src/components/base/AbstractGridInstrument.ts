/**
 * Base class for grid-based instruments (drums, lead synth, etc.)
 * Extracts common functionality from DrumInstrument and LeadInstrument
 */

import { Sequencer } from '../../sequencer';

export abstract class AbstractGridInstrument {
  protected sequencer: Sequencer;
  protected instrumentId: string;
  protected eventController: AbortController | null = null;

  constructor(sequencer: Sequencer, instrumentId: string) {
    this.sequencer = sequencer;
    this.instrumentId = instrumentId;
  }

  /**
   * Get the current grid column count from the sync manager
   */
  protected getGridCols(): number {
    const sync = this.sequencer.getSync();
    return sync ? sync.getGridCols() : 16;
  }

  /**
   * Render the instrument UI
   * Must be implemented by subclasses
   */
  abstract render(): string;

  /**
   * Render the grid portion
   * Must be implemented by subclasses
   */
  public abstract renderGrid(): string;

  /**
   * Attach event handlers to the container
   * Can be overridden by subclasses for custom behavior
   */
  attachEvents(container: HTMLElement): void {
    // Clean up any existing event listeners
    if (this.eventController) {
      this.eventController.abort();
    }
    this.eventController = new AbortController();

    // Cell click handler
    container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains('cell')) {
        const rowStr = target.dataset.row;
        const colStr = target.dataset.col;
        if (rowStr !== undefined && colStr !== undefined) {
          const row = parseInt(rowStr);
          const col = parseInt(colStr);
          this.onCellClick(row, col, target);
        }
      }
    }, { signal: this.eventController.signal });

    // Volume control handler
    const volumeSlider = container.querySelector(`#${this.instrumentId}-volume`) as HTMLInputElement;
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        this.sequencer.setInstrumentVolume(this.instrumentId, value);
      }, { signal: this.eventController.signal });
    }

    // Effect send control handler
    const effectSendSlider = container.querySelector(`#${this.instrumentId}-effect-send`) as HTMLInputElement;
    if (effectSendSlider) {
      effectSendSlider.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        this.sequencer.setEffectSend(this.instrumentId, value);
      }, { signal: this.eventController.signal });
    }

    // Let subclasses attach additional events
    this.attachAdditionalEvents(container, this.eventController.signal);
  }

  /**
   * Handle cell click - can be overridden by subclasses
   */
  protected onCellClick(row: number, col: number, target: HTMLElement): void {
    this.sequencer.toggle(this.instrumentId, row, col);
    target.classList.toggle('active');
  }

  /**
   * Hook for subclasses to attach additional events
   */
  protected attachAdditionalEvents(_container: HTMLElement, _signal: AbortSignal): void {
    // Override in subclasses if needed
  }

  /**
   * Update all cells to reflect current sequencer state
   * This method is identical across DrumInstrument and LeadInstrument
   */
  updateGridDisplay(container: HTMLElement): void {
    container.querySelectorAll('.cell').forEach((cell) => {
      const cellElement = cell as HTMLElement;
      const rowStr = cellElement.dataset.row;
      const colStr = cellElement.dataset.col;
      if (rowStr !== undefined && colStr !== undefined) {
        const row = parseInt(rowStr);
        const col = parseInt(colStr);
        const isActive = this.sequencer.isActive(this.instrumentId, row, col);
        cell.classList.toggle('active', isActive);
      }
    });
  }

  /**
   * Update which step is currently playing
   * This method is identical across DrumInstrument and LeadInstrument
   */
  updateCurrentStep(container: HTMLElement, currentStep: number): void {
    const isPlaying = this.sequencer.isPlaying();
    container.querySelectorAll('.cell').forEach((cell) => {
      const colStr = (cell as HTMLElement).dataset.col;
      if (colStr !== undefined) {
        const col = parseInt(colStr);
        cell.classList.toggle('current', isPlaying && col === currentStep);
      }
    });
  }

  /**
   * Update a selector element with a new value
   * Generic implementation for kit/synth selectors
   */
  protected updateSelector(container: HTMLElement, selectorId: string, value: string): void {
    const selector = container.querySelector(`#${selectorId}`) as HTMLSelectElement;
    if (selector) {
      selector.value = value;
    }
  }

  /**
   * Render volume control slider
   * Reusable component for all instruments
   */
  protected renderVolumeControl(): string {
    const volume = this.sequencer.getInstrumentVolume(this.instrumentId);
    return `
      <div class="control-group">
        <label for="${this.instrumentId}-volume">Volume:</label>
        <input type="range" id="${this.instrumentId}-volume" min="0" max="1" step="0.01" value="${volume}" class="small-range-input" />
      </div>
    `;
  }

  /**
   * Render effect send control slider
   * Reusable component for all instruments
   */
  protected renderEffectSendControl(): string {
    const effectSend = this.sequencer.getEffectSend(this.instrumentId);
    return `
      <div class="control-group">
        <label for="${this.instrumentId}-effect-send">Delay:</label>
        <input type="range" id="${this.instrumentId}-effect-send" min="0" max="1" step="0.01" value="${effectSend}" class="small-range-input" />
      </div>
    `;
  }

  /**
   * Update volume slider to reflect current value
   */
  updateVolumeDisplay(container: HTMLElement): void {
    const volumeSlider = container.querySelector(`#${this.instrumentId}-volume`) as HTMLInputElement;
    if (volumeSlider) {
      const currentVolume = this.sequencer.getInstrumentVolume(this.instrumentId);
      volumeSlider.value = currentVolume.toString();
    }
  }

  /**
   * Update effect send slider to reflect current value
   */
  updateEffectSendDisplay(container: HTMLElement): void {
    const effectSendSlider = container.querySelector(`#${this.instrumentId}-effect-send`) as HTMLInputElement;
    if (effectSendSlider) {
      const currentEffectSend = this.sequencer.getEffectSend(this.instrumentId);
      effectSendSlider.value = currentEffectSend.toString();
    }
  }
}
