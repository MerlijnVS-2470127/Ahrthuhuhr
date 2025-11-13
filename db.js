import Database from "better-sqlite3";

export const db = new Database("database.db", { verbose: console.log });

export function InitializeDatabase() {
  db.pragma("journal_mode = WAL;");
  db.pragma("busy_timeout = 5000;");
  db.pragma("synchronous = NORMAL;");
  db.pragma("cache_size = 1000000000;");
  db.pragma("foreign_keys = true;");
  db.pragma("temp_store = memory;");

  //db.prepare(`DROP TABLE users`);

  //prepare users
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      last_login TEXT NOT NULL
    ) STRICT
    `).run();

  //prepare messages
  db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    ) STRICT
  `).run();
  
  
  /*const exampleUsers = [
    { email: "admin", password: "admin", last_login: "/" },
  ];
  const insertUser = db.prepare("INSERT INTO users (email, password, last_login) VALUES (?,?,?)");
  exampleUsers.forEach((user) => {
    insertUser.run(user.email, user.password, user.last_login);
  });*/
}
