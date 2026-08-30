export default async function handler(req, res) {
  // Test API route
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      route: "chat",
      model: "gemini-3.5-flash",
      message: "VitaMind AI API is online"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please provide a valid message"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel Environment Variables"
      });
    }

    // FINAL MODEL
    const model = "gemini-3.5-flash";

    const prompt = `You are VitaMind AI, a general wellness education assistant.

Rules:
- Give clear, simple, age-appropriate general health information.
- Do not diagnose diseases or conditions.
- Do not prescribe medicines.
- Do not provide medication doses.
- Do not claim certainty about someone's personal health.
- For serious or urgent symptoms, recommend contacting a qualified healthcare professional or local emergency services.
- Keep answers concise and practical.

User question:
${message}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],

          generationConfig: {
            maxOutputTokens: 700
          }
        })
      }
    );

    // Safely read response
    const rawText = await response.text();

    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        error: "Gemini returned an invalid response"
      });
    }

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed"
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!text) {
      return res.status(500).json({
        error: "Gemini returned an empty response"
      });
    }

    return res.status(200).json({
      text
    });

  } catch (error) {

    console.error("VitaMind AI server error:", error);

    return res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
}
