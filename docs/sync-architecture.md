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
- GridSyncManager: Instrument grid states (drums, lead1, lead2, bass)
- BpmSyncManager: Tempo/BPM (40-240)
- KitSyncManager: Drum kit selection
- SynthTypeSyncManager: Lead 1 synth preset type
- Lead2SynthTypeSyncManager: Lead 2 synth preset type
- BassTypeSyncManager: Bass synth preset type
- VolumeSyncManager: Per-instrument volume controls (0.0-1.0)
- EffectsSyncManager: Per-instrument effect send amounts (0.0-1.0)

**Base Classes:**
- InstrumentTypeSyncManager: Abstract base class for type sync managers
- ObservableSync: Utility base class providing onChange pattern for simple value managers

## Data Structure in Yjs

**Top-level Y.Map:**
```typescript
const yDoc = new Y.Doc();
const sharedState = yDoc.getMap('synth-room');

sharedState structure:
{
  instruments: Y.Map<InstrumentId, {
    grid: Y.Array<Y.Array<number>>,      // 0 = inactive, 1 = active
    volume: number,                       // 0.0 to 1.0
    effectSend: number                    // 0.0 to 1.0
  }>
  bpm: Y.Map { value: number }            // 40-240
  kit: Y.Map { name: string }             // kit identifier
  synthType: Y.Map { type: string }       // Lead 1 synth type
  lead2SynthType: Y.Map { type: string }  // Lead 2 synth type
  bassType: Y.Map { type: string }        // Bass synth type
}
```

**Grid Structure:**
```typescript
instruments.get('drums').grid → Y.Array[
  Y.Array[0, 1, 0, ...],  // Row 0 (0=inactive, 1=active)
  Y.Array[0, 0, 1, ...],  // Row 1
  ...
]
```

**Note:** Grids use numbers (0/1) instead of booleans for Yjs compatibility. Values are converted to booleans when read by the application.

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

### KitSyncManager

Location: [src/sync/managers/KitSyncManager.ts](../src/sync/managers/KitSyncManager.ts)

**Manages:** Drum kit selection

**Data Structure:** Y.Map with 'name' key containing string value

**Special Handling:** Async loading of samples on remote clients

### SynthTypeSyncManager

Location: [src/sync/managers/SynthTypeSyncManager.ts](../src/sync/managers/SynthTypeSyncManager.ts)

**Manages:** Lead 1 synth preset selection

**Data Structure:** Y.Map with 'type' key containing string value

**Presets:** 3 available preset types

### Lead2SynthTypeSyncManager

Location: [src/sync/managers/Lead2SynthTypeSyncManager.ts](../src/sync/managers/Lead2SynthTypeSyncManager.ts)

**Manages:** Lead 2 synth preset selection

**Data Structure:** Y.Map with 'type' key containing string value

**Presets:** 3 FM synthesis preset types

### BassTypeSyncManager

Location: [src/sync/managers/BassTypeSyncManager.ts](../src/sync/managers/BassTypeSyncManager.ts)

**Manages:** Bass synth preset selection

**Data Structure:** Y.Map with 'type' key containing string value

**Presets:** 2 available preset types

### VolumeSyncManager

Location: [src/sync/managers/VolumeSyncManager.ts](../src/sync/managers/VolumeSyncManager.ts)

**Manages:** Per-instrument volume controls

**Data Structure:**
Stored within each instrument's Y.Map in the `instruments` collection:
```typescript
instruments.get(instrumentId).volume: number
```

**Range:** 0.0 (silent) to 1.0 (full volume)

**Note:** Application converts between 0.0-1.0 range and decibels (-∞ dB to 0 dB) using Tone.js utilities

### EffectsSyncManager

Location: [src/sync/managers/EffectsSyncManager.ts](../src/sync/managers/EffectsSyncManager.ts)

**Manages:** Effect send amounts for each instrument

**Data Structure:**
Stored within each instrument's Y.Map in the `instruments` collection:
```typescript
instruments.get(instrumentId).effectSend: number
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
