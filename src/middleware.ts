import type { MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async (_context, next) => {
  const response = await next();
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; upgrade-insecure-requests",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  return response;
};
