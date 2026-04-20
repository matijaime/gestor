# Gestor · Architecture Documentation

## Overview

Gestor is a zero-dependency, vanilla JS single-page application (SPA).
No build step, no bundler, no framework — just open `index.html`.

## File Responsibilities

### `index.html`
- Pure semantic HTML structure
- No inline styles or scripts
- ARIA labels for accessibility
- Inline SVG logo (avoids extra HTTP request, enables CSS animation)

### `assets/css/styles.css`
- CSS Custom Properties (design tokens at `:root`)
- All layout: Grid + Flexbox
- All animations: `@keyframes`, transitions, hover effects
- Component-scoped styling (BEM-like class names)
- Responsive breakpoints

### `assets/js/app.js`
- Single global state object `S`
- Persistence via `localStorage` (key: `gestor_tracker_2627`)
- Dollar Blue fetched from `https://dolarapi.com/v1/dolares/blue`
- Canvas 2D chart with `requestAnimationFrame` animated bars
- No global variable pollution (all functions named and contained)

## Data Flow

```
User action
    │
    ▼
Event handler (onclick, oninput, onsubmit)
    │
    ▼
State mutation (S.data[monthIdx]...)
    │
    ▼
save() → localStorage
    │
    ▼
render() / partial update
    │
    ▼
DOM update
```

## State Schema

```typescript
interface State {
  blue: number;           // Current ARS/USD blue rate
  blueUpdated: string;    // HH:MM string of last update
  yearView: 2026 | 2027;  // Active year tab
  monthIdx: number;       // Active month (0–19)
  data: {
    [monthIndex: string]: MonthData;
  };
}

interface MonthData {
  income: number;       // ARS
  savings: number;      // ARS target
  expenses: Expense[];
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  currency: 'ARS' | 'USD';
  category: Category;
  status: 'pending' | 'paid' | 'upcoming';
  note: string;
}

type Category =
  | 'Vivienda' | 'Alimentación' | 'Transporte' | 'Salud'
  | 'Entretenimiento' | 'Servicios' | 'Educación' | 'Ropa'
  | 'Tecnología' | 'Otro';
```

## Rendering Strategy

- `render()` = full re-render (called on month/year change, expense add/delete)
- `updateCards()` + `updateProgress()` = partial update (called on income/rate change)
- `renderTable()` = table-only re-render (called on status cycle)
- `renderChart()` = canvas-only re-render (called by ResizeObserver too)

## Chart Animation

The bar chart uses `requestAnimationFrame` with an `easeOutCubic` easing function.
Bars animate from 0 to their target height over 22 frames (~366ms at 60fps).
Active month bar gets a purple glow via `ctx.shadowBlur`.

## Dollar Blue API

- Endpoint: `https://dolarapi.com/v1/dolares/blue`
- Method: `GET`
- Timeout: 7 seconds (`AbortSignal.timeout`)
- Fallback: keeps last known rate, shows error dot
- Rate field priority: `venta` → `compra`
