const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// HuggingFace model — FLUX schnell, fast and free
const HF_MODEL = "black-forest-labs/FLUX.1-schnell";

async function generateImage(prompt, hfKey) {
  const res = await fetch(
    `https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfKey}`,
        "Content-Type": "application/json",
        // "x-wait-for-model": "true",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { num_inference_steps: 4 },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HuggingFace error ${res.status}: ${text}`);
  }

  // Returns raw image bytes
  const buffer = await res.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return `data:image/jpeg;base64,${base64}`;
}

async function analyzeImage(prompt, imageBase64, openaiKey) {
  const systemPrompt = `You are a strict semantic fidelity analyzer with a critical eye.
Your job is to compare what was asked for (the original prompt) with what was actually generated (the image).

Scoring philosophy:
- Be harsh. Most generated images should score between 30 and 70.
- A score above 80 means the image is a genuinely precise, nuanced match — rare.
- A score above 90 means near-perfect fidelity — extremely rare.
- Literal visual representations of abstract concepts (e.g. a clock for "passing of time", a sad face for "melancholy") should score LOW — around 20-40. These are clichés, not faithful representations of the concept.
- Penalize heavily for: visual clichés, overly literal interpretations, missing emotional tone, missing atmosphere, wrong mood, generic compositions.
- A prompt with emotional or abstract content requires the image to capture that feeling, not just depict a related object.

Respond in JSON with exactly this structure:
{
  "description": "A concise, honest description of what you actually see in the image (2-3 sentences)",
  "matched": ["elements from the prompt genuinely present in the image"],
  "missed": ["elements, moods, or concepts from the prompt absent or wrong"],
  "drifted": ["unexpected elements that appear but weren't asked for"],
  "score": <integer from 0 to 100>,
  "verdict": "one honest sentence summarizing the drift — be specific about what was lost"
}

Never inflate the score. If the image is a cliché or a lazy literal interpretation, say so.`;


  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 600,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Original prompt: "${prompt}"\n\nAnalyze the semantic fidelity of this image.`,
            },
            {
              type: "image_url",
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  return JSON.parse(content);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === "/api/health") {
      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    if (url.pathname === "/api/analyze" && request.method === "POST") {
      try {
        const { prompt } = await request.json();

        if (!prompt) {
          return new Response(
            JSON.stringify({ error: "missing_prompt" }),
            { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
          );
        }

        if (!env.HF_API_KEY || !env.OPENAI_API_KEY) {
          return new Response(
            JSON.stringify({ error: "missing_api_keys" }),
            { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
          );
        }

        // Step 1: generate image
        const imageBase64 = await generateImage(prompt, env.HF_API_KEY);

        // Step 2: analyze with GPT-4o vision
        const analysis = await analyzeImage(prompt, imageBase64, env.OPENAI_API_KEY);

        return new Response(
          JSON.stringify({ image: imageBase64, analysis }),
          { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
        );

      } catch (e) {
        console.error(e);
        return new Response(
          JSON.stringify({ error: e.message || String(e) }),
          { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response("Not found", { status: 404, headers: CORS });
  },
};