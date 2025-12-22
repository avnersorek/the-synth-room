/**
 * Bass synth instrument component
 * Extends AbstractGridInstrument for grid-based functionality
 */

import { Sequencer } from '../sequencer';
import { BASS_OSCILLATOR_TYPES, BASS_NOTES } from '../types';
import { AbstractGridInstrument } from './base/AbstractGridInstrument';
import { renderCell, renderLabel } from './base/GridRenderer';

export class BassInstrument extends AbstractGridInstrument {
  private onOscillatorChange: (oscillatorType: string) => void;

  constructor(sequencer: Sequencer, onOscillatorChange: (oscillatorType: string) => void) {
    super(sequencer, 'bass');
    this.onOscillatorChange = onOscillatorChange;
  }

  render(): string {
    return `
      <div class="bass-instrument">
        <div class="bass-controls">
          <label for="bass-oscillator-type">Oscillator:</label>
          <select id="bass-oscillator-type">
            ${BASS_OSCILLATOR_TYPES.map(type => `<option value="${type}">${type}</option>`).join('')}
          </select>
          ${this.renderVolumeControl()}
        </div>
        <div class="grid" id="bass-grid">
          ${this.renderGrid()}
        </div>
      </div>
    `;
  }

  protected renderGrid(): string {
    let html = '';

    // Render notes in reverse order (C2 at top, C0 at bottom) like a piano roll
    for (let row = 24; row >= 0; row--) {
      const noteName = BASS_NOTES[row];
      const isSharp = noteName.includes('#');
      const keyClass = isSharp ? 'black-key' : 'white-key';

      html += `<div class="row bass-row ${keyClass}">`;
      html += renderLabel(noteName, 'bass-label');
      for (let col = 0; col < 16; col++) {
        html += renderCell(row, col, 'bass-cell');
      }
      html += `</div>`;
    }

    return html;
  }

  protected attachAdditionalEvents(container: HTMLElement): void {
    // Oscillator type selector change handler
    const oscillatorSelect = container.querySelector('#bass-oscillator-type') as HTMLSelectElement;
    if (oscillatorSelect) {
      oscillatorSelect.addEventListener('change', () => {
        this.onOscillatorChange(oscillatorSelect.value);
      });
    }
  }

  updateOscillatorSelector(container: HTMLElement, oscillatorType: string): void {
    this.updateSelector(container, 'bass-oscillator-type', oscillatorType);
  }
}
