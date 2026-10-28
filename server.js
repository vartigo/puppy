/* =====================================================================
   server.js  —  BACKEND (Node.js + Express + MySQL / MongoDB)
   Covers: Practical 1 (Node), 8 (MySQL), 9 (roles/auth), 10 (MongoDB),
           11 (process.env.PORT for deployment)

   HOW TO RUN (see README.md for full steps):
     npm install
     node server.js                 -> uses in-memory data (no DB needed, safest first test)
     DB_MODE=mysql node server.js   -> uses MySQL  (Windows CMD: set DB_MODE=mysql&& node server.js)
     DB_MODE=mongo node server.js   -> uses MongoDB

   TO ADAPT TO YOUR EXAM TOPIC (e.g. "Library", "Hospital", "Event"):
     1. Rename the table/collection "items" -> "books" etc.  (search for ITEMS)
     2. Edit the FIELDS list below + the SQL CREATE TABLE.
     3. Edit the form fields in the frontend html file.
   ===================================================================== */

const express = require("express");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(express.json());                                  // parse JSON request bodies
app.use(express.static(path.join(__dirname, "public")));  // serve /public (html files)

// ---------------------------------------------------------------------
// CONFIG  — change these to match the lab machine
// ---------------------------------------------------------------------
const DB_MODE = process.env.DB_MODE || "memory";          // "memory" | "mysql" | "mongo"
const PORT = process.env.PORT || 3000;                    // Practical 11: hosts supply PORT

const MYSQL_CONFIG = {
  host: "localhost",
  user: "root",
  password: "",          // <-- lab MySQL password (XAMPP default is empty)
  // database is selected after we create it (see initMySQL)
};
const MYSQL_DB = "college";

const MONGO_URI = "mongodb://127.0.0.1:27017";
const MONGO_DB = "college";

// ---------------------------------------------------------------------
// FIELDS  — the columns of your main entity. Edit for your topic.
// ---------------------------------------------------------------------
const FIELDS = ["title", "description", "category", "price", "image_url", "status", "latitude", "longitude", "created_by"];

// Keep only the allowed fields from a request body (avoids junk / injection of fields).
// On UPDATE, an empty box means "clear this field" -> stored as null (title is never cleared).
function pick(body, forUpdate) {
  const out = {};
  FIELDS.forEach(f => {
    if (body[f] === undefined) return;
    if (body[f] === "") { if (forUpdate && f !== "title") out[f] = null; }
    else out[f] = body[f];
  });
  return out;
}

// =====================================================================
// DATA LAYER — three interchangeable implementations with the SAME 4 functions:
//   list(), create(obj), update(id, obj), remove(id)
// The routes below never care which DB is used.
// =====================================================================
let db; // will hold the chosen implementation

// ---------- A) In-memory (no database needed; resets on restart) ----------
function memoryDB() {
  let rows = [];
  let nextId = 1;
  return {
    async list() { return rows; },
    async create(obj) {
      const row = { id: nextId++, status: "todo", ...obj, created_at: new Date() };
      rows.push(row);
      return row;
    },
    async update(id, obj) {
      const row = rows.find(r => String(r.id) === String(id));
      if (!row) return null;
      Object.assign(row, obj);
      return row;
    },
    async remove(id) {
      const before = rows.length;
      rows = rows.filter(r => String(r.id) !== String(id));
      return before !== rows.length;
    }
  };
}

