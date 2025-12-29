# Sequencer and Timing System

## Overview

The [Sequencer](../src/sequencer.ts) class is the playback engine that coordinates timing, step advancement, and audio triggering across all instruments. It bridges the UI, audio engine, and instrument state.

## Core Responsibilities

1. **Transport Control:** Play/stop functionality
2. **Step Scheduling:** Trigger notes/samples at each 16th note
3. **State Management:** Track current step position (0-15)
4. **UI Synchronization:** Notify UI of step changes via requestAnimationFrame
5. **Note Duration Calculation:** Determine how long synth notes should play

## Architecture

Location: [src/sequencer.ts](../src/sequencer.ts)

**Dependencies:**
- AudioEngine: Audio playback and synthesis
- Instrument instances: Grid state (drums, lead1, lead2, bass)
- Tone.Transport: Scheduling clock

**Key State:**
- `loopId`: Tone.Transport loop ID (null when stopped, number when playing)
- `currentStep`: Current position in 16-step sequence (0-15)
- `onStepCallbacks`: Array of callbacks for UI updates

**Key Methods:**
- `isPlaying()`: Computed method returning boolean (checks loopId and Transport state)

## Playback Flow

```
User clicks Play
    ↓
Sequencer.play()
    ↓
AudioEngine.start() (starts Transport)
    ↓
Transport calls scheduleRepeat callback every 16th note
    ↓
For each instrument:
    instrument.playStep(currentStep, time)
        ↓
        Drums: Trigger samples for active cells
        Lead 1: Trigger notes with calculated duration
        Lead 2: Trigger notes with calculated duration
        Bass: Trigger notes with calculated duration
    ↓
Increment currentStep (mod 16)
    ↓
requestAnimationFrame → onStepChange callback
    ↓
UI updates visual step indicator
```

## Step Scheduling

**Tone.Transport.scheduleRepeat:**
```typescript
Tone.Transport.scheduleRepeat((time) => {
  // Called precisely every 16th note
  this.playStep(time);
}, "16n");
```

**Critical:** The 'time' parameter must be passed to all Tone.js playback methods. This ensures precise scheduling ahead of time, preventing timing jitter.

## playStep Method

**Sequence for Each Step:**
1. Iterate through all instruments
2. Call `instrument.playStep(currentStep, time)`
3. Instrument checks grid state at current step
4. If active, trigger audio playback
5. Increment currentStep (wrap at 16)
6. Schedule UI update via requestAnimationFrame

