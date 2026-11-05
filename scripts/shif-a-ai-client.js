(function () {
  "use strict";
  const URL = "https://qmoxfzgiwamblpouxitn.supabase.co";
  const KEY = "sb_publishable_dsVQ5-5VuIG5n_m0qqNjqw__i5sogpL";
  const MODEL = "gemini-3.8-flash";
  const ENDPOINT = URL + "/functions/v1/shif-a-model-gateway";

  async function request(message, mode) {
    if (!window.ShifAAuth || typeof window.ShifAAuth.getSession !== "function") {
      throw new Error("Login service load नहीं हुई। Page refresh करके फिर कोशिश करें।");
    }
    const auth = await window.ShifAAuth.getSession();
    if (auth.error || !auth.session || !auth.user) {
      throw new Error("Gemini AI इस्तेमाल करने के लिए पहले SHIF-A account में login करें।");
    }
    if (!auth.user.email_confirmed_at) {
      throw new Error("पहले अपने account का email verify करें।");
    }
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": KEY,
        "Authorization": "Bearer " + auth.session.access_token
      },
      body: JSON.stringify({ message: String(message || "").slice(0, 4000), model: MODEL, mode: mode || "chat" })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (data.error === "MODEL_PROVIDER_NOT_CONFIGURED") {
        throw new Error("Gemini API key अभी Supabase Edge Function में configure नहीं हुई है। कोई AI उत्तर generate नहीं हुआ।");
      }
      if (response.status === 429) throw new Error(data.message || "Hourly AI request limit पूरी हो गई है।");
      if (response.status === 401) throw new Error("Login session expire हो गया है। दोबारा login करें।");
      if (response.status === 403) throw new Error(data.message || "इस request की अनुमति नहीं मिली।");
      throw new Error(data.message || "Gemini service अभी जवाब नहीं दे पाई।");
    }
    if (typeof data.answer !== "string" || !data.answer.trim()) throw new Error("Gemini ने खाली उत्तर दिया।");
    return data.answer.trim();
  }

  window.ShifAAI = Object.freeze({ request, model: MODEL });
})();