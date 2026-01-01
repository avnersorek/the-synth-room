/**
 * Drum instrument component
 * Extends AbstractGridInstrument for grid-based functionality
 */

import { Sequencer, SAMPLES } from '../sequencer';
import { KITS } from '../types';
import { AbstractGridInstrument } from './base/AbstractGridInstrument';
import { renderCell, renderLabel } from './base/GridRenderer';

export class DrumInstrument extends AbstractGridInstrument {
  private onKitChange: (kit: string) => void;

  private static getKitDisplayName(kitId: string): string {
    const nameMap: { [key: string]: string } = {
      'kit_cr78': 'CR-78',
      'kit_real': 'Real',
      'kit_80s': '80s',
      'kit_lofi': 'Lo-Fi'
    };
    return nameMap[kitId] || kitId;
  }

  constructor(sequencer: Sequencer, onKitChange: (kit: string) => void) {
    super(sequencer, 'drums');
    this.onKitChange = onKitChange;
  }

  render(): string {
    return `
      <div class="drum-instrument">
        <div class="drum-controls">
          <label for="kit">Kit:</label>
          <select id="kit">
            ${KITS.map(kit => `<option value="${kit}">${DrumInstrument.getKitDisplayName(kit)}</option>`).join('')}
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

  public renderGrid(): string {
    let html = '';
    const gridCols = this.getGridCols();

    for (let row = 0; row < 8; row++) {
      html += `<div class="row">`;
      html += renderLabel(SAMPLES[row]);
      for (let col = 0; col < gridCols; col++) {
        html += renderCell(row, col);
      }
      html += `</div>`;
    }

    return html;
  }

  protected attachAdditionalEvents(container: HTMLElement, signal: AbortSignal): void {
    // Kit selector change handler
    const kitSelect = container.querySelector('#kit') as HTMLSelectElement;
    if (kitSelect) {
      kitSelect.addEventListener('change', () => {
        this.onKitChange(kitSelect.value);
      }, { signal });
    }
  }

  updateKitSelector(container: HTMLElement, kitName: string): void {
    this.updateSelector(container, 'kit', kitName);
  }
}
