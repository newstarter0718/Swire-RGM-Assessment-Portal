import { clearSessionCookie } from "../_auth.js";

export default function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      ok: false,
      message: "Method not allowed.",
    });
  }

  response.setHeader("Set-Cookie", clearSessionCookie());
  return response.status(200).json({
    ok: true,
    message: "Logged out.",
  });
}
