# Module 02: Layout Components

## Description
Import the dashboard layout system from Lovable including sidebar, header, and main content structure.

## Scope
- DashboardLayout component
- AppSidebar with collapsible state
- DashboardHeader component
- Navigation structure
- Theme configurator

## Dependencies
- Module 00 (Infrastructure)
- Module 01 (UI Components)

## Clarifying Questions

### Q1: Sidebar Navigation Items
Lovable sidebar has these sections:
- Dashboard, Marketplace, My Modules, Wizard, Upgrades
- Analytics, Team, Settings, Help

Should we keep all these or modify the navigation structure?

### Q2: User Menu Integration
Current project has `nav-user.tsx` with Fortify integration. Lovable has different user menu.
- **A)** Use Lovable's design but keep Fortify logout/profile logic
- **B)** Completely replace with Lovable's implementation
- **C)** Merge both - Lovable design + existing functionality

### Q3: Mobile Navigation
Lovable uses sheet/drawer for mobile. Current project has different mobile nav.
- **A)** Use Lovable's mobile navigation
- **B)** Keep current mobile implementation
- **C)** Redesign mobile nav combining both approaches

## Source Files (Lovable)
- `components/DashboardLayout.tsx`
- `components/AppSidebar.tsx`
- `components/DashboardHeader.tsx`
- `components/NavLink.tsx`
- `components/ThemeConfigurator.tsx`

## Target Files (Archimedes)
- `resources/js/layouts/dashboard-layout.tsx`
- `resources/js/components/app-sidebar.tsx` (replace existing)
- `resources/js/components/dashboard-header.tsx`
- `resources/js/components/nav-link.tsx`
- `resources/js/components/theme-configurator.tsx`
