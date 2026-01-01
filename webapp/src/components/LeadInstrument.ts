/**
 * Lead synth instrument component
 * Extends AbstractGridInstrument for grid-based functionality
 */

import { Sequencer } from '../sequencer';
import { SYNTH_TYPES, LEAD2_SYNTH_TYPES, LEAD_NOTES } from '../types';
import { AbstractGridInstrument } from './base/AbstractGridInstrument';
import { renderCell, renderLabel } from './base/GridRenderer';

export class LeadInstrument extends AbstractGridInstrument {
  private onSynthChange: (synthType: string) => void;
  private synthTypes: readonly string[];

  constructor(
    sequencer: Sequencer,
    onSynthChange: (synthType: string) => void,
    instrumentId: 'lead1' | 'lead2' = 'lead1'
  ) {
    super(sequencer, instrumentId);
    this.onSynthChange = onSynthChange;
    this.synthTypes = instrumentId === 'lead1' ? SYNTH_TYPES : LEAD2_SYNTH_TYPES;
  }

  render(): string {
    return `
      <div class="lead-instrument">
        <div class="lead-controls">
          <label for="synth-type">Synth:</label>
          <select id="synth-type">
            ${this.synthTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
          </select>
          ${this.renderVolumeControl()}
          ${this.renderEffectSendControl()}
        </div>
        <div class="grid" id="lead-grid">
          ${this.renderGrid()}
        </div>
      </div>
    `;
  }

  public renderGrid(): string {
    let html = '';
    const gridCols = this.getGridCols();

    // Render notes in reverse order (C4 at top, C2 at bottom) like a piano roll
    for (let row = 24; row >= 0; row--) {
      const noteName = LEAD_NOTES[row];
      const isSharp = noteName.includes('#');
      const keyClass = isSharp ? 'black-key' : 'white-key';

      html += `<div class="row lead-row ${keyClass}">`;
      html += renderLabel(noteName, 'lead-label');
      for (let col = 0; col < gridCols; col++) {
        html += renderCell(row, col, 'lead-cell');
      }
      html += `</div>`;
    }

    return html;
  }

  protected attachAdditionalEvents(container: HTMLElement, signal: AbortSignal): void {
    // Synth type selector change handler
    const synthSelect = container.querySelector('#synth-type') as HTMLSelectElement;
    if (synthSelect) {
      synthSelect.addEventListener('change', () => {
        this.onSynthChange(synthSelect.value);
      }, { signal });
    }
  }

  updateSynthSelector(container: HTMLElement, synthType: string): void {
    this.updateSelector(container, 'synth-type', synthType);
  }
}
