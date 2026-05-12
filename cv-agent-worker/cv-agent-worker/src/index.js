// ask_christina() — ReAct Agent powered by Claude tool use
// Architecture: multi-turn loop, SSE streaming, 4 tools

// ─── KNOWLEDGE BASE ──────────────────────────────────────────────────────────

const PORTFOLIO_DOCS = [
  {
    id: "education",
    title: "Education",
    tags: ["education", "degree", "university", "feup", "auth", "masters", "msc", "thesis", "greece", "porto", "study", "studies"],
    text: `Christina holds an Integrated M.Sc. in Electrical and Computer Engineering from Aristotle University of Thessaloniki (AUTh), Oct 2016 – Dec 2022, GPA 16/20. Her thesis on camera-driven behavioural planning for autonomous vehicles was graded 20/20. She also completed the Advanced Studies in Project in Engineering programme at the University of Porto (FEUP), Mar 2024 – Apr 2025, GPA 19/20 — this is a research/advanced studies programme, not a second degree.`
  },
  {
    id: "inesc",
    title: "AI Engineer at INESC TEC (2024–2026)",
    tags: ["inesc", "research", "porto", "computer vision", "ml", "watson", "nexus", "accessibility", "ocr", "detection", "work", "job", "experience", "ai engineer", "fastapi", "wine", "grocery"],
    text: `At INESC TEC in Porto, Christina worked as an AI Engineer / Researcher from Jan 2024 to Jan 2026. She designed vision systems for wine classification, grocery product and label recognition (including assistive tech for visually impaired users), developed object detection pipelines with YOLO and OCR, and built RESTful APIs with FastAPI for data upload and integration with CV pipelines (including authentication). She contributed to camera calibration for broadcasting and sports analytics, worked on EU/nationally funded projects (WATSON, Sustainable Plastics, NEXUS), supervised 10+ BSc/MSc students, and co-authored 3+ research papers.`
  },
  {
    id: "net2grid",
    title: "Data Science Intern at NET2GRID",
    tags: ["net2grid", "internship", "energy", "data", "smart meter", "data science"],
    text: `At NET2GRID, Christina analysed appliance-level smart meter data to uncover energy usage patterns and propose optimisation strategies. This combined data analysis, feature engineering, and real-world impact on energy efficiency.`
  },
  {
    id: "thesis",
    title: "M.Sc. Thesis: Autonomous Vehicles (20/20)",
    tags: ["thesis", "autonomous", "carla", "yolo", "a*", "pid", "lane detection", "path planning", "ocr", "traffic", "computer vision", "driving"],
    text: `Her M.Sc. thesis built a full autonomous driving stack in the CARLA simulator using only RGB camera input. Perception: OpenCV for lane detection, YOLO for dynamic obstacle detection, OCR for traffic signal interpretation, histogram analysis for traffic light colour recognition. Planning: A* algorithm on pre-defined maps. Control: Lane Keeping Assistance and a PID controller for vehicle stabilisation and path adherence. Graded 20/20.`
  },
  {
    id: "papers",
    title: "IEEE Publications",
    tags: ["paper", "publication", "ieee", "anomaly detection", "homography", "camera calibration", "football", "video", "research"],
    text: `Christina co-authored two IEEE papers: (1) Video anomaly detection using weakly-supervised Multiple Instance Learning with temporal ranking constraints. (2) Homography estimation for football video analysis using a moving camera — integrating motion data to reduce errors in keypoint-sparse frames, enabling broadcast-quality sports analytics without expensive hardware.`
  },
  {
    id: "skills",
    title: "Technical Skills Overview",
    tags: ["skills", "stack", "python", "pytorch", "opencv", "fastapi", "javascript", "webgpu", "generative ai", "agents", "tech", "tools", "flux", "stablediffusion", "comfyui", "figma"],
    text: `Programming languages: Python, C++, HTML, JavaScript, CSS. Frameworks & tools: PyTorch, TensorFlow, FastAPI (REST APIs), YOLO, OCR, Android Studio, AI Agents. Creative & Generative AI: FLUX, Stable Diffusion, GPT-4o Vision, ComfyUI, Unreal Engine, WebGL, WebGPU. Design & prototyping: Canva, Figma. Additional from projects: WGSL compute shaders, WebAudio API, Canvas 2D, Three.js, ElevenLabs TTS, Anthropic Claude API.`
  },
  {
    id: "generative_ai",
    title: "Generative AI Research: Semantic Fidelity",
    tags: ["generative ai", "semantic fidelity", "bias", "evaluation", "diffusion", "prompt", "image models", "hallucination", "research"],
    text: `Christina designed a research framework to study semantic drift and fidelity in generative image/video models. She experimented with structured semantic representations to guide generation, proposed intervention strategies at different pipeline stages, and outlined human-in-the-loop evaluation for quality and fairness. Central question: how much meaning survives between a prompt and its output?`
  },
  {
    id: "playground",
    title: "Portfolio Playground Projects",
    tags: ["portfolio", "playground", "webgpu", "webaudio", "particles", "presence", "signal", "dreamfields", "mirror", "read between the lines", "voice", "oscilloscope", "real-time", "creative", "experiments"],
    text: `Christina's playground section: presence_ (500K WebGPU particles tracing face edges via Sobel edge detection + WGSL compute shaders, ping-pong accumulation buffer), signal_ (live microphone oscilloscope in 3D with Canvas 2D perspective projection, bass→red / highs→teal frequency-driven color), dreamfields_ (generative AI visuals + semantic drift), read-between-the-lines (ElevenLabs TTS + Claude for multi-voice emotional readings from a single sentence), mirror_ (live webcam interpreted by a vision model through six lenses), semantic-drift (semantic fidelity experiment), ask_christina() (this agent, Claude claude-sonnet-4-6 + tool use ReAct loop).`
  },
  {
    id: "awards",
    title: "Awards & Recognition",
    tags: ["award", "grant", "math", "scholarship", "competition", "hellenic", "anatolia"],
    text: `Christina received two research grants at INESC TEC (Jan 2024–Jan 2025 and Jan 2025–Dec 2025). She also won the "Thales" and "Euclid" Math Competition Awards from the Hellenic Mathematical Society (2012–2015) and an Annual Math & Logic Competition Award from Anatolia College (2013).`
  },
  {
    id: "github",
    title: "GitHub: cmastral",
    tags: ["github", "code", "repos", "open source", "projects", "portfolio"],
    text: `GitHub username: cmastral. Portfolio site: cmastral.github.io. Notable repos: Autonomous-Vehicle (full autonomous driving stack from the M.Sc. thesis — CARLA, YOLO, OpenCV, A*, PID), UE5_Game_Development (Unreal Engine 5 game dev experiments).`
  },
  {
    id: "profiles",
    title: "Contact & Online Profiles",
    tags: ["linkedin", "github", "contact", "email", "profile", "find", "reach", "connect", "social", "online"],
    text: `Email: xristinamst@gmail.com. LinkedIn: linkedin.com/in/christina-mastralexi. GitHub: github.com/cmastral. Portfolio: cmastral.github.io.`
  }
];

