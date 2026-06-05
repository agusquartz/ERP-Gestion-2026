"use client";

import { PUBLIC_ENV } from "@/lib/env/public";

function readCookie(name) {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
}

export class ClientRequestError extends Error {
  constructor({ status, statusText, body }) {
    super(
      body?.message ||
        body?.error ||
        statusText ||
        `HTTP ${status}`
    );

    this.name = "ClientRequestError";

    this.status = status;
    this.statusText = statusText;

    // Campos que vienen del backend
    this.code = body?.code ?? null;
    this.body = body ?? null;

    // Soporta snake_case y camelCase
    this.productId = body?.product_id ?? body?.productId ?? null;
  }
}

async function readResponseBody(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
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
    const body = await readResponseBody(response);

    throw new ClientRequestError({
      status: response.status,
      statusText: response.statusText,
      body,
    });
  }

  if (response.status === 204) return null;

  const body = await readResponseBody(response);
  return body;
}