# Migration Questions Summary

This document consolidates all clarifying questions from each module. Please review and provide your preferences before starting implementation.

---

## Module 00: Infrastructure

### Q1: CORS Configuration
- **A)** Serve React build from Laravel's public folder (same origin, no CORS) ✅ *Recommended for production*
- **B)** Run React dev server separately during development (needs CORS config)

### Q2: API Versioning
- **A)** Yes - `/api/v1/*` structure
- **B)** No - Simple `/api/*` structure ✅ *Recommended: easier to start*

### Q3: API Response Format
- **A)** Laravel API Resources (transformers) ✅ *Recommended*
- **B)** Direct Eloquent toArray() with envelope

---

## Module 01: UI Components

### Q1: Component Conflicts Strategy
- **A)** Prefer Lovable versions (full design consistency) ✅ *Recommended*
- **B)** Keep current versions, only add missing ones
- **C)** Merge manually

### Q2: Animation Library
- **A)** Add framer-motion (matches Lovable exactly) ✅ *Recommended*
- **B)** Use CSS animations only
- **C)** Use tw-animate-css

### Q3: Additional Dependencies
- **A)** Install all (recharts, react-day-picker, cmdk, vaul, sonner, embla-carousel, react-hook-form, zod) ✅ *Recommended*
- **B)** Selective installation

---

## Module 02: Layout

### Q1: Sidebar Navigation Items
Keep all sections? (Dashboard, Marketplace, My Modules, Wizard, Upgrades, Analytics, Team, Settings, Help)
- **A)** Keep all ✅ *Default*
- **B)** Customize (specify which to keep/remove)

### Q2: User Menu Integration
- **A)** Lovable's design + Fortify logout/profile logic ✅ *Recommended*
- **B)** Completely replace
- **C)** Merge both

### Q3: Mobile Navigation
- **A)** Use Lovable's mobile navigation ✅ *Recommended*
- **B)** Keep current
- **C)** Redesign

---

## Module 03: Authentication

### Q1: Auth Layout Design
- **A)** Design matching Lovable's style
- **B)** Split-screen design (form + illustration) ✅ *Recommended*
- **C)** Keep current, update components

### Q2: Social Login
- **A)** No social login ✅ *Start simple*
- **B)** Google OAuth
- **C)** Google + GitHub
- **D)** Add later (placeholders)

### Q3: Remember Me
- **A)** Standard checkbox ✅ *Default*
- **B)** Always remember
- **C)** Session-only default

### Q4: Error Handling UI
- **A)** Inline errors
- **B)** Toast notifications
- **C)** Both ✅ *Recommended*

---

## Module 04: Dashboard Home

### Q1: Dashboard Data Source
- **A)** Create Laravel API for real data
- **B)** Mock data initially ✅ *Recommended for MVP*
- **C)** Aggregation API

### Q2: Stats Cards Metrics
- **A)** Keep Lovable metrics ✅ *Default*
- **B)** Customize
- **C)** Configurable

### Q3: Featured Modules Section
- **A)** Static from admin config ✅ *Start simple*
- **B)** Dynamic
- **C)** Skip

---

## Module 05: Marketplace

### Q1: Module Data Structure
- **A)** Use exact Lovable structure ✅ *Recommended*
- **B)** Simplify
- **C)** Extend

### Q2: Module Installation Flow
- **A)** Instant install
- **B)** Show confirmation modal ✅ *Recommended*
- **C)** Redirect to detail
- **D)** Checkout for paid

### Q3: Search Implementation
- **A)** Client-side filtering ✅ *Start simple*
- **B)** Server-side
- **C)** Hybrid

### Q4: Categories
- **A)** Keep all Lovable categories ✅ *Default*
- **B)** Reduce
- **C)** Configurable

---

## Module 06: My Modules

### Q1: Module Configuration
- **A)** Inline settings panel
- **B)** Dedicated settings page
- **C)** Modal ✅ *Recommended*
- **D)** Depends on module

### Q2: Uninstall Behavior
- **A)** Immediate with confirmation ✅ *Default*
- **B)** Soft delete
- **C)** Hard delete