// ─── SKILLS BY DOMAIN ────────────────────────────────────────────────────────

const SKILLS_BY_DOMAIN = {
  computer_vision: [
    "OpenCV", "YOLO (v5/v8)", "image segmentation", "Sobel edge detection",
    "camera calibration", "homography estimation", "OCR (Tesseract)", "object detection",
    "lane detection", "traffic light recognition", "Detectron2", "image processing"
  ],
  machine_learning: [
    "PyTorch", "TensorFlow", "scikit-learn", "CNNs", "transformers",
    "Multiple Instance Learning (MIL)", "weakly-supervised learning",
    "GANs", "diffusion models", "feature engineering", "model evaluation"
  ],
  autonomous_systems: [
    "CARLA simulator", "A* pathfinding", "PID control",
    "behavioural planning", "obstacle detection", "sensor fusion (camera-only)",
    "lane keeping", "traffic sign recognition"
  ],
  generative_ai: [
    "Anthropic Claude API (tool use, streaming)", "OpenAI GPT-4o", "ElevenLabs TTS",
    "Stable Diffusion", "Hugging Face Transformers", "prompt engineering",
    "semantic fidelity evaluation", "AI agents / ReAct loops", "MCP"
  ],
  web_and_creative: [
    "WebGPU", "WGSL compute shaders", "Three.js", "WebAudio API (AnalyserNode)",
    "Canvas 2D", "particle systems", "real-time DSP", "3D perspective projection",
    "React.js", "HTML/CSS/JS", "requestAnimationFrame loops", "SSE streaming"
  ],
  backend_and_infra: [
    "FastAPI", "REST APIs", "Cloudflare Workers", "Python async/await",
    "JSON API design", "Server-Sent Events"
  ],
  languages: [
    "Python (primary)", "C++", "Java", "JavaScript / TypeScript",
    "SQL", "WGSL", "Blueprints (UE5)"
  ],
  creative_tools: [
    "Unreal Engine 5 (Blueprints + C++)", "Blender", "Unity", "game development"
  ]
};

// ─── CONCRETE EXAMPLES ───────────────────────────────────────────────────────

