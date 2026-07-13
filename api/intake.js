const { getSessionUser, getSubmission, saveSubmission } = require("./_lib");

module.exports = async (req, res) => {
  const username = getSessionUser(req);
  if (!username) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  if (req.method === "GET") {
    const submission = await getSubmission(username);
    res.status(200).json({ submission: submission || null });
    return;
  }

  if (req.method === "POST") {
    const { answers, images } = req.body || {};
    if (!answers || typeof answers !== "object") {
      res.status(400).json({ error: "Missing answers" });
      return;
    }

    await saveSubmission(username, {
      answers,
      images: Array.isArray(images) ? images : [],
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
