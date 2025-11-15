import "./style.css";

const $ = (q, root = document) => root.querySelector(q);

// --- Boot intro typing effect ---
const boot = document.getElementById("boot");
const linesEl = document.getElementById("boot-lines");

// the lines that will "type" onto screen
const bootLines = [
  "> INITIALIZING INTERFACE...",
  "> BOOTING SEQUENCE 0.1b",
  "> LOADING QUESTIONABLE IDEAS: [███████████░░░░░░░░░░]",
  "> DEBUGGING REALITY LAYER...",
  "> STATUS: A BIT UNSTABLE",
  "> WELCOME, CURIOUS HUMAN",
  "> SYSTEM READY_"
];

let i = 0, char = 0;
const speed = 40; // typing speed (ms per character)

function typeLine() {
  if (i < bootLines.length) {
    const line = bootLines[i];
    if (char < line.length) {
      linesEl.textContent += line[char++];
      setTimeout(typeLine, speed);
    } else {
      linesEl.textContent += "\n";
      i++; char = 0;
      setTimeout(typeLine, 300);
    }
  } else {
    // fade out once done
    setTimeout(() => {
      boot.style.opacity = 0;
      setTimeout(() => boot.remove(), 700);
    }, 800);
  }
}

window.addEventListener("load", () => typeLine());
// year
$("#year").textContent = new Date().getFullYear();

// theme toggle (keep simple; dark default)
const themeBtn = document.getElementById("theme");
themeBtn.addEventListener("click", () => {
  const light = document.body.classList.toggle("light");
  document.body.classList.toggle("dark", !light);
});
// light mode styles (minimal) via direct classes:
const style = document.createElement("style");
style.textContent = `
  body.light { background:#f6f6f6; color:#0b0b0b; }
  body.light .card { background:rgba(255,255,255,.7); border-color:#e5e5e5; }
  body.light .card:hover { background:#fff; border-color:#bdbdbd; }
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", () => {
  const graphic = document.getElementById("life-path-graphic");
  if (!graphic) return;

  const pathMain = document.getElementById("path-main");
  const pathFuture = document.getElementById("path-future");

  // safety
  if (!pathMain || !pathFuture) return;

  // initial state
  const mainOffset = pathMain.getTotalLength?.() || pathMain.getAttribute("stroke-dasharray") || 180;
  const futureOffset = pathFuture.getTotalLength?.() || pathFuture.getAttribute("stroke-dasharray") || 140;
  pathMain.style.strokeDashoffset = mainOffset;
  pathFuture.style.strokeDashoffset = futureOffset;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // draw lines
        pathMain.style.transition = "stroke-dashoffset 1.1s ease-out";
        pathFuture.style.transition = "stroke-dashoffset 1.1s ease-out 0.25s";
        pathMain.style.strokeDashoffset = "0";
        pathFuture.style.strokeDashoffset = "0";

        // after a bit, gently fade it back so it doesn't dominate
        setTimeout(() => {
          graphic.firstElementChild?.classList.add("opacity-60");
        }, 2000);

        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.3,
    }
  );

  observer.observe(graphic);
});

// Data
const projects = [
  { title: "Autonomous Vehicle Perception", blurb: "Thesis project integrating object detection, behavior prediction & route planning.", link: "https://github.com/cmastral/Autonomous-Vehicle", tags: ["Computer Vision", "Autonomous Vehicles"] },
  { title: "Game Development - Unreal Engine", blurb: "Prototype game development in Unreal Engine 5.", link: "https://github.com/cmastral/UE5_Game_Development", tags: ["Game development","Unreal Engineer", "Computer Graphics"] },
  { title: "Accessibility Mobile App", blurb: "Mobile Application for visually impaired consumers.", link: "https://ieeexplore.ieee.org/document/11166185", tags: ["Accessibility","Human-Computer Interaction"] },
  { title: "Video Anomaly Detection", blurb: "Video Anomaly Detection with temporal constraints.", link: "https://ieeexplore.ieee.org/document/10965669", tags: ["Camera Calibration","Sports", "Broadcasting"] },
  { title: "Camera Calibration", blurb: "Camera Calibration for Football Matches", link: "https://ieeexplore.ieee.org/document/11122448", tags: ["Camera Calibration","Sports", "Broadcasting"] },
];

const log = [
  { date: "2025-11-14", text: "Added Playground Section." },
  { date: "2025-11-1", text: "Deployed this website." },
];

// Render projects
$("#project-count").textContent = `${projects.length} projects`;
document.getElementById("grid").innerHTML = projects.map(p => `
  <a href="${p.link}" target="_blank" class="card block">
    <div class="p-5">
      <div class="flex items-start justify-between">
        <h3 class="text-base font-semibold tracking-tight hover:underline">${p.title}</h3>
        <span class="badge">0/1</span>
      </div>
      <p class="mt-2 text-sm text-zinc-400">${p.blurb}</p>
      <div class="mt-4 flex gap-2 flex-wrap">
        ${p.tags.map(t => `<span class="badge">${t}</span>`).join("")}
      </div>
    </div>
    <div class="hr opacity-0 group-hover:opacity-100"></div>
    <div class="p-5 pt-4 text-xs text-zinc-500">Open ↗</div>
  </a>
`).join("");

// Render log
document.getElementById("log-list").innerHTML = log.map(i => `
  <div class="flex items-start gap-4">
    <div class="mt-1 h-2 w-2 rounded-full bg-fuchsia-500"></div>
    <div>
      <div class="mono text-[11px] text-zinc-500">${i.date}</div>
      <div class="text-sm">${i.text}</div>
    </div>
  </div>
`).join("");
