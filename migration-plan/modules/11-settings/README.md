# Module 11: Settings Pages

## Description
Import the comprehensive settings page with multiple tabs (Profile, Notifications, Security, Billing).

## Scope
- Profile settings (name, email, avatar)
- Notification preferences
- Security settings (password, 2FA)
- Billing information
- Preferences (theme, language)

## Dependencies
- Module 02 (Layout)
- Module 01 (UI Components)
- Module 03 (Auth - for password/2FA integration)

## Clarifying Questions

### Q1: Settings Structure
- **A)** Single settings page with tabs (Lovable approach)
- **B)** Separate pages for each section
- **C)** Combination - main settings with sub-routes

### Q2: Avatar Upload
- **A)** Upload to local storage
- **B)** Upload to cloud (S3, etc.)
- **C)** Use external avatar service (Gravatar, DiceBear)
- **D)** Skip avatar upload for now

### Q3: Billing Integration
- **A)** Integrate with Stripe
- **B)** Integrate with other payment provider
- **C)** Show billing info only (no payment processing)
- **D)** Skip billing section

### Q4: Delete Account
- **A)** Allow account deletion with confirmation
- **B)** Soft delete (deactivate account)
- **C)** Contact support to delete
- **D)** No delete option

## Source Files (Lovable)
- `pages/Settings.tsx` (13.6KB - tabbed interface)

## API Endpoints to Create
- `PATCH /api/user/profile` - Update profile
- `POST /api/user/avatar` - Upload avatar
- `PATCH /api/user/password` - Change password
- `PATCH /api/user/notifications` - Update notification prefs
- `GET /api/user/billing` - Get billing info
- `DELETE /api/user` - Delete account

## Target Files
- `resources/js/pages/settings/index.tsx`
- `resources/js/pages/settings/profile.tsx`
- `resources/js/pages/settings/notifications.tsx`
- `resources/js/pages/settings/security.tsx`
- `resources/js/pages/settings/billing.tsx`