// ---------- B) MySQL (Practical 8) ----------
async function mysqlDB() {
  const mysql = require("mysql");                         // npm install mysql
  const conn = mysql.createConnection(MYSQL_CONFIG);

  // Wrap callback-style conn.query into a Promise so we can use async/await
  const q = (sql, params = []) =>
    new Promise((resolve, reject) =>
      conn.query(sql, params, (err, result) => (err ? reject(err) : resolve(result))));

  await new Promise((res, rej) => conn.connect(err => (err ? rej(err) : res())));
  console.log("Connected to MySQL");

  // Create database + table automatically (same as running the SQL in phpMyAdmin)
  await q(`CREATE DATABASE IF NOT EXISTS ${MYSQL_DB}`);
  await new Promise((res, rej) => conn.changeUser({ database: MYSQL_DB }, e => (e ? rej(e) : res())));
  await q(`
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT,
      category VARCHAR(80),
      price DOUBLE,
      image_url VARCHAR(500),
      status VARCHAR(20) DEFAULT 'todo',
      latitude DOUBLE,
      longitude DOUBLE,
      created_by VARCHAR(60),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  // If the table was created by an older version, add the newer columns (ignore "already exists")
  for (const col of ["price DOUBLE", "image_url VARCHAR(500)"]) {
    try { await q("ALTER TABLE items ADD COLUMN " + col); }
    catch (e) { if (e.code !== "ER_DUP_FIELDNAME") throw e; }
  }

  return {
    list: () => q("SELECT * FROM items ORDER BY id DESC"),
    async create(obj) {
      // "INSERT ... SET ?" lets the driver build the column list from the object.
      // Values are escaped automatically (parameterized -> prevents SQL injection).
      const r = await q("INSERT INTO items SET ?", obj);
      return (await q("SELECT * FROM items WHERE id = ?", [r.insertId]))[0];
    },
    async update(id, obj) {
      const r = await q("UPDATE items SET ? WHERE id = ?", [obj, id]);
      if (!r.affectedRows) return null;
      return (await q("SELECT * FROM items WHERE id = ?", [id]))[0];
    },
    async remove(id) {
      const r = await q("DELETE FROM items WHERE id = ?", [id]);
      return r.affectedRows > 0;
    }
  };
}

// ---------- C) MongoDB (Practical 10) ----------
async function mongoDB() {
  const { MongoClient, ObjectId } = require("mongodb");   // npm install mongodb
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("Connected to MongoDB");
  const col = client.db(MONGO_DB).collection("items");    // collection ~ table

  // Mongo uses _id (ObjectId); the frontend expects "id", so convert.
  const toRow = d => (d ? { ...d, id: d._id.toString() } : null);
  const oid = id => { try { return new ObjectId(id); } catch { return null; } };

  return {
    async list() { return (await col.find({}).sort({ _id: -1 }).toArray()).map(toRow); },
    async create(obj) {
      const doc = { status: "todo", ...obj, created_at: new Date() };
      const r = await col.insertOne(doc);
      return toRow({ ...doc, _id: r.insertedId });
    },
    async update(id, obj) {
      if (!oid(id)) return null;
      const r = await col.findOneAndUpdate({ _id: oid(id) }, { $set: obj }, { returnDocument: "after" });
      // driver v6 returns the doc directly; older versions return { value }
      return toRow(r && r.value !== undefined ? r.value : r);
    },
    async remove(id) {
      if (!oid(id)) return false;
      const r = await col.deleteOne({ _id: oid(id) });
      return r.deletedCount > 0;
    }
  };
}

// =====================================================================
// AUTH + ROLES (Practical 9)
//   Authentication = who are you?   -> 401 if wrong
//   Authorization  = what may you do? -> 403 if not allowed
// Demo accounts only. Real apps: hashed passwords + HTTPS + env secrets.
// =====================================================================
const users = [
  { username: "admin",   password: "1234", role: "admin" },
  { username: "student", password: "1234", role: "user" }
];
const tokens = {};   // token -> user   (in-memory sessions)

// POST /api/login  -> returns a token the frontend stores in localStorage
app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  console.log("Login attempt:", username);        // shows in the terminal -> proves the request arrived
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: "Authentication failed" });
  const token = crypto.randomBytes(16).toString("hex");   // works on every Node version
  tokens[token] = user;
  res.json({ message: "Login successful", token, username: user.username, role: user.role });
});

// Middleware: checks "Authorization: Bearer <token>" header
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const user = tokens[token];
  if (!user) return res.status(401).json({ message: "Please login first" });
  req.user = user;
  next();
}

// Middleware factory: only allow certain roles
function requireRole(role) {
  return (req, res, next) =>
    req.user.role === role ? next() : res.status(403).json({ message: role + " access only" });
}

// =====================================================================
// ROUTES  — CRUD on "items" (Create, Read, Update, Delete)
// =====================================================================

// READ all
app.get("/api/items", auth, async (req, res) => {
  try { res.json(await db.list()); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

// CREATE
app.post("/api/items", auth, async (req, res) => {
  const data = pick(req.body);
  if (!data.title) return res.status(400).json({ message: "Title is required" });   // validation
  data.created_by = req.user.username;
  try { res.status(201).json(await db.create(data)); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

// UPDATE (also used by drag & drop to change status)
app.put("/api/items/:id", auth, async (req, res) => {
  try {
    const row = await db.update(req.params.id, pick(req.body, true));
    if (!row) return res.status(404).json({ message: "Item not found" });
    res.json(row);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE — ADMIN ONLY (role-based access control demo)
app.delete("/api/items/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const ok = await db.remove(req.params.id);
    if (!ok) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Admin-only extra route (like "/admin" in Practical 9)
app.get("/api/admin/summary", auth, requireRole("admin"), async (req, res) => {
  const all = await db.list();
  res.json({ total: all.length, users: users.map(u => ({ username: u.username, role: u.role })) });
});

// =====================================================================
// START
// =====================================================================
(async () => {
  try {
    if (DB_MODE === "mysql") db = await mysqlDB();
    else if (DB_MODE === "mongo") db = await mongoDB();
    else db = memoryDB();
    console.log("Database mode:", DB_MODE);
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  } catch (e) {
    // ECONNREFUSED -> DB service not started.  Access denied -> wrong user/password.
    console.error("Could not start:", e.message);
    process.exit(1);
  }
})();
