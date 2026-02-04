# Wizard - TODO

## Backend Setup
- [ ] Add `onboarding_completed_at` to users table
- [ ] Create `OnboardingController`
- [ ] Implement `GET /api/onboarding/status` endpoint
- [ ] Implement `POST /api/onboarding/step/{step}` endpoint
- [ ] Implement `POST /api/onboarding/complete` endpoint
- [ ] Add middleware to check onboarding status

## Wizard State Management
- [ ] Create `use-wizard.ts` hook
- [ ] Manage current step state
- [ ] Handle step navigation (next/prev)
- [ ] Handle form data per step
- [ ] Handle validation per step

## Wizard Components
- [ ] Create main `Wizard` page component
- [ ] Create `WizardStep` wrapper component
- [ ] Create `ProgressBar` component
- [ ] Create step navigation buttons

## Step 1: Welcome/Company Info
- [ ] Company name input
- [ ] Industry selection
- [ ] Company size selection
- [ ] Logo upload (optional)

## Step 2: Module Selection
- [ ] Display recommended modules
- [ ] Allow module selection
- [ ] Show selected modules summary

## Step 3: Team Setup (Optional)
- [ ] Invite team members form
- [ ] Email input with validation
- [ ] Role selection
- [ ] Skip option

## Step 4: Preferences
- [ ] Theme selection
- [ ] Notification preferences
- [ ] Language selection

## Step 5: Completion
- [ ] Success message
- [ ] Summary of selections
- [ ] CTA to go to dashboard

## Animations
- [ ] Step transition animations
- [ ] Progress bar animation
- [ ] Success confetti (optional)

## Testing
- [ ] Test step navigation
- [ ] Test form validation
- [ ] Test skip functionality
- [ ] Test completion flow
- [ ] Test resume from saved state
