# Module 05: Marketplace

## Description
Import the marketplace page for browsing and installing modules.

## Scope
- MarketplacePage component
- ModuleCatalog with filtering
- ModuleCard component
- Search and filter functionality
- Module detail view

## Dependencies
- Module 02 (Layout)
- Module 01 (UI Components)

## Clarifying Questions

### Q1: Module Data Structure
Lovable has a comprehensive module structure (see `data/modules.ts`). Do you want:
- **A)** Use the exact same data structure
- **B)** Simplify the structure for MVP
- **C)** Extend with additional fields

### Q2: Module Installation Flow
When user clicks "Install":
- **A)** Instant install (add to user's modules)
- **B)** Show confirmation modal first
- **C)** Redirect to module detail page with install option
- **D)** For paid modules, redirect to checkout

### Q3: Search Implementation
- **A)** Client-side filtering (all modules loaded at once)
- **B)** Server-side search with pagination
- **C)** Hybrid (load first page, search on server)

### Q4: Categories
Lovable categories: invoicing, crm, erp, survey, hr, analytics, communication, project-management, ecommerce, marketing
- **A)** Keep all categories
- **B)** Reduce to fewer categories
- **C)** Make categories configurable

## Source Files (Lovable)
- `pages/Marketplace.tsx`
- `components/MarketplacePage.tsx` (10KB)
- `components/ModuleCatalog.tsx` (7.9KB)
- `components/ModuleCard.tsx` (5KB)
- `data/modules.ts` (mock data)
- `types/module.ts`

## API Endpoints to Create
- `GET /api/modules` - List all modules (with filters)
- `GET /api/modules/{id}` - Single module details
- `POST /api/modules/{id}/install` - Install module
- `GET /api/modules/categories` - List categories

## Target Files
- `resources/js/pages/marketplace.tsx`
- `resources/js/components/marketplace-page.tsx`
- `resources/js/components/module-catalog.tsx`
- `resources/js/components/module-card.tsx`
- `resources/js/types/module.ts`
