export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // CORS headers
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // HEALTH CHECK
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({
        ok: true,
        hasToken: !!env.REPLICATE_API_TOKEN
      }), {
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    // DREAM GENERATION
    if (url.pathname === "/api/dream" && method === "POST") {
      try {
        const { prompt } = await request.json();

        const create = await fetch(
          "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
          {
            method: "POST",
            headers: {
              "Authorization": `Token ${env.REPLICATE_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: { prompt, steps: 20, guidance: 3 }
            })
          }
        );

        const start = await create.json();
        if (!create.ok) {
			console.error("CREATE ERROR:", start);
			return new Response(JSON.stringify(start), {
				status: create.status,
				headers: { ...cors, "Content-Type": "application/json" }
			});
}

        let result = start;
        while (result.status === "starting" || result.status === "processing") {
          await new Promise((res) => setTimeout(res, 1500));
          const poll = await fetch(
            `https://api.replicate.com/v1/predictions/${start.id}`,
            {
              headers: { "Authorization": `Token ${env.REPLICATE_API_TOKEN}` }
            }
          );
          result = await poll.json();
        }

        if (result.status !== "succeeded") {
			console.error("POLL ERROR:", result);
			return new Response(JSON.stringify(result), {
				status: 500,
				headers: { ...cors, "Content-Type": "application/json" }
			});
			}

        const output = Array.isArray(result.output)
          ? result.output[0]
          : result.output;

        return new Response(JSON.stringify({ url: output }), {
          headers: { ...cors, "Content-Type": "application/json" }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" }
        });
      }
    }

    // FALLBACK 404
    return new Response("Not found", { status: 404, headers: cors });
  }
}
