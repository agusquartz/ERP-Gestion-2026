"use client";

import { PUBLIC_ENV } from "@/lib/env/public";

function readCookie(name) {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
}

export async function clientRequest(path, options = {}) {
  const csrfToken = readCookie("csrfToken");

  const response = await fetch(`${PUBLIC_ENV.API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let error;

    try {
      error = await response.json();
    } catch {
      error = { message: response.statusText };
    }

    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}