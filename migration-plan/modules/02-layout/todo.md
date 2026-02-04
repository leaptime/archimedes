# Layout - TODO

## Components to Create/Replace
- [ ] Create new `dashboard-layout.tsx` based on Lovable's DashboardLayout
- [ ] Replace `app-sidebar.tsx` with Lovable's AppSidebar
- [ ] Create `dashboard-header.tsx` from Lovable
- [ ] Create `nav-link.tsx` component
- [ ] Import `ThemeConfigurator.tsx`

## Sidebar Implementation
- [ ] Implement collapsible sidebar state
- [ ] Add sidebar toggle animation (framer-motion)
- [ ] Configure navigation items
- [ ] Add active state highlighting
- [ ] Implement sidebar footer with user info

## Header Implementation
- [ ] Page title and subtitle support
- [ ] Breadcrumb integration
- [ ] Search bar (if applicable)
- [ ] User menu dropdown
- [ ] Notification bell (optional)

## Mobile Responsiveness
- [ ] Implement mobile sidebar (sheet/drawer)
- [ ] Add hamburger menu trigger
- [ ] Handle touch gestures for sidebar
- [ ] Test on various screen sizes

## Theme Integration
- [ ] Integrate theme configurator
- [ ] Connect to existing `use-appearance` hook
- [ ] Ensure theme persistence
- [ ] Test dark/light mode switching

## State Management
- [ ] Sidebar collapsed state (localStorage persistence)
- [ ] Mobile menu open/close state
- [ ] Integrate with React Router for active states

## Testing
- [ ] Test sidebar collapse/expand
- [ ] Test navigation between pages
- [ ] Test mobile navigation
- [ ] Test theme switching
- [ ] Verify animations are smooth
