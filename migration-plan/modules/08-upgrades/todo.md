# Upgrades - TODO

## Backend Setup
- [ ] Add version tracking to user_modules table
- [ ] Create update availability logic
- [ ] Implement `GET /api/modules/updates` endpoint
- [ ] Implement `POST /api/modules/{id}/update` endpoint
- [ ] Implement `GET /api/plans` endpoint (if needed)

## Page Implementation
- [ ] Create `pages/upgrades.tsx`
- [ ] Add page header
- [ ] Integrate with DashboardLayout

## Updates Section
- [ ] Create `UpdateCard` component
- [ ] Display module name and icon
- [ ] Display current version
- [ ] Display available version
- [ ] Show changelog summary
- [ ] Add "Update" button
- [ ] Add "View Details" link

## Bulk Actions
- [ ] "Update All" button
- [ ] Update progress indicator
- [ ] Success/failure summary

## Pricing Section (if applicable)
- [ ] Create `PricingTable` component
- [ ] Display plan tiers
- [ ] Highlight current plan
- [ ] Show feature comparison
- [ ] Add upgrade CTAs

## Empty State
- [ ] "All modules up to date" message
- [ ] Illustration or icon

## Notifications
- [ ] Badge on sidebar when updates available
- [ ] Toast on successful update
- [ ] Error handling for failed updates

## Data Fetching
- [ ] Create `useAvailableUpdates` hook
- [ ] Create `useUpdateModule` mutation
- [ ] Handle loading states

## Testing
- [ ] Test update detection
- [ ] Test update execution
- [ ] Test bulk update
- [ ] Test error handling
