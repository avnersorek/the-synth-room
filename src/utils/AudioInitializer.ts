/**
 * Utility for initializing the Tone.js audio context.
 * Handles the one-time audio context startup that requires user interaction.
 */

let audioStarted = false;

export class AudioInitializer {
  /**
   * Starts the Tone.js audio context if not already started.
   * Must be called from a user interaction event (click, keypress, etc.)
   */
  static async startAudioContext(): Promise<void> {
    if (audioStarted) {
      return;
    }

    const Tone = await import('tone');
    await Tone.start();
    audioStarted = true;
    console.log('Tone.js audio context started');
  }

  /**
   * Check if the audio context has been started
   */
  static isAudioStarted(): boolean {
    return audioStarted;
  }

  /**
   * Reset the audio started flag (mainly for testing)
   */
  static reset(): void {
    audioStarted = false;
  }
}
