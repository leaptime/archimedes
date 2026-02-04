# My Modules - TODO

## Backend Setup
- [ ] Create user_modules pivot table migration
- [ ] Add modules relationship to User model
- [ ] Implement `GET /api/user/modules` endpoint
- [ ] Implement `DELETE /api/user/modules/{id}` endpoint
- [ ] Implement `GET /api/user/modules/{id}/usage` endpoint

## Page Implementation
- [ ] Create `pages/my-modules.tsx`
- [ ] Add page header with title/subtitle
- [ ] Integrate with DashboardLayout

## Installed Modules List
- [ ] Create `InstalledModuleCard` component
- [ ] Display module icon and name
- [ ] Display installed version
- [ ] Display last used date
- [ ] Display status (active, needs update, etc.)
- [ ] Add action buttons (Configure, Uninstall)

## Module Actions
- [ ] Implement Configure button
- [ ] Create uninstall confirmation modal
- [ ] Implement uninstall mutation
- [ ] Handle optimistic updates
- [ ] Show success/error toasts

## Empty State
- [ ] Design empty state for no installed modules
- [ ] Add CTA to browse marketplace

## Search & Filter
- [ ] Add search input
- [ ] Filter by category (optional)
- [ ] Sort by name/date installed

## Data Fetching
- [ ] Create `useUserModules` React Query hook
- [ ] Create `useUninstallModule` mutation
- [ ] Handle loading skeleton
- [ ] Handle error states

## Testing
- [ ] Test module display
- [ ] Test uninstall flow
- [ ] Test empty state
- [ ] Test mobile responsiveness
