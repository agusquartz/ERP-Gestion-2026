import { serverRequest } from "./request";

export function whoAmI() {
  return serverRequest("/auth/whoami", { method: "GET" });
}
