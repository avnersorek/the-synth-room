import type * as Party from "partykit/server";

export default class RoomsMetadataRoomClient {
  constructor(readonly room: Party.Room) {}

  updateRoomMetadata(roomId: string, connections: number) {
    this.room.storage.put(roomId, { connections });
  }

  async getRooms() {
    const rooms = await this.room.storage.list();
    return rooms;
  }
}
