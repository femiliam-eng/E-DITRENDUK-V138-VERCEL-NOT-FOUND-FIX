'use strict';
// V24: central SQLite runtime entry point. PostgreSQL HTTP runtime is not implemented.
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

function normalizeDriver(driver) {
  const value = String(driver || 'sqlite').trim().toLowerCase();
  if (value !== 'sqlite') {
    throw new Error(`DB_DRIVER=${value} belum didukung runtime HTTP V24; gunakan sqlite sampai adapter PostgreSQL siap.`);
  }
  return value;
}

function openDatabase({ driver, dataDir } = {}) {
  normalizeDriver(driver); // Reject unsupported drivers BEFORE opening any SQLite file.
  if (!dataDir || typeof dataDir !== 'string') throw new TypeError('dataDir wajib berupa path direktori');
  const db = new DatabaseSync(path.join(dataDir, 'editrenduk.sqlite'));
  try {
    db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

module.exports = { normalizeDriver, openDatabase };
