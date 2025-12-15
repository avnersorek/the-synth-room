import { Sequencer } from '../sequencer';
import { SYNTH_TYPES, LEAD_NOTES } from '../types';

export class LeadInstrument {
  private sequencer: Sequencer;
  private onSynthChange: (synthType: string) => void;

  constructor(sequencer: Sequencer, onSynthChange: (synthType: string) => void) {
    this.sequencer = sequencer;
    this.onSynthChange = onSynthChange;
  }

  render(): string {
    return `
      <div class="lead-instrument">
        <div class="lead-controls">
          <label for="synth-type">Synth:</label>
          <select id="synth-type">
            ${SYNTH_TYPES.map(type => `<option value="${type}">${type}</option>`).join('')}
          </select>
        </div>
        <div class="grid" id="lead-grid">
          ${this.renderGrid()}
        </div>
      </div>
    `;
  }

  private renderGrid(): string {
    let html = '';

    // Render notes in reverse order (C4 at top, C2 at bottom) like a piano roll
    for (let row = 24; row >= 0; row--) {
      const noteName = LEAD_NOTES[row];
      const isSharp = noteName.includes('#');
      const keyClass = isSharp ? 'black-key' : 'white-key';

      html += `<div class="row lead-row ${keyClass}">`;
      html += `<div class="label lead-label">${noteName}</div>`;
      for (let col = 0; col < 16; col++) {
        const beatGroup = Math.floor(col / 4);
        html += `<div class="cell lead-cell beat-${beatGroup}" data-row="${row}" data-col="${col}"></div>`;
      }
      html += `</div>`;
    }

    return html;
  }

  attachEvents(container: HTMLElement) {
    // Cell click handler
    container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains('cell')) {
        const row = parseInt(target.dataset.row!);
        const col = parseInt(target.dataset.col!);
        this.sequencer.toggle('lead1', row, col);
        target.classList.toggle('active');
      }
    });

    // Synth type selector change handler
    const synthSelect = container.querySelector('#synth-type') as HTMLSelectElement;
    if (synthSelect) {
      synthSelect.addEventListener('change', () => {
        this.onSynthChange(synthSelect.value);
      });
    }
  }

  updateGridDisplay(container: HTMLElement) {
    // Update all cells to reflect current sequencer state
    container.querySelectorAll('.cell').forEach((cell) => {
      const row = parseInt((cell as HTMLElement).dataset.row!);
      const col = parseInt((cell as HTMLElement).dataset.col!);
      const isActive = this.sequencer.isActive('lead1', row, col);
      cell.classList.toggle('active', isActive);
    });
  }

  updateCurrentStep(container: HTMLElement, currentStep: number) {
    // Update which step is currently playing
    const isPlaying = this.sequencer.isPlaying();
    container.querySelectorAll('.cell').forEach((cell) => {
      const col = parseInt((cell as HTMLElement).dataset.col!);
      cell.classList.toggle('current', isPlaying && col === currentStep);
    });
  }

  updateSynthSelector(container: HTMLElement, synthType: string) {
    const synthSelect = container.querySelector('#synth-type') as HTMLSelectElement;
    if (synthSelect) {
      synthSelect.value = synthType;
    }
  }
}
