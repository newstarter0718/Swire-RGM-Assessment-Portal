const ENDPOINT_STORAGE_KEY = "swire-rgm-apps-script-url";

function getStoredEndpoint() {
  try {
    return (localStorage.getItem(ENDPOINT_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

function resolveEndpoint() {
  const config = window.RGM_SITE_CONFIG || {};
  return (config.appsScriptUrl || "").trim() || getStoredEndpoint();
}

export async function submitToGoogleSheets(payload) {
  const config = window.RGM_SITE_CONFIG || {};
  const endpoint = resolveEndpoint();

  if (!endpoint) {
    return {
      ok: false,
      transport: "disabled",
      message: "Apps Script URL not configured. Results remain local until an endpoint is added.",
    };
  }

  const body = JSON.stringify(payload);

  try {
    if (config.preferBeacon !== false && navigator.sendBeacon) {
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
      message: "Submission sent to Google Apps Script.",
    };
  } catch (error) {
    return {
      ok: false,
      transport: "error",
      message: error instanceof Error ? error.message : "Unknown submission error.",
    };
  }
}
