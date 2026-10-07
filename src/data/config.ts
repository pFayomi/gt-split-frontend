const ENV_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");
export const API_BASE_URL = ENV_URL || `http://${resolveApiHost()}:${BACKEND_PORT}`;
