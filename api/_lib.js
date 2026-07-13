const crypto = require("crypto");
const { put, get } = require("@vercel/blob");

const USERS_PATH = "data/users.json";
const SUBMISSIONS_PATH = "data/submissions.json";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

async function readJSON(pathname, fallback) {
  const result = await get(pathname, { access: "public" });
  if (!result || !result.stream) return fallback;
  const text = await new Response(result.stream).text();
  return text ? JSON.parse(text) : fallback;
}

async function writeJSON(pathname, data) {
  await put(pathname, JSON.stringify(data), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function getUsers() {
  return readJSON(USERS_PATH, {});
}
async function saveUsers(users) {
  return writeJSON(USERS_PATH, users);
}
async function getSubmissions() {
  return readJSON(SUBMISSIONS_PATH, {});
}
async function saveSubmissions(subs) {
  return writeJSON(SUBMISSIONS_PATH, subs);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const derived = crypto.scryptSync(password, salt, 64);
  return hashBuf.length === derived.length && crypto.timingSafeEqual(hashBuf, derived);
}

function signSession(username) {
  const payload = { u: username, exp: Date.now() + SESSION_MAX_AGE * 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", process.env.SESSION_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

function verifySession(token) {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = crypto
    .createHmac("sha256", process.env.SESSION_SECRET)
    .update(data)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload.u;
}

function getSessionUser(req) {
  const cookies = req.cookies || {};
  return verifySession(cookies.session);
}

function setSessionCookie(res, username) {
  const token = signSession(username);
  res.setHeader(
    "Set-Cookie",
    `session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax; Secure`
  );
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure");
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

module.exports = {
  getUsers,
  saveUsers,
  getSubmissions,
  saveSubmissions,
  hashPassword,
  verifyPassword,
  getSessionUser,
  setSessionCookie,
  clearSessionCookie,
  USERNAME_RE,
};
