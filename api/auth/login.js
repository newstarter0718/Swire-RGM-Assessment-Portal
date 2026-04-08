import { createSessionCookie, getAuthConfig, readJsonBody } from "../_auth.js";

export default function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      ok: false,
      message: "Method not allowed.",
    });
  }

  const auth = getAuthConfig();
  if (!auth.configured) {
    return response.status(503).json({
      ok: false,
      message: "APP_LOGIN_PASSWORD and APP_LOGIN_SESSION_SECRET must be configured in Vercel.",
    });
  }

  const body = readJsonBody(request);
  const password = typeof body.password === "string" ? body.password : "";

  if (!password || password !== auth.password) {
    return response.status(401).json({
      ok: false,
      message: "Incorrect password.",
    });
  }

  response.setHeader("Set-Cookie", createSessionCookie(auth.secret));
  return response.status(200).json({
    ok: true,
    message: "Login successful.",
  });
}