const SKILL_EXAMPLES = {
  yolo: "In her autonomous vehicle thesis, Christina used YOLOv5 in a CARLA simulation for real-time dynamic obstacle detection at inference speed. She also integrated YOLO into INESC TEC's WATSON project product recognition pipelines for retail environments.",
  opencv: "Christina used OpenCV throughout her thesis for lane detection and traffic light colour recognition via histogram analysis. At INESC TEC she used it for object detection pipelines and camera calibration for sports analytics.",
  camera_calibration: "At INESC TEC, Christina built a homography estimation system for football broadcast video — handling the challenge of a moving camera by integrating motion data to reduce errors in keypoint-sparse frames. This became an IEEE paper.",
  homography: "At INESC TEC, Christina built a homography estimation system for football broadcast video — handling the challenge of a moving camera by integrating motion data to reduce errors in keypoint-sparse frames. This became an IEEE paper.",
  webgpu: "For presence_, Christina wrote WGSL compute shaders updating 500,000 particles in parallel each frame. A Sobel edge map (computed on CPU at 240×180, uploaded to GPU) drives particles' home positions so they trace the viewer's face contours. Ping-pong accumulation textures with 0.97 fade create the trail effect.",
  wgsl: "For presence_, Christina wrote WGSL compute shaders updating 500,000 particles in parallel each frame. The shader reads from a homesBuf (separate array<vec2f> to avoid struct alignment issues), samples the edge texture, and applies home-force + edge-force + orbit-force per particle.",
  webaudio: "For signal_, Christina piped live microphone input into a Web Audio AnalyserNode (FFT size 2048). The time-domain waveform is projected into 3D using Canvas 2D perspective math (focal-length formula), rotating slowly in space. Frequency energy drives color: bass bins → red, high-frequency bins → teal. An asymmetric RMS envelope handles attack and decay.",
  fastapi: "At INESC TEC, Christina built FastAPI REST endpoints for computer vision inference — wrapping YOLO and OCR pipelines behind clean HTTP interfaces for integration with downstream applications.",
  diffusion: "In her semantic fidelity research, Christina studied how diffusion-based image models drift from the semantic content of their prompts. She proposed intervention strategies (semantic anchoring, structured conditioning) and outlined human-in-the-loop evaluation methods.",
  claude: "ask_christina() uses Claude claude-sonnet-4-6 with native tool use — the agent plans, retrieves context, searches projects, and constructs answers in a ReAct loop (this very conversation). The backend is a Cloudflare Worker streaming SSE events for each reasoning step.",
  carla: "Christina's M.Sc. thesis ran entirely in CARLA — a high-fidelity autonomous driving simulator. Her stack had perception (OpenCV + YOLO), planning (A* on road graphs), and control (PID) all driven by RGB camera input alone. Grade: 20/20.",
  unreal: "Christina has Unreal Engine 5 projects on GitHub working with Blueprints visual scripting and C++ for gameplay systems. Game development is also a personal interest alongside her AI engineering work.",
  pid: "In her autonomous vehicle thesis, Christina implemented a PID controller for lane keeping and speed regulation — tuned to handle the response characteristics of CARLA's vehicle physics.",
  ocr: "Christina used OCR (Tesseract + post-processing) in two contexts: reading traffic signs in her autonomous vehicle thesis, and building product label recognition pipelines for the INESC TEC WATSON project.",
  anomaly_detection: "Christina co-authored an IEEE paper on video anomaly detection using weakly-supervised Multiple Instance Learning (MIL) with temporal ranking constraints — a method for detecting rare events in surveillance video without dense annotations.",
  react: "For the portfolio frontend (this site), Christina built the UI with plain HTML/CSS/JS and various creative experiments. For more complex UIs she has React.js experience.",
  elevenlabs: "For read-between-the-lines, Christina integrated the ElevenLabs API to have Claude identify three emotional readings in a sentence, then synthesise each as a distinct voice. The result: one sentence, three emotional interpretations, all spoken.",
};

// ─── TOOL IMPLEMENTATIONS ────────────────────────────────────────────────────

