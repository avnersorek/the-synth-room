/**
 * Factory for creating drum sampler instruments
 */

import * as Tone from 'tone';

export class DrumSamplerFactory {
  /**
   * Create a sampler for a drum sound
   */
  static createSampler(
    name: string,
    url: string,
    onLoad?: () => void
  ): Tone.Sampler {
    return new Tone.Sampler({
      urls: {
        'C3': url.replace('/sounds/', './sounds/'),
      },
      onload: () => {
        console.log(`Sample ${name} loaded`);
        if (onLoad) {
          onLoad();
        }
      },
    });
  }
}
