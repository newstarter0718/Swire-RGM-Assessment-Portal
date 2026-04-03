export default async function handler(request, response) {
  const endpoint = process.env.APPS_SCRIPT_URL;

  if (request.method === "GET") {
    return response.status(200).json({
      ok: true,
      mode: "vercel-proxy",
      endpointConfigured: Boolean(endpoint),
    });
  }

  if (request.method !== "POST") {
    return response.status(405).json({
      ok: false,
      message: "Method not allowed.",
    });
  }

  if (!endpoint) {
    return response.status(503).json({
      ok: false,
      message: "APPS_SCRIPT_URL is not configured in Vercel environment variables.",
    });
  }

  try {
    const body = typeof request.body === "string"
      ? request.body
      : JSON.stringify(request.body || {});

    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body,
    });

    const text = await upstream.text();
    let payload;

    try {
      payload = text ? JSON.parse(text) : { ok: upstream.ok };
    } catch {
      payload = {
        ok: upstream.ok,
        message: text || "Apps Script returned a non-JSON response.",
      };
    }

    return response.status(upstream.ok ? 200 : 502).json(payload);
  } catch (error) {
    return response.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : "Unknown proxy failure.",
    });
  }
}
