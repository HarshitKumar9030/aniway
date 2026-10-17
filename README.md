# aniway

A minimal, responsive anime tracker with live AniList schedules, IANA timezones, seasonal discovery, account-owned watchlists, episode progress, schedule-change notices and calendar export.

## Run

Node.js 22.13 or later. Run `npm install`, then `npm run dev` for http://127.0.0.1:5173. `npm run build` produces the Cloudflare Worker. D1 migrations are in `drizzle/`; generate with `npm run db:generate`. Apply pending migrations locally with Wrangler and `.wrangler/state`; hosted publication applies them separately.

## Identity and storage

Email/password signup and login use scrypt (N=32768, r=8, p=3), independent random salts, constant-time comparisons and random 256-bit session tokens. D1 stores only token digests; cookies are HttpOnly, SameSite=Lax, and Secure on HTTPS. Sessions expire after 30 days and are revoked on logout. Authentication is rate-limited, and mutation endpoints validate request origin. Passwords require at least 15 characters. Email verification and password recovery email delivery are not configured.

Application sign-in uses email/password accounts only. Each private query derives its owner from a validated application session; clients cannot choose their user ID. The hosting audience remains private.

## Schedules and alerts

AniList supplies Japanese broadcast times; subtitled streaming availability can differ. Intl converts UTC timestamps using IANA timezone rules, including DST and local date rollover. Schedule queries include adjacent UTC dates, paginate, and report partial results. The schedule refreshes every five minutes while open.

Authenticated schedule checks run every minute while open, compare saved timestamps with fresh metadata, and write deduplicated personal release, hiatus and schedule-change notices. Browser notifications require permission. Detected changes do not invent official delay reasons. Closed-app push delivery, email notifications and guaranteed exact-time delivery are not implemented. Calendar export is an ICS snapshot with 15-minute reminders, not a live subscription.

## Crunchyroll

Anime details use verified Crunchyroll series links from AniList metadata, with official Crunchyroll search as a fallback. Region and subscription restrictions still apply. The Connections screen supports reviewed CSV/JSON progress imports into shows already followed on aniway, using fields `title` and `watched`. Imports never reduce progress and all writes are scoped to the signed-in account.

The server uses the user-requested `crunchy-api@0.1.1` package for cookie authentication, watchlists and history. Connect using an etp_rt cookie in the in-app Connections form. The session is encrypted with AES-256-GCM under CRUNCHYROLL_ENCRYPTION_KEY; cookies/tokens are never returned to the browser or logged. Requests stay on the package default Crunchyroll host and reject redirects. Expired access tokens are renewed using the encrypted cookie. Disconnect deletes the stored session and cache. Sync updates only existing followed shows with unambiguous title/season matches and completed episodes; progress never regresses. Automatic checks run every five minutes while open. Fetching is bounded to 200 watchlist and 300 history entries and reports partial results. A real signed-in Crunchyroll session is required for live verification.

## Design and motion

Warm near-white, charcoal, sage and muted coral. Manrope headings and DM Sans interface text. No decorative borders or shadows. The concept is `design-concept.png`; the generated landscape is `public/anime-landscape.png`. The built-in image generator produced the concept and landscape; UI text and controls are native code.

GSAP scopes and cleans up page entrance timelines. Framer Motion handles shared navigation/tab indicators, custom searchable dropdowns, switches, cards, dialog entrances/exits, animated play reels, clocks, release waves, connection diagrams and bottom-center toasts. The mobile navbar has a shared active indicator and icon movement. Both animation systems respect reduced motion. Dropdowns support keyboard selection, typeahead, Escape and click outside. Dialogs trap focus.

## Validation

`node node_modules/typescript/bin/tsc --noEmit`

`npm run build`

Browser checks cover desktop and mobile, account prompts/signup, custom search/dropdowns, saved watchlists/progress, calendar export, preferences and Crunchyroll links. API checks cover signup/login, incorrect passwords, session revocation, origin validation, account isolation, atomic history import and prevention of progress regression. Timezone checks cover day rollover, DST, India’s half-hour offset and Tokyo conversion.

Crunchyroll artwork is the original 2024 SVG from Wikimedia Commons, sourced from Crunchyroll; the icon asset uses its original symbol viewport. Source: https://commons.wikimedia.org/wiki/File:Crunchyroll_2024.svg.

References: [AniList media metadata](https://docs.anilist.co/reference/object/media), [GSAP context](https://gsap.com/docs/v3/GSAP/gsap.context()/), [Motion accessibility](https://motion.dev/docs/react-accessibility), [Cloudflare crypto](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/), [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).


