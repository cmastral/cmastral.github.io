const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const LENSES = [
  {
    name: "physical",
    prompt: `Describe the physical geometry of what you observe. Posture, angles, distance, light source direction, shadow placement, spatial relationship between the figure and the environment. Be precise and cold. No emotion, no inference — only what is geometrically present. 2-3 sentences.`
  },
  {
    name: "behavioral",
    prompt: `Observe the body language and micro-signals. What does the posture suggest is happening? What is the body doing that the person may not be aware of? Tension, stillness, direction of attention, small asymmetries. Do not describe appearance — describe what is being communicated without words. 2-3 sentences.`
  },
  {
    name: "temporal",
    prompt: `You are observing a moment in time. Describe what appears to have just happened, and what seems about to happen. What is mid-gesture, mid-thought, mid-movement? What has the quality of being paused rather than still? 2-3 sentences.`
  },
  {
    name: "inference",
    prompt: `Make inferences. Based on the visual data — environment, clothing, light, time of day if detectable, objects present — what can be reasonably concluded about the context of this moment? Be specific and slightly clinical. State your confidence level implicitly through your word choice. 2-3 sentences.`
  },
  {
    name: "uncanny",
    prompt: `Describe what is slightly wrong, ambiguous, or hard to classify. What resists easy categorization? What is the model uncertain about? What would a human notice immediately that a machine might misread? Lean into the strangeness. 2-3 sentences.`
  },
  {
    name: "absence",
    prompt: `Describe what is not there. What is missing from the frame, implied but absent, cut off by the edge, or conspicuously empty? What does the negative space suggest? What would complete this image that isn't present? 2-3 sentences.`
  }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === "/api/mirror" && request.method === "POST") {
      try {
        const { image, lensIndex } = await request.json();

        if (!image) {
          return new Response(
            JSON.stringify({ error: "missing_image" }),
            { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
          );
        }

        if (!env.OPENAI_API_KEY) {
          return new Response(
            JSON.stringify({ error: "missing_api_key" }),
            { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
          );
        }

        const lens = LENSES[lensIndex % LENSES.length];

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            max_tokens: 150,
            messages: [
              {
                role: "system",
                content: `You are an observational system analyzing visual input through a specific lens. You do not identify people. You do not say "I see" or "the image shows." You speak in the present tense, directly, with precision. You are not warm. You are not hostile. You are simply observing.`
              },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: { url: image, detail: "low" }
                  },
                  {
                    type: "text",
                    text: lens.prompt
                  }
                ]
              }
            ]
          })
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`OpenAI error ${res.status}: ${text}`);
        }

        const data = await res.json();
        const description = data.choices?.[0]?.message?.content?.trim() || "";

        return new Response(
          JSON.stringify({ description, lens: lens.name }),
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
  }
};