/**
 * Manages step animations (play button pulse, title pulse)
 */

import { Sequencer } from '../../sequencer';

export class StepAnimationController {
  private sequencer: Sequencer;
  private container: HTMLElement;
  private lastStep: number = -1;

  constructor(sequencer: Sequencer, container: HTMLElement) {
    this.sequencer = sequencer;
    this.container = container;
  }

  /**
   * Start the update loop for animations
   */
  startUpdateLoop(): void {
    // Use callback-based updates instead of polling for better sync
    this.sequencer.onStep((currentStep: number) => {
      this.updateAnimations(currentStep);
    });
  }

  /**
   * Update animations for the current step
   */
  private updateAnimations(currentStep: number): void {
    // Pulse play button and title every 4 beats (on the downbeat) when playing
    if (this.sequencer.isPlaying() && currentStep % 4 === 0 && currentStep !== this.lastStep) {
      this.pulsePlayButton();
      this.pulseTitle();
      this.lastStep = currentStep;
    } else if (currentStep % 4 !== 0) {
      this.lastStep = -1; // Reset tracker when not on downbeat
    }
  }

  /**
   * Pulse the play button animation
   */
  private pulsePlayButton(): void {
    const playButton = this.container.querySelector('#play') as HTMLElement;
    if (playButton) {
      // Remove and re-add class to restart animation
      playButton.classList.remove('playing');
      // Force reflow to restart animation
      void playButton.offsetWidth;
      playButton.classList.add('playing');
    }
  }

  /**
   * Pulse the title animation
   */
  private pulseTitle(): void {
    const title = this.container.querySelector('h1') as HTMLElement;
    if (title) {
      // Remove and re-add class to restart animation
      title.classList.remove('playing');
      // Force reflow to restart animation
      void title.offsetWidth;
      title.classList.add('playing');
    }
  }
}
