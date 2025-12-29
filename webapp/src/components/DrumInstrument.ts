/**
 * Drum instrument component
 * Extends AbstractGridInstrument for grid-based functionality
 */

import { Sequencer, SAMPLES } from '../sequencer';
import { KITS } from '../types';
import { AbstractGridInstrument } from './base/AbstractGridInstrument';
import { renderCell, renderLabel } from './base/GridRenderer';

export class DrumInstrument extends AbstractGridInstrument {
  private onKitChange: (kit: string) => Promise<void>;

  constructor(sequencer: Sequencer, onKitChange: (kit: string) => Promise<void>) {
    super(sequencer, 'drums');
    this.onKitChange = onKitChange;
  }

  render(): string {
    return `
      <div class="drum-instrument">
        <div class="drum-controls">
          <label for="kit">Kit:</label>
          <select id="kit">
            ${KITS.map(kit => `<option value="${kit}">${kit}</option>`).join('')}
          </select>
          ${this.renderVolumeControl()}
          ${this.renderEffectSendControl()}
        </div>
        <div class="grid" id="drum-grid">
          ${this.renderGrid()}
        </div>
      </div>
    `;
  }

  protected renderGrid(): string {
    let html = '';

    for (let row = 0; row < 8; row++) {
      html += `<div class="row">`;
      html += renderLabel(SAMPLES[row]);
      for (let col = 0; col < 16; col++) {
        html += renderCell(row, col);
      }
      html += `</div>`;
    }

    return html;
  }

  protected attachAdditionalEvents(container: HTMLElement): void {
    // Kit selector change handler
    const kitSelect = container.querySelector('#kit') as HTMLSelectElement;
    if (kitSelect) {
      kitSelect.addEventListener('change', () => {
        this.onKitChange(kitSelect.value);
      });
    }
  }

  updateKitSelector(container: HTMLElement, kitName: string): void {
    this.updateSelector(container, 'kit', kitName);
  }
}
