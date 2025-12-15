import { Sequencer, SAMPLES } from './sequencer';
import { KITS } from './main';

export class UI {
  private sequencer: Sequencer;
  private container: HTMLElement;
  private onKitChange: (kit: string) => Promise<void>;

  constructor(sequencer: Sequencer, container: HTMLElement, onKitChange: (kit: string) => Promise<void>) {
    this.sequencer = sequencer;
    this.container = container;
    this.onKitChange = onKitChange;
  }

  render() {
    this.container.innerHTML = `
      <div class="drum-machine">
        <h1>The Synth Room</h1>
        <div class="controls">
          <select id="kit">
            ${KITS.map(kit => `<option value="${kit}">${kit}</option>`).join('')}
          </select>
          <input type="number" id="bpm" value="120" min="40" max="240" />
          <label for="bpm">BPM</label>
          <input type="range" id="volume" min="0" max="1" step="0.01" value="0.7" />
          <label for="volume">♩</label>
          <button id="play">►</button>
          <button id="stop">⏹</button>
        </div>
        <div class="grid" id="grid"></div>
      </div>
    `;

    this.renderGrid();
    this.attachEvents();
    this.startUpdateLoop();
  }

  private renderGrid() {
    const grid = this.container.querySelector('#grid')!;
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

    grid.innerHTML = html;
  }

  private attachEvents() {
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.classList.contains('cell')) {
        const row = parseInt(target.dataset.row!);
        const col = parseInt(target.dataset.col!);
        this.sequencer.toggle(row, col);
        target.classList.toggle('active');
      }

      if (target.id === 'play') {
        this.sequencer.play();
      }

      if (target.id === 'stop') {
        this.sequencer.stop();
      }
    });

    const bpmInput = this.container.querySelector('#bpm') as HTMLInputElement;
    bpmInput.addEventListener('input', () => {
      this.sequencer.setBpm(parseInt(bpmInput.value));
    });

    const volumeInput = this.container.querySelector('#volume') as HTMLInputElement;
    volumeInput.addEventListener('input', () => {
      this.sequencer.setVolume(parseFloat(volumeInput.value));
    });

    const kitSelect = this.container.querySelector('#kit') as HTMLSelectElement;
    kitSelect.addEventListener('change', () => {
      this.onKitChange(kitSelect.value);
    });
  }

  private startUpdateLoop() {
    setInterval(() => {
      const isPlaying = this.sequencer.isPlaying();
      const currentStep = this.sequencer.getCurrentStep();
      this.container.querySelectorAll('.cell').forEach((cell) => {
        const col = parseInt((cell as HTMLElement).dataset.col!);
        cell.classList.toggle('current', isPlaying && col === currentStep);
      });
    }, 50);
  }
}
