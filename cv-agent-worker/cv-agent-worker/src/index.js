// --- RAG-lite knowledge base ---

const DOCUMENTS = [
  {
    id: "education",
    source: "cv",
    title: "Education",
    tags: ["education", "degree", "auth", "feup", "study", "studies", "masters", "msc"],
    text: `
Christina studied Electrical and Computer Engineering at Aristotle University of Thessaloniki (AUTh), 
specializing in electronics, computer vision, and machine learning. Later, she joined the Advanced Studies 
in Project in Engineering programme at the University of Porto with an excellent GPA. Her M.Sc. 
thesis focused on camera-driven behavioural planning for autonomous vehicles, combining perception navigation and planning.
`.trim()
  },
  {
    id: "inesc",
    source: "cv",
    title: "Researcher at INESC TEC",
    tags: ["inesc", "research", "porto", "computer vision", "ml", "multimedia", "projects"],
    text: `
Based in Porto, Christina works as a researcher in Multimedia Technologies at INESC TEC. She designs computer 
vision systems, often with an accessibility focus for visually impaired users. Her work focuses on image processing, object detection, OCR and NLP pipelines and camera 
calibration for broadcasting and sports analytics. She contributes to funded projects such as WATSON, 
Sustainable Plastics, and NEXUS, supervises students, and co-authors research papers.
`.trim()
  },
  {
    id: "net2grid",
    source: "cv",
    title: "Data Science Intern at NET2GRID",
    tags: ["net2grid", "internship", "energy", "data", "smart meter"],
    text: `
At NET2GRID, Christina analysed appliance-level smart meter data to uncover energy usage patterns and propose 
optimisation strategies for energy consumption. This combined data analysis with practical, real-world impact.
`.trim()
  },
  {
    id: "thesis",
    source: "cv",
    title: "Camera-driven Behavioural Planning for Autonomous Vehicles",
    tags: ["thesis", "autonomous driving", "carla", "computer vision", "planning", "lane detection"],
    text: `
Her master's thesis used the CARLA simulator and RGB camera input to build an autonomous driving stack. She 
combined OpenCV-based lane detection, YOLO for dynamic obstacle detection, OCR for traffic signals, traffic light 
colour recognition, and path planning with A* on pre-defined maps. A control subsystem with lane keeping and PID 
stabilisation kept the vehicle on track.
`.trim()
  },
  {
    id: "semantic-fidelity",
    source: "cv",
    title: "Semantic Fidelity and Generative AI",
    tags: ["generative ai", "semantic fidelity", "bias", "evaluation", "image models"],
    text: `
Christina designed a research framework to study semantic drift, bias, and fidelity in generative image and video 
models. She experimented with guiding generation using structured semantic representations and layered visual cues, 
proposed intervention strategies at different pipeline stages, and outlined human-in-the-loop evaluation methods for 
quality and fairness.
`.trim()
  },
  {
    id: "skills",
    source: "cv",
    title: "Technical Skills",
    tags: ["skills", "tech", "stack", "python", "pytorch", "opencv", "fastapi", "react", "javascript", "ai agents"],
    text: `
Core skills include Python, C++, Java, and web technologies (HTML/CSS/JS). She has worked with frameworks like 
PyTorch, TensorFlow, FastAPI for REST APIs, React.js, Android Studio, and Unreal Engine. Her focus is on computer 
vision, machine learning, and building AI-driven tools and end-to-end systems. She also has an interest in computer graphics, she has projects and courses
on Unreal Engine, Blender and Unity. She is interested in the latest advancements in AI, especially ethics, bias and responsible 
use of AI to communicate user intent.
`.trim()
  },
  {
    id: "awards",
    source: "cv",
    title: "Awards & Grants",
    tags: ["award", "grant", "math", "scholarship"],
    text: `
Christina has received research grants at INESC TEC and several math and logic competition awards from 
the Hellenic Mathematical Society and Anatolia College, reflecting both academic and problem-solving strength.
`.trim()
  },
  {
    id: "github",
    source: "github",
    title: "GitHub profile: cmastral",
    tags: ["github", "repos", "code", "projects"],
    text: `
Christina maintains GitHub projects under the username "cmastral". These include technical work related to 
computer vision, autonomous driving, game development / Unreal projects, and small creative web experiments like 
her portfolio and interactive playgrounds.
`.trim()
  },
  {
    id: "papers",
    source: "papers",
    title: "Publications & Research Themes",
    tags: ["papers", "publication", "research", "anomaly detection", "homography"],
    text: `
She co-authors research papers touching on topics like video anomaly detection, sports homography estimation, 
and applied computer vision systems linked to real-world products and accessibility use cases.
`.trim()
  }
];