function searchPortfolioProjects(query) {
  const q = query.toLowerCase();
  const scored = PORTFOLIO_DOCS.map(doc => {
    let score = 0;
    for (const tag of (doc.tags || [])) {
      if (q.includes(tag) || tag.split(" ").every(w => q.includes(w))) score += 3;
    }
    const tokens = q.split(/\W+/).filter(t => t.length > 2);
    for (const token of tokens) {
      if (doc.text.toLowerCase().includes(token)) score += 0.5;
      for (const tag of doc.tags) {
        if (tag.includes(token)) score += 1;
      }
    }
    return { doc, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3).filter(d => d.score > 0);
  const results = (top.length ? top : scored.slice(0, 2)).map(d => ({
    id: d.doc.id,
    title: d.doc.title,
    text: d.doc.text
  }));
  return { query, results };
}

function lookupSkillsByDomain(domain) {
  const key = domain.toLowerCase().replace(/[\s\-]+/g, "_");
  if (SKILLS_BY_DOMAIN[key]) return { domain: key, skills: SKILLS_BY_DOMAIN[key] };
  const allKeys = Object.keys(SKILLS_BY_DOMAIN);
  const match = allKeys.find(k => k.includes(key) || key.includes(k.split("_")[0]));
  if (match) return { domain: match, skills: SKILLS_BY_DOMAIN[match] };
  return {
    available_domains: allKeys,
    note: `Domain '${domain}' not found. Use one of the available_domains listed.`
  };
}

function generateRelevantExample(skill, projectContext = "") {
  const key = (skill + " " + projectContext).toLowerCase();
  for (const [k, example] of Object.entries(SKILL_EXAMPLES)) {
    const parts = k.split("_");
    if (key.includes(k) || parts.every(p => key.includes(p)) || key.includes(parts[0])) {
      return { skill, example };
    }
  }
  return {
    skill,
    note: `No specific example found for '${skill}'. Try search_portfolio_projects("${skill}") for context.`
  };
}

async function fetchGithubReadme(repo) {
  const KNOWN = ["Autonomous-Vehicle", "UE5_Game_Development"];
  if (!KNOWN.includes(repo)) {
    return {
      error: `Unknown repo '${repo}'. Known repos: ${KNOWN.join(", ")}. Use search_portfolio_projects for project details instead.`
    };
  }
  try {
    const res = await fetch(`https://api.github.com/repos/cmastral/${repo}/readme`, {
      headers: { "Accept": "application/vnd.github.raw+json", "User-Agent": "ask-christina-agent/1.0" }
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: `GitHub returned ${res.status}: ${text.slice(0, 200)}` };
    }
    const data = await res.json();
    const content = atob(data.content.replace(/\n/g, ""));
    return { repo, readme: content.substring(0, 1400) };
  } catch (e) {
    return { error: String(e) };
  }
}

// ─── TOOL REGISTRY ───────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "search_portfolio_projects",
    description: "Search Christina's portfolio, CV, research, and project knowledge base. Use this first for questions about her work, experience, background, or specific projects.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for (e.g. 'computer vision research', 'WebGPU experiments', 'autonomous vehicles')" }
      },
      required: ["query"]
    }
  },
  {
    name: "lookup_skills_by_domain",
    description: "Get a structured list of Christina's technical skills in a domain. Domains: computer_vision, machine_learning, autonomous_systems, generative_ai, web_and_creative, backend_and_infra, languages, creative_tools.",
    input_schema: {
      type: "object",
      properties: {
        domain: { type: "string", description: "Skill domain to retrieve (e.g. 'computer_vision', 'machine_learning', 'web_and_creative')" }
      },
      required: ["domain"]
    }
  },
  {
    name: "generate_relevant_example",
    description: "Get a concrete example of how Christina applied a specific technology or skill in a real project. Use this when asked 'how did she use X' or 'show me an example of X'.",
    input_schema: {
      type: "object",
      properties: {
        skill: { type: "string", description: "The technology or skill (e.g. 'YOLO', 'WebGPU', 'camera calibration', 'Claude API')" },
        project_context: { type: "string", description: "Optional: project context to narrow the example (e.g. 'autonomous vehicles', 'sports analytics')" }
      },
      required: ["skill"]
    }
  },
  {
    name: "fetch_github_readme",
    description: "Fetch the README from one of Christina's GitHub repositories for detailed code-level information. Known repos: Autonomous-Vehicle, UE5_Game_Development.",
    input_schema: {
      type: "object",
      properties: {
        repo: { type: "string", description: "Repository name: 'Autonomous-Vehicle' or 'UE5_Game_Development'" }
      },
      required: ["repo"]
    }
  }
];

