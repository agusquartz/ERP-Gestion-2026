import { clientRequest } from "./request";

export function login(username, password) {
  return clientRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({"username": username, "password": password}),
  });
}