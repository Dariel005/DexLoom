# Social Report (2026-02-19)

## Scope
- Repo audit for current Social feature set.
- Review of UI, API, service layer, validation, and local data in `.data`.
- Goal: identify what already exists and what to add next.

## Current Social Inventory

### 1) User-facing surfaces
- Dedicated Social page: `app/social/page.tsx`.
- Main Social hub client with:
  - Trainer discovery by exact name.
  - Invite link copy + invite link resolution.
  - Incoming requests (accept/reject), outgoing requests (cancel), friend remove.
  - Block/unblock trainer.
  - Report trainer (reason + optional notes).
  - Privacy settings (friend requests policy + presence visibility).
  - Social feed (friend actions + favorite_added events).
  - File: `components/social/SocialHubClient.tsx`.
- Social entry point in main explorer nav with pending incoming badge:
  - File: `components/PokemonExplorer.tsx`.
- Social interaction in public profile page (friendship actions + block-aware behavior):
  - File: `components/profile/ProfilePublicClient.tsx`.

### 2) API endpoints
- Friends:
  - `GET/POST /api/friends`
  - `GET /api/friends/search`
  - `GET /api/friends/lookup`
  - `GET /api/friends/status`
- Social:
  - `GET /api/social/hub`
  - `POST /api/social/presence`
  - `PUT /api/social/settings`
  - `POST /api/social/block`
  - `POST /api/social/report`
- All routes require auth and are gated by profile feature flag:
  - `isProfileFeatureEnabled()` in `lib/firebase-admin.ts`.

### 3) Domain model and rules
- Core social types:
  - Friendship states, relation states, presence, privacy settings, blocks, reports, activity feed.
  - File: `lib/social-types.ts`.
- Validation and payload constraints:
  - Action parsing for friends, settings, block, report.
  - Report notes max length: 300.
  - File: `lib/social-validation.ts`.
- Service logic:
  - Presence online threshold: 2 minutes.
  - Search is exact-match on normalized display name / name / email prefix.
  - Feed includes accepted-friend network + self.
  - Favorite activity events included with privacy checks.
  - File: `lib/social-service.ts`.
- Repository/storage logic:
  - Local JSON persistence in `.data`.
  - Activity retention: 30 days.
  - Max activity rows: 2000.
  - File: `lib/social-repository.ts`.

### 4) Data snapshot (.data) at audit time
- users: 2 (`.data/users.json`)
- profiles: 2 (`.data/profiles.json`)
- friendships: 1 total
  - pending: 1
  - accepted: 0
- social-presence: 2
- social-settings: 0 persisted rows (defaults are used when missing)
- social-blocks: 0
- social-reports: missing file (created on first report write path)
- social-activities: 4
  - favorite_added: 4
  - unique actors: 1
  - unique targets: 0

## What Is Strong Today
- End-to-end Social loop is complete for MVP:
  - discover -> request -> accept/reject/cancel/remove -> block -> report -> feed.
- Privacy-aware presence and feed behavior are implemented.
- Social is integrated in main navigation and profile page (not isolated to one screen).
- Reasonable input validation and auth checks across all social endpoints.

## Gaps and What To Add

### Priority 1 (high impact, low-medium effort)
1. Improve discover/search UX
- Current search requires exact normalized match.
- Add prefix/contains/fuzzy search to reduce zero-result frustration.
- Where: `lib/social-service.ts` in `searchFriendCandidates`.

2. Add report moderation tooling
- Reports are collected but there is no admin review workflow/UI.
- Add admin endpoint and dashboard:
  - list reports
  - filter by reason/date/user
  - resolve/close report state
  - optional action log.

3. Add notifications beyond incoming badge
- Today badge exists in main nav, but there is no notification history/center.
- Add lightweight notifications store for:
  - request received
  - request accepted
  - block/unblock (optional)
  - report acknowledgement (optional).

4. Add pagination for feed/friends lists
- Current hub loads fixed-size feed and full list sections in one payload.
- Add cursors/infinite scroll for scale readiness.

### Priority 2 (product depth)
1. Richer activity taxonomy
- Current kinds: friend_request_sent, friend_request_accepted, friend_removed, favorite_added.
- Add:
  - favorite_removed
  - profile_updated
  - avatar_updated
  - milestone events (friend count thresholds).

2. Better invite/share system
- Current invite uses query param with user id (`/social?invite=...`).
- Add signed short invite tokens with expiration + campaign tag.

3. Privacy granularity
- Current presence visibility: everyone/friends/no_one.
- Add:
  - custom allow-list
  - quiet mode schedule
  - hide specific feed event types.

4. Friend recommendations
- Suggest trainers based on shared favorites/tags/modules.

### Priority 3 (architecture and operability)
1. Move social persistence from local JSON to DB
- Current JSON write queue is process-local and not multi-instance safe.
- For production scale, migrate to database-backed repository.

2. Add observability
- Metrics:
  - request_sent rate
  - accept rate
  - block rate
  - report rate
  - search success rate.
- Add structured logs per social action.

3. Add automated tests for social critical flows
- Unit tests for service/repository rules.
- Integration tests for API routes:
  - request/accept/reject/cancel/remove
  - block/unblock effects
  - presence visibility matrix.

## Suggested 2-week Execution Plan
1. Week 1
- Search UX upgrade (prefix/contains).
- Report moderation API + simple admin view.
- Feed pagination API support.

2. Week 2
- Notification center MVP.
- Add 2-3 new activity kinds.
- Initial test suite for critical social flows.

## Acceptance Targets
- Discovery success: +30% users finding a trainer in <= 2 tries.
- Pending request conversion to accepted: +20%.
- Social API error rate: <1%.
- Test coverage for social service + routes: >=70% on touched modules.
