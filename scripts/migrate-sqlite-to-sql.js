const Keyv = require("keyv");
const KeyvSqlite = require("@keyv/sqlite");
const KeyvPostgres = require("@keyv/postgres");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const SQLITE_URI = process.env.DB_URI || "sqlite://database.sqlite";
const POSTGRES_URI = process.env.DB_SQL_URI || process.env.DATABASE_URL;
console.log("SQlite URI:", SQLITE_URI);
console.log("PostgreSQL URI:", POSTGRES_URI);
async function migrate() {
  console.log("Starting migration from SQLite to PostgreSQL...");
  for (const file of fs.readdirSync(
    path.join(__dirname, "..", "src", "endpoints"),
  )) {
    console.log(`Migrating data from ${file} (${file.split(".")[0]})...`);
    // continue;
    const sqliteStore = new KeyvSqlite({
      uri: SQLITE_URI,
      // table: file.split(".")[0]
    });
    const sqliteDb = new Keyv({
      store: sqliteStore,
      namespace: file.split(".")[0].trim(),
    });

    const postgresStore = new KeyvPostgres({
      uri: POSTGRES_URI,
      table: file.split(".")[0].replace(/-/g, "_"),
    });
    const postgresDb = new Keyv({
      store: postgresStore,
      namespace: file.split(".")[0].trim(),
    });
    // continue;
    try {
      console.log("Connected to both databases");

      const iterator = sqliteStore.iterator();
      let count = 0;

      for await (const [key, value] of iterator) {
        const nameSpace = key.split(":")[0];
        if (nameSpace !== file.split(".")[0].trim()) {
          continue; // skip keys not in the current namespace
        }
        const cleanKey = key.split(":").slice(1).join(":");
        console.log(`Migrating key: ${cleanKey} (${nameSpace})`);
        await postgresDb.set(cleanKey, value);
        count++;
        if (count % 10 === 0) {
          console.log(`Migrated ${count} entries...`);
        }
      }

      console.log(
        `\nMigration completed successfully for ${file}! Migrated ${count} total entries.`,
      );
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    } finally {
      await sqliteDb.disconnect();
      await postgresDb.disconnect();
    }
  }
}

migrate().catch(console.error);
