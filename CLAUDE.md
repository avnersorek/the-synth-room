# The Synth Room - Development Guide

## Project Overview

The Synth Room is a collaborative, real-time music creation web application. Multiple users can join virtual rooms and create music together using a browser-based synthesizer and drum machine with a 16-step grid sequencer.

**Tech Stack:**
- TypeScript (strict mode) + Vite
- Tone.js (Web Audio API synthesis and scheduling)
- Yjs (CRDT for conflict-free state synchronization)
- PartyKit (WebSocket server for real-time collaboration)
- Vanilla JavaScript/TypeScript (no frontend framework)

## Project Structure

This is a monorepo with two main packages:

```
the-synth-room/
├── webapp/                  # Frontend Vite application
│   ├── src/
│   │   ├── main.ts          # Application entry point
│   │   ├── types.ts         # Global type definitions
│   │   ├── audio.ts         # AudioEngine class
│   │   ├── sequencer.ts     # Sequencer playback engine
│   │   ├── instrument.ts    # Instrument grid state
│   │   ├── lobby.ts         # Room browser
│   │   ├── init/            # App initialization logic
│   │   ├── components/      # UI components (instruments, panels)
│   │   │   └── base/        # Abstract base classes
│   │   ├── ui/              # UI orchestration and event handling
│   │   │   ├── UI.ts        # Main UI controller
│   │   │   ├── managers/    # Event, sync UI, animation managers
│   │   │   └── utils/       # UI utilities
│   │   ├── sync/            # Real-time synchronization
│   │   │   ├── SyncManager.ts     # Main sync orchestrator
│   │   │   ├── managers/    # Domain-specific sync managers
│   │   │   └── utils/       # Sync utilities and migration
│   │   ├── synths/          # Synth and sampler factories
│   │   ├── effects/         # Audio effects
│   │   └── utils/           # Configuration and helpers
│   ├── package.json         # Frontend dependencies & scripts
│   ├── vite.config.ts       # Vite configuration
│   └── tsconfig.json        # TypeScript config for webapp
│
├── party/                   # PartyKit server (WebSocket + Yjs)
│   ├── index.ts             # Main server entry point
│   ├── synthRoom.ts         # Synth room handler
│   ├── roomsMetadataRoom.ts # Room metadata handler
│   ├── package.json         # Server dependencies & scripts
│   └── tsconfig.json        # TypeScript config for server
│
├── docs/                    # Shared documentation
├── Taskfile.yml             # Monorepo task runner
└── partykit.json            # PartyKit configuration
```

## Key Features

### Instruments
- Four instruments: **Drums**, **Lead 1**, **Lead 2**, and **Bass**
- Instruments have grids and settings that are synced across the room
- All instruments have a volume setting and effect send control
- Each instrument type has its own settings, sounds, effects, and UI
- The user scrolls through the instruments and works on one at a time
- All instrument parts are played together when the app is playing
- Instruments use preset-based architecture with named sound configurations

### Real-time Collaboration
- Grid state, BPM, kit/synth selection, volumes, and effects synced via Yjs
- Conflict-free updates using CRDTs
- Room-based sessions with lobby browser
- Some things are not synced, mainly Play/stop status - users listen individually and edit together
- Four instruments synced: drums (sampler), lead1 (polyphonic synth), lead2 (FM synth), bass (mono synth)

**Audio Processing:**
- Tone.js Transport for precise scheduling and varied sound generation.
- Background playback (works when tab unfocused)

## Coding Style and Patterns



### Architecture Patterns

**Manager Pattern:** Separate manager classes for different concerns (EventManager, SyncUIManager, GridSyncManager, BpmSyncManager, etc.). Each handles a specific domain.

**Component-Based:** Abstract base classes for shared functionality (AbstractGridInstrument), with inheritance for specific implementations. Composition in UI orchestration.

**Observer Pattern:** Callback-driven updates for state changes. Clean separation between sync layer and UI layer.

