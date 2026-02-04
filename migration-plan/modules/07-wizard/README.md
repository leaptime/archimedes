# Module 07: Setup Wizard

## Description
Import the multi-step setup wizard for onboarding new users.

## Scope
- Multi-step wizard flow
- Progress indicator
- Step navigation
- Form validation per step
- Completion handling

## Dependencies
- Module 02 (Layout)
- Module 01 (UI Components)

## Clarifying Questions

### Q1: Wizard Trigger
When should the wizard be shown?
- **A)** Automatically for new users (first login)
- **B)** Manually accessible from dashboard/settings
- **C)** Both - auto for new users, optional access later
- **D)** Skip wizard entirely (not needed for your use case)

### Q2: Wizard Steps
Lovable wizard has steps for: Company Info, Module Selection, Team Setup, etc.
- **A)** Keep the same steps
- **B)** Customize steps for your use case
- **C)** Make steps configurable

### Q3: Skip Option
- **A)** Allow users to skip wizard entirely
- **B)** Allow skipping individual steps
- **C)** All steps required
- **D)** Some steps required, some skippable

### Q4: Wizard Data Persistence
If user leaves mid-wizard:
- **A)** Save progress, resume later
- **B)** Start over
- **C)** Save as draft, prompt to continue

## Source Files (Lovable)
- `pages/Wizard.tsx` (18.2KB - complex multi-step)

## API Endpoints to Create
- `GET /api/onboarding/status` - Check if onboarding complete
- `POST /api/onboarding/step/{step}` - Save step data
- `POST /api/onboarding/complete` - Mark onboarding complete

## Target Files
- `resources/js/pages/wizard.tsx`
- `resources/js/components/wizard/wizard-step.tsx`
- `resources/js/components/wizard/progress-bar.tsx`
- `resources/js/hooks/use-wizard.ts`
