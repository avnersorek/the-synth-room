/**
 * Effects controller for managing audio effects
 * Handles creation and routing of effects like PingPongDelay
 */

import * as Tone from 'tone';

export class EffectsController {
  private pingPong: Tone.PingPongDelay;
  private effectSends: Map<string, Tone.Volume>;

  constructor(destination: Tone.ToneAudioNode) {
    this.effectSends = new Map();

    // Create PingPongDelay effect
    this.pingPong = new Tone.PingPongDelay("3n", 0.2).connect(destination);
  }

  /**
   * Get or create an effect send for an instrument
   */
  getOrCreateEffectSend(instrumentId: string): Tone.Volume {
    let send = this.effectSends.get(instrumentId);
    if (!send) {
      // Create a send volume node that connects to the effect
      // Start with -Infinity (muted) by default
      send = new Tone.Volume(-Infinity).connect(this.pingPong);
      this.effectSends.set(instrumentId, send);
    }
    return send;
  }

  /**
   * Set the effect send amount for an instrument (0-1 range)
   */
  setEffectSend(instrumentId: string, value: number): void {
    const send = this.getOrCreateEffectSend(instrumentId);

    // Convert 0-1 range to decibels
    if (value === 0) {
      send.volume.value = -Infinity;
    } else {
      send.volume.value = Tone.gainToDb(value);
    }
  }

  /**
   * Get the effect send volume node for an instrument
   * This is used to connect the instrument's output to the effect
   */
  getEffectSendNode(instrumentId: string): Tone.Volume {
    return this.getOrCreateEffectSend(instrumentId);
  }

  /**
   * Get the current effect send value for an instrument
   */
  getEffectSend(instrumentId: string): number {
    const send = this.effectSends.get(instrumentId);
    if (!send) return 0;

    const dbValue = send.volume.value;
    if (dbValue === -Infinity) return 0;
    return Tone.dbToGain(dbValue);
  }

  /**
   * Cleanup all effects
   */
  dispose(): void {
    this.effectSends.forEach(send => send.dispose());
    this.effectSends.clear();
    this.pingPong.dispose();
  }
}
