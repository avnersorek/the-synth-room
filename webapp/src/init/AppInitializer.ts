/**
 * Main application initializer
 * Determines whether to show lobby or initialize a room
 */

import { getRoomId, getPartyKitHost } from '../utils/config';
import { RoomInitializer } from './RoomInitializer';
import { Lobby } from '../lobby';

export class AppInitializer {
  private roomInitializer: RoomInitializer;

  constructor() {
    this.roomInitializer = new RoomInitializer();
  }

  /**
   * Initialize the application
   * Routes to either lobby or room based on URL parameters
   */
  async init(): Promise<void> {
    const roomId = getRoomId();

    if (roomId) {
      // Room mode: join or create a room
      await this.initRoom(roomId);
    } else {
      // Lobby mode: show room browser
      await this.initLobby();
    }
  }

  /**
   * Initialize a room
   */
  private async initRoom(roomId: string): Promise<void> {
    const partyKitHost = getPartyKitHost();
    await this.roomInitializer.initRoom(roomId, partyKitHost);
  }

  /**
   * Initialize the lobby
   */
  private async initLobby(): Promise<void> {
    const app = document.querySelector<HTMLDivElement>('#app')!;
    const partyKitHost = getPartyKitHost();
    const lobby = new Lobby(app, partyKitHost);
    await lobby.render();
  }
}
