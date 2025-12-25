# Real-Time Synchronization Architecture

## Overview

The Synth Room uses **Yjs** (a CRDT library) and **PartyKit** (WebSocket hosting) to provide conflict-free real-time collaboration. Multiple users can simultaneously edit patterns, change settings, and play music together.

## Core Technologies

**Yjs:** Conflict-Free Replicated Data Type (CRDT) library
- Automatic conflict resolution
- No server-side merge logic needed
- Local-first updates with eventual consistency
- Efficient binary protocol for network transmission

**PartyKit:** WebSocket server platform
- Manages WebSocket connections
- Hosts Yjs document persistence
- Room-based isolation
- Integrates with y-partykit provider

**y-partykit:** Yjs + PartyKit integration
- WebSocket provider for Yjs
- Handles document sync protocol
- Connection management
- Presence and awareness

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                       Client A                            │
│  ┌────────────┐      ┌─────────────┐                    │
│  │ UI         │─────→│ SyncManager │                    │
│  │ Components │←─────│   (Local)   │                    │
│  └────────────┘      └──────┬──────┘                    │
│                              │                            │
│                      ┌───────▼────────┐                  │
│                      │ Yjs Document   │                  │
│                      │  (Y.Doc)       │                  │
│                      └───────┬────────┘                  │
│                              │                            │
│                      ┌───────▼────────┐                  │
│                      │ PartyKit       │                  │
│                      │ Provider       │                  │
│                      └───────┬────────┘                  │
└──────────────────────────────┼───────────────────────────┘
                               │ WebSocket
                               │
                    ┌──────────▼──────────┐
                    │  PartyKit Server    │
                    │  (Room: xyz)        │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │ Yjs Document  │  │
                    │  │  Persistence  │  │
                    │  └───────────────┘  │
                    └──────────┬──────────┘
                               │ WebSocket
┌──────────────────────────────┼───────────────────────────┐
│                      ┌───────▼────────┐                  │
│                      │ PartyKit       │                  │
│                      │ Provider       │                  │
│                      └───────┬────────┘                  │
│                              │                            │
│                      ┌───────▼────────┐                  │
│                      │ Yjs Document   │                  │
│                      │  (Y.Doc)       │                  │
│                      └───────┬────────┘                  │
│                              │                            │
│  ┌────────────┐      ┌──────▼──────┐                    │
│  │ UI         │←─────│ SyncManager │                    │
│  │ Components │─────→│   (Local)   │                    │
│  └────────────┘      └─────────────┘                    │
│                       Client B                            │
└──────────────────────────────────────────────────────────┘
```

## SyncManager Architecture

Location: [src/sync/SyncManager.ts](../src/sync/SyncManager.ts)

**Central Orchestrator:** Coordinates domain-specific sync managers and owns the Yjs document.

**Responsibilities:**
- Initialize Yjs document and PartyKit provider
- Create and coordinate domain-specific managers
- Provide public API for local state changes
- Handle connection status
- Clean up on disconnect

**Domain-Specific Managers:**
- GridSyncManager: Instrument grid states
- BpmSyncManager: Tempo/BPM
- KitSyncManager: Drum kit selection
- SynthTypeSyncManager: Lead synth type
- VolumeSyncManager: All volume controls
- EffectsSyncManager: Effect send amounts

## Data Structure in Yjs

**Top-level Y.Map:**
```typescript
const yDoc = new Y.Doc();
const sharedState = yDoc.getMap('synth-room');

sharedState structure:
{
  grids: Y.Map<InstrumentId, Y.Array<Y.Array<boolean>>>
  bpm: number
  kit: string
  leadSynthType: string
  volumes: Y.Map<InstrumentId, number>
  effectSends: Y.Map<InstrumentId, number>
}
```

**Grid Structure:**
```typescript
grids.get('drums') → Y.Array[
  Y.Array[false, true, false, ...],  // Row 0
  Y.Array[false, false, true, ...],  // Row 1
  ...
]
```

## Sync Flow: User Action

**Example: User toggles a drum cell**

```
1. User clicks cell in UI
   ↓
2. EventManager captures click
   ↓
3. Sequencer.toggle('drums', row, col)
   ↓
4. Instrument.toggle(row, col)
   ├── Updates local grid state immediately
   └── UI updates instantly (optimistic)
   ↓
