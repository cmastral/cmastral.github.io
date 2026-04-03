const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function generateImage(prompt, hfKey) {
  const HF_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";
  const body = JSON.stringify({ inputs: prompt, parameters: { num_inference_steps: 4 } });
  const headers = { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" };

  // Try up to 3 times — model may be cold or temporarily unavailable
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(HF_URL, { method: "POST", headers, body });

    if (res.ok) {
      const blob = await res.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(blob)));
      return `data:image/jpeg;base64,${base64}`;
    }

    const errText = await res.text();

    // 503 = model loading — wait and retry
    if (res.status === 503 || res.status === 500) {
      if (attempt < 3) {
      await new Promise(r => setTimeout(r, 12000 * attempt));
        continue;
      }
    }

    throw new Error(`HF error ${res.status}: ${errText}`);
  }
}

async function describeImage(imageBase64, originalPrompt, openaiKey) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 80,
      messages: [
        {
          role: "system",
          content: `You are a precise observer. Describe what you see in this image as a single evocative sentence — vivid, specific, present tense. Do not mention that it is an image. Do not use the word "depicts" or "shows". Write as if describing something happening right now. Maximum 15 words.`
        },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageBase64, detail: "low" } },
            { type: "text", text: "Describe what you see in one sentence." }
          ]
        }
      ]
    })
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function semanticSimilarity(text1, text2, openaiKey) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 10,
      messages: [
        {
          role: "system",
          content: `You are a semantic similarity evaluator. Given two sentences, return only a number from 0 to 100 representing how semantically similar they are. 100 = identical meaning, 0 = completely unrelated. Return only the number, nothing else.`
        },
        {
          role: "user",
          content: `Sentence 1: "${text1}"\nSentence 2: "${text2}"\nSimilarity score (0-100):`
        }
      ]
    })
  });
  if (!res.ok) return 0;
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || "0";
  return parseInt(raw.replace(/[^0-9]/g, ""), 10) || 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Single step: generate image from prompt
    if (url.pathname === "/api/generate" && request.method === "POST") {
      try {
        const { prompt } = await request.json();
        
        if (!prompt) return new Response(JSON.stringify({ error: "missing_prompt" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });

        const image = await generateImage(prompt, env.HF_API_KEY);
        return new Response(JSON.stringify({ image }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
      }
    }

    // Single step: describe image → new sentence
    if (url.pathname === "/api/describe" && request.method === "POST") {
      try {
        const { image, originalPrompt } = await request.json();
        if (!image) return new Response(JSON.stringify({ error: "missing_image" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });

        const description = await describeImage(image, originalPrompt, env.OPENAI_API_KEY);
        return new Response(JSON.stringify({ description }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
      }
    }

    // Drift score between original and final
    if (url.pathname === "/api/score" && request.method === "POST") {
      try {
        const { original, final } = await request.json();
        const score = await semanticSimilarity(original, final, env.OPENAI_API_KEY);
        return new Response(JSON.stringify({ score }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
      }
    }

    return new Response("Not found", { status: 404, headers: CORS });
  }
};