import Database from "better-sqlite3";

export const db = new Database("database.db", { verbose: console.log });

export function InitializeDatabase() {
  db.pragma("journal_mode = WAL;");
  db.pragma("busy_timeout = 5000;");
  db.pragma("synchronous = NORMAL;");
  db.pragma("cache_size = 1000000000;");
  db.pragma("foreign_keys = true;");
  db.pragma("temp_store = memory;");

  //db.prepare(`DROP TABLE groupusers`).run();

  //prepare users
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL, 
      password TEXT NOT NULL,
      last_login INTEGER NOT NULL
      ) STRICT
      `
  ).run();

  // prepare groups
  db.prepare(
    `CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE SET NULL
    ) STRICT
  `
  ).run();

  // prepare groupusers
  db.prepare(
    `CREATE TABLE IF NOT EXISTS groupusers (
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'member', -- lurker||member||admin||owner
      PRIMARY KEY (group_id, user_id),
      FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id)  REFERENCES users(id)  ON DELETE CASCADE
    ) STRICT
  `
  ).run();

  // prepare events
  db.prepare(
    `CREATE TABLE IF NOT EXISTS events(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER,
      group_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned', -- planned||happening now||ended||cancelled
      location TEXT, -- location: leesbare string voor weer te geven op de site, lat en lng voor coördinaten op te slaan
      location_lat REAL,
      location_lng REAL,
      FOREIGN KEY(creator_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(group_id)  REFERENCES groups(id) ON DELETE CASCADE
    ) STRICT
  `
  ).run();

  // prepare eventusers
  db.prepare(
    `CREATE TABLE IF NOT EXISTS eventusers(
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'going',   -- 'going'||'interested'||'declined' (intrested: voor mensen die enkel notificaties willen ontvangen, ideaal voor thuisblijvers)
      joined_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as integer) * 1000),
      PRIMARY KEY(event_id, user_id),
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id)  REFERENCES users(id) ON DELETE CASCADE
    ) STRICT;
  `
  ).run();

  // prepare event resources
  db.prepare(
    `CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      filename TEXT NOT NULL,        -- original filename
      storage_name TEXT NOT NULL,    -- actual file name on disk
      path TEXT NOT NULL,            -- relative path (e.g. uploads/events/123/abc.jpg)
      mime TEXT NOT NULL,
      size INTEGER NOT NULL,
      tag TEXT,
      uploader_id INTEGER,
      uploaded_at INTEGER NOT NULL DEFAULT (cast(strftime('%s','now') as integer) * 1000),
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY(uploader_id) REFERENCES users(id) ON DELETE SET NULL
    ) STRICT;
  `
  ).run();

  //prepare messages
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    ) STRICT
  `
  ).run();

  // indices for faster lookup
  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`
  ).run();

  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_groups_owner ON groups(owner_id);`
  ).run();

  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_groupusers_user ON groupusers(user_id);`
  ).run();
  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_groupusers_group ON groupusers(group_id);`
  ).run();

  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_events_group ON events(group_id);`
  ).run();
  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_events_creator ON events(creator_id);`
  ).run();
  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);`
  ).run();
  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);`
  ).run();

  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_eventusers_user ON eventusers(user_id);`
  ).run();
  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_eventusers_status ON eventusers(status);`
  ).run();
  db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_resources_event ON resources(event_id);`
  ).run();
}
