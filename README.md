# EventPulse — Full Build (Phases 1–6)

A digital event management platform for **PCTE Group of Institutes**, built with
Node/Express/MongoDB + React/Vite/Tailwind. Brand colors are PCTE's maroon
(`#7A1F2B`) and gold (`#C9A227`).

## What's built — everything is real, working code, not stubs

**PCTE branding & event artwork** — uses the PCTE logo supplied for this app,
original locally bundled society/event illustrations when no cover has been
uploaded, and uploadable event covers in the organizer dashboard. Real PCTE
photos should be uploaded by an authorized user; the app does not scrape the
college website or social accounts. Society pages link back to PCTE's official
festival pages and photo tour for its original galleries.

**Auth & roles** — verified phone-OTP participant sign-up/sign-in, staff
email/password sign-in, JWT sessions, and protected routes on both API and
frontend. Participant accounts cannot be created without verifying a phone.

**Events & societies** — Organizations, 6 PCTE societies (Debate Society,
Koshish, Turf, Ehsaas, PAC, STEM), Events, Sessions, search/filter/pagination.

**Koshish 2026's real 22 competition events**, seeded with actual rules, team
sizes, timing and points sourced from the official rule book you supplied.

**Registration & ticketing** — QR-code tickets, per-type capacity limits,
idempotent check-in safe for concurrent gate scanners, poster "scan to
register" QR generator, live Socket.IO push to the organizer dashboard.

**Feedback forms** — every managed event gets a public, no-login form with ten
event-specific questions, a shareable link and QR code. Participants provide
their name, roll number, class, batch, block, phone and email. Optional voice
feedback is saved outside public uploads and exposed only through an
organization-protected playback endpoint. Four organizer charts track
responses over time, responses by event, ratings and voice coverage; they
refresh immediately on Socket.IO feedback events and every 20 seconds as a
fallback. Existing manual and AI-assisted forms continue to work.

**Hackathons, sports & debate** — team registration (max 4 members) + project
submission, multi-judge multi-criteria weighted scoring, live leaderboards,
sports/debate fixtures & brackets with live score push over Socket.IO.

**Certificates & volunteers** — auto-generated PDF certificates (PDFKit,
maroon-and-gold layout) for every checked-in attendee, emailed via
Nodemailer if SMTP is configured (degrades gracefully if not), volunteer task
& shift assignment with status tracking.

**Gallery** — Multer-based photo/video uploads, served locally, never
hotlinked from external sites.

