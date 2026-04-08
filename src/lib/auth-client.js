async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || "Unexpected response." };
  }
}

export async function getAuthSession() {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  const payload = await readJson(response);

  return {
    ok: response.ok && payload.ok !== false,
    configured: Boolean(payload.configured),
    authenticated: Boolean(payload.authenticated),
    message: payload.message || "",
  };
}

export async function loginWithPassword(password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });
  const payload = await readJson(response);

  return {
    ok: response.ok && payload.ok !== false,
    message: payload.message || (response.ok ? "Login successful." : "Login failed."),
  };
}

export async function logoutSession() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  const payload = await readJson(response);

  return {
    ok: response.ok && payload.ok !== false,
    message: payload.message || (response.ok ? "Logged out." : "Logout failed."),
  };
}
