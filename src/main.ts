import './style.css';
import { AudioEngine } from './audio';
import { Sequencer, SAMPLES } from './sequencer';
import { UI } from './ui';

export const KITS = ['kit_a', 'kit_b', 'kit_c'];

async function loadKit(audio: AudioEngine, kit: string) {
  audio.clear();
  await Promise.all(
    SAMPLES.map(name =>
      audio.loadSample(name, `/sounds/${kit}/${name}.wav`)
    )
  );
}

async function init() {
  const audio = new AudioEngine();
  audio.setVolume(0.7);
  await loadKit(audio, KITS[0]);

  const sequencer = new Sequencer(audio);
  const app = document.querySelector<HTMLDivElement>('#app')!;
  const ui = new UI(sequencer, app, (kit) => loadKit(audio, kit));

  ui.render();
}

init();