**Code Reference:** [src/sequencer.ts:145](../src/sequencer.ts#L145)

## Note Duration Calculation (Synths)

**Problem:** Grid cells are on/off states, but synths need note duration.

**Solution:** Embedded in the `playStep()` method in [src/instrument.ts:98-113](../src/instrument.ts#L98-L113).

**Algorithm:**
The duration calculation is performed inline during playback and only triggers notes at the start of a span:

```typescript
// Check if this is the start of a note span
const isStartOfSpan = step === 0 || !this.state.grid[row][step - 1];

if (isStartOfSpan) {
  let spanLength = 1;
  // Count consecutive active cells forward from current position
  for (let i = step + 1; i < this.config.gridCols; i++) {
    if (this.state.grid[row][i]) {
      spanLength++;
    } else {
      break;  // Stop at first inactive cell
    }
  }

  // Convert to Tone.js time notation (bars:quarters:sixteenths)
  const duration = `0:0:${spanLength}`;
  sampler.triggerAttackRelease(note, duration, time);
}
```

**Key Differences from Simple Approach:**
1. **Span Detection**: Only triggers on the first cell of a span (prevents re-triggering)
2. **Forward-Only**: Doesn't wrap around grid (stops at boundary)
3. **Time Notation**: Uses Tone.js time format `"0:0:N"` (bars:quarters:sixteenths)

**Example:**
```
Grid:  X X X . . . . .
       ↑ ↑ ↑
Step:  0 1 2

At step 0: isStartOfSpan = true, spanLength = 3, duration = "0:0:3"
At step 1: isStartOfSpan = false (previous cell active), no trigger
At step 2: isStartOfSpan = false, no trigger
```

This approach ensures each note is triggered only once with the correct duration, preventing overlapping triggers.

## Drums vs. Synths Playback

**Drums (Sample-based):**
- Each cell triggers a complete sample
- No duration needed (sample plays to completion)
- All 8 voices can play simultaneously
- Simple: check grid[row][col], if true → trigger sample

**Synths (Note-based):**
- Calculate duration from consecutive cells
- Map grid row to MIDI note (chromatic scale)
- Use triggerAttackRelease with calculated duration
- Lead: polyphonic (multiple rows can play)
- Bass: monophonic (only one note at a time)

## UI Synchronization

**requestAnimationFrame Strategy:**

Scheduling happens in audio thread (Web Audio API). UI updates must happen on animation frame for smooth visuals.

**Implementation:**
```typescript
private playStep(time: number): void {
  // Audio scheduling happens here
  this.instruments.forEach(instrument => {
    instrument.playStep(this.currentStep, time);
  });

  // UI update scheduled for next animation frame
  requestAnimationFrame(() => {
    this.onStepChange?.(this.currentStep);
  });

  this.currentStep = (this.currentStep + 1) % 16;
}
```

**Why:** Separates audio timing (precise) from visual updates (frame-rate dependent). Prevents UI jank from affecting audio.

See: [StepAnimationController](../src/ui/managers/StepAnimationController.ts) for UI implementation.

## BPM Control

**Range:** 40 to 240 BPM

**Implementation:**
```typescript
setBPM(bpm: number): void {
  Tone.Transport.bpm.value = bpm;
}
```

**Effect:** Changes speed of 16th note divisions. All instruments affected simultaneously.

**Sync:** BPM changes are synchronized across all clients via [BpmSyncManager](../src/sync/managers/BpmSyncManager.ts).

## Grid State Management

**Toggling Cells:**
```typescript
toggle(instrumentId: InstrumentId, row: number, col: number): void {
  const instrument = this.instruments.get(instrumentId);
  instrument.toggle(row, col);
}
```

**Flow:**
1. Sequencer receives toggle request
2. Delegates to appropriate Instrument instance
3. Instrument updates local grid state
4. Next playStep call uses new grid state

**Sync:** Grid changes are broadcast via [GridSyncManager](sync-architecture.md).

## Transport Control Methods

**play():**
- Starts Tone.Transport if not already started
- Creates a scheduleRepeat loop and stores its ID in loopId
- isPlaying() now returns true
- UI reflects playback state

**stop():**
- Stops and clears the scheduled loop (sets loopId = null)
- Resets currentStep to 0
- Calls transport.stop() to halt the Transport
- UI stops visual animation
- **Note:** Transport can be restarted when play() is called again

**destroy():**
- Stops Transport
- Clears scheduled callbacks
- Disposes all instruments
- Called on cleanup/navigation

## Background Playback

**Key Feature:** Playback continues when browser tab is inactive.

**How:**
- Tone.Transport uses Web Audio API clock (not setTimeout)
- Scheduling happens ahead of time
- Not tied to browser's main event loop
- Works across multiple tabs with same room

**Benefit:** Collaborative sessions stay in sync even when users switch tabs.

## Performance Considerations

**Scheduling Ahead:**
Tone.js schedules events ~100ms in advance. This buffering prevents glitches from JS event loop delays.

**Minimal Step Logic:**
playStep method is called 16 times per bar. Keep logic minimal:
- Simple grid lookups
- Direct audio triggering
- No complex calculations in hot path

**requestAnimationFrame:**
UI updates only when needed (per step). Prevents unnecessary repaints.

## API Reference

**Sequencer Methods:**
- `play()`: Start playback
- `stop()`: Stop playback and reset position
- `toggle(instrumentId, row, col)`: Toggle grid cell
- `setBPM(bpm)`: Set tempo (40-240)
- `getCurrentStep()`: Get current step position (0-15)
- `onStepChange(callback)`: Register UI update callback

**Instrument Interface:**
- `playStep(step, time)`: Trigger audio for current step
- `toggle(row, col)`: Toggle cell in grid
- `getGrid()`: Get grid state
- `setGrid(grid)`: Set grid state (for sync)

See [src/sequencer.ts](../src/sequencer.ts) and [src/instrument.ts](../src/instrument.ts) for complete implementation.
