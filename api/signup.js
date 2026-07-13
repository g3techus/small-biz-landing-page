const { getUsers, saveUsers, hashPassword, setSessionCookie, USERNAME_RE } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { username, password } = req.body || {};

  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    res.status(400).json({
      error: "Username must be 3-20 characters (letters, numbers, underscore only)",
    });
    return;
  }
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const users = await getUsers();
  const key = username.toLowerCase();
  if (users[key]) {
    res.status(409).json({ error: "That username is already taken" });
    return;
  }

  users[key] = {
    username,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  await saveUsers(users);

  setSessionCookie(res, key);
  res.status(200).json({ ok: true, username });
};
