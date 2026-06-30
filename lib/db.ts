import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './db/schema';

// Maintain a global singleton pattern
const globalForDb = globalThis as unknown as {
  db: PostgresJsDatabase<typeof schema> | undefined;
};

const pgUrl = process.env.DATABASE_URL || "postgres://localhost:5432/math_pace";

// Instantiate the DB
const queryClient = postgres(pgUrl);
export const db = globalForDb.db ?? drizzle(queryClient, { schema });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
