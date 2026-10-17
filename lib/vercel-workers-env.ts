// Vercel's Node runtime has no Cloudflare worker bindings. The Vite alias uses
// this module there; local/Cloudflare builds keep the native binding module.
export const env = {
  DB: undefined,
  CRUNCHYROLL_ENCRYPTION_KEY: process.env.CRUNCHYROLL_ENCRYPTION_KEY,
};