### Q3: Usage Display
- **A)** Full stats
- **B)** Minimal (last used) ✅ *Start simple*
- **C)** No stats

---

## Module 07: Wizard

### Q1: Wizard Trigger
- **A)** Auto for new users
- **B)** Manual access
- **C)** Both ✅ *Recommended*
- **D)** Skip wizard

### Q2: Wizard Steps
- **A)** Keep Lovable steps ✅ *Default*
- **B)** Customize
- **C)** Configurable

### Q3: Skip Option
- **A)** Skip entire wizard
- **B)** Skip individual steps ✅ *Recommended*
- **C)** All required
- **D)** Some required

### Q4: Data Persistence
- **A)** Save progress, resume ✅ *Recommended*
- **B)** Start over
- **C)** Save as draft

---

## Module 08: Upgrades

### Q1: Upgrade Types
- **A)** Module updates only
- **B)** Plan upgrades only
- **C)** Both ✅ *Recommended*
- **D)** Skip page

### Q2: Update Process
- **A)** Instant update
- **B)** Show changelog first ✅ *Recommended*
- **C)** Background queue
- **D)** Confirmation page

### Q3: Pricing Display
- **A)** Show on page
- **B)** Link to billing page ✅ *Recommended*
- **C)** Contact sales

---

## Module 09: Analytics

### Q1: Analytics Data Source
- **A)** Track in Laravel
- **B)** External service
- **C)** Mock data ✅ *Start simple*
- **D)** UI only

### Q2: Metrics to Display
- **A)** Keep Lovable metrics ✅ *Default*
- **B)** Customize
- **C)** Configurable

### Q3: Export Functionality
- **A)** CSV
- **B)** PDF
- **C)** Both ✅ *Recommended*
- **D)** No export

### Q4: Real-time Updates
- **A)** Static ✅ *Start simple*
- **B)** Auto-refresh
- **C)** WebSockets
- **D)** Manual refresh

---

## Module 10: Team

### Q1: Team Structure
- **A)** Single org per user ✅ *Start simple*
- **B)** Multiple orgs
- **C)** Hierarchical
- **D)** Skip team

### Q2: Roles & Permissions
- **A)** Simple: Owner, Admin, Member ✅ *Recommended*
- **B)** Custom roles
- **C)** No roles
- **D)** Use Spatie

### Q3: Invitation Flow
- **A)** Email magic link ✅ *Recommended*
- **B)** Invite code
- **C)** Direct add
- **D)** All options

### Q4: Member Limits
- **A)** Unlimited ✅ *Start simple*
- **B)** Plan-based
- **C)** Hard limit

---

## Module 11: Settings

### Q1: Settings Structure
- **A)** Single page with tabs ✅ *Lovable approach*
- **B)** Separate pages
- **C)** Combination

### Q2: Avatar Upload
- **A)** Local storage ✅ *Start simple*
- **B)** Cloud (S3)
- **C)** External service
- **D)** Skip

### Q3: Billing Integration
- **A)** Stripe
- **B)** Other provider
- **C)** Display only ✅ *Start simple*
- **D)** Skip

### Q4: Delete Account
- **A)** Allow with confirmation ✅ *Recommended*
- **B)** Soft delete
- **C)** Contact support
- **D)** No delete

---

## Module 12: Help

### Q1: AI Chatbot
- **A)** OpenAI/Claude API
- **B)** Third-party service
- **C)** Simple FAQ bot ✅ *Start simple*
- **D)** Skip chatbot

### Q2: Documentation Source
- **A)** Static markdown ✅ *Recommended*
- **B)** CMS
- **C)** External docs
- **D)** Inline only

### Q3: Support Tickets
- **A)** Email contact form ✅ *Start simple*
- **B)** Ticket system
- **C)** Third-party
- **D)** No tickets

### Q4: Help Content
- **A)** Import Lovable structure ✅ *Default*
- **B)** Custom content
- **C)** Placeholder

---

## How to Use This Document

1. Review each module's questions
2. Mark your preferences (or accept recommended defaults)
3. Add any additional requirements or notes
4. We'll proceed module by module based on your answers

**Note**: Items marked with ✅ are recommended defaults. You can change any of these based on your specific needs.
