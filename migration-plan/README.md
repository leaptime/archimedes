# Archimedes Migration Plan
## From Inertia.js to React SPA with API

### Overview
Migrate from Laravel + Inertia.js to Laravel API + React SPA, importing designs from the Lovable dashboard project.

### Architecture Decisions
- **API**: Laravel Sanctum (SPA cookie authentication)
- **Routing**: React SPA at `/` with Laravel API at `/api/*`
- **State**: TanStack Query (React Query) for server state
- **Auth**: Rewrite auth pages with Lovable design + Fortify API endpoints
- **Styling**: Keep Tailwind CSS v4 from current project

### Module Structure
Each module in `/modules/` contains:
- `README.md` - Module overview and questions
- `todo.md` - Pending tasks
- `done.md` - Completed tasks

### Migration Order
1. **00-infrastructure** - Base setup (API routes, Sanctum, React Router)
2. **01-ui-components** - Import shadcn/ui components from Lovable
3. **02-layout** - Dashboard layout, sidebar, header
4. **03-auth** - Authentication pages migration
5. **04-dashboard-home** - Main dashboard page
6. **05-marketplace** - Marketplace & module catalog
7. **06-my-modules** - Installed modules management
8. **07-wizard** - Setup wizard flow
9. **08-upgrades** - Module upgrades page
10. **09-analytics** - Analytics dashboard
11. **10-team** - Team management
12. **11-settings** - Settings pages
13. **12-help** - Help & chatbot

### Files to Remove (After Migration)
- `resources/js/app.tsx` (Inertia entry)
- `resources/js/ssr.tsx`
- All Inertia-specific pages in `resources/js/pages/`
- Inertia middleware and providers
