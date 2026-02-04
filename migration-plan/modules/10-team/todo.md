# Team - TODO

## Backend Setup
- [ ] Create `teams` table migration
- [ ] Create `team_user` pivot table with role
- [ ] Create `team_invitations` table
- [ ] Create Team model with relationships
- [ ] Create TeamInvitation model
- [ ] Add team relationship to User model
- [ ] Create TeamController
- [ ] Implement invitation email notification

## API Endpoints
- [ ] Implement `GET /api/team/members`
- [ ] Implement `POST /api/team/invite`
- [ ] Implement `DELETE /api/team/members/{id}`
- [ ] Implement `PATCH /api/team/members/{id}/role`
- [ ] Implement `GET /api/team/invitations`
- [ ] Implement `DELETE /api/team/invitations/{id}`
- [ ] Implement `POST /api/team/invitations/{token}/accept`

## Page Implementation
- [ ] Create `pages/team.tsx`
- [ ] Add page header with member count
- [ ] Add "Invite Member" button

## Member List
- [ ] Create `MemberList` component
- [ ] Display member avatar
- [ ] Display member name and email
- [ ] Display role badge
- [ ] Display joined date
- [ ] Add role change dropdown
- [ ] Add remove button (with confirmation)
- [ ] Highlight current user

## Invite Modal
- [ ] Create `InviteModal` component
- [ ] Email input field
- [ ] Role selection
- [ ] Send invitation button
- [ ] Handle multiple invites
- [ ] Show success/error feedback

## Pending Invitations
- [ ] List pending invitations
- [ ] Show invitation email
- [ ] Show sent date
- [ ] Add resend button
- [ ] Add cancel button

## Role Management
- [ ] Create `RoleSelector` component
- [ ] Define available roles
- [ ] Prevent demoting last owner
- [ ] Confirmation for role changes

## Empty State
- [ ] "No team members yet" message
- [ ] CTA to invite first member

## Data Fetching
- [ ] Create `useTeamMembers` hook
- [ ] Create `useInviteMember` mutation
- [ ] Create `useRemoveMember` mutation
- [ ] Create `useUpdateRole` mutation

## Testing
- [ ] Test member listing
- [ ] Test invitation flow
- [ ] Test role changes
- [ ] Test member removal
- [ ] Test permission checks
