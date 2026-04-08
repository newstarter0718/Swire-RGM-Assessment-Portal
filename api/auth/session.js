import { getAuthConfig, isAuthenticated } from "../_auth.js";

export default function handler(request, response) {
  if (request.method !== "GET") {
    return response.status(405).json({
      ok: false,
      message: "Method not allowed.",
    });
  }

  const auth = getAuthConfig();
  return response.status(200).json({
    ok: true,
    configured: auth.configured,
    authenticated: auth.configured ? isAuthenticated(request, auth.secret) : false,
  });
}
