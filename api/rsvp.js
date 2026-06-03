const { randomUUID } = require("crypto");

const STORE_KEY = "wedding:rsvps";

const getStoreConfig = () => ({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const sendJson = (res, statusCode, body) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const readBody = async (req) => {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
};

const cleanText = (value, maxLength = 1000) =>
  String(value || "")
    .trim()
    .slice(0, maxLength);

const saveSubmission = async (record) => {
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
    body: JSON.stringify(["LPUSH", STORE_KEY, JSON.stringify(record)]),
  });

  if (!response.ok) {
    throw new Error(`Storage request failed with ${response.status}.`);
  }
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readBody(req);

    if (cleanText(body.website)) {
      return sendJson(res, 200, { ok: true });
    }

    const record = {
      id: randomUUID(),
      submittedAt: new Date().toISOString(),
      name: cleanText(body.name, 120),
      attending: cleanText(body.attending, 40),
      meal: cleanText(body.meal, 80),
      dietary: cleanText(body.dietary, 1000),
      contact: cleanText(body.contact, 160),
      message: cleanText(body.message, 1500),
      userAgent: cleanText(req.headers["user-agent"], 300),
    };

    if (!record.name || !record.contact || !record.attending) {
      return sendJson(res, 400, {
        error: "Please add your name, contact details, and attendance response.",
      });
    }

    await saveSubmission(record);

    return sendJson(res, 201, { ok: true, id: record.id });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, {
      error: "We could not save your RSVP right now. Please try again.",
    });
  }
};
