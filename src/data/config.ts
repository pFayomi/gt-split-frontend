import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Where the backend lives, resolved in priority order:
 *
 *  1. `EXPO_PUBLIC_API_URL` — set at build time. On Vercel this is "/api",
 *     a relative path that `vercel.json` rewrites to the Render backend.
 *     On a native production build it must be an absolute URL
 *     (e.g. "https://gt-split-backend.onrender.com").
 *  2. Development — the backend runs on the same machine as Metro, so it is
 *     reachable on whatever host Expo Go is already talking to. Reading the
 *     host off the manifest means the app keeps working when the machine's
 *     LAN IP changes, instead of failing every request against a stale address.
 *  3. Published web build without env config — same-origin "/api" proxy.
 *  4. Published native build without env config — empty string (requests will
 *     fail until EXPO_PUBLIC_API_URL is provided).
 */
const FALLBACK_HOST = "172.20.10.2";
const BACKEND_PORT = 3000;

function resolveDevHost(): string {
  const hostUri = Constants.expoConfig?.hostUri ?? "";
  // hostUri is "host:port", and may arrive scheme-prefixed on some platforms.
  const host = hostUri.replace(/^[a-z]+:\/\//i, "").split(":")[0];
  return host || FALLBACK_HOST;
}

function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    return `http://${resolveDevHost()}:${BACKEND_PORT}`;
  }
  return Platform.OS === "web" ? "/api" : "";
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * PIN that confirms a transfer / split payment. It is deliberately separate from
 * the 6-digit login PIN (which the backend validates in /auth/login and which is
 * unchanged): signing in still needs the account's login PIN, while confirming
 * a payment needs this 4-digit one.
 */
export const TRANSFER_PIN = "1234";