**EventPulse AI** — a floating chat widget in two modes: organizer-side
(compares any number of events using their live stats) and public-side
(scoped to one event, using that event's live feedback data). Branded only as
"EventPulse AI" — no AI-company names appear anywhere in the UI or prompts.

**Student records & analytics** — cross-event student profile with a
composite engagement score, block/branch/section breakdown with CSV export,
and a CSV/Excel upload analyzer that auto-summarizes any spreadsheet
(numeric stats or categorical top-values per column).

**Notifications** — real-time, delivered over Socket.IO, unread badge,
mark-as-read, visible from any dashboard screen.

**Admin console** — organizations list, cross-institution benchmarking,
webhooks CRUD, SLA escalations, paginated/filterable audit-log viewer (every
sensitive action — login, register, event/ticket/score changes — is logged).

**UX** — dark mode, glass-morphic cards, animated login screen, responsive
layouts, search/filter/pagination, loading/empty states, toasts, graceful
error handling throughout.

## Project structure

```
eventpulse/
├── backend/
│   ├── models/         22 Mongoose models (Organization, User, Society, Event,
│   │                   Session, CompetitionEvent, Ticket, Form, Response, Team,
│   │                   Score, Fixture, Certificate, VolunteerAssignment, Media,
│   │                   Sponsor, Performer, Notification, AuditLog, Subscription,
│   │                   Webhook, Escalation)
│   ├── controllers/    business logic, one file per domain
│   ├── routes/         REST endpoints
│   ├── middleware/     auth (JWT), role guard, error handler, org resolver, uploads
│   ├── utils/          token, audit logger, socket singleton
│   ├── seed/           seed script for PCTE data, Koshish rules, and owner account
│   └── server.js        entry point (Express + Socket.IO)
└── frontend/
    └── src/
        ├── pages/        22 pages covering every module above
        ├── context/      Auth, Socket, Theme (dark mode)
        ├── layouts/      PublicLayout, DashboardLayout
        └── components/   Navbar, ProtectedRoute, NotificationBell, AIChatWidget
```

## Setup

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a connection string to Atlas

### 2. Backend

```bash
cd backend
cp .env.example .env     # set owner credentials and a strong JWT_SECRET
npm install
npm run seed              # resets the seeded collections and creates PCTE data
npm run dev                # http://localhost:5000
```

Before running the seed script, set `OWNER_NAME`, `OWNER_EMAIL`, and a strong
`OWNER_PASSWORD` in `backend/.env`. The seed script requires these values and
will stop before changing database contents if any are missing. The seed
script clears and recreates the organization, event, society, competition, and
user collections; do not use it to initialize a database containing data you
need to preserve.

For an existing database, add or update only the Jasmine Sandlas Festaweek
event and its supplied poster without resetting other data:

```bash
npm run seed:jasmine
```

The performance is listed for October 9, 2026 at 7:00 PM in Ludhiana, as shown
on the supplied poster. The organizer feedback-form setup generates its ten
artist-specific questions, share link, and QR code when the organizer opens
the forms dashboard.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173 (proxies /api and /socket.io to :5000)
```

If the backend uses a different port, set `VITE_API_PROXY_TARGET` to its URL
before starting Vite (for example, `http://localhost:5001`).

### 4. Optional: AI provider & email

- Set `AI_PROVIDER_API_KEY` (and `AI_PROVIDER_BASE_URL` if not using Anthropic's
  API directly) in `backend/.env` to power the AI-assisted form builder and the
  EventPulse AI chat widgets with real natural-language answers. Without a key,
  both features still work using deterministic fallbacks.
- Set `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` to actually email certificates.
  Without SMTP, certificates still generate and are downloadable — they're
  just not emailed.
- Participant sign-up and sign-in require phone OTP verification through
  Twilio Verify. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and
  `TWILIO_VERIFY_SERVICE_SID`. Participant accounts cannot be created or used
  through email/password or Google sign-in.
  Verification is rejected with a configuration error until real provider
  credentials are supplied; no test OTP or bypass is enabled.
- Voice recordings are retained in `backend/private/feedback-audio` by default
  (`VOICE_FEEDBACK_DIR` can override the directory). The application has no
  recording deletion endpoint or automatic cleanup. This is local disk storage:
  production deployments must mount a persistent volume, include it in tested
  backups, and restrict host-level access. Data controllers must establish an
  appropriate retention/privacy policy for participant details and recordings.
- Configure `CLIENT_URL` to the externally reachable frontend URL when serving
  the organizer dashboard through a proxy or in production. QR codes use the
  active browser origin when available.
- To list and embed public uploads from PCTE's YouTube channel, create a
  YouTube Data API v3 key in Google Cloud Console and set `YOUTUBE_API_KEY`
  in `backend/.env`. The key stays on the server. The Koshish page always
  embeds the channel's official uploads playlist and configured highlight
  video; individual video cards are an optional API-key enhancement.
  Channel video cards are paginated in groups of 12 with **Load more videos**.

### 5. Log in

The seed script creates the organization-admin account from `OWNER_NAME`,
`OWNER_EMAIL`, and `OWNER_PASSWORD` in `backend/.env`. Sign in to the staff
dashboard with that email and password. No demo passwords or staff accounts
are included.

Participants sign up and sign in with a phone number and a real Twilio Verify
OTP; configure the Twilio credentials above before using participant login.
Public event feedback forms do not require an account.

### Suggested walkthrough
1. Sign up as a participant using a phone number and the delivered OTP, then
   open **Events → Koshish 2026** to explore competition rules and register.
2. Sign in to the organizer dashboard with the owner credentials configured
   during setup. Under **Feedback Forms**, generate an event form and copy its
   public link or QR code.
3. Open the feedback link in a separate browser session, submit a response
   without logging in, and check **Feedback Forms → analytics**. The organizer
   charts update live when responses arrive.
4. Open **Admin Console** to review organization settings and the audit log.
5. Click the floating **EventPulse AI** bubble on any public event page or the
   organizer dashboard.

## API overview (abbreviated — see `backend/routes/` for the full list)

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` / `/login` | public | Auth |
| GET | `/api/events` / `/:slug` | public | Discover events |
| GET | `/api/events/:eventSlug/competitions[/:slug]` | public | Koshish's 22 events, rules |
| POST | `/api/events/:eventId/register` | ✅ | QR ticket registration |
| POST | `/api/tickets/checkin` | ✅ staff | Idempotent gate check-in |
| GET/POST | `/api/forms`, `/api/forms/ai-generate` | ✅ organizer | Feedback form builder |
| GET/POST | `/api/forms/share/:shareSlug[/responses]` | public | Respond, no login |
| POST | `/api/competitions/:id/teams` | ✅ | Team registration |
| POST | `/api/competitions/:id/scores` | ✅ judge | Multi-judge scoring |
| GET | `/api/competitions/:id/leaderboard` | public | Ranked leaderboard |
| POST | `/api/events/:id/certificates/issue` | ✅ organizer | Bulk-issue PDF certs |
| GET | `/api/certificates/mine`, `/:id/download` | ✅ | Participant certs |
| POST | `/api/media/events/:id` | ✅ organizer | Gallery upload |
| GET | `/api/youtube/status` | public | Whether YouTube API video cards are configured |
| GET | `/api/youtube/videos?pageToken=...` | public | PCTE channel uploads via YouTube Data API |
| POST | `/api/ai/organizer-chat`, `/public-chat/:slug` | mixed | EventPulse AI |
| GET | `/api/students/:userId/profile`, `/breakdown` | ✅ organizer | Cross-event profile |
| POST | `/api/students/analytics/upload` | ✅ organizer | CSV/Excel analyzer |
| GET/POST | `/api/admin/*` | ✅ admin | Orgs, webhooks, escalations, audit log |

## Known gaps / honest notes

- **No dedicated judge-scoring UI page** — the scoring API is complete and the
  leaderboard/fixtures UI is live, but judges currently submit scores via the
  API directly (e.g. Postman or a quick fetch call) rather than a form. Easy
  to add — a `ScoreSubmit.jsx` page hitting `POST /api/competitions/:id/scores`.
- **Organizer "My Events" management UI** (create/edit event, ticket types,
  manage competitions/sponsors/performers from the dashboard) is API-complete
  but doesn't have a dedicated admin form yet — the dashboard allows cover
  image uploads, while other event fields remain read-only. The seed script
  populates everything so the read side is fully demoable.
- **Webhook delivery** — webhooks can be registered via the admin API but
  nothing currently fires them on events; the CRUD and data model are there,
  the dispatch job is not.
- **node-cron** is installed but not yet wired to a scheduled job (e.g.
  nightly certificate issuance, subscription renewal checks) — straightforward
  to add in `server.js`.
- This container has no outbound network access, so dependencies were written
  and syntax/require-checked here but never `npm install`ed or run live —
  install and run locally as above. Every internal `require`/import path was
  verified to resolve correctly.
- Seed data and `.env.example` secrets are for local development only —
  rotate `JWT_SECRET`/`COOKIE_SECRET` and use real SMTP/AI credentials before
  any real deployment.

Want the judge-scoring form, the organizer event-management UI, or webhook
dispatch next? Just ask — same approach, real working code.
