<div align="center">

<img src="docs/assets/eventpulse-hero.svg" alt="EventPulse — the live pulse of every PCTE event" width="100%">

<h1>EventPulse</h1>

### One connected platform for every event, attendee, and insight.

Plan PCTE festivals, welcome participants, collect thoughtful feedback, and see
what is happening — as it happens.

<p>
  <a href="https://github.com/ZahikAbasdar/Event-Pulse"><img src="https://img.shields.io/badge/Project-EventPulse-7A1F2B?style=for-the-badge" alt="EventPulse"></a>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=111827" alt="React 18">
  <img src="https://img.shields.io/badge/Node.js-Express-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js and Express">
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB and Mongoose">
</p>

[Explore the platform](#-the-experience) ·
[Get started](#-run-eventpulse-locally) ·
[See the analytics prototype](#-live-analytics-at-a-glance) ·
[Configure SMS sign-in](#-real-phone-verification)

</div>

---

## ✨ The experience

EventPulse brings the public event experience and the organizer's control room
into one responsive application. Its PCTE-inspired visual system pairs maroon
and gold with glass-style surfaces, original local event illustrations, and a
live dashboard.

| 🎟️ For participants | 📊 For organizers | 🛡️ For administrators |
|---|---|---|
| Discover festivals and competitions, sign up with verified phone OTP, register for events, and access QR tickets and certificates. | Publish public feedback forms, share QR codes, review audio responses, and monitor event activity in real time. | Manage organization data and roles, review audit activity, and use protected administrative tools. |

> **Visual prototype:** the illustrations below are original, locally stored
> SVGs designed for this README. They depict the app's UI and chart types; they
> are explanatory prototypes, not screenshots or sample analytics from a live
> production database.

## 📈 Live analytics at a glance

The organizer overview visualizes feedback trends, event comparisons, ratings,
and voice responses. Socket.IO pushes a refresh as new feedback arrives, with a
20-second polling fallback.

<div align="center">

<img src="docs/assets/eventpulse-dashboard.svg" alt="Animated EventPulse organizer dashboard prototype showing four live feedback charts" width="100%">

*An animated, original dashboard prototype — the real organizer dashboard is
powered by live application data.*

</div>

| 📈 Response trend | 📊 Feedback by event | ⭐ Rating breakdown | 🎙️ Voice coverage |
|---|---|---|---|
| See submissions over time. | Compare the events people responded to. | Understand the response distribution. | Track responses that include voice feedback. |

## 🎭 Made for the PCTE events experience

Event cards use artwork bundled with the app and the user-provided Jasmine
Sandlas poster. Organizers can upload authorized event photos from the
dashboard. PCTE gallery media is not scraped or copied from third-party sites.

<div align="center">

<img src="docs/assets/eventpulse-events.svg" alt="EventPulse event artwork preview for Koshish, Turf, and Ehsaas" width="100%">

*Festival cover-art concept previews — bundled artwork is illustrative unless
an organizer has uploaded an authorized event photograph.*

</div>

**Explore:** [Events](https://github.com/ZahikAbasdar/Event-Pulse) ·
[Koshish](https://pcte.edu.in/life/koshish) ·
[Turf](https://pcte.edu.in/life/turf) ·
[Ehsaas](https://pcte.edu.in/life/ehsaas) ·
[PCTE Photo Tour](https://pcte.edu.in/photo-tour)

## 💎 What ships in the app

<details open>
<summary><strong>Events, communities & tickets</strong></summary>

- Six PCTE communities: Debate Society, Koshish, Turf, Ehsaas, PAC, and STEM.
- Searchable and filterable public events and event details.
- Koshish competition listings with rules, team sizes, timing, and scoring.
- Event registration, QR tickets, capacity limits, and idempotent staff
  check-in.
- Uploadable cover images and locally bundled artwork as a fallback.

</details>

<details>
<summary><strong>Verified sign-in & roles</strong></summary>

- Participants create and access accounts through Twilio Verify SMS OTP.
- Staff access the dashboard with their email and password.
- Role- and organization-protected API routes and dashboard pages.
- No SMS verification bypass or demo participant login is enabled.

</details>

<details>
<summary><strong>Public feedback, QR forms & voice</strong></summary>

- Ten event-specific questions for generated event feedback forms.
- Public share links and QR codes; feedback submission does not require login.
- Participant fields for name, roll number, class, batch, block, phone, and
  email.
- Optional voice feedback stored outside the public uploads folder and
  available to authorized organizers.
- Feedback analytics refreshed by live events and fallback polling.
- Persistent production storage and backups must be configured by the
  deployment owner; see [recording storage](#-voice-feedback-storage).

</details>

<details>
<summary><strong>More tools for the event team</strong></summary>

- Competition teams, judging and scoring APIs, fixtures, brackets, and
  leaderboards.
- PDF certificate generation and volunteer assignment tracking.
- Organizer and participant notifications with Socket.IO.
- Image and video gallery uploads.
- Student records and CSV/Excel analysis.
- Admin console, audit logging, and EventPulse AI chat surfaces.
- Optional official YouTube channel video listings through the YouTube Data
  API.

</details>

## 🧱 Built with

| Layer | Technology |
|---|---|
| Web application | React 18, Vite, Tailwind CSS, Recharts |
| API | Node.js, Express, JWT, express-validator |
| Persistence | MongoDB, Mongoose |
| Real-time updates | Socket.IO |
| Event artwork | Original local SVG covers and authorized image uploads |
| Optional integrations | Twilio Verify, YouTube Data API, SMTP, AI provider |

## 🚀 Run EventPulse locally

### Prerequisites

- Node.js 18 or later
- MongoDB running locally or an Atlas connection string
- Twilio Verify credentials to send real participant sign-in/sign-up SMS

### 1. Configure the backend

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env`. Set a strong `JWT_SECRET`, `COOKIE_SECRET`, and initial
owner credentials (`OWNER_NAME`, `OWNER_EMAIL`, `OWNER_PASSWORD`). Set
`MONGO_URI` to your MongoDB database.

Install dependencies and initialize the PCTE data:

```powershell
npm install
npm run seed
npm run dev
```

> **Seed warning:** `npm run seed` clears and recreates seeded organization,
> event, society, competition, and user collections. Do not run it against a
> database containing data you need to preserve.

For an existing database, add/update only the Jasmine Sandlas Festaweek event
and feedback form without resetting other collections:

```powershell
npm run seed:jasmine
```

### 2. Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally
[`http://localhost:5173`](http://localhost:5173)). Vite proxies API and
Socket.IO requests to `http://localhost:5000`. If your API uses another URL,
set `VITE_API_PROXY_TARGET` before starting Vite.

### 3. Sign in

- **Organizer/staff:** use the owner email and password configured in
  `backend/.env`.
- **Participant:** sign up with a phone number in international format, request
  the SMS, and enter the delivered OTP.
- **Public feedback:** open an organizer-generated link or scan its QR code;
  participants do not need to sign in.

## ☁️ Deploy to Render + MongoDB Atlas

The repository includes [`render.yaml`](render.yaml), which configures a
single-origin Render web service: Express serves the built React app, the API,
and Socket.IO from the same URL. A persistent disk is mounted for uploaded
event media and voice recordings. **A Render Starter web service is required
for the persistent disk.** Configure a MongoDB Atlas database before creating
the Render Blueprint.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ZahikAbasdar/Event-Pulse)

1. Create an Atlas cluster and database user. In Atlas Network Access, allow
   the outbound IP ranges shown for your Render service; avoid opening database
   access to the entire internet where possible. Copy the Atlas connection URI
   and substitute the database user's password safely.
2. In Render, choose **New → Blueprint**, connect this GitHub repository, and
   deploy the `render.yaml` blueprint from the `main` branch.
3. Add the requested private environment values in Render's dashboard:
   `MONGO_URI`, `OWNER_NAME`, `OWNER_EMAIL`, `OWNER_PASSWORD`,
   `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and
   `TWILIO_VERIFY_SERVICE_SID`. Render generates `JWT_SECRET` and
   `COOKIE_SECRET`. Never put secrets in Git or in client-side variables.
4. Wait for the build and `/api/health` health check to pass. The default
   service URL is [`https://eventpulse.onrender.com`](https://eventpulse.onrender.com).
   If you change the Render service name, update `CLIENT_URL` to the exact
   deployed HTTPS origin, then redeploy.
5. Initialize the empty production database exactly once from the Render
   service Shell:

   ```bash
   npm run seed --prefix backend
   ```

   The seed uses the Render `OWNER_*` values. It **deletes and recreates**
   seeded PCTE collections; never run it to update a database with data that
   must be preserved. For a populated database, use the non-destructive
   `npm run seed:jasmine --prefix backend` only if that event update is needed.
6. Verify the live URL, organizer login, feedback QR link, media upload, and
   Socket.IO updates. Send a real OTP only after valid Twilio Verify credentials
   and any Twilio trial recipient verification are configured.

The included disk starts at 1 GB. Monitor its usage and configure external
backups; a persistent disk is not itself a backup. Do not use an ephemeral
free-tier filesystem for feedback audio or uploaded media. Render, MongoDB
Atlas, and Twilio account setup and billing are controlled by their providers;
this repository cannot create those accounts or enter account secrets for you.

## 📲 Real phone verification

Participant login depends on **real Twilio Verify credentials**. Create a
Verify Service in Twilio Console with SMS enabled, then add its credentials to
the local `backend/.env`:

```dotenv
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VA...
```

Restart the backend after updating the environment. The credentials are
server-side only: never put them in frontend configuration, screenshots, or
Git. Twilio trial accounts may require destination numbers to be verified in
Twilio first. Without these credentials, OTP requests correctly fail with a
configuration message; the app will not create an account without provider
verification.

## 🎙️ Voice feedback storage

Voice recordings default to `backend/private/feedback-audio` and are not served
as public uploads. The application has no recording-deletion endpoint or
automatic cleanup. **Local disk is not a backup or a production durability
guarantee:** production operators must configure a persistent volume, verify
backups and restore procedures, protect access to recordings, and establish an
appropriate privacy and retention policy for participant information.

## 🔐 Other optional integrations

| Capability | Environment variables | If not configured |
|---|---|---|
| YouTube channel video listings | `YOUTUBE_API_KEY` | The official channel/playlist embeds remain available; API-populated video cards are disabled. |
| AI-assisted tools | `AI_PROVIDER_API_KEY`, optional `AI_PROVIDER_BASE_URL` | Provider-backed AI answers are unavailable. |
| Certificate email delivery | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_PORT`/`SMTP_FROM` | Generated certificates remain downloadable but are not emailed. |
| Public/proxied deployment | `CLIENT_URL`, optional `VOICE_FEEDBACK_DIR` | Configure these to match the deployed frontend and persistent storage location. |

All backend configuration belongs in the ignored local `backend/.env` file.
See [`backend/.env.example`](backend/.env.example) for the full template.

## 🗺️ App map

| Route | Experience |
|---|---|
| `/` | EventPulse landing page |
| `/events` | Browse events |
| `/events/:slug` | Event details and registration |
| `/events/:slug/competitions/:compSlug` | Competition details and rules |
| `/events/:slug/competitions/:compSlug/leaderboard` | Public leaderboard |
| `/societies` · `/societies/:slug` | PCTE communities |
| `/feedback/:shareSlug` | Public, no-login feedback form |
| `/dashboard` | Organizer overview and live charts |
| `/dashboard/forms` | Generate and share feedback forms |
| `/dashboard/analytics/feedback` | Feedback analysis |
| `/dashboard/admin` | Organization administration |
| `/my/tickets` · `/my/certificates` | Participant passes and certificates |

## 🧪 API quick reference

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | API health |
| `POST` | `/api/auth/phone-otp/start` | Send participant OTP |
| `POST` | `/api/auth/phone-otp/verify` | Verify OTP and authenticate |
| `GET` | `/api/events` | Discover published events |
| `POST` | `/api/events/:eventId/register` | Register for an event |
| `GET` | `/api/dashboard/organizer/charts` | Organizer analytics data |
| `POST` | `/api/forms/event-feedback/ensure` | Ensure event feedback forms |
| `GET` | `/api/forms/share/:shareSlug` | Load a public feedback form |
| `POST` | `/api/forms/share/:shareSlug/responses` | Submit public feedback |
| `GET` | `/api/youtube/videos` | Optional official channel uploads |

See [`backend/routes/`](backend/routes/) for the complete route definitions.

## 🛠️ Current product notes

- Judges can submit scores via the API, but there is not yet a dedicated
  judge-scoring form page.
- Organizer event-management screens are limited; some event fields are
  managed through the API/seed process.
- Webhook registration exists; event-triggered webhook dispatch is not yet
  wired.
- Event cards show bundled illustrations until an authorized event cover image
  is uploaded.
- A YouTube Data API key is optional; official YouTube embeds do not require
  the key.

## 🤝 Contributing

1. Fork the repository and create a focused feature branch.
2. Configure local environment variables; never commit `.env` files,
   credentials, recordings, or participant data.
3. Install the backend and frontend dependencies and build the frontend:

   ```powershell
   cd frontend
   npm install
   npm run build
   ```

4. Describe the change and verification performed in your pull request.

## 📜 License & media

No project license is currently included; ask the repository owner before
redistributing the source. Event artwork and the supplied performance poster
are for this project's preview. Obtain permission before publishing
institutional photographs or other third-party media. The app does not scrape
PCTE or social-media websites.

---

<div align="center">

**Made for the moments that bring a campus together.**

[Back to top](#eventpulse) ·
[PCTE Group of Institutes](https://pcte.edu.in/) ·
[Repository](https://github.com/ZahikAbasdar/Event-Pulse)

</div>
