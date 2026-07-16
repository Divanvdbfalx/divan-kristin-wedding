const { randomUUID } = require("crypto");

const TABLE_NAME = "rsvp_submissions";

const getSupabaseConfig = () => ({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
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

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const sendNotificationEmail = async (record) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return; // Email notifications not configured — skip silently.
  }

  const to = process.env.RSVP_NOTIFY_TO || "dkvanderbankwedding@gmail.com";
  const from = process.env.RSVP_NOTIFY_FROM || "Troue RSVP <onboarding@resend.dev>";

  const rows = [
    ["Naam", record.name],
    ["Bywoning", record.attending],
    ["Ete", record.meal],
    ["Dieet", record.dietary],
    ["Kontak", record.contact],
    ["Boodskap", record.message],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;font-weight:600;vertical-align:top">${label}</td><td style="padding:6px 12px">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const html = `<div style="font-family:Arial,sans-serif;color:#2f2d29">
    <h2 style="margin:0 0 12px">Nuwe RSVP ontvang</h2>
    <table style="border-collapse:collapse">${rows}</table>
    <p style="color:#77736c;font-size:12px;margin-top:16px">Ingedien ${record.submitted_at}</p>
  </div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Nuwe RSVP: ${record.name} (${record.attending})`,
      html,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend email failed with ${response.status}: ${message}`);
  }
};

const saveSubmission = async (record) => {
  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  const response = await fetch(`${url}/rest/v1/${TABLE_NAME}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase insert failed with ${response.status}: ${message}`);
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
      submitted_at: new Date().toISOString(),
      name: cleanText(body.name, 120),
      attending: cleanText(body.attending, 40),
      meal: cleanText(body.meal, 80),
      dietary: cleanText(body.dietary, 1000),
      contact: cleanText(body.contact, 160),
      message: cleanText(body.message, 1500),
      user_agent: cleanText(req.headers["user-agent"], 300),
    };

    if (!record.name || !record.contact || !record.attending) {
      return sendJson(res, 400, {
        error: "Please add your name, contact details, and attendance response.",
      });
    }

    await saveSubmission(record);

    try {
      await sendNotificationEmail(record);
    } catch (emailError) {
      // Never fail the RSVP because the notification email failed.
      console.error("RSVP notification email failed:", emailError);
    }

    return sendJson(res, 201, { ok: true, id: record.id });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, {
      error: "We could not save your RSVP right now. Please try again.",
    });
  }
};