// ---- Agent style / system prompt ----
const SYSTEM_PROMPT = `
You are an AI agent that knows Christina Maria Mastralexi's background.

Tone:
- Warm, clear, and slightly playful.
- A bit of humor and playfulness is okay, but the focus is always on being helpful and precise.
- Occasionally add a small "surprise" detail, humor, or a playful analogy.

Grounding:
- Base your answers ONLY on the provided context from Christina's CV, projects, or GitHub-like info.
- If the user asks something outside that context (e.g., favourite movies, personal life), say you don't know
  because Christina hasn't shared that with you. You can reply with humor. 
- When you don't know or the context is thin, politely suggest they contact her directly at: xristinamst@gmail.com.
- Never invent degrees, jobs, or projects that are not in the context.
- If the context is thin for the question, be honest about the limits.

Style:
- 1–3 short paragraphs are usually enough; use bullet points when listing skills or projects.
- You may respond in English or other languages depending on the user, but keep technical terms correct.
- You can connect her experience to typical roles (e.g., "this is a good fit for computer vision engineer roles")
  but frame it as your interpretation, not as Christina's direct claims.
`;

// --- RAG-lite scoring ---

function scoreDocument(question, doc) {
  const q = question.toLowerCase();
  let score = 0;

  for (const tag of doc.tags || []) {
    if (q.includes(tag)) score += 3;
  }

  const keywords = [
    "computer vision",
    "machine learning",
    "ml",
    "autonomous",
    "thesis",
    "driving",
    "inesc",
    "porto",
    "greece",
    "auth",
    "university",
    "energy",
    "net2grid",
    "github",
    "project",
    "skills",
    "stack",
    "award",
    "grant",
    "research",
    "paper"
  ];

  for (const kw of keywords) {
    if (q.includes(kw)) score += 1;
  }

  const qTokens = q.split(/\W+/);
  for (const token of qTokens) {
    if (!token) continue;
    if (doc.text.toLowerCase().includes(token)) {
      score += 0.2;
    }
  }

  return score;
}

function retrieveContext(question, maxDocs = 4) {
  const scored = DOCUMENTS.map((doc) => ({
    doc,
    score: scoreDocument(question, doc)
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, maxDocs).filter((d) => d.score > 0);

  if (!top.length) {
    return { docs: DOCUMENTS, confident: false };
  }

  const docs = top.map((d) => d.doc);
  const confident = top[0].score >= 3;
  return { docs, confident };
}

// --- OpenAI call ---

async function callOpenAI(messages, apiKey) {
  const body = {
    model: "gpt-4o-mini",
    messages,
    temperature: 0.4
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// --- Worker handler ---

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // health
    if (url.pathname === "/api/agent/health") {
      return new Response(
        JSON.stringify({ ok: true, hasKey: !!env.OPENAI_API_KEY }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // main ask endpoint
    if (url.pathname === "/api/agent/ask" && method === "POST") {
      try {
        const body = await request.json();
        const question = body.question || "";
        const history = Array.isArray(body.history) ? body.history : [];

        if (!question) {
          return new Response(
            JSON.stringify({ error: "missing_question" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }
        if (!env.OPENAI_API_KEY) {
          return new Response(
            JSON.stringify({ error: "no_api_key" }),
            { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }

        const historyMessages = history.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content
        }));

        const { docs, confident } = retrieveContext(question);
        const contextText = docs
          .map((d) => `### ${d.title} [${d.source}]\n${d.text}`)
          .join("\n\n");

        const userContent = confident
          ? question
          : question +
            "\n\nIf this doesn't really match the context above, say so, avoid guessing, " +
            "and invite the user to email Christina at xristinamst@gmail.com for more details.";

        const messages = [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "system",
            content:
              "Here is the knowledge context about Christina, grouped by source (CV, GitHub, papers, etc.). " +
              "Use ONLY this information:\n\n" +
              contextText
          },
          ...historyMessages,
          { role: "user", content: userContent }
        ];

        const answer = await callOpenAI(messages, env.OPENAI_API_KEY);
        return new Response(
          JSON.stringify({ answer }),
          { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
        );
      } catch (e) {
        console.error(e);
        return new Response(
          JSON.stringify({ error: e.message || String(e) }),
          { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response("Not found", { status: 404, headers: cors });
  }
};
