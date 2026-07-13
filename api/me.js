const { getSessionUser, getUsers } = require("./_lib");

module.exports = async (req, res) => {
  const key = getSessionUser(req);
  if (!key) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  const users = await getUsers();
  const user = users[key];
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  res.status(200).json({ username: user.username });
};
