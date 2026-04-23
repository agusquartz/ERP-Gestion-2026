import "server-only";

export const SERVER_ENV = Object.freeze({
  API_URL: process.env.API_URL ?? "http://localhost:3000",
  CSRF_COOKIE_NAME: process.env.CSRF_COOKIE_NAME ?? "csrfToken",
  AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME ?? "session",
});