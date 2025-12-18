import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";

const ROOMS_METADATA_ROOM_ID = "rooms";
const PARTYKIT_HOST = 'http://localhost:1999';

const createResponse = (body: object, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "http://localhost:5173", // Allow your frontend origin
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Specify allowed methods
        "Access-Control-Allow-Headers": "Content-Type", // Specify allowed headers
    },
});

type RoomMetadata = {
    roomId: string;
}

const callRoomsMetadataRoom = (init: RequestInit) => fetch(`${PARTYKIT_HOST}/parties/main/${ROOMS_METADATA_ROOM_ID}`, init);

// missing
// connection count on rooms

export default class SynthRoomServer implements Party.Server {
    constructor(readonly room: Party.Room) {
        console.log('Creating room handler', room.id);
    }

    async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
        // y-partykit handles all Yjs protocol communication
        return onConnect(conn, this.room, {
            persist: true,
            callback: {
                handler: async () => {
                    if (this.room.id !== ROOMS_METADATA_ROOM_ID) {
                        await callRoomsMetadataRoom({
                            method: "POST",
                            body: JSON.stringify({
                                roomId: this.room.id,
                            })
                        });
                    }
                },
            },
        });
    }

    async onRequest(request: Party.Request) {
        try {
            const url = new URL(request.url);
            console.log('Incoming Request', request.method, url.pathname);

            if (url.pathname === "/parties/main/" + ROOMS_METADATA_ROOM_ID) {
                // WE ARE IN THE ROOMS METADATA ROOM
                if (request.method === "POST") {
                    const payload: RoomMetadata = await request.json();
                    this.room.storage.put(payload.roomId, payload);
                    return createResponse({});
                } else if (request.method === "GET") {
                    return await this.getRoomsList();
                }
            } else {
                // WE ARE IN THE REGULAR ROOMS
                if (request.method === "GET") {
                    return createResponse({
                        roomId: this.room.id,
                        connectionCount: [...this.room.getConnections()].length
                    });
                }
            }

            return createResponse({ error: "Not Found " + url.pathname }, 404);
        } catch (error) {
            console.log(`Error on ${request.method} ${request.url}`);
            console.error(error);
            return createResponse({ error: "Failed" }, 500);
        }
    }

    private async getRoomsList() {
        const roomsKeys = await this.room.storage.list().then(roomsMap => [...roomsMap.keys()]);
        const roomsList: RoomMetadata[] = [];
        for (const roomKey of roomsKeys) {
            const roomData = await fetch(`${PARTYKIT_HOST}/parties/main/${roomKey}`, { method: 'GET' });
            roomsList.push(await roomData.json());
        }
        console.log(roomsList);
        return createResponse({ roomsList });
    }
}

SynthRoomServer satisfies Party.Worker;
