export default async function handler(req, res) {
  // Allow GET request to test if the route is working
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      route: "chat",
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
        error: "Please provide a message"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel Environment Variables"
      });
    }

    // Use GEMINI_MODEL from Vercel if available
    const model =
      process.env.GEMINI_MODEL || "gemini-flash-latest";

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
                  text: `You are VitaMind AI.

You provide general wellness and health education.

Rules:
- Give simple and useful information.
- Do not diagnose diseases.
- Do not prescribe medicines.
- Do not provide medication doses.
- Do not claim certainty about someone's health.
- If someone describes serious or urgent symptoms, tell them to contact a qualified healthcare professional or local emergency services.

User question:
${message}`
                }
              ]
            }
          ],

          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 700
          }
        })
      }
    );

    const data = await response.json();

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
      text: text
    });

  } catch (error) {

    console.error("VitaMind AI error:", error);

    return res.status(500).json({
      error: error.message || "Internal server error"
    });
  }
}
