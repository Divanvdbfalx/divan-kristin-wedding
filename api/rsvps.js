const STORE_KEY = "wedding:rsvps";

const getStoreConfig = () => ({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  adminPassword: process.env.RSVP_ADMIN_PASSWORD,
});

const sendJson = (res, statusCode, body) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const readSubmissions = async () => {
  const { url, token } = getStoreConfig();

  if (!url || !token) {
    throw new Error("Missing RSVP storage environment variables.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["LRANGE", STORE_KEY, "0", "-1"]),
  });

  if (!response.ok) {
    throw new Error(`Storage request failed with ${response.status}.`);
  }

  const payload = await response.json();
  const records = payload.result || [];

  return records
    .map((record) => {
      try {
        return JSON.parse(record);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
};

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const { adminPassword } = getStoreConfig();
  const suppliedPassword = req.headers["x-admin-password"];

  if (!adminPassword || suppliedPassword !== adminPassword) {
    return sendJson(res, 401, { error: "Invalid admin password." });
  }

  try {
    const submissions = await readSubmissions();
    return sendJson(res, 200, { submissions });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, {
      error: "Could not load RSVP submissions right now.",
    });
  }
};
