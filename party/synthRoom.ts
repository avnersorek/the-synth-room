import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

const ROOMS_METADATA_ROOM_ID = "rooms";
const PARTYKIT_HOST = 'http://localhost:1999';

export default class SynthRoom implements Party.Server {
  constructor(readonly room: Party.Room) {
    console.log('creating room', room.id);
  }

  // Handle WebSocket connections for Yjs synchronization
  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // y-partykit handles all Yjs protocol communication
    return onConnect(conn, this.room, {
      // Optional: persist document periodically
      persist: true,
      // Optional: callback when document is loaded
      callback: {
        handler: async () => {
          // Update room metadata when document changes
          console.log('nonnn connect');
          await this.updateRoomMetadata();
        },
      },
    });
  }

  // Handle HTTP requests (for room listing)
  async onRequest(request: Party.Request) {    
    const url = new URL(request.url);
    console.log('Incoming Request', request.method, url.pathname);

    if (url.pathname === "/parties/main/" + ROOMS_METADATA_ROOM_ID) {
      if (request.method === "GET") {
        return this.listRooms();
      } else if  (request.method === "POST") {
        console.log(await request.json());
        return new Response("OK!");
      } 
    }    

    // GET /metadata - Get metadata for current room
    if (request.method === "GET" && url.pathname === "/metadata") {
      return this.getRoomMetadata();
    }

    return new Response("Not Found " + url.pathname, { status: 404 });
  }

  // List all rooms with metadata
  private async listRooms() {
    try {
      // Get all rooms from storage
      return new Response('sorry', { status: 400 });
      // const rooms = await 
      
      // .parties.main.getMany();

      // const roomList = await Promise.all(
      //   Array.from(rooms.keys()).map(async (roomId) => {
      //     const room = rooms.get(roomId);
      //     if (!room) return null;

      //     // Get metadata for each room
      //     const metadata = await room.storage.get("metadata");
      //     const connections = [...room.getConnections()];

      //     return {
      //       id: roomId,
      //       connectedUsers: connections.length,
      //       lastActivity: metadata?.lastActivity || Date.now(),
      //       metadata: metadata || {},
      //     };
      //   })
      // );

      // // Filter out null values and sort by last activity
      // const activeRooms = roomList
      //   .filter((room): room is NonNullable<typeof room> => room !== null)
      //   .sort((a, b) => b.lastActivity - a.lastActivity);

      // return new Response(JSON.stringify(activeRooms), {
      //   status: 200,
      //   headers: {
      //     "Content-Type": "application/json",
      //     "Access-Control-Allow-Origin": "*",
      //   },
      // });
    } catch (error) {
      console.error("Error listing rooms:", error);
      return new Response(JSON.stringify({ error: "Failed to list rooms" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Get metadata for current room
  private async getRoomMetadata() {
    const metadata = await this.room.storage.get("metadata");
    const connections = [...this.room.getConnections()];

    return new Response(
      JSON.stringify({
        id: this.room.id,
        connectedUsers: connections.length,
        lastActivity: metadata?.lastActivity || Date.now(),
        metadata: metadata || {},
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // Update room metadata (called when document changes)
  private async updateRoomMetadata() {
    const metadata = {
      lastActivity: Date.now(),
      roomId: this.room.id,
    };

    await fetch(`${PARTYKIT_HOST}/parties/main/${ROOMS_METADATA_ROOM_ID}`, {
      method: "POST",
      body: JSON.stringify(metadata)
    });
    // await this.room.storage.put("metadata", metadata);
  }

  // Handle connection close
  async onClose(connection: Party.Connection) {
    // Update metadata when users disconnect
    await this.updateRoomMetadata();
  }
}

SynthRoom satisfies Party.Worker;