5. SyncManager.toggleCell('drums', row, col)
   ↓
6. GridSyncManager.toggleCell(...)
   ├── Gets Y.Array for drum grid
   └── Updates Yjs data structure
   ↓
7. Yjs broadcasts change to PartyKit server
   ↓
8. Server persists change and broadcasts to all clients
   ↓
9. Other clients receive Yjs update
   ↓
10. GridSyncManager observe handler fires
    ↓
11. Calls registered callback: onGridChange('drums', newGrid)
    ↓
12. Instrument.setGrid(newGrid) updates remote client state
    ↓
13. UI updates on remote clients
```

## Domain-Specific Managers

### GridSyncManager

Location: [src/sync/managers/GridSyncManager.ts](../src/sync/managers/GridSyncManager.ts)

**Manages:** All instrument grid states (drums, lead, bass)

**Data Structure:**
```typescript
gridsMap: Y.Map<InstrumentId, Y.Array<Y.Array<boolean>>>
```

**Methods:**
- `toggleCell(instrumentId, row, col)`: Toggle single cell
- `setGrid(instrumentId, grid)`: Set entire grid (initial sync)
- Observe: Monitors changes and fires callbacks


### BpmSyncManager

Location: [src/sync/managers/BpmSyncManager.ts](../src/sync/managers/BpmSyncManager.ts)

**Manages:** Global tempo (40-240 BPM)

**Data Structure:** Simple number in shared Y.Map

**Debouncing:** Uses throttling to prevent excessive updates during slider drag.

### KitSyncManager & SynthTypeSyncManager

**Manages:** Drum kit selection and lead synth type

**Data Structure:** String values in shared Y.Map

**Special Handling:** Async loading of samples/synths on remote clients

### VolumeSyncManager

Location: [src/sync/managers/VolumeSyncManager.ts](../src/sync/managers/VolumeSyncManager.ts)

**Manages:** Per-instrument and master volumes

**Data Structure:**
```typescript
volumes: Y.Map<InstrumentId | 'master', number>
```

**Range:** -50 dB to 0 dB (Tone.js volume units)

### EffectsSyncManager

Location: [src/sync/managers/EffectsSyncManager.ts](../src/sync/managers/EffectsSyncManager.ts)

**Manages:** Effect send amounts for each instrument

**Data Structure:**
```typescript
effectSends: Y.Map<InstrumentId, number>
```

**Range:** 0.0 (no effect) to 1.0 (full effect)

## PartyKit Server

Location: [party/index.ts](../party/index.ts)

**Responsibilities:**
- Handle WebSocket connections
- Persist Yjs document using y-partykit
- Store room metadata (user count, creation time)
- Provide REST API for room list
- CORS configuration

**Room Persistence:**
Uses PartyKit storage API to persist Yjs documents. Rooms survive server restarts.

**Room List API:**
The `rooms` room id is used for saving the lobby metadata.
Its `storage` object is used for saving the rooms list.
When we GET the rooms list we also check all the rooms from the list for their user count.

## Connection Management

**UI Feedback:**
SyncUIManager ([src/ui/managers/SyncUIManager.ts](../src/ui/managers/SyncUIManager.ts)) displays connection status and user count.

**Reconnection:**
PartyKit provider handles automatic reconnection with exponential backoff.

## Initialization Flow

## Conflict Resolution

**CRDT Properties:**
- Commutative: Order of operations doesn't matter
- Idempotent: Applying same operation multiple times has same effect
- Automatic merging: No manual conflict resolution needed

**Example Conflict:**
```
User A toggles cell (0, 0) → ON
User B toggles cell (0, 0) → OFF

Both clients update locally (optimistic)
Yjs merges: Last write wins based on logical clock
All clients converge to same state
```

## Performance Optimizations

**Binary Protocol:**
Yjs uses efficient binary encoding for network transmission. Updates are typically 10-50 bytes.

**Local-First:**
All operations apply locally first, then sync. No round-trip delay for local user.

**Selective Observation:**
Each manager only observes its specific data paths. Reduces unnecessary callback invocations.

**Debouncing:**
BPM slider changes are throttled to prevent flooding network with updates.




# More
See individual manager files in [src/sync/managers/](../src/sync/managers/) for complete APIs.
