# Module 00: Infrastructure Setup

## Description
Set up the foundational infrastructure for React SPA with Laravel API backend.

## Scope
- Configure Laravel Sanctum for SPA authentication
- Set up API routes structure
- Configure Vite for SPA (remove Inertia plugins)
- Set up React Router DOM
- Configure TanStack Query
- Set up API client (axios/fetch wrapper)

## Dependencies
- None (first module)

## Clarifying Questions

### Q1: CORS Configuration
The Laravel app will serve both the SPA and API. Should we:
- **A)** Serve React build from Laravel's public folder (same origin, no CORS)
- **B)** Run React dev server separately during development (needs CORS config)

**Recommendation**: Option A for production, Option B during development with proper CORS.

### Q2: API Versioning
Do you want API versioning from the start?
- **A)** Yes - `/api/v1/*` structure
- **B)** No - Simple `/api/*` structure (can add later)

### Q3: API Response Format
Preferred response structure:
- **A)** Laravel API Resources (transformers)
- **B)** Direct Eloquent toArray() with consistent envelope `{ data, meta, errors }`

## Files to Create
- `routes/api.php` - API routes
- `app/Http/Controllers/Api/` - API controllers
- `resources/js/main.tsx` - New SPA entry point
- `resources/js/router.tsx` - React Router configuration
- `resources/js/lib/api.ts` - API client
- `resources/js/lib/query-client.ts` - React Query setup

## Files to Modify
- `vite.config.ts` - Remove Inertia, add SPA config
- `config/sanctum.php` - SPA domains config
- `config/cors.php` - CORS settings
- `app/Http/Kernel.php` - Middleware adjustments
