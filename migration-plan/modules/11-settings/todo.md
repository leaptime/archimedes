# Settings - TODO

## Backend Setup
- [ ] Create `ProfileController` for user updates
- [ ] Implement `PATCH /api/user/profile`
- [ ] Implement `POST /api/user/avatar`
- [ ] Implement `PATCH /api/user/password`
- [ ] Implement `PATCH /api/user/notifications`
- [ ] Add notification preferences to users table
- [ ] Configure file upload for avatars
- [ ] Implement account deletion logic

## Page Implementation
- [ ] Create `pages/settings/index.tsx` with tabs
- [ ] Implement tab navigation
- [ ] Handle tab state in URL

## Profile Tab
- [ ] Profile photo section with upload
- [ ] First name input
- [ ] Last name input
- [ ] Email input (with verification flow if changed)
- [ ] Company name input
- [ ] Save button with loading state
- [ ] Success toast on save

## Preferences Section
- [ ] Language selector
- [ ] Theme selector (Light/Dark/System)
- [ ] Timezone selector (optional)

## Notifications Tab
- [ ] Module Updates toggle
- [ ] Security Alerts toggle
- [ ] Usage Reports toggle
- [ ] Team Activity toggle
- [ ] Marketing emails toggle
- [ ] Save preferences
- [ ] Group by category (optional)

## Security Tab
- [ ] Current password input
- [ ] New password input
- [ ] Confirm password input
- [ ] Password visibility toggle
- [ ] Password strength indicator
- [ ] Update password button
- [ ] Two-Factor Authentication section
- [ ] Enable/Disable 2FA toggle
- [ ] Recovery codes display
- [ ] Session management (optional)

## Billing Tab
- [ ] Current plan display
- [ ] Plan features summary
- [ ] Upgrade plan button
- [ ] Payment method display
- [ ] Update payment method button
- [ ] Billing history table (optional)
- [ ] Invoice download links

## Delete Account Section
- [ ] Delete account button
- [ ] Confirmation modal
- [ ] Password confirmation required
- [ ] Data export option before delete

## Form Validation
- [ ] Set up react-hook-form for each section
- [ ] Define zod schemas
- [ ] Display validation errors

## Data Fetching
- [ ] Create `useUpdateProfile` mutation
- [ ] Create `useUploadAvatar` mutation
- [ ] Create `useUpdatePassword` mutation
- [ ] Create `useNotificationPrefs` query/mutation

## Testing
- [ ] Test profile update
- [ ] Test avatar upload
- [ ] Test password change
- [ ] Test notification toggles
- [ ] Test account deletion
