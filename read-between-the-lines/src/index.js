const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Map emotions to ElevenLabs voice IDs
const VOICE_MAP = {
  grief:      "nPczCjzI2devNBz1zQrb", // Brian — deep, resonant, comforting
  longing:    "JBFqnCBsd6RMkjVDRZzb", // George — warm, captivating storyteller
  rage:       "SOYHLrjzK2X1ezoPC6cr", // Harry — fierce, rough, warrior
  tenderness: "EXAVITQu4vr4xnSDxMaL", // Sarah — mature, reassuring, warm
  wonder:     "FGY2WhTYpPnrIDTdsKH5", // Laura — enthusiast, quirky, open
  shame:      "pFZP5JQG7iQjIQuC4Bku", // Lily — velvety, soft, British
  exhaustion: "pqHfZKP75CvOlQylNhV4", // Bill — wise, old, measured
  cheerful:   "cgSgspJ2msm6clMCkdW9", // Jessica — playful, bright, warm
  excitement: "IKne3meq5aSn9XLyUdCD", // Charlie — energetic, confident, Australian
  nostalgia:  "onwK4e9ZLuTAKqWW03F9", // Daniel — steady, British, formal gravitas
  anxiety:    "TX3LPaxmHKxFdv7VOQHJ", // Liam — young, energetic, fast
  bitterness: "N2lVS1w4EtoT3dr4eOWO", // Callum — husky, gravelly, unsettling edge
  calm:       "SAz9YHcvj6GT2YYXdXww", // River — relaxed, neutral, descriptive says "calm"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── /api/interpret ─────────────────────────────────
    if (url.pathname === "/api/interpret" && request.method === "POST") {
      try {
        const { sentence } = await request.json();

        if (!sentence) {
          return new Response(
            JSON.stringify({ error: "missing_sentence" }),
            { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
          );
        }

        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-opus-4-5",
            max_tokens: 500,
            messages: [{
              role: "user",
              content: `Given this sentence: "${sentence}"

Pick the three most emotionally resonant readings of it from this list:
grief, longing, rage, tenderness, cheerful, wonder, shame, exhaustion, excitement, nostalgia, anxiety, bitterness, calm

Return ONLY a JSON array, no other text:
[
  {"emotion": "emotion_name", "delivery": "one sentence on how the voice should feel and speak"},
  {"emotion": "emotion_name", "delivery": "one sentence on how the voice should feel and speak"},
  {"emotion": "emotion_name", "delivery": "one sentence on how the voice should feel and speak"}
]`
            }]
          })
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Anthropic error ${res.status}: ${text}`);
        }

        const data = await res.json();
        const raw = data.content?.[0]?.text?.trim() || "";
        const emotions = JSON.parse(raw);

        // Attach voice IDs
        const result = emotions.map(e => ({
          ...e,
          voice_id: VOICE_MAP[e.emotion] || Object.values(VOICE_MAP)[0]
        }));

        return new Response(
          JSON.stringify({ emotions: result }),
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

    // // ── /api/speak ──────────────────────────────────────
    // if (url.pathname === "/api/speak" && request.method === "POST") {
    //   try {
    //     const { text, voice_id, delivery } = await request.json();

    //     if (!text || !voice_id) {
    //       return new Response(
    //         JSON.stringify({ error: "missing_text_or_voice" }),
    //         { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    //       );
    //     }

    //     const res = await fetch(
    //       `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
    //       {
    //         method: "POST",
    //         headers: {
    //           "xi-api-key": env.ELEVENLABS_API_KEY,
    //           "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({
    //           text,
    //           model_id: "eleven_multilingual_v2",
    //           voice_settings: {
    //             stability: 0.4,
    //             similarity_boost: 0.8,
    //             style: 0.5,
    //             use_speaker_boost: true
    //           }
    //         })
    //       }
    //     );

    //     if (!res.ok) {
    //       const text = await res.text();
    //       throw new Error(`ElevenLabs error ${res.status}: ${text}`);
    //     }

    //     const audio = await res.arrayBuffer();

    //     return new Response(audio, {
    //       status: 200,
    //       headers: {
    //         ...CORS,
    //         "Content-Type": "audio/mpeg",
    //       }
    //     });

    //   } catch (e) {
    //     console.error(e);
    //     return new Response(
    //       JSON.stringify({ error: e.message || String(e) }),
    //       { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    //     );
    //   }
    // }

    return new Response("Not found", { status: 404, headers: CORS });
  }
};