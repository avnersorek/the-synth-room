# UI Component System

## Overview

The UI is built with vanilla TypeScript using a component-based architecture. Components are responsible for rendering, event handling, and state display. No frontend framework is used.

## Architecture

**Main Orchestrator:** [UI.ts](../src/ui/UI.ts)
- Creates and coordinates all components
- Manages instrument switching
- Handles transport controls
- Coordinates managers (EventManager, SyncUIManager, StepAnimationController)

**Component Hierarchy:**
```
UI (orchestrator)
├── Instrument Components
│   ├── DrumInstrument
│   ├── LeadInstrument
│   └── BassInstrument
├── InstrumentPanel (instrument selector)
├── EventManager (DOM event handling)
├── SyncUIManager (connection status)
└── StepAnimationController (playback visualization)
```

## Base Classes

### AbstractGridInstrument
Location: [src/components/base/AbstractGridInstrument.ts](../src/components/base/AbstractGridInstrument.ts)
**Purpose:** Shared functionality for all grid-based instruments.

### GridRenderer
Location: [src/components/base/GridRenderer.ts](../src/components/base/GridRenderer.ts)
**Static Utility Class:** Provides shared rendering logic.

## Instrument Components
Location: `src/components/*Instrument.ts

**Scroll Behavior:**
Grid is scrollable vertically due to height. Default scroll position shows middle octave.

Location: [src/components/InstrumentPanel.ts](../src/components/InstrumentPanel.ts)
**Purpose:** Instrument switcher (tabs for drums, lead, bass, ...)
**Event Handling:**
- Button click → UI.onInstrumentChange()
- Updates active state (CSS class)
- Hides/shows appropriate instrument component

## Event Management

### EventManager
Location: [src/ui/managers/EventManager.ts](../src/ui/managers/EventManager.ts)
**Purpose:** Centralize DOM event listener registration.

## Step Animation

### StepAnimationController
Location: [src/ui/managers/StepAnimationController.ts](../src/ui/managers/StepAnimationController.ts)
**Purpose:** Animate current step indicator during playback.


## Sync UI

### SyncUIManager
Location: [src/ui/managers/SyncUIManager.ts](../src/ui/managers/SyncUIManager.ts)
**Purpose:** Display connection status and user count.

## Grid Rendering

**Responsive Sizing:**
Cells use `aspect-ratio: 1` to remain square. Grid adapts to container width.

## Selector Updates

### SelectorUpdater
Location: [src/ui/utils/SelectorUpdater.ts](../src/ui/utils/SelectorUpdater.ts)
**Purpose:** Update dropdowns when synced from remote clients.
**Why:** Prevents triggering change events when updating from sync (avoids circular updates).

## Component Lifecycle

**Initialization:**
```typescript
1. UI.ts creates all instrument components
2. Components render to DOM
3. EventManager registers all listeners
4. Initial state loaded from Sequencer/AudioEngine
5. Sync callbacks registered
```

**Runtime:**
```typescript
User interaction → Event handler → Sequencer → Sync → Other clients
Sync update → Callback → Component → DOM update
```

**Cleanup:**
```typescript
1. EventManager.destroy() removes all listeners
2. Components remove DOM elements
3. Sync callbacks unregistered
```

## Styling Approach

# !! CSS IS A MESS AND SHOULD BE REFACTORED !!

## Performance Considerations

**Minimize DOM Updates:**
- Only update cells that changed
- Use CSS classes instead of inline styles
- Batch updates when possible

**Event Delegation:**
Consider using event delegation for large grids:
```typescript
grid.addEventListener('click', (e) => {
  const cell = (e.target as HTMLElement).closest('.cell');
  if (cell) {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    this.handleCellClick(row, col);
  }
});
```

**requestAnimationFrame:**
Use for animations and visual updates synchronized with browser paint cycle.

## API Reference

See component files in [src/components/](../src/components/) and [src/ui/](../src/ui/) for complete implementations.
