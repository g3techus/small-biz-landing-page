const { put } = require("@vercel/blob");
const { getSessionUser } = require("./_lib");

const MAX_BYTES = 4 * 1024 * 1024; // 4MB decoded

function safeName(name) {
  return String(name || "file")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-60);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const username = getSessionUser(req);
  if (!username) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const { filename, contentType, dataBase64, kind } = req.body || {};

  if (typeof contentType !== "string" || !contentType.startsWith("image/")) {
    res.status(400).json({ error: "Only image uploads are allowed" });
    return;
  }
  if (typeof dataBase64 !== "string" || !dataBase64) {
    res.status(400).json({ error: "Missing file data" });
    return;
  }

  let buffer;
  try {
    buffer = Buffer.from(dataBase64, "base64");
  } catch {
    res.status(400).json({ error: "Invalid file data" });
    return;
  }

  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    res.status(400).json({ error: "Image must be smaller than 4MB" });
    return;
  }

  const label = kind === "logo" ? "logo" : "photo";
  const pathname = `uploads/${username}/${label}-${Date.now()}-${safeName(filename)}`;

  const blob = await put(pathname, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });

  res.status(200).json({ url: blob.url });
};
