import fetch from "node-fetch";

export async function getGeminiResponse(prompt) {
  try {
    // Clean the API key thoroughly
    const apiKey = process.env.GEMINI_API_KEY?.trim().replace(/[\r\n]/g, '');

    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      throw new Error(" GEMINI_API_KEY is missing or empty in .env file");
    }

    console.log(" API Key loaded:", apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length - 5));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    console.log("📡 Calling Gemini API...");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(" Gemini API Error Response:", JSON.stringify(data, null, 2));
      throw new Error(`Gemini API failed: ${data.error?.message || 'Unknown error'}`);
    }

    console.log(" Gemini response received successfully");
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error(" Gemini API Error:", error.message);
    throw error;
  }
}