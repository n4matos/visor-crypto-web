# Design System — DAO Activity Dashboard

> Source of truth para geração de código. Usar CSS custom properties ou Tailwind config abaixo.

---

## CSS Custom Properties

```css
:root {
  /* Surfaces */
  --surface-page: #0B0D12;
  --surface-sidebar: #10131A;
  --surface-card: #14171F;
  --surface-card-alt: #191D27;
  --surface-elevated: #1E222D;
  --surface-input: #1A1E28;
  --surface-overlay: rgba(0, 0, 0, 0.60);

  /* Text */
  --text-primary: #FFFFFF;
  --text-secondary: #A1A7B5;
  --text-muted: #6B7280;
  --text-disabled: #4B5060;
  --text-on-primary: #FFFFFF;
  --text-on-surface: #C8CDD8;
  --text-link: #8B8FFE;

  /* Actions */
  --action-primary: #7C5CFC;
  --action-primary-hover: #9178FF;
  --action-primary-muted: rgba(124, 92, 252, 0.15);
  --action-secondary: #2A2D38;
  --action-secondary-hover: #33374A;
  --action-destructive: #EF4444;

  /* Accents */
  --accent-yellow: #F5D245;
  --accent-green: #34D399;
  --accent-purple: #7C5CFC;
  --accent-purple-light: #A78BFA;
  --accent-red: #F87171;
  --accent-orange: #FB923C;

  /* Borders */
  --border-default: #1F2330;
  --border-subtle: #1A1D26;
  --border-strong: #2D3140;
  --border-focus: #7C5CFC;
  --border-accent: rgba(124, 92, 252, 0.40);

  /* Status */
  --status-success: #34D399;
  --status-success-muted: rgba(52, 211, 153, 0.15);
  --status-warning: #FBBF24;
  --status-error: #F87171;
  --status-error-muted: rgba(248, 113, 113, 0.15);
  --status-info: #7C5CFC;

  /* Charts */
  --chart-line-1: #7C5CFC;
  --chart-line-2: #F5D245;
  --chart-bar-1: #7C5CFC;
  --chart-bar-2: #A78BFA;
  --chart-area-fill: rgba(124, 92, 252, 0.10);
  --chart-grid: #1A1E28;
  --chart-axis-label: #6B7280;

  /* Typography */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* Font sizes: xs=11px, sm=13px, base=14px, lg=16px, xl=20px, 2xl=24px, 3xl=28px */
  --text-xs: 0.6875rem;
  --text-sm: 0.8125rem;
  --text-base: 0.875rem;
  --text-lg: 1rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.75rem;

  /* Spacing (4px grid) */
  --space-0-5: 2px;
  --space-1: 4px;
  --space-1-5: 6px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.30);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.40);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.50);
  --shadow-glow: 0 0 20px rgba(124, 92, 252, 0.15);

  /* Transitions */
  --transition-fast: 100ms ease;
  --transition-base: 150ms ease;
  --transition-moderate: 200ms ease-out;
  --transition-slow: 300ms ease-in-out;
  --transition-chart: 500ms ease-in-out;

  /* Layout */
  --sidebar-width: 56px;
  --sidebar-width-expanded: 240px;
  --topbar-height: 64px;
  --content-max-width: 1440px;
}
```

---

