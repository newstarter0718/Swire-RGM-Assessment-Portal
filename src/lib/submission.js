import { readCustomEndpoint } from "./browser-storage.js";

const CLIENT_ENV_ENDPOINT = (import.meta.env.VITE_APPS_SCRIPT_URL || "").trim();

function resolveDirectEndpoint() {
  return readCustomEndpoint() || CLIENT_ENV_ENDPOINT;
}

function isLocalHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

async function postDirect(endpoint, payload, { preferBeacon = true } = {}) {
  const body = JSON.stringify(payload);

  try {
    if (preferBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const beaconBody = new Blob([body], { type: "text/plain;charset=utf-8" });
      const queued = navigator.sendBeacon(endpoint, beaconBody);
      return {
        ok: queued,
        transport: "beacon",
        message: queued
          ? "Submission dispatched to Google Apps Script."
          : "Browser did not accept the background submission request.",
      };
    }

    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body,
    });

    return {
      ok: true,
      transport: "fetch-no-cors",
      message: "Submission sent directly to Google Apps Script.",
    };
  } catch (error) {
    return {
      ok: false,
      transport: "error",
      message: error instanceof Error ? error.message : "Unknown submission error.",
    };
  }
}

async function postProxy(payload) {
  try {
    const response = await fetch("/api/assessment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const payloadText = await response.text();
    const parsed = payloadText ? JSON.parse(payloadText) : {};

    return {
      ok: response.ok && parsed.ok !== false,
      transport: "vercel-function",
      message: parsed.message || (response.ok ? "Submission routed through Vercel." : "Proxy submission failed."),
    };
  } catch (error) {
    return {
      ok: false,
      transport: "error",
      message: error instanceof Error ? error.message : "Unknown proxy submission error.",
    };
  }
}

export async function submitAssessmentPayload(payload, { preferBeacon = true } = {}) {
  const directEndpoint = resolveDirectEndpoint();

  if (directEndpoint) {
    return postDirect(directEndpoint, payload, { preferBeacon });
  }

  if (typeof window !== "undefined" && !isLocalHost(window.location.hostname)) {
    return postProxy(payload);
  }

  return {
    ok: false,
    transport: "disabled",
    message: "No Apps Script URL or Vercel proxy is configured yet. Draft remains local for now.",
  };
}

export async function saveDraftPayload(payload) {
  return submitAssessmentPayload(payload, { preferBeacon: false });
}

export function getSubmissionModeLabel() {
  return resolveDirectEndpoint() ? "Direct Apps Script" : "Vercel Proxy";
}
