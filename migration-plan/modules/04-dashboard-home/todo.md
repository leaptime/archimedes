# Dashboard Home - TODO

## Backend API
- [ ] Create `DashboardController` for API endpoints
- [ ] Implement `GET /api/dashboard/stats` endpoint
- [ ] Implement `GET /api/dashboard/featured-modules` endpoint
- [ ] Implement `GET /api/dashboard/recent-activity` endpoint
- [ ] Add proper authorization checks

## Components to Import
- [ ] Import/adapt `DashboardHome.tsx`
- [ ] Import `FeaturedModuleCard.tsx`
- [ ] Import `CategoryCard.tsx`
- [ ] Create reusable `StatsCard` component

## Dashboard Page
- [ ] Create `pages/dashboard.tsx` with layout
- [ ] Integrate with React Query for data fetching
- [ ] Add loading skeletons
- [ ] Add error states

## Stats Section
- [ ] Display Active Modules count
- [ ] Display API Calls metric
- [ ] Display Monthly Cost
- [ ] Display Team Members count
- [ ] Add trend indicators (up/down arrows)
- [ ] Add animation on mount

## Featured Modules Section
- [ ] Display featured module cards
- [ ] Add install/view actions
- [ ] Show module ratings
- [ ] Link to marketplace

## Categories Section
- [ ] Display category cards
- [ ] Add category icons
- [ ] Link to marketplace filtered by category

## Quick Actions
- [ ] Add "Browse Marketplace" button
- [ ] Add "View My Modules" button
- [ ] Add "Invite Team" button (if applicable)

## Styling & Animation
- [ ] Apply Lovable's card styling
- [ ] Add framer-motion animations
- [ ] Ensure responsive grid layout
- [ ] Test dark mode

## Testing
- [ ] Verify data loading
- [ ] Test error handling
- [ ] Test empty states
- [ ] Test mobile layout
