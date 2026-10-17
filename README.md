# aniway

A minimal, responsive anime tracker with live AniList schedules, IANA timezones, seasonal discovery, account-owned watchlists, episode progress, schedule-change notices and calendar export.

## Run

Node.js 22.13 or later. Install dependencies and initialize the local database:

```bash
npm ci
npm run db:migrate:local
```

The migration command uses `wrangler.local.json`, runs only locally, and persists D1 under `.wrangler/state`, matching the Vite development runtime. It safely skips migrations already applied. `npm run db:generate` creates new migration files; it does not initialize the database.

For a fresh database, create the gitignored encryption key without displaying it:

```bash
node --input-type=module -e 'import {writeFileSync} from "node:fs"; import {randomBytes} from "node:crypto"; writeFileSync(".dev.vars", "CRUNCHYROLL_ENCRYPTION_KEY=" + randomBytes(32).toString("hex") + "\n", {mode: 0o600, flag: "wx"})'
```

This refuses to overwrite an existing secrets file. Preserve the matching encryption key if transferring existing Crunchyroll connections. Secrets and local database records do not travel through Git.

Run `npm run dev` and open http://127.0.0.1:5173 (check the actual printed address). `npm run build` produces the Cloudflare Worker. Keep development local; publishing requires an explicit request.

## Deploy to Vercel

The Vercel build uses Vinext with Nitro's Vercel preset. In the Vercel project settings, keep the root directory at the repository root; `vercel.json` sets `npm ci`, `npm run build:vercel`, and Nitro's `.vercel/output` Build Output API directory. Vercel's Node runtime does not provide Cloudflare D1, so the Vercel target uses Turso's SQLite-compatible libSQL service. Add Turso through the Vercel Marketplace and connect it to this project; it supplies `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

Add `CRUNCHYROLL_ENCRYPTION_KEY` as an encrypted Vercel environment variable. Generate a new 32-byte key with `openssl rand -hex 32`; keep the same value for every deployment that needs to read previously stored Crunchyroll sessions. After pulling the database variables into a trusted local shell, run `npm run db:push:turso` once to create the tables. Never commit `.env*`, `.dev.vars*`, database credentials, or encryption keys.

Mac setup was verified October 17, 2026 with Node 26.12.0: dependency installation, all four D1 migrations, TypeScript, production build, credential signup/login/logout, session revocation, saved preferences, and live AniList catalogue/schedule responses passed. The npm lockfile was repaired for missing optional dependencies.

The previously published preview has not been confirmed unpublished; the earlier unpublish request remains unresolved. No deployment is part of local setup.

## Identity and storage

Email/password signup and login use scrypt (N=32768, r=8, p=3), independent random salts, constant-time comparisons and random 256-bit session tokens. D1 stores only token digests; cookies are HttpOnly, SameSite=Lax, and Secure on HTTPS. Sessions expire after 30 days and are revoked on logout. Authentication is rate-limited, and mutation endpoints validate request origin. Passwords require at least 15 characters. Email verification and password recovery email delivery are not configured.

Application sign-in uses email/password accounts only. Each private query derives its owner from a validated application session; clients cannot choose their user ID. The hosting audience remains private.

## Schedules and alerts

AniList supplies Japanese broadcast times; subtitled streaming availability can differ. Intl converts UTC timestamps using IANA timezone rules, including DST and local date rollover. Schedule queries include adjacent UTC dates, paginate, and report partial results. The schedule refreshes every five minutes while open.

Authenticated schedule checks run every minute while open, compare saved timestamps with fresh metadata, and write deduplicated personal release, hiatus and schedule-change notices. Browser notifications require permission. Detected changes do not invent official delay reasons. Closed-app push delivery, email notifications and guaranteed exact-time delivery are not implemented. Calendar export is an ICS snapshot with 15-minute reminders, not a live subscription.

## Crunchyroll

Anime details use verified Crunchyroll series links from AniList metadata, with official Crunchyroll search as a fallback. Region and subscription restrictions still apply. The Connections screen supports reviewed CSV/JSON progress imports into shows already followed on aniway, using fields `title` and `watched`. Imports never reduce progress and all writes are scoped to the signed-in account.

The server uses the user-requested `crunchy-api@0.1.1` package for cookie authentication, watchlists and history. Connect using an etp_rt cookie in the in-app Connections form. The session is encrypted with AES-256-GCM under CRUNCHYROLL_ENCRYPTION_KEY; cookies/tokens are never returned to the browser or logged. Requests stay on the package default Crunchyroll host and reject redirects. Expired access tokens are renewed using the encrypted cookie. Disconnect deletes the stored session and cache. Sync updates only existing followed shows with unambiguous title/season matches and completed episodes; progress never regresses. Automatic checks run every five minutes while open. Fetching is bounded to 200 watchlist and 300 history entries and reports partial results. A real signed-in Crunchyroll session is required for live verification.

### Cookie connection behavior

The installed `crunchy-api@0.1.1` sends a server-side form POST to `https://beta-api.crunchyroll.com/auth/v1/token` with `grant_type=etp_rt_cookie`, device identifiers, Basic client authentication and an `etp_rt` Cookie header. Aniway accepts the raw value or a copied cookie header, extracts only `etp_rt`, and never forwards unrelated cookies. The package stores the returned bearer session in memory; Aniway encrypts it for persistence and explicitly reauthenticates before expiry. Requests use `redirect: "manual"` and reject all 3xx responses without following them. Cloudflare Workers does not implement the `"error"` redirect mode; using it prevents the request from being sent.

