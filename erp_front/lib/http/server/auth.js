import { serverRequest } from "./request";

export function whoAmI(cookieHeader, csrfToken) {
  return serverRequest(
    "/auth/whoami",
    {
      headers: {
        "x-csrf-token": csrfToken,
      },
    },
    cookieHeader
  );
}