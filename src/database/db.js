import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("expenses.db");

export function initDB() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL,
      category TEXT,
      type TEXT,
      note TEXT,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT UNIQUE,
      limitAmount REAL
    );
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      targetAmount REAL,
      savedAmount REAL DEFAULT 0
    );
  `);
}

// Otomatik başlatma
initDB();

export default db;
