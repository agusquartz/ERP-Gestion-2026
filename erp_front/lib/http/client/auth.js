import { clientRequest } from "./request";

export function login(username, password) {
  return clientRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({"username": username, "password": password}),
  });
}

export function logout() {
  return clientRequest("/auth/logout", {
    method: "POST",
  });
}

export function whoAmI() {
  return clientRequest("/auth/whoami", {
    method: "GET",
  });
}