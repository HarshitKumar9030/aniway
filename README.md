# aniway

A minimal, responsive anime tracker with live AniList schedules, IANA timezones, seasonal discovery, account-owned watchlists, episode progress, schedule-change notices and calendar export.

## Run

Node.js 22.13 or later. Run `npm install`, then `npm run dev` for http://127.0.0.1:5173. `npm run build` produces the Cloudflare Worker. D1 migrations are in `drizzle/`; generate with `npm run db:generate`. Apply pending migrations locally with Wrangler and `.wrangler/state`; hosted publication applies them separately.

## Identity and storage

Email/password signup and login use scrypt (N=32768, r=8, p=3), independent random salts, constant-time comparisons and random 256-bit session tokens. D1 stores only token digests; cookies are HttpOnly, SameSite=Lax, and Secure on HTTPS. Sessions expire after 30 days and are revoked on logout. Authentication is rate-limited, and mutation endpoints validate request origin. Passwords require at least 15 characters. Email verification and password recovery email delivery are not configured.

The existing Sites/ChatGPT identity flow remains available as an alternative. The hosting access gate remains owner-private. Each private query derives its owner from a validated application session or platform identity. User IDs cannot be supplied by clients. Email/password accounts and ChatGPT accounts have independent libraries.

## Schedules and alerts

AniList supplies Japanese broadcast times; subtitled streaming availability can differ. Intl converts UTC timestamps using IANA timezone rules, including DST and local date rollover. Schedule queries include adjacent UTC dates, paginate, and report partial results. The schedule refreshes every five minutes while open.

Authenticated schedule checks run every minute while open, compare saved timestamps with fresh metadata, and write deduplicated personal release, hiatus and schedule-change notices. Browser notifications require permission. Detected changes do not invent official delay reasons. Closed-app push delivery, email notifications and guaranteed exact-time delivery are not implemented. Calendar export is an ICS snapshot with 15-minute reminders, not a live subscription.

## Crunchyroll

Anime details use verified Crunchyroll series links from AniList metadata, with official Crunchyroll search as a fallback. Region and subscription restrictions still apply. The Connections screen supports reviewed CSV/JSON progress imports into shows already followed on aniway, using fields `title` and `watched`. Imports never reduce progress and all writes are scoped to the signed-in account.

A supported Crunchyroll account-authorization API or connector was not available. The app does not collect Crunchyroll passwords, connect a Crunchyroll account or automatically sync watch history. Automatic sync requires approved partner access.

## Design and motion

Warm near-white, charcoal, sage and muted coral. Manrope headings and DM Sans interface text. No decorative borders or shadows. The concept is `design-concept.png`; the generated landscape is `public/anime-landscape.png`. The built-in image generator produced the concept and landscape; UI text and controls are native code.

GSAP scopes and cleans up page entrance timelines. Framer Motion handles shared navigation/tab indicators, custom searchable dropdowns, switches, cards, dialog entrances/exits, SVG details and bottom-center toasts. The mobile navbar has a shared active indicator and icon movement. Both animation systems respect reduced motion. Dropdowns support keyboard selection, typeahead, Escape and click outside. Dialogs trap focus.

## Validation

`node node_modules/typescript/bin/tsc --noEmit`

`npm run build`

Browser checks cover desktop and mobile, account prompts/signup, custom search/dropdowns, saved watchlists/progress, calendar export, preferences and Crunchyroll links. API checks cover signup/login, incorrect passwords, session revocation, origin validation, account isolation, atomic history import and prevention of progress regression. Timezone checks cover day rollover, DST, India’s half-hour offset and Tokyo conversion.

References: [AniList media metadata](https://docs.anilist.co/reference/object/media), [GSAP context](https://gsap.com/docs/v3/GSAP/gsap.context()/), [Motion accessibility](https://motion.dev/docs/react-accessibility), [Cloudflare crypto](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/), [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
