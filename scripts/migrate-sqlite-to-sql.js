const Keyv = require("keyv");
const KeyvSqlite = require("@keyv/sqlite");
const KeyvPostgres = require("@keyv/postgres");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const SQLITE_URI = process.env.DB_URI || "sqlite://database.sqlite";
const POSTGRES_URI = process.env.MIGRATE_TARGET_URI || process.env.DB_SQL_URI || process.env.DATABASE_URL;
const DRY_RUN = process.argv.includes("--dry-run");

if (!POSTGRES_URI) {
  console.error(
    "Missing target Postgres URI. Set MIGRATE_TARGET_URI (preferred for this script) or DB_SQL_URI/DATABASE_URL.",
  );
  process.exit(1);
}

const sqlitePath = SQLITE_URI.replace(/^sqlite:\/\//, "");
if (!fs.existsSync(sqlitePath)) {
  console.error(`SQLite file not found at "${sqlitePath}", aborting.`);
  process.exit(1);
}

// Always work off a fresh backup, never the live file, so a bad run can't touch the source of truth.
const backupPath = `${sqlitePath}.premigrate-${Date.now()}.bak`;
fs.copyFileSync(sqlitePath, backupPath);
console.log(`Backed up ${sqlitePath} -> ${backupPath}`);

async function migrate() {
  console.log(
    `Starting migration from SQLite to PostgreSQL${DRY_RUN ? " (DRY RUN, no writes)" : ""}...`,
  );
  const summary = [];

  for (const file of fs.readdirSync(
    path.join(__dirname, "..", "src", "endpoints"),
  )) {
    const namespace = file.split(".")[0].trim();
    const table = namespace.replace(/-/g, "_");
    console.log(`\n[${namespace}] migrating (table: ${table})...`);

    // NOTE: iterating through the Keyv wrapper (not the raw store) so values come out
    // already deserialized to their real shape. Iterating the raw store and re-`.set()`ing
    // through a Keyv wrapper double-serializes every value (this bit us before - see the
    // JSON.parse(...).value workaround in src/endpoints/quotesdb.js).
    const sqliteDb = new Keyv({
      store: new KeyvSqlite({ uri: `sqlite://${backupPath}` }),
      namespace,
    });
    const postgresDb = new Keyv({
      store: new KeyvPostgres({ uri: POSTGRES_URI, table }),
      namespace,
    });

    let migrated = 0;
    const sampleKeys = [];
    try {
      if (typeof sqliteDb.iterator !== "function") {
        console.log(`[${namespace}] iterator unavailable, skipping`);
        continue;
      }

      for await (const [key, value] of sqliteDb.iterator()) {
        if (!DRY_RUN) {
          await postgresDb.set(key, value);
        }
        migrated++;
        if (sampleKeys.length < 3) sampleKeys.push(key);
        if (migrated % 25 === 0) {
          console.log(`[${namespace}] ${migrated} entries...`);
        }
      }

      console.log(
        `[${namespace}] done: ${migrated} entr${migrated === 1 ? "y" : "ies"}${
          DRY_RUN ? " (dry run, nothing written)" : ""
        }`,
      );

      if (!DRY_RUN && sampleKeys.length > 0) {
        for (const key of sampleKeys) {
          const before = await sqliteDb.get(key);
          const after = await postgresDb.get(key);
          const ok = JSON.stringify(before) === JSON.stringify(after);
          console.log(`[${namespace}] verify "${key}": ${ok ? "OK" : "MISMATCH"}`);
          if (!ok) {
            console.error(`  sqlite:   ${JSON.stringify(before)}`);
            console.error(`  postgres: ${JSON.stringify(after)}`);
          }
        }
      }

      summary.push({ namespace, migrated });
    } catch (error) {
      console.error(`[${namespace}] migration failed:`, error);
      throw error;
    } finally {
      await sqliteDb.disconnect();
      await postgresDb.disconnect();
    }
  }

  console.log("\nSummary:");
  for (const { namespace, migrated } of summary) {
    console.log(`  ${namespace}: ${migrated}`);
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