Watchlists require the token response's `profile_id`; history accepts `account_id` or `profile_id`. Account-only sessions sync history with a watchlist warning. Successful authentication is preserved when the initial library fetch fails, with a separate sync warning and retry control. HTTP 401, 403 and 429 have distinct messages; a 403 can reflect provider access restrictions rather than an invalid cookie. Live authentication still requires testing through the app with a real session; fixture tests do not establish provider acceptance.

Package transport, cookie and Cloudflare runtime regression checks: `node --test tests/crunchyroll-*.test.mjs` (Node 22.18+ for built-in TypeScript stripping, or Node 26 used for Mac verification).

## Design and motion

Warm near-white, charcoal, sage and muted coral. Manrope headings and DM Sans interface text. No decorative borders or shadows. The concept is `design-concept.png`; the generated landscape is `public/anime-landscape.png`. The built-in image generator produced the concept and landscape; UI text and controls are native code.

GSAP scopes and cleans up page entrance timelines. Framer Motion handles shared navigation/tab indicators, custom searchable dropdowns, switches, cards, dialog entrances/exits, animated play reels, clocks, release waves, connection diagrams and bottom-center toasts. The mobile navbar has a shared active indicator and icon movement. Both animation systems respect reduced motion. Dropdowns support keyboard selection, typeahead, Escape and click outside. Dialogs trap focus.

## Validation

`node node_modules/typescript/bin/tsc --noEmit`

`npm run build`

Browser checks cover desktop and mobile, account prompts/signup, custom search/dropdowns, saved watchlists/progress, calendar export, preferences and Crunchyroll links. API checks cover signup/login, incorrect passwords, session revocation, origin validation, account isolation, atomic history import and prevention of progress regression. Timezone checks cover day rollover, DST, India’s half-hour offset and Tokyo conversion.

Crunchyroll artwork is the original 2024 SVG from Wikimedia Commons, sourced from Crunchyroll; the icon asset uses its original symbol viewport. Source: https://commons.wikimedia.org/wiki/File:Crunchyroll_2024.svg.

References: [AniList media metadata](https://docs.anilist.co/reference/object/media), [GSAP context](https://gsap.com/docs/v3/GSAP/gsap.context()/), [Motion accessibility](https://motion.dev/docs/react-accessibility), [Cloudflare crypto](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/), [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).



## Seasonal watchlist and cookie helper

My watchlist uses broadcast season/year from AniList, with a separate Season TBA option for undated saves. It combines saved aniway shows with uniquely matched titles from the connected account's cached Crunchyroll watchlist. Duplicate AniList IDs appear once, with both source labels. Exact title/season matches are conservative: ambiguous or unmatched provider entries remain available in Connections and are not assigned an invented broadcast season. The seasonal catalogue is paginated (up to 400 entries) and reports incomplete results.

Completed matched history supplies progress without reducing existing aniway progress. Editing progress on a Crunchyroll-only card first saves that show in aniway. Removing an aniway save does not remove the provider entry; disconnecting removes the provider list from the merged view. No changes are sent to the Crunchyroll library.

The local Chrome/Edge extension is in [`extensions/crunchyroll-cookie`](extensions/crunchyroll-cookie/README.md). Load it unpacked, sign in to Crunchyroll in that browser, then use **Copy for aniway** and paste in Connections. The copied JSON includes browser cookie expiry; raw cookie values still work with unknown expiry. Expiry metadata stays with the encrypted stored session. The app shows expiry and a warning within 24 hours; the extension also supports local browser reminders, without storing cookie values or sending them automatically. Browser cookie expiry is distinct from API token lifetime, and cannot predict early provider revocation.

Checks: `node --test tests/*.test.mjs`, TypeScript and production build. Synthetic-profile Chromium QA covered cookie extraction/copy, timestamp export, expiry notification logic and absence of cookie values in extension storage; browser/API QA covered seasonal merging, progress persistence, account isolation and mobile menu interactions. No extension store or site publication is part of this work.
