const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const Database = require('better-sqlite3');
const path = require('path');

const dev = true;
const app = next({ dev });
const handle = app.getRequestHandler();

process.env.JWT_SECRET = 'tbs_ii_secure_jwt_secret_key_2026';

// Use the actual local D1 database file
const sqliteDb = new Database(path.resolve(__dirname, '../.wrangler/state/v3/d1/miniflare-D1DatabaseObject/5d5b3cf95e9abc30512429e389a2d48a7bb99dd729cb98d835da0292c0c845ba.sqlite'));

globalThis.DB = {
  prepare: (sql) => {
    const stmt = sqliteDb.prepare(sql);
    return {
      bind: (...params) => ({
        first: async () => stmt.get(...params),
        all: async () => ({ results: stmt.all(...params) }),
        run: async () => {
          const info = stmt.run(...params);
          return { meta: { changes: info.changes } };
        },
        _sql: sql,
        _params: params,
        _stmt: stmt
      })
    };
  },
  batch: async (queries) => {
    // D1 does NOT wrap batch in a transaction that automatically rolls back.
    // It runs sequentially and stops on the first error.
    const results = [];
    for (const q of queries) {
      try {
        const info = q._stmt.run(...q._params);
        results.push({ meta: { changes: info.changes }, success: true });
      } catch (err) {
        console.error("D1 Batch error:", err.message);
        results.push({ error: err.message, success: false });
        break;
      }
    }
    return results;
  }
};

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
