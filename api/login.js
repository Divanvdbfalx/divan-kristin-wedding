const ACCESS_COOKIE = "wedding_access";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

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

  const rawBody = Buffer.concat(chunks).toString("utf8");
  const contentType = req.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    return JSON.parse(rawBody || "{}");
  }

  return Object.fromEntries(new URLSearchParams(rawBody));
};

const getAccessToken = () =>
  Buffer.from(process.env.WEBSITE_PASSWORD || "", "utf8").toString("base64");

const normalizePath = (value) => {
  const path = String(value || "/");

  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }

  return path;
};

const setAccessCookie = (res) => {
  const token = encodeURIComponent(getAccessToken());
  const cookieParts = [
    `${ACCESS_COOKIE}=${token}`,
    "Path=/",
    `Max-Age=${MAX_AGE_SECONDS}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ];

  res.setHeader("Set-Cookie", cookieParts.join("; "));
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const expectedPassword = process.env.WEBSITE_PASSWORD;

  if (!expectedPassword) {
    return sendJson(res, 500, { error: "Website password is not configured." });
  }

  try {
    const body = await readBody(req);
    const suppliedPassword = String(body.password || "");

    if (suppliedPassword !== expectedPassword) {
      return sendJson(res, 401, { error: "That password is not correct." });
    }

    const redirectTo = normalizePath(body.next);
    setAccessCookie(res);

    if ((req.headers.accept || "").includes("application/json")) {
      return sendJson(res, 200, { ok: true, redirectTo });
    }

    res.statusCode = 303;
    res.setHeader("Location", redirectTo);
    return res.end();
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: "Could not sign in right now." });
  }
};
