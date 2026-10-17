# aniway cookie helper (Chrome / Edge)

1. Open `chrome://extensions` (or `edge://extensions`) and enable Developer mode.
2. Choose **Load unpacked** and select this folder.
3. Sign in to Crunchyroll in the same browser profile. Open the extension.
4. Click **Copy for aniway**, then paste into aniway → Connections → Crunchyroll → Connect. This copies the cookie and browser expiry together. **Copy cookie value only** is also available, but carries no expiry information.

The extension copies a session credential to the clipboard only when you click a Copy button. It never sends network requests, injects scripts, changes cookies, or stores cookie values. Clipboard contents remain until replaced. Only Crunchyroll cookie access is requested; there is no permission to read aniway or other sites. Browser permission warnings describe cookie access as read/write even though this extension only calls `cookies.get`.

Local expiry monitoring runs every 30 minutes while Chrome is running and also reacts to cookie changes. Notifications warn within 24 hours of the browser expiry date and when a previously observed cookie disappears. Turn them off in the popup. Browser/OS notification settings can suppress alerts, and sleep can delay them. The extension stores only timestamps, alert preferences and notification state.

A session cookie may have no expiry date. It can still trigger a disappearance alert after it has been observed. Crunchyroll can revoke a session before browser expiry; expiry reminders cannot detect that. Renewed browser cookies are not automatically sent to aniway: copy fresh connection details and reconnect.

The app stores copied expiry metadata alongside its encrypted session and shows an in-app reminder within 24 hours. It does not derive cookie expiry from the API access token lifetime.

This is a local unpacked extension, not a Chrome Web Store publication. No account credentials belong in this folder, Git, screenshots or bug reports.
