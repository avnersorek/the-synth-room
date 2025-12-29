# Audio System Architecture

## Overview

The audio system is built on Tone.js, a framework for creating interactive music in the browser. The [AudioEngine](../src/audio.ts) class manages all audio components including instruments, effects, and master output.

## AudioEngine Class

Location: [src/audio.ts](../src/audio.ts)

**Responsibilities:**
- Initialize and manage Tone.js Transport
- Create and configure instruments (samplers, synthesizers)
- Route audio through effects chain
- Control master and per-instrument volumes
- Load and switch sample kits and synth types

## Audio Routing

```
┌─────────────┐
│ Drum Sampler│───┐
└─────────────┘   │
                  │
┌─────────────┐   │
│ Lead 1 Synth│───┤
└─────────────┘   │
                  ├──→ Instrument Volume ──┬──→ Effect Send ──→ PingPongDelay ─┐
┌─────────────┐   │                        │                                    │
│ Lead 2 Synth│───┤                        └──→ Master Volume ─────────────────┼──→ Output
└─────────────┘   │                                                             │
                  │                                                             │
┌─────────────┐   │                                                             │
│ Bass Synth  │───┘                                                             │
└─────────────┘                                                                 │
                                                                                │
                     Effect Wet Signal ─────────────────────────────────────────┘
```

Each instrument has:
- Individual volume control (Tone.Volume)
- Effect send amount (controls wet/dry mix)
- Direct and effect-processed signal paths

## Instrument Types

### Drums

**Implementation:** Tone.Sampler
- Sample-based playback (no synthesis)
- 8 voices: kick, snare, hihat, openhat, clap, boom, ride, tink
- 3 available kits: kit_a, kit_b, kit_c
- Samples loaded from [public/sounds/](../public/sounds/)
- Polyphonic (all voices can play simultaneously)

**Kit Switching:**
```typescript
setKit(kitId: string): Promise<void>
```
Loads new sample set for all 8 voices. Uses Promise to handle async loading.

### Lead 1 Synth

**Implementation:** Tone.PolySynth with preset-based architecture
- Polyphonic (multiple notes simultaneously)
- 25-note range: C2 to C4 (chromatic)
- 3 named presets with different synthesis approaches:
  - Various oscillator types (fatsawtooth, harmonic partials)
  - Includes both basic synth and AM synthesis options
  - Each with distinct timbral characteristics
- Each preset has custom envelope and filter settings
- ADSR envelope for volume shaping

**Note Duration:**
Calculated based on consecutive active cells in the grid. See [Sequencer](sequencer.md) for details.

**Preset Switching:**
```typescript
setLeadSynthType(type: string): void
```
Disposes old PolySynth and creates new one with specified preset configuration.

### Lead 2 Synth

**Implementation:** Tone.PolySynth wrapping Tone.FMSynth with preset-based architecture
- Polyphonic (multiple notes simultaneously)
- 25-note range: C2 to C4 (chromatic)
- 3 FM synthesis presets with varying modulation characteristics
- Each preset uses different modulation indices for distinct timbres
- ADSR envelopes for both carrier and modulator

**Note Duration:**
Calculated based on consecutive active cells in the grid. See [Sequencer](sequencer.md) for details.

**Preset Switching:**
```typescript
setLead2SynthType(type: string): void
```
Disposes old PolySynth and creates new one with specified FM preset configuration.

### Bass Synth

**Implementation:** Tone.MonoSynth with preset-based architecture
- Monophonic (one note at a time)
- 25-note range: C1 to C3 (chromatic)
- 2 named presets with different synthesis approaches:
  - FM synthesis with complex modulation
  - Harmonic synthesis using custom partials
- Each preset has custom envelope, filter, and modulation settings
- ADSR envelope for volume shaping

**Preset Switching:**
```typescript
setBassType(type: string): void
```
Disposes old MonoSynth and creates new one with specified preset configuration.

## Effects

### PingPongDelay

**Implementation:** EffectsController class ([src/effects/EffectsController.ts](../src/effects/EffectsController.ts))

**Parameters:**
- Delay time: "3n" (dotted eighth note, adapts to current BPM)
- Feedback: 0.2 (number of repeats)
- Ping-pong stereo spread
- Per-instrument send amount (0.0 to 1.0)

**Signal Flow:**
Each instrument has an effect send that splits the signal:
- Dry signal → Master Volume → Output
- Wet signal → PingPongDelay → Master Volume → Output

**Send Amount Control:**
```typescript
setEffectSend(instrumentId: InstrumentId, amount: number): void
```

## Audio Context Initialization

**Browser Requirement:** Audio context must be started by a user gesture (click, tap, etc.)

**Implementation:** [AudioInitializer](../src/utils/AudioInitializer.ts)
- Shows "Click to Start Audio" button
- Initializes Tone.js Transport on user interaction
- Dismisses button after audio starts
- See [src/utils/AudioInitializer.ts:20](../src/utils/AudioInitializer.ts#L20)

## Transport and Timing

**Tone.Transport:**
- Global clock for scheduling events
- BPM control: 40 to 240 BPM
- Handles precise timing for all instruments
- Continues in background when tab unfocused

**Scheduling:**
All audio events must be scheduled using the 'time' parameter:
```typescript
Tone.Transport.scheduleRepeat((time) => {
  sampler.triggerAttackRelease("C4", "8n", time);
}, "16n");
```

NEVER use `Tone.now()` for scheduled events - this causes timing drift.

## Volume Management

**Master Volume:**
- Controls overall output level
- Range: -50 dB to 0 dB
- Applied after instrument mixing

**Per-Instrument Volume:**
- Individual control for drums, lead, bass
- Range: -50 dB to 0 dB
- Applied before effect send and master

**Implementation:**
```typescript
setInstrumentVolume(instrumentId: InstrumentId, volume: number): void
setMasterVolume(volume: number): void
```

## Resource Loading

**ResourceLoader:** [src/init/ResourceLoader.ts](../src/init/ResourceLoader.ts)

**Initialization Sequence:**
1. Create AudioEngine instance
2. Load default kit (kit_a)
3. Initialize lead synth type (Synth)
4. Initialize bass oscillator type (square)
5. Wait for user interaction to start audio context
6. Start Transport

**Sample Loading:**
Asynchronous - samples loaded via Tone.Sampler with URL map. Loading happens before first playback.

## Performance Optimizations

**Instrument Reuse:**
- Don't recreate instruments on parameter changes
- Only dispose/recreate when switching synth types
- Tone.PolySynth and Tone.MonoSynth are expensive to create

**Voice Management:**
- Drums: Tone.Sampler handles polyphony automatically
- Lead: PolySynth manages voice allocation
- Bass: MonoSynth automatically stops previous note

**Background Playback:**
- Tone.Transport uses Web Audio API clock (not setTimeout)
- Continues scheduling when browser tab inactive
- Ensures steady playback in multi-tab scenarios

## API Reference

**AudioEngine Main Methods:**
- `start()`: Start Tone.Transport and enable playback
- `setKit(kitId)`: Load new drum kit samples
- `setLeadSynthType(type)`: Change Lead 1 synthesizer preset
- `setLead2SynthType(type)`: Change Lead 2 synthesizer preset
- `setBassType(type)`: Change bass synthesizer preset
- `setInstrumentVolume(id, volume)`: Set instrument level
- `setMasterVolume(volume)`: Set master output level
- `setEffectSend(id, amount)`: Set effect send amount (0-1)

See [src/audio.ts](../src/audio.ts) for complete implementation details.
