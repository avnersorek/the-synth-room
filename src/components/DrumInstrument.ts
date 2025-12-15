import { Sequencer, SAMPLES } from '../sequencer';
import { KITS } from '../types';

export class DrumInstrument {
  private sequencer: Sequencer;
  private onKitChange: (kit: string) => Promise<void>;

  constructor(sequencer: Sequencer, onKitChange: (kit: string) => Promise<void>) {
    this.sequencer = sequencer;
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
        </div>
        <div class="grid" id="drum-grid">
          ${this.renderGrid()}
        </div>
      </div>
    `;
  }

  private renderGrid(): string {
    let html = '';

    for (let row = 0; row < 8; row++) {
      html += `<div class="row">`;
      html += `<div class="label">${SAMPLES[row]}</div>`;
      for (let col = 0; col < 16; col++) {
        const beatGroup = Math.floor(col / 4);
        html += `<div class="cell beat-${beatGroup}" data-row="${row}" data-col="${col}"></div>`;
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
        this.sequencer.toggle('drums', row, col);
        target.classList.toggle('active');
      }
    });

    // Kit selector change handler
    const kitSelect = container.querySelector('#kit') as HTMLSelectElement;
    if (kitSelect) {
      kitSelect.addEventListener('change', () => {
        this.onKitChange(kitSelect.value);
      });
    }
  }

  updateGridDisplay(container: HTMLElement) {
    // Update all cells to reflect current sequencer state
    container.querySelectorAll('.cell').forEach((cell) => {
      const row = parseInt((cell as HTMLElement).dataset.row!);
      const col = parseInt((cell as HTMLElement).dataset.col!);
      const isActive = this.sequencer.isActive('drums', row, col);
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

  updateKitSelector(container: HTMLElement, kitName: string) {
    const kitSelect = container.querySelector('#kit') as HTMLSelectElement;
    if (kitSelect) {
      kitSelect.value = kitName;
    }
  }
}
