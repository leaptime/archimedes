# Module 10: Team Management

## Description
Import the team management page for inviting and managing team members.

## Scope
- Team members list
- Invite new members
- Role management
- Remove members
- Pending invitations

## Dependencies
- Module 02 (Layout)
- Module 01 (UI Components)

## Clarifying Questions

### Q1: Team/Organization Model
How should teams be structured?
- **A)** Single organization per user (simple)
- **B)** Users can belong to multiple organizations
- **C)** Hierarchical teams within organization
- **D)** Skip team feature for now (single-user only)

### Q2: Roles & Permissions
- **A)** Simple roles: Owner, Admin, Member
- **B)** Custom roles with granular permissions
- **C)** No roles - all members equal
- **D)** Use existing Laravel permission package (Spatie, etc.)

### Q3: Invitation Flow
- **A)** Email invitation with magic link
- **B)** Generate invite code/link
- **C)** Direct add by email (if user exists)
- **D)** All of the above

### Q4: Member Limits
- **A)** Unlimited team members
- **B)** Limit based on subscription plan
- **C)** Hard limit (e.g., max 10 members)

## Source Files (Lovable)
- `pages/Team.tsx` (4.6KB)
- `components/team/*` (team-specific components)

## API Endpoints to Create
- `GET /api/team/members` - List team members
- `POST /api/team/invite` - Send invitation
- `DELETE /api/team/members/{id}` - Remove member
- `PATCH /api/team/members/{id}/role` - Update role
- `GET /api/team/invitations` - Pending invitations
- `DELETE /api/team/invitations/{id}` - Cancel invitation

## Target Files
- `resources/js/pages/team.tsx`
- `resources/js/components/team/member-list.tsx`
- `resources/js/components/team/invite-modal.tsx`
- `resources/js/components/team/role-selector.tsx`
