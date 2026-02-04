# Marketplace - TODO

## Backend Setup
- [ ] Create `Module` Eloquent model
- [ ] Create modules migration
- [ ] Create `ModuleController` API controller
- [ ] Implement `GET /api/modules` with filtering
- [ ] Implement `GET /api/modules/{id}` endpoint
- [ ] Implement `POST /api/modules/{id}/install` endpoint
- [ ] Implement `GET /api/modules/categories` endpoint
- [ ] Create module seeder with sample data

## Types & Data
- [ ] Create `types/module.ts` TypeScript interface
- [ ] Define module status enum (installed, available, coming-soon)
- [ ] Define price type enum (free, freemium, paid)
- [ ] Create API response types

## Components to Import
- [ ] Import/adapt `MarketplacePage.tsx`
- [ ] Import/adapt `ModuleCatalog.tsx`
- [ ] Import/adapt `ModuleCard.tsx`

## Marketplace Page
- [ ] Create `pages/marketplace.tsx`
- [ ] Integrate with DashboardLayout
- [ ] Add page header with title/subtitle

## Module Catalog
- [ ] Implement search input
- [ ] Implement category filter tabs
- [ ] Implement status filter (All, Installed, Available)
- [ ] Implement sort dropdown (Popular, Newest, Rating)
- [ ] Add grid/list view toggle (optional)

## Module Card
- [ ] Display module icon (Lucide icons)
- [ ] Display module name and description
- [ ] Display provider name and badge
- [ ] Display rating stars
- [ ] Display install count
- [ ] Display price/pricing tier
- [ ] Add Install/View button
- [ ] Add status badge (installed, coming soon)

## Search & Filter
- [ ] Debounced search input
- [ ] URL query params sync (for shareable filters)
- [ ] Clear filters button
- [ ] Results count display

## Data Fetching
- [ ] Create `useModules` React Query hook
- [ ] Create `useInstallModule` mutation hook
- [ ] Handle loading states
- [ ] Handle empty states
- [ ] Handle error states

## Testing
- [ ] Test search functionality
- [ ] Test category filtering
- [ ] Test module installation
- [ ] Test pagination (if implemented)
- [ ] Test mobile layout
