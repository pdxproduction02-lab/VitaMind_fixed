module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, route: "chat", message: "VitaMind AI route is online. Send POST with { message }." });
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });

  try {
    const { message } = req.body || {};
    if (!message || typeof message !== "string") return res.status(400).json({ error: "Message is required." });
    if (message.length > 4000) return res.status(400).json({ error: "Message is too long." });

    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: "GEMINI_API_KEY is not configured in Vercel Environment Variables." });

    // Keep the model configurable. Put the exact enabled model ID in GEMINI_MODEL.
    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

    const prompt = `You are VitaMind AI, a concise general wellness education assistant.
Rules:
- Provide general educational information only.
- Do not diagnose illnesses, prescribe treatment, or provide medication dosing.
- Avoid certainty about a user's personal health.
- Keep responses clear, practical, and age-appropriate.
- For severe, urgent, or worrying symptoms, advise contacting a qualified healthcare professional or local emergency services.
User question: ${message}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 700 }
        })
      }
    );

    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; }
    catch {
      return res.status(502).json({ error: "Gemini returned an invalid response. Check GEMINI_MODEL and API configuration." });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || `Gemini request failed (${response.status}).`
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
    return res.status(200).json({ text: text || "No response was generated. Please try again." });
  } catch (error) {
    console.error("VitaMind chat error:", error);
    return res.status(500).json({ error: "Server error: " + (error?.message || "Unknown error") });
  }
};