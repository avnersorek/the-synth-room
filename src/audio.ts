export class AudioEngine {
  private context: AudioContext;
  private buffers: Map<string, AudioBuffer>;
  private gainNode: GainNode;

  constructor() {
    this.context = new AudioContext();
    this.buffers = new Map();
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
  }

  async loadSample(name: string, url: string) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
    this.buffers.set(name, audioBuffer);
  }

  play(name: string) {
    const buffer = this.buffers.get(name);
    if (!buffer) return;

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    source.start();
  }

  setVolume(value: number) {
    this.gainNode.gain.value = value;
  }

  clear() {
    this.buffers.clear();
  }
}
