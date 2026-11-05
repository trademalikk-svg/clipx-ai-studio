(function () {
  "use strict";
  const SUPABASE_URL = "https://qmoxfzgiwamblpouxitn.supabase.co";
  const SUPABASE_KEY = "sb_publishable_dsVQ5-5VuIG5n_m0qqNjqw__i5sogpL";
  const ENDPOINT = SUPABASE_URL + "/functions/v1/shif-a-media-gateway";
  async function call(body) {
    if (!window.ShifAAuth) throw new Error("Account module did not load.");
    const auth = await window.ShifAAuth.requireSession();
    if (auth.error) throw auth.error;
    if (!auth.session) throw new Error("Please sign in with a verified account to generate media.");
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": "Bearer " + auth.session.access_token },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || ("Cloud media error " + response.status));
    return result;
  }
  async function create(options) {
    if (!options || !["image", "video"].includes(options.kind)) throw new Error("Choose image or video generation.");
    return call({ action: "create", ...options });
  }
  async function status(taskToken) {
    return call({ action: "status", task_token: taskToken });
  }
  async function wait(taskToken, onUpdate, signal) {
    let delay = 2500;
    while (!signal?.aborted) {
      const result = await status(taskToken);
      if (typeof onUpdate === "function") onUpdate(result);
      if (["succeeded", "failed", "canceled"].includes(result.status)) return result;
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        if (signal) signal.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Cancelled", "AbortError")); }, { once: true });
      });
      delay = Math.min(8000, Math.round(delay * 1.35));
    }
    throw new DOMException("Cancelled", "AbortError");
  }
  function outputUrl(output) {
    if (typeof output === "string") return output;
    if (Array.isArray(output)) return output.find(item => typeof item === "string" && /^https:\/\//i.test(item)) || "";
    if (output && typeof output === "object") {
      for (const value of Object.values(output)) {
        if (typeof value === "string" && /^https:\/\//i.test(value)) return value;
        if (Array.isArray(value)) {
          const found = value.find(item => typeof item === "string" && /^https:\/\//i.test(item));
          if (found) return found;
        }
      }
    }
    return "";
  }
  window.ShifACloudMedia = Object.freeze({ create, status, wait, outputUrl });
})();