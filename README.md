# aniway

A minimal anime tracker with a real AniList schedule, IANA timezone conversion, seasonal discovery, personal watchlists, episode progress, schedule change detection, calendar export and notification preferences.

## Run locally

Requires Node.js 22.13 or later. Install with `npm install`, then `npm run dev`. The preview runs at http://127.0.0.1:5173. The Sites portable preview provides a development-only ChatGPT sign-in account. Hosted authentication is managed by Sites.

## Storage and accounts

Cloudflare D1 stores watchlists, preferences and notifications. Every private operation derives the user ID from the platform identity and scopes queries to that user; clients cannot choose their owner. Database migrations are in `drizzle/`. Run `npm run db:generate` after schema changes. Build once and apply pending SQL migrations to local D1 as described in the Sites starter documentation.

## Schedules and notifications

AniList provides Japanese broadcast times, which may differ from subtitled streaming availability. UTC Unix timestamps are converted using Intl with IANA timezone rules, including daylight saving transitions and local date rollover. Schedule queries include adjacent UTC dates to avoid missing local-day events. Seasonal catalog and schedules paginate up to the provider limit and report partial results.

The authenticated `/api/check` endpoint compares saved episode timestamps with fresh AniList data, writes deduplicated personal notifications, and updates saved metadata. The UI checks every minute while open. Browser notifications require explicit permission. Schedule shifts are labeled as detected changes; the app does not invent official delay reasons. Notifications while the app is closed, email delivery, official delay reports and guaranteed on-time push delivery are not implemented. The calendar export includes a 15-minute reminder and is a snapshot, not a live subscription.

## Design

Warm near-white, charcoal, sage and muted coral. Manrope headings and DM Sans interface type. No visual borders or shadows. The concept is `design-concept.png`; the landscape in `public/anime-landscape.png` was created with the built-in image generator. All controls and text are native HTML, with live anime artwork supplied by AniList.

## Checks

`node node_modules/typescript/bin/tsc --noEmit`

`npm run build`

Browser QA covers sign-in, follow/unfollow, persisted progress, timezone conversion, saved preferences, season search, calendar export, and responsive layouts. Production credentials, notification permissions and future real-world schedule changes require their corresponding live conditions.
