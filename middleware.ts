declare const process: {
  env: Record<string, string | undefined>;
};

const ACCESS_COOKIE = "wedding_access";

const publicPaths = new Set([
  "/login",
  "/login.html",
  "/api/login",
  "/styles.css",
]);

const encodeBase64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
};

const getAccessToken = () => {
  const password = process.env.WEBSITE_PASSWORD;

  if (!password) {
    return undefined;
  }

  return encodeBase64(password);
};

const getCookie = (request: Request, name: string) => {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const prefix = `${name}=`;
  const cookie = cookies.find((item) => item.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : "";
};

export default function middleware(request: Request) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return undefined;
  }

  const url = new URL(request.url);
  const isPublicPath = publicPaths.has(url.pathname);
  const hasAccess = getCookie(request, ACCESS_COOKIE) === accessToken;

  if (isPublicPath || hasAccess) {
    return undefined;
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${url.pathname}${url.search}`);

  return Response.redirect(loginUrl);
}

export const config = {
  matcher: ["/(.*)"],
};
