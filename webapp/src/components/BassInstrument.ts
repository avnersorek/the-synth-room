/**
 * Bass synth instrument component
 * Extends AbstractGridInstrument for grid-based functionality
 */

import { Sequencer } from '../sequencer';
import { BASS_TYPES, BASS_NOTES } from '../types';
import { AbstractGridInstrument } from './base/AbstractGridInstrument';
import { renderCell, renderLabel } from './base/GridRenderer';

export class BassInstrument extends AbstractGridInstrument {
  private onBassTypeChange: (bassType: string) => void;

  constructor(sequencer: Sequencer, onBassTypeChange: (bassType: string) => void) {
    super(sequencer, 'bass');
    this.onBassTypeChange = onBassTypeChange;
  }

  render(): string {
    return `
      <div class="bass-instrument">
        <div class="bass-controls">
          <label for="bass-type">Bass Type:</label>
          <select id="bass-type">
            ${BASS_TYPES.map(type => `<option value="${type}">${type}</option>`).join('')}
          </select>
          ${this.renderVolumeControl()}
          ${this.renderEffectSendControl()}
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
    // Bass type selector change handler
    const bassTypeSelect = container.querySelector('#bass-type') as HTMLSelectElement;
    if (bassTypeSelect) {
      bassTypeSelect.addEventListener('change', () => {
        this.onBassTypeChange(bassTypeSelect.value);
      });
    }
  }

  updateBassTypeSelector(container: HTMLElement, bassType: string): void {
    this.updateSelector(container, 'bass-type', bassType);
  }
}
