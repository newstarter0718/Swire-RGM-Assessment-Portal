export const STORAGE_KEY = "swire-rgm-certification-draft-v3";
export const ENDPOINT_STORAGE_KEY = "swire-rgm-apps-script-url";

export function readDraftState() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraftState(state) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore local storage failures and preserve in-memory work.
  }
}

export function clearDraftState() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore local storage failures.
  }
}

export function readCustomEndpoint() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return (window.localStorage.getItem(ENDPOINT_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function saveCustomEndpoint(endpoint) {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = (endpoint || "").trim();

  try {
    if (trimmed) {
      window.localStorage.setItem(ENDPOINT_STORAGE_KEY, trimmed);
    } else {
      window.localStorage.removeItem(ENDPOINT_STORAGE_KEY);
    }
  } catch {
    // Ignore local storage failures.
  }
}
