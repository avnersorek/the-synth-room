/**
 * Configuration utilities for environment detection and URL parsing
 */

/**
 * Get room ID from URL query parameters
 * @returns Room ID if present, null otherwise
 */
export function getRoomId(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

/**
 * Get PartyKit host based on environment
 * @returns PartyKit host URL
 */
export function getPartyKitHost(): string {
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isDev ? 'localhost:1999' : 'the-synth-room.avnersorek.partykit.dev';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}
