# Auth Pages - TODO

## Auth Hook & Context
- [ ] Create `use-auth.ts` hook with React Query
- [ ] Implement login mutation
- [ ] Implement logout mutation
- [ ] Implement register mutation
- [ ] Implement forgot password mutation
- [ ] Implement reset password mutation
- [ ] Create auth context provider
- [ ] Implement `useUser()` hook for current user

## Auth Layout
- [ ] Design auth layout (full page or split screen)
- [ ] Add logo/branding
- [ ] Add background styling
- [ ] Ensure mobile responsiveness

## Login Page
- [ ] Create login form with react-hook-form
- [ ] Add email validation (zod)
- [ ] Add password field with show/hide toggle
- [ ] Add "Remember me" checkbox
- [ ] Add "Forgot password" link
- [ ] Add "Register" link
- [ ] Handle login errors
- [ ] Handle 2FA redirect
- [ ] Add loading state during submission

## Register Page
- [ ] Create registration form
- [ ] Add name, email, password fields
- [ ] Add password confirmation
- [ ] Add terms acceptance checkbox (optional)
- [ ] Handle registration errors
- [ ] Redirect after successful registration

## Forgot Password Page
- [ ] Create forgot password form
- [ ] Email input with validation
- [ ] Success message display
- [ ] Handle errors

## Reset Password Page
- [ ] Parse token from URL
- [ ] Password and confirm password fields
- [ ] Handle reset errors
- [ ] Redirect to login on success

## Email Verification Page
- [ ] Display verification status message
- [ ] Resend verification email button
- [ ] Handle resend cooldown
- [ ] Auto-redirect when verified

## Two-Factor Challenge
- [ ] OTP input component (6 digits)
- [ ] Recovery code fallback option
- [ ] Handle invalid code errors
- [ ] Remember device option (if supported)

## Confirm Password Page
- [ ] Password confirmation form
- [ ] Used before sensitive actions
- [ ] Timeout handling

## Testing
- [ ] Test complete login flow
- [ ] Test registration flow
- [ ] Test password reset flow
- [ ] Test 2FA flow
- [ ] Test error states
- [ ] Test mobile responsiveness
