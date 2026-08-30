export default async function handler(req, res) {
  // Test whether the Vercel route is deployed
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      route: "scan",
      model: "gemini-3.5-flash",
      message: "VitaMind Scanner API is online"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { image } = req.body || {};

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        error: "Image is required"
      });
    }

    if (!image.startsWith("data:image/")) {
      return res.status(400).json({
        error: "Invalid image format"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel Environment Variables"
      });
    }

    const model = "gemini-3.5-flash";

    // Separate data URL into metadata + base64
    const commaIndex = image.indexOf(",");

    if (commaIndex === -1) {
      return res.status(400).json({
        error: "Invalid image data"
      });
    }

    const header = image.substring(0, commaIndex);
    const base64Image = image.substring(commaIndex + 1);

    if (!base64Image) {
      return res.status(400).json({
        error: "Image data is empty"
      });
    }

    const mimeMatch = header.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64$/
    );

    const mimeType = mimeMatch?.[1] || "image/jpeg";

    const prompt = `
You are VitaMind's Food Label Education Scanner.

Analyze ONLY the information that is clearly visible in the uploaded food package, ingredient list, or nutrition label.

Your response MUST be concise, specific, easy to scan, and divided into the exact sections below.

Do NOT combine all information into one paragraph.

FORMAT:

PRODUCT
- Product name: [visible name]
- Category: [food category if reasonably clear]

INGREDIENTS
- List the clearly readable ingredients.
- Keep the ingredient names exactly as visible whenever possible.
- If the ingredient list is not visible or readable, write: "Not clearly visible."

POSITIVE SIDES
- Mention only genuinely positive or useful observations supported by the visible label.
- Examples: source of protein, fibre present, specific vitamins/minerals listed, whole-grain ingredient, etc.
- Do NOT call a product "healthy", "safe", "good for weight loss", or similar unless the label itself clearly supports the statement.
- If no meaningful positive observation can be made, write: "No specific positive feature can be confirmed from the visible label."

NEGATIVE SIDES
- Mention only potential concerns supported by the visible label.
- Examples: high sugar, high sodium, saturated fat present, long ingredient list, added sweeteners, or notable allergens.
- Do NOT exaggerate or make medical claims.
- If no specific concern can be confirmed, write: "No specific concern can be confirmed from the visible label."

NUTRITION SNAPSHOT
- Calories: [value + serving basis]
- Protein: [value + serving basis]
- Carbohydrates: [value + serving basis]
- Total sugars: [value + serving basis]
- Added sugars: [value + serving basis if visible]
- Fat: [value + serving basis]
- Saturated fat: [value + serving basis if visible]
- Sodium: [value + serving basis if visible]
Only include nutrients that are actually visible.
Never guess missing values.

ALLERGENS
- List allergens explicitly declared on the package.
- If none are visible, say: "No allergen statement clearly visible."

BASIC TERMS EXPLAINED
Explain ONLY important label terms that may be unfamiliar to a general user.
Use this format:
- Term — simple explanation.
Examples:
- Serving size — the amount the nutrition values refer to.
- Saturated fat — a type of dietary fat found in foods such as butter and some processed foods.
- Added sugar — sugar added during food preparation or manufacturing.
- Sodium — a mineral commonly present in salt and used in nutrition labeling.

Do not explain common words unnecessarily.
Only explain terms that are actually visible or relevant to understanding this label.

QUICK TAKE
Give exactly 2–3 short bullet points summarizing the most important things a user should notice about this specific label.

IMPORTANT RULES:
1. Use ONLY information clearly visible in the image.
2. Never invent ingredients, nutrition values, allergens, serving sizes, or claims.
3. If text is unreadable, write "Not clearly visible."
4. Do not diagnose diseases or medical conditions.
5. Do not prescribe diets, supplements, or treatments.
6. Do not claim that a product is safe or unsafe for a specific person.
7. Do not compare the product with another product unless the user asks.
8. Keep observations specific to this product.
9. Avoid generic health lectures.
10. Do not repeat the same information in multiple sections.
11. Keep the entire response concise.
12. Always mention the serving basis when reporting nutrition values.
13. End with exactly:
"Always check the original package for exact ingredient, allergen, and nutrition information."
`;

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
              role: "user",
              parts: [
                {
                  text: prompt
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                  }
                }
              ]
            }
          ],

          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1500
          }
        })
      }
    );

    const rawText = await response.text();

    let data;

    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("Gemini returned non-JSON:", rawText);

      return res.status(502).json({
        error: "Gemini returned an invalid server response"
      });
    }

    if (!response.ok) {
      console.error("Gemini Scanner API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini scan request failed"
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

    if (!text) {
      return res.status(500).json({
        error: "Gemini returned an empty scan result"
      });
    }

    return res.status(200).json({
      text
    });

  } catch (error) {
    console.error("VitaMind Scanner server error:", error);

    return res.status(500).json({
      error: error.message || "Scanner server error"
    });
  }
      }
