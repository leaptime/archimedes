# Module 04: Dashboard Home

## Description
Import the main dashboard home page from Lovable with stats cards, featured modules, and quick actions.

## Scope
- DashboardHome component
- Stats cards with metrics
- Featured module cards
- Category cards
- Quick action buttons

## Dependencies
- Module 02 (Layout)
- Module 01 (UI Components)

## Clarifying Questions

### Q1: Dashboard Data Source
The Lovable dashboard shows module stats, featured modules, etc. Where should this data come from?
- **A)** Create Laravel API endpoints for real data
- **B)** Use mock data initially (like Lovable), add API later
- **C)** Create a dashboard API that aggregates multiple data sources

### Q2: Stats Cards Metrics
Lovable shows: Active Modules, API Calls, Monthly Cost, Team Members
Do you want to:
- **A)** Keep these exact metrics
- **B)** Customize metrics for your use case
- **C)** Make stats configurable per user/organization

### Q3: Featured Modules Section
Lovable has featured modules with install actions. Implementation:
- **A)** Static featured list from admin config
- **B)** Dynamic based on popularity/recommendations
- **C)** Skip featured section for now

## Source Files (Lovable)
- `components/DashboardHome.tsx` (13.7KB - complex component)
- `components/FeaturedModuleCard.tsx`
- `components/CategoryCard.tsx`

## API Endpoints to Create
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/featured-modules` - Featured modules list
- `GET /api/dashboard/recent-activity` - Recent activity feed

## Target Files
- `resources/js/pages/dashboard.tsx`
- `resources/js/components/dashboard-home.tsx`
- `resources/js/components/featured-module-card.tsx`
- `resources/js/components/category-card.tsx`
- `resources/js/components/stats-card.tsx`