## Tailwind Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: {
          page: '#0B0D12',
          sidebar: '#10131A',
          card: '#14171F',
          'card-alt': '#191D27',
          elevated: '#1E222D',
          input: '#1A1E28',
        },
        action: {
          primary: '#7C5CFC',
          'primary-hover': '#9178FF',
          secondary: '#2A2D38',
          'secondary-hover': '#33374A',
        },
        accent: {
          yellow: '#F5D245',
          green: '#34D399',
          purple: '#7C5CFC',
          'purple-light': '#A78BFA',
          red: '#F87171',
          orange: '#FB923C',
        },
        border: {
          DEFAULT: '#1F2330',
          subtle: '#1A1D26',
          strong: '#2D3140',
          focus: '#7C5CFC',
        },
        status: {
          success: '#34D399',
          warning: '#FBBF24',
          error: '#F87171',
          info: '#7C5CFC',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A1A7B5',
          muted: '#6B7280',
          disabled: '#4B5060',
          'on-surface': '#C8CDD8',
          link: '#8B8FFE',
        },
        chart: {
          'line-1': '#7C5CFC',
          'line-2': '#F5D245',
          'bar-1': '#7C5CFC',
          'bar-2': '#A78BFA',
          grid: '#1A1E28',
          'axis-label': '#6B7280',
        },
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        xs: ['0.6875rem', { lineHeight: '1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.375rem' }],
        lg: ['1rem', { lineHeight: '1.5rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.75rem', { lineHeight: '2.25rem' }],
      },
      spacing: {
        0.5: '2px',
        1: '4px',
        1.5: '6px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.30)',
        md: '0 4px 12px rgba(0, 0, 0, 0.40)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.50)',
        glow: '0 0 20px rgba(124, 92, 252, 0.15)',
      },
      transitionDuration: {
        fast: '100ms',
        base: '150ms',
        moderate: '200ms',
        slow: '300ms',
        chart: '500ms',
      },
    },
  },
};
```

---

## Component Specs

Referência rápida para construir componentes. Valores usam os tokens acima.

### Button — Primary

```
bg: action-primary | hover: action-primary-hover | active: brightness(0.9)
text: text-on-primary | size: text-sm | weight: 500
padding: 8px 16px | radius: radius-md
focus: 2px solid border-focus, offset 2px
transition: transition-base
```

### Button — Secondary/Ghost

```
bg: transparent ou action-secondary | hover: action-secondary-hover
text: text-primary ou accent-green | size: text-sm | weight: 500
padding: 6px 12px | radius: radius-sm
border: 1px solid border-default
```

### Button — Destructive/Accent

```
bg: accent-red | text: #FFFFFF | radius: radius-md
— ou —
bg: transparent | text: text-primary | border: 1px solid border-strong | radius: radius-md
```

### Card

```
bg: surface-card | border: 1px solid border-default
radius: radius-xl | padding: 24px | gap interno: 16px
— variante ticker strip —
bg: surface-card-alt | radius: radius-2xl | padding: 16px 20px
```

### Search Input

```
bg: surface-input | border: 1px solid border-default | focus border: border-focus
radius: radius-lg | padding: 8px 16px | height: 40px
placeholder color: text-muted | size: text-sm
```

### Filter Chips

```
inactive: bg action-secondary | text text-secondary | size text-xs | weight 500
          padding: 6px 12px | radius: radius-sm
active:   bg surface-elevated | text text-primary | border: 1px solid border-strong
```

### Segmented Control

```
container: bg action-secondary | radius: radius-md | padding: 2px
inactive:  text text-muted | padding: 4px 12px
active:    bg surface-elevated | text text-primary | radius: radius-sm
```

### Badge — Status (ex: "+1.94%")

```
bg: status-success-muted | text: status-success
padding: 2px 6px | radius: radius-xs | size: text-xs | weight: 500
```

### Badge — Performance (ex: "82%")

```
bg: accent-orange (dinâmico) | text: text-primary ou surface-page
padding: 4px 8px | radius: radius-full | size: text-xs | weight: 700
```

### Sidebar

```
width: 56px | bg: surface-sidebar | border-right: 1px solid border-subtle
icon: 20px | color: text-muted | hover: text-secondary | active: action-primary
fab "+": 36px | bg: action-primary | text: text-on-primary | radius: radius-md
```

### Avatar

```
sm: 28px | md: 36px | radius: full
stack overlap border: 2px solid surface-page
```

### Calendar

```
container: bg surface-card | padding: 24px
day cell: 32px | size text-sm | text text-secondary | radius: full
today: bg action-primary | text text-on-primary
highlighted: bg action-primary-muted | text accent-purple
outside month: text text-disabled
```

### Table Row

```
padding: 12px 16px | border-bottom: 1px solid border-subtle
hover: bg surface-elevated
text: text-base text-primary | secondary: text-sm text-secondary
left indicator: 3px wide | bg accent-purple | radius: full
```

### Icons

```
sizes: 16px (inline), 20px (sidebar/actions), 24px (header)
color: text-muted → hover: text-secondary → active: action-primary
style: outlined/stroke (Lucide)
```

---

## Layout Grid

```
12 colunas | gap: 16px | max-width: 1440px
sidebar: 56px collapsed / 240px expanded | topbar: 64px

Breakpoints: sm=640px | md=768px | lg=1024px | xl=1280px | 2xl=1536px
```

## Typography Quick Ref

```
font-weight: 400 body | 500 labels/tabs | 600 section titles | 700 page title/big values
letter-spacing: -0.02em titles | 0 body | 0.04em uppercase labels
```