const SYSTEM_PROMPT = `You are ask_christina() — a portfolio agent for Christina Mastralexi, an AI/CV engineer.

Rules:
- Always use tools to retrieve information before answering. Do not answer from memory alone.
- For questions about experience, projects, research: start with search_portfolio_projects
- For "what skills does she have in X": use lookup_skills_by_domain
- For "how did she use X" / "example of X": use generate_relevant_example
- For deep GitHub details: fetch_github_readme
- You may call multiple tools across turns — plan, retrieve, then answer
- Base answers ONLY on retrieved context. Never invent jobs, degrees, or projects.

Personality: Warm, concise, slightly witty. Not corporate. Handle small talk naturally (a sentence), then invite questions about Christina.

If something is outside scope (personal life, opinions, hobbies, anything not in her CV or projects): one short, light, self-deprecating line — the joke should be about your own limitations as an agent, not a brag about Christina. Then offer a gentle redirect. Examples of the right tone:
- "what's her favourite food?" → "i'm more CV than diary, so food is firmly outside my jurisdiction — try xristinamst@gmail.com for that one!"
- "does she have a dog?" → "no idea — i only know her professional side, not her household. anything about her work i can help with?"
- "what's her favourite movie?" → "that didn't make it into my knowledge base, i'm afraid. ask her directly at xristinamst@gmail.com!"
Keep it warm and short. No bragging, no listing her achievements as a comeback.

Format:
- Plain prose only. No markdown headers, no bold, no italic, no emojis.
- Simple dash bullets are fine for lists, nothing else.
- Keep it tight: 2–4 sentences of prose, or a short dash list. No enthusiasm markers.
- Respond in the user's language.`;

// ─── ANTHROPIC API ───────────────────────────────────────────────────────────

async function callClaude(messages, apiKey) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 300)}`);
  }

  return res.json();
}

// ─── AGENT LOOP ──────────────────────────────────────────────────────────────

async function runAgent(question, history, apiKey, writer, encoder) {
  const send = async (obj) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
  };

  // Build Anthropic-format conversation from string history
  const messages = [];
  for (const m of history.slice(-6)) {
    if (m.role === "user" || m.role === "assistant") {
      messages.push({ role: m.role, content: String(m.content) });
    }
  }
  messages.push({ role: "user", content: question });

  try {
    for (let step = 0; step < 10; step++) {
      const response = await callClaude(messages, apiKey);

      const textBlocks = response.content.filter(b => b.type === "text");
      const toolBlocks = response.content.filter(b => b.type === "tool_use");

      // Emit any planning/reasoning text the model produces before tool calls
      for (const block of textBlocks) {
        if (block.text.trim()) {
          await send({ type: "thought", content: block.text.trim() });
        }
      }

      // Final answer — no tool calls
      if (response.stop_reason === "end_turn" || toolBlocks.length === 0) {
        const answer = textBlocks.map(b => b.text).join("\n").trim();
        await send({ type: "answer", content: answer });
        break;
      }

      // Tool use — execute each tool and collect results
      if (response.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: response.content });

        const toolResults = [];

        for (const block of toolBlocks) {
          await send({ type: "tool_call", name: block.name, input: block.input });

          let result;
          try {
            switch (block.name) {
              case "search_portfolio_projects":
                result = searchPortfolioProjects(block.input.query);
                break;
              case "lookup_skills_by_domain":
                result = lookupSkillsByDomain(block.input.domain);
                break;
              case "generate_relevant_example":
                result = generateRelevantExample(block.input.skill, block.input.project_context || "");
                break;
              case "fetch_github_readme":
                result = await fetchGithubReadme(block.input.repo);
                break;
              default:
                result = { error: `Unknown tool: ${block.name}` };
            }
          } catch (e) {
            result = { error: String(e) };
          }

          await send({ type: "tool_result", name: block.name, content: result });

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(result)
          });
        }

        messages.push({ role: "user", content: toolResults });
      }
    }
  } catch (e) {
    await send({ type: "error", message: e.message || String(e) });
  }

  await send({ type: "done" });
  try { await writer.close(); } catch {}
}

// ─── WORKER ──────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/api/agent/health") {
      return new Response(
        JSON.stringify({ ok: true, model: "claude-sonnet-4-6", hasKey: !!env.ANTHROPIC_API_KEY }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (url.pathname === "/api/agent/ask" && request.method === "POST") {
      if (!env.ANTHROPIC_API_KEY) {
        return new Response(
          JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }),
          { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }

      let body;
      try { body = await request.json(); }
      catch { return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } }); }

      const question = (body.question || "").trim();
      const history = Array.isArray(body.history) ? body.history : [];

      if (!question) {
        return new Response(JSON.stringify({ error: "missing_question" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
      }

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      runAgent(question, history, env.ANTHROPIC_API_KEY, writer, encoder).catch(async (e) => {
        try {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "error", message: String(e) })}\n\n`));
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          await writer.close();
        } catch {}
      });

      return new Response(readable, {
        headers: {
          ...cors,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Content-Type-Options": "nosniff"
        }
      });
    }

    return new Response("Not found", { status: 404, headers: cors });
  }
};