### Code Organization Principles

1. **Separation of Concerns:** Clear boundaries between data (instrument.ts), logic (sequencer.ts), audio (audio.ts), sync (sync/), and UI (ui/, components/)

2. **Single Responsibility:** Each class/file has a focused purpose. Break down complex logic into specialized managers.

3. **Dependency Injection:** Pass dependencies via constructors (e.g., AudioEngine → Sequencer → Instrument)

4. **Type Safety:** Use TypeScript strictly. Define types in types.ts for shared interfaces. No 'any' types.

5. **Modular Structure:** Small, focused files. Clear module boundaries. Avoid circular dependencies.

### TypeScript Conventions

- Strict mode enabled (no implicit any, strict null checks)
- Interfaces for contracts, types for unions/intersections
- Explicit return types on public methods
- Descriptive variable names (no single-letter names except loop indices)
- Use const by default, let only when reassignment needed

### Event Handling

Use the Manager pattern for event handling. See EventManager.ts for reference:
- Centralize event listener registration
- Use method references (not inline lambdas when possible)
- Clean up listeners in destroy() methods

### Grid State Management

All instruments use a two-dimensional boolean array:
```typescript
grid: boolean[][]  // grid[row][column]
```

Always validate dimensions when setting grid state.

## Development Workflow

**Local Development:**
```bash
# Option 1: Run from individual packages
cd party && npm run dev      # Start PartyKit server (localhost:1999)
cd webapp && npm run dev     # Start Vite dev server (localhost:5173)

# Option 2: Use Taskfile (recommended for running both)
task run-local               # Launches both servers in Zellij layout
```

**Testing Collaboration:**
Open multiple browser tabs/windows with the same room URL to test sync.

**Running CI Checks:**
```bash
task ci:party         # Run lint & type-check for party
task ci:webapp        # Run lint & type-check for webapp
task ci               # Run all CI checks (both packages)
```

**Deployment:**
- Webapp is deployed to Cloudflair workers in push to main, using wrangler.
- Partykit
```bash
cd party && npm run deploy          # Deploy PartyKit server
```

## Technical Documentation

For detailed technical information, see the docs folder:
- [Audio System Architecture](docs/audio-system.md) - AudioEngine, Tone.js integration, effects routing
- [Sequencer and Timing](docs/sequencer.md) - Transport control, playback scheduling, step animation
- [Sync Architecture](docs/sync-architecture.md) - Yjs, PartyKit, sync managers, data flow
- [UI Component System](docs/ui-components.md) - Component hierarchy, grid rendering, event handling
- [Development Roadmap](docs/TODO.md) - Known issues and planned features

## Performance Considerations

- Use requestAnimationFrame for UI updates synchronized with rendering
- Avoid re-creating Tone.js instruments when possible (reuse with parameter changes)
- Background playback: Tone.Transport continues when tab unfocused
- Lazy audio initialization (wait for user interaction, browser requirement)

## Contributing Guidelines

- Follow existing code patterns and structure
- Keep files focused and under 300 lines when possible
- Write descriptive commit messages
- Test locally with multiple tabs before deploying
- Update types.ts for any new configuration or interfaces
- Document complex logic with inline comments
- Update relevant docs/ files for architectural changes
- ALWAYS run linting and type-checking frequently and correct ALL issues:
  ```bash
  # Check individual packages
  cd webapp && npm run lint && npm run type-check
  cd party && npm run lint && npm run type-check

  # Or use Taskfile to check everything
  task ci
  ```

## Monorepo Notes

- Each package (webapp, party) has its own dependencies and build configuration
- Both packages share the same TypeScript and ESLint versions for consistency
- The webapp package includes all frontend dependencies (Vite, Tone.js)
- The party package includes only server dependencies (PartyKit, Yjs)
- Shared documentation lives in the root `docs/` folder
- Use the Taskfile for cross-package operations
