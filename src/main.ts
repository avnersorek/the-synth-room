import './style.css';
import './components/glowcard.css';
import { AudioEngine } from './audio';
import { Sequencer } from './sequencer';
import { UI } from './ui';
import { SyncManager } from './sync';
import { Lobby } from './lobby';

let isLoadingKitFromSync = false;

async function loadKit(sequencer: Sequencer, kit: string) {
  console.log(`loadKit: Loading kit "${kit}"`);

  try {
    const drumsInstrument = sequencer.getInstrument('drums');
    if (drumsInstrument) {
      await drumsInstrument.loadSamples(kit);
      console.log(`loadKit: All samples loaded for kit "${kit}"`);
    }
  } catch (error) {
    console.error(`loadKit: Error loading kit "${kit}":`, error);
    throw error;
  }
}

// Get room ID from URL (returns null if no room parameter)
function getRoomId(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

function getPartyKitHost(): string {
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isDev ? 'localhost:1999' : 'the-synth-room.yourusername.partykit.dev';
}

async function initLobby() {
  const app = document.querySelector<HTMLDivElement>('#app')!;
  const partyKitHost = getPartyKitHost();
  const lobby = new Lobby(app, partyKitHost);
  await lobby.render();
}

async function initRoom(roomId: string) {
  const audio = new AudioEngine();
  audio.setVolume(0.7);

  // Initialize room and sync
  const partyKitHost = getPartyKitHost();

  const sync = new SyncManager({
    roomId,
    partyKitHost,
  });

  // Create sequencer with sync enabled
  const sequencer = new Sequencer(audio, sync);

  // Load initial kit from sync or default
  const initialKit = sync.getKit();
  await loadKit(sequencer, initialKit);

  // Initialize lead synth
  const lead1Instrument = sequencer.getInstrument('lead1');
  if (lead1Instrument) {
    await lead1Instrument.loadSamples();
  }

  const app = document.querySelector<HTMLDivElement>('#app')!;

  // Handle kit changes
  const onKitChange = async (kit: string) => {
    // Update sync if this is a local change
    if (!isLoadingKitFromSync) {
      sync.setKit(kit);
    }
    await loadKit(sequencer, kit);
  };

  // Handle synth type changes
  const onSynthChange = (synthType: string) => {
    const lead1 = sequencer.getInstrument('lead1');
    if (lead1) {
      lead1.setParameter('synthType', synthType);
      audio.createSynth('lead1', synthType as any);
    }
  };

  const ui = new UI(sequencer, app, onKitChange, onSynthChange);

  // Listen to remote kit changes
  sync.onKitChange(async (kitName) => {
    console.log(`main.ts: Remote kit change detected: "${kitName}"`);
    isLoadingKitFromSync = true;
    try {
      await loadKit(sequencer, kitName);
      // Update UI kit selector to reflect the change
      ui.updateKitSelector(kitName);
      console.log(`main.ts: Kit "${kitName}" loaded successfully`);
    } catch (error) {
      console.error(`main.ts: Error loading kit "${kitName}":`, error);
    } finally {
      isLoadingKitFromSync = false;
    }
  });

  ui.render();
}

async function init() {
  const roomId = getRoomId();

  if (roomId) {
    // Room mode: join or create a room
    await initRoom(roomId);
  } else {
    // Lobby mode: show room browser
    await initLobby();
  }
}

init();
