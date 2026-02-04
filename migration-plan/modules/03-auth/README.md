# Module 03: Authentication Pages

## Description
Rewrite authentication pages using Lovable's design style with Laravel Fortify API endpoints.

## Scope
- Login page with Lovable styling
- Register page
- Forgot password flow
- Reset password page
- Email verification page
- Two-factor authentication challenge
- Confirm password page

## Dependencies
- Module 00 (Infrastructure - API setup)
- Module 01 (UI Components)

## Clarifying Questions

### Q1: Auth Layout Design
Lovable project doesn't have dedicated auth pages. Options:
- **A)** Design auth pages matching Lovable's style (cards, forms, etc.)
- **B)** Use a split-screen design (form + illustration)
- **C)** Keep current auth layout but update components to Lovable style

### Q2: Social Login
Current project doesn't have social auth. Do you want to add:
- **A)** No social login needed
- **B)** Add Google OAuth
- **C)** Add Google + GitHub OAuth
- **D)** Plan for social login later (add UI placeholders)

### Q3: Remember Me & Session
- **A)** Standard "Remember me" checkbox
- **B)** Always remember (no checkbox)
- **C)** Session-only by default

### Q4: Error Handling UI
For API validation errors:
- **A)** Inline errors under each field (current approach)
- **B)** Toast notifications for errors
- **C)** Both - inline for field errors, toast for general errors

## Fortify API Endpoints to Use
- `POST /login` - Login
- `POST /logout` - Logout
- `POST /register` - Registration
- `POST /forgot-password` - Request reset link
- `POST /reset-password` - Reset password
- `POST /email/verification-notification` - Resend verification
- `POST /two-factor-challenge` - 2FA verification
- `POST /user/confirm-password` - Confirm password
- `GET /api/user` - Get authenticated user

## Files to Create
- `resources/js/pages/auth/login.tsx`
- `resources/js/pages/auth/register.tsx`
- `resources/js/pages/auth/forgot-password.tsx`
- `resources/js/pages/auth/reset-password.tsx`
- `resources/js/pages/auth/verify-email.tsx`
- `resources/js/pages/auth/two-factor-challenge.tsx`
- `resources/js/pages/auth/confirm-password.tsx`
- `resources/js/layouts/auth-layout.tsx`
- `resources/js/hooks/use-auth.ts` - Auth hook with React Query
