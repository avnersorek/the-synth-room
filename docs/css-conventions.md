# CSS Architecture Guidelines

## Overview
Gradual migration from monolithic `style.css` (898 lines) to component-based CSS. **Extract styles only as you work on components**, not in a big refactor.

## File Structure

```
webapp/src/styles/
├── base/              # Reset, variables, typography
├── layout/            # Header, lobby, room status
├── forms/             # Buttons, inputs, selects
├── grid/              # Base grid system
├── instruments/       # Instrument-specific styles
└── components/        # Reusable UI components
```

## Component Mapping

| Component | CSS File |
|-----------|----------|
| DrumInstrument.ts | styles/instruments/drums.css |
| LeadInstrument.ts | styles/instruments/piano-roll.css |
| BassInstrument.ts | styles/instruments/piano-roll.css (shared) |
| GlowCard.ts | styles/components/glowcard.css ✅ |

---

## Creating New Component CSS

1. Create CSS file in appropriate category folder
2. Write scoped styles with component prefix
3. Import in `main.ts` at correct cascade position (see Import Order below)
4. Use in TypeScript component

```bash
touch webapp/src/styles/forms/volume-slider.css
```

```css
.volume-slider { display: flex; gap: var(--spacing-md); }
.volume-slider__label { font-weight: bold; }
.volume-slider__input { width: 150px; }
```

```typescript
// main.ts
import './styles/forms/volume-slider.css';
element.className = 'volume-slider';
```

---

## Extracting Existing CSS from style.css

**When:** Only when actively working on a component.

**Process:**
```bash
grep -n "lead-" webapp/src/style.css                    # 1. Find styles
touch webapp/src/styles/instruments/piano-roll.css      # 2. Create file
# Copy styles to new file                                # 3. Copy
# Add import to main.ts                                  # 4. Import
cd webapp && npm run dev                                # 5. Test
# Delete extracted lines from style.css                  # 6. Delete
git commit -m "refactor: extract lead styles"          # 7. Commit
```

**Checklist:**
- [ ] Styles found via grep
- [ ] New file created, styles copied
- [ ] Import added to main.ts
- [ ] Component tested
- [ ] Old lines deleted from style.css
- [ ] Linting passes: `npm run lint`
- [ ] Committed

---

## Import Order in main.ts

**Critical:** Generic → Specific

```typescript
// Base
import './styles/base/reset.css';
import './styles/base/variables.css';
import './styles/base/typography.css';

// Shared
import './styles/forms/controls.css';
import './styles/layout/header.css';
import './styles/layout/lobby.css';

// Grid
import './styles/grid/grid-base.css';

// Instruments (override grid)
import './styles/instruments/drums.css';
import './styles/instruments/piano-roll.css';

// Components (last for overrides)
import './styles/components/glowcard.css';
```

**Rule:** When adding import, place at appropriate level. If it overrides something, place it lower.

---

## Common Patterns

### Instrument with Custom Grid
```css
/* grid-base.css - Base */
.cell { width: 40px; height: 40px; }

/* piano-roll.css - Override */
.lead-instrument .lead-cell { width: 32px; height: 20px; }
```

### Shared Styles (Lead + Bass)
```css
.lead-instrument .grid,
.bass-instrument .grid { max-height: 600px; }

.lead-cell, .bass-cell { width: 32px; }
```

### CSS Variables
```css
/* base/variables.css */
:root { --color-primary: #ff9800; --cell-size: 40px; }

/* Usage */
.cell { width: var(--cell-size); }
```

---

## CSS Organization Principles

### 1. Component Scope
```css
/* ✅ Good - scoped */
.lead-instrument .grid { }

/* ❌ Bad - global */
.grid { }
```

### 2. BEM-like Naming
```css
.component { }              /* Block */
.component__element { }     /* Element */
.component--modifier { }    /* Modifier */
```

### 3. Shared Styles
Extract to shared file, override in component-specific files.

---

## Quick Reference

### Creating New Component
```bash
touch webapp/src/styles/[category]/[name].css
# Add import to main.ts
```

### Extracting Existing CSS
```bash
grep -n "[prefix]-" webapp/src/style.css
# Create file, copy styles, add import, test, delete from style.css
```

---

## Current Status

- ✅ `glowcard.css` - Modular example (232 lines)
- ⏳ `style.css` - Legacy file (898 lines) - extract gradually

## Migration Strategy

1. ✅ Document conventions
2. ⏭️ Follow guidelines for **new** components
3. ⏭️ Extract from `style.css` only when **modifying** existing components
4. ⏭️ Eventually deprecate `style.css`

**No immediate action required** - use as reference.
