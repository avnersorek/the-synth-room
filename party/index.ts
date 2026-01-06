import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";
import * as Y from 'yjs';

const ROOMS_METADATA_ROOM_ID = "rooms";

type RoomMetadata = {
    roomId: string;
    connectionCount?: number;
    hasData: boolean;
}

export default class SynthRoomServer implements Party.Server {
    constructor(readonly room: Party.Room) {
        console.log('Creating room handler', room.id);
    }

    private getEnv(key: string, fallback: string) {
        const value = this.room.env[key];
        return typeof value === 'string' ? value : fallback;
    }

    private callOtherRoom = (roomId: string, init: RequestInit) =>
        fetch(`${this.getEnv('PARTYKIT_HOST', "http://localhost:1999")}/parties/main/${roomId}`, init);

    private callRoomsMetadataRoom = (init: RequestInit) =>
        this.callOtherRoom(ROOMS_METADATA_ROOM_ID, init);

    private async thisRoomHasData(): Promise<boolean> {
        const ydoc = new Y.Doc();
        const storageItems = await this.room.storage.list();
        for (const value of [...storageItems.values()] as Uint8Array[]) {
            try {
                Y.applyUpdate(ydoc, value);
            } catch {
                // some items are not updates
            }
        }
        const instruments = ydoc.getMap('instruments').toJSON() as Record<string, { grid: number[][] }>;
        const hasData =
            Object.keys(instruments).some(
                instrument => (instruments[instrument].grid).some(
                    channel => channel.some(
                        note => note !== 0)));

        return hasData;
    }

    private createResponse = (body: object, status = 200) => new Response(JSON.stringify(body), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": this.getEnv('CORS_ORIGIN', "http://localhost:5173"), // Allow your frontend origin
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Specify allowed methods
            "Access-Control-Allow-Headers": "Content-Type", // Specify allowed headers
        },
    });

    async onConnect(conn: Party.Connection, _ctx: Party.ConnectionContext) {
        // y-partykit handles all Yjs protocol communication
        return onConnect(conn, this.room, {
            persist: { mode: "snapshot" },
            callback: {
                handler: async () => {
                    if (this.room.id !== ROOMS_METADATA_ROOM_ID) {
                        // Register room in metadata (will be filtered when empty in getRoomsList)
                        await this.callRoomsMetadataRoom({
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

            if (url.pathname === `/parties/main/${ROOMS_METADATA_ROOM_ID}`) {
                // WE ARE IN THE ROOMS METADATA ROOM
                if (request.method === "POST") {
                    const payload: RoomMetadata = await request.json();
                    await this.room.storage.put(payload.roomId, payload);
                    return this.createResponse({});
                } else if (request.method === "GET") {
                    return await this.getRoomsList();
                }
            } else {
                // WE ARE IN THE REGULAR ROOMS
                if (request.method === "GET") {
                    return this.createResponse({
                        roomId: this.room.id,
                        connectionCount: [...this.room.getConnections()].length,
                        hasData: await this.thisRoomHasData()
                    });
                }
            }

            return this.createResponse({ error: `Not Found ${url.pathname}` }, 404);
        } catch (error) {
            console.log(`Error on ${request.method} ${request.url}`);
            console.error(error);
            return this.createResponse({ error: "Failed" }, 500);
        }
    }

    private async getRoomsList() {
        // I implemented this using a static room but maybe it can be done using partykit Party.Lobby
        const roomsKeys = await this.room.storage.list().then(roomsMap => [...roomsMap.keys()]);
        const roomsList: RoomMetadata[] = [];

        for (const roomKey of roomsKeys) {
            const roomData = await this.callOtherRoom(roomKey, { method: 'GET' });
            const roomJson: RoomMetadata = await roomData.json();

            if (roomJson.hasData || roomJson.connectionCount) {
                roomsList.push(roomJson);
            } else {
                await this.room.storage.delete(roomKey);
            }
        }

        return this.createResponse({ roomsList });
    }
}

SynthRoomServer satisfies Party.Worker;
