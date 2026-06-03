const TABLE_NAME = "rsvp_submissions";

const getSupabaseConfig = () => ({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
  adminPassword: process.env.RSVP_ADMIN_PASSWORD,
});

const sendJson = (res, statusCode, body) => {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
};

const readSubmissions = async () => {
  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  const params = new URLSearchParams({
    select: "id,submitted_at,name,attending,meal,dietary,contact,message",
    order: "submitted_at.desc",
  });

  const response = await fetch(`${url}/rest/v1/${TABLE_NAME}?${params}`, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Supabase read failed with ${response.status}: ${message}`);
  }

  const records = await response.json();

  return records.map((record) => ({
    id: record.id,
    submittedAt: record.submitted_at,
    name: record.name,
    attending: record.attending,
    meal: record.meal,
    dietary: record.dietary,
    contact: record.contact,
    message: record.message,
  }));
};

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const { adminPassword } = getSupabaseConfig();
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
