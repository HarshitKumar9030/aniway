import { env } from "cloudflare:workers";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/d1";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";

let tursoClient: Client | undefined;

export function getTursoClient() {
  if (env.DB) {
    throw new Error("Turso is not used by the Cloudflare D1 runtime.");
  }

  if (!tursoClient) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) {
      throw new Error("Turso database is not configured on this server.");
    }
    tursoClient = createClient({ url, authToken });
  }

  return tursoClient;
}

export function getDb(): BaseSQLiteDatabase<"async", any, typeof schema> {
  if (env.DB) {
    return drizzle(env.DB, { schema });
  }

  return drizzleLibsql({ client: getTursoClient(), schema });
}
