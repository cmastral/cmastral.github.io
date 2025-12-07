const API = "https://cv-agent-worker.cmastral.workers.dev/api/agent/ask"; // <-- your worker URL

const chatEl = document.getElementById("chat");
const formEl = document.getElementById("form");
const inputEl = document.getElementById("input");
const thinkingEl = document.getElementById("thinking");

let history = [];

function addMessage(role, content) {
  const row = document.createElement("div");
  row.className = "row " + role;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;
  row.appendChild(bubble);
  chatEl.appendChild(row);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function setThinking(on) {
  thinkingEl.textContent = on ? "> let me think…" : "";
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = inputEl.value.trim();
  if (!q) return;

  addMessage("user", q);
  history.push({ role: "user", content: q });
  inputEl.value = "";
  setThinking(true);

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, history })
    });
    const data = await res.json();
    setThinking(false);

    if (!res.ok || !data.answer) {
      console.error("error:", data);
      addMessage(
        "assistant",
        "something glitched on my side. maybe try again – or email christina at xristinamst@gmail.com."
      );
      return;
    }

    history.push({ role: "assistant", content: data.answer });
    addMessage("assistant", data.answer);
  } catch (err) {
    console.error(err);
    setThinking(false);
    addMessage(
      "assistant",
      "network error – are we offline? you can always email christina at xristinamst@gmail.com."
    );
  }
});

// seed intro
addMessage(
  "assistant",
  "hi, i'm a small agent that knows christina's CV, research, and projects. ask me about her background, skills, or where her work is heading."
);
