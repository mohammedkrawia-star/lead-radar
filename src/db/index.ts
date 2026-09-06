import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDrizzleDb?: NodePgDatabase;
};

function createPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return new Pool({
    connectionString: databaseUrl,
  });
}

function getPool(): Pool {
  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    const newPool = createPool();
    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = newPool;
    }
    return newPool;
  }
  return globalForDb.__arenaNextJsPostgresqlPool;
}

function getDb(): NodePgDatabase {
  if (!globalForDb.__arenaNextJsDrizzleDb) {
    const newDb = drizzle(getPool());
    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsDrizzleDb = newDb;
    }
    return newDb;
  }
  return globalForDb.__arenaNextJsDrizzleDb;
}

// `pool` and `db` are lazy proxies: the real Pool/drizzle instance (and the
// DATABASE_URL check) is only created the first time a property on them is
// actually accessed. This means simply *importing* this module — which is
// what happens during `next build`'s page-data collection for every route,
// including ones that are never invoked — never throws, even if
// DATABASE_URL isn't set in the build environment. The error only surfaces
// if a request actually tries to hit the database without it configured.
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    return Reflect.get(getPool(), prop, receiver);
  },
});

export const db: NodePgDatabase = new Proxy({} as NodePgDatabase, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
