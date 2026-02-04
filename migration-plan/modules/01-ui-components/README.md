# Module 01: UI Components Migration

## Description
Import and adapt shadcn/ui components from Lovable project to match the current Tailwind v4 setup.

## Scope
- Compare existing vs Lovable UI components
- Import missing components
- Adapt components to Tailwind CSS v4 syntax
- Ensure consistent theming

## Dependencies
- Module 00 (Infrastructure)

## Clarifying Questions

### Q1: Component Conflicts
The current project has 25 UI components, Lovable has 49. Strategy for conflicts:
- **A)** Prefer Lovable versions (full design consistency)
- **B)** Keep current versions, only add missing ones
- **C)** Merge manually - keep best of both

### Q2: Animation Library
Lovable uses `framer-motion` for animations. Current project doesn't have it.
- **A)** Add framer-motion (matches Lovable exactly)
- **B)** Use CSS animations only (lighter bundle)
- **C)** Use Tailwind CSS animations (`tw-animate-css` already installed)

### Q3: Additional Dependencies
Lovable has these extra deps not in current project:
- `recharts` (charts)
- `react-day-picker` (calendar)
- `cmdk` (command palette)
- `vaul` (drawer)
- `sonner` (toasts)
- `embla-carousel-react` (carousel)
- `react-hook-form` + `zod` (forms)

Install all or selective?

## Components to Import (Missing in Current)
- accordion, alert-dialog, aspect-ratio, calendar, carousel
- chart, command, context-menu, drawer, form
- hover-card, menubar, pagination, popover, progress
- radio-group, resizable, scroll-area, slider, sonner
- switch, table, tabs, textarea, toast/toaster

## Files Affected
- `resources/js/components/ui/*` - All UI components
- `resources/css/app.css` - Theme variables if needed
- `package.json` - New dependencies
