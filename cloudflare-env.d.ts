declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    CRUNCHYROLL_ENCRYPTION_KEY?: string;
  }
}
