# Module 06: My Modules

## Description
Import the "My Modules" page showing user's installed modules with management options.

## Scope
- Installed modules list
- Module status display
- Module actions (configure, uninstall, upgrade)
- Usage statistics per module

## Dependencies
- Module 02 (Layout)
- Module 05 (Marketplace - shared components)

## Clarifying Questions

### Q1: Module Configuration
When user clicks "Configure" on a module:
- **A)** Open inline settings panel
- **B)** Navigate to dedicated module settings page
- **C)** Open modal with settings
- **D)** Depends on module (some have settings, some don't)

### Q2: Uninstall Behavior
When uninstalling a module:
- **A)** Immediate uninstall with confirmation modal
- **B)** Soft delete (can reinstall with data preserved)
- **C)** Hard delete (all module data removed)

### Q3: Module Usage Display
Show usage stats per module?
- **A)** Yes - API calls, last used, data usage
- **B)** Minimal - just last used date
- **C)** No usage stats on this page

## Source Files (Lovable)
- `pages/MyModules.tsx` (5.1KB)

## API Endpoints to Create
- `GET /api/user/modules` - User's installed modules
- `DELETE /api/user/modules/{id}` - Uninstall module
- `GET /api/user/modules/{id}/usage` - Module usage stats

## Target Files
- `resources/js/pages/my-modules.tsx`
- `resources/js/components/installed-module-card.tsx`
