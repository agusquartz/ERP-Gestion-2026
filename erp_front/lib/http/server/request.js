import "server-only";
import { cookies } from "next/headers";
import { SERVER_ENV } from "@/lib/env/server";

export async function serverRequest(path, options = {}) {
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get(SERVER_ENV.CSRF_COOKIE_NAME)?.value;

  const response = await fetch(`${SERVER_ENV.API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}