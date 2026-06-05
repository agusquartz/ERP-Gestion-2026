import "server-only";
import { SERVER_ENV } from "@/lib/env/server";

// export async function serverRequest(path, options = {}, cookieHeader = "") {
//   const res = await fetch(`${SERVER_ENV.API_URL}${path}`, {
//     ...options,
//     headers: {
//       "Content-Type": "application/json",
//       ...(cookieHeader ? { Cookie: cookieHeader } : {}),
//       ...(options.headers ?? {}),
//     },
//     cache: "no-store",
//   });

//   if (res.status === 401) return null;
//   if (!res.ok) throw new Error(`HTTP ${res.status}`);
//   if (res.status === 204) return null;

//   return res.json();
// }
export async function serverRequest(path, options = {}, cookieHeader = "") {
  const url = `${SERVER_ENV.API_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  if (res.status === 401) return null;
  if (res.status === 204) return null;

  if (!res.ok) {
    const text = await res.text();

    console.error("serverRequest failed", {
      url,
      status: res.status,
      body: text,
      cookieHeader,
    });

    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}