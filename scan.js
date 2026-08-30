module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, route: "scan", message: "VitaMind scanner route is online. Send POST with { image }." });
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed. Use POST." });

  try {
    const { image } = req.body || {};
    if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
      return res.status(400).json({ error: "A valid image is required." });
    }

    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: "Unsupported image format." });

    const mimeType = match[1];
    const base64 = match[2];
    if (base64.length > 4_500_000) {
      return res.status(413).json({ error: "Image is too large. Use a smaller or clearer photo." });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: "GEMINI_API_KEY is not configured in Vercel Environment Variables." });

    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
    const instruction = `Analyze this image of a food package, ingredient list, or nutrition label.
Return concise plain text using these headings when information is visible:
Product/Label
Ingredients
Allergens
Notes

Rules:
- Only report information visible in the image or directly readable from it.
- Do not invent missing ingredients, nutrition values, or allergens.
- Do not diagnose or say a product is safe for a particular person.
- End with: Check the original package for exact ingredient, allergen, nutrition, and safety information.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: instruction },
              { inlineData: { mimeType, data: base64 } }
            ]
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 900 }
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
        error: data?.error?.message || `Gemini scan failed (${response.status}).`
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
    return res.status(200).json({
      text: text || "I couldn't read enough information from this image. Try a clearer photo."
    });
  } catch (error) {
    console.error("VitaMind scan error:", error);
    return res.status(500).json({ error: "Server error: " + (error?.message || "Unknown error") });
  }
};