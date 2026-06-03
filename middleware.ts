declare const process: {
  env: Record<string, string | undefined>;
};

const REALM = "Divan & Kristin Wedding";

const unauthorized = () =>
  new Response("Password required", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store",
    },
  });

export default function middleware(request: Request) {
  const password = process.env.WEBSITE_PASSWORD;

  if (!password) {
    return undefined;
  }

  const username = process.env.WEBSITE_USERNAME || "guest";
  const authHeader = request.headers.get("authorization") || "";
  const expected = `Basic ${btoa(`${username}:${password}`)}`;

  if (authHeader !== expected) {
    return unauthorized();
  }

  return undefined;
}

export const config = {
  matcher: ["/(.*)"],
};
