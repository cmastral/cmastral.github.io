const API = "https://dreamfields-worker.cmastral.workers.dev/api/dream";

const promptEl = document.getElementById("prompt");
const goBtn    = document.getElementById("go");
const stopBtn  = document.getElementById("stop");
const canvas   = document.getElementById("dream");
const ctx      = canvas.getContext("2d");
const statusEl = document.getElementById("status");

// ---------- glitch helpers ----------
function addStatic(ctx, alpha = 0.06) {
  const { width, height } = ctx.canvas;
  const id = ctx.getImageData(0, 0, width, height);
  const data = id.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 255 * alpha;
    data[i] += n; data[i+1] += n; data[i+2] += n;
  }
  ctx.putImageData(id, 0, 0);
}
function rgbShift(ctx, amount = 3) {
  const { width, height } = ctx.canvas;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let y = 0; y < height; y++) {
    for (let x = width - 1; x >= amount; x--) {
      const i = (y * width + x) * 4;
      const j = (y * width + (x - amount)) * 4;
      data[i] = data[j]; // shift red channel
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

// ---------- state ----------
let img = null;
let raf = 0;
let t = 0;
let running = false;

const DURATION = {
  dream:   15000, // ms of dream animation (longer)
  wakeFade: 700,  // fade-to-black
  wakeHold: 650,  // WAKE UP hold
  wakeOut:  350,  // fade-out
};
const GLITCH = {
  duringDream: 0.12,
  duringWake:  0.35,
};

// Phase machine
let phase = "dream"; // "dream" → "wake" → "done"
let phaseT0 = performance.now();
const phaseElapsed = () => performance.now() - phaseT0;
const setPhase = (p) => { phase = p; phaseT0 = performance.now(); };

const setStatus = (s) => { statusEl.textContent = s; };

// ---------- draw loop ----------
function draw() {
  if (!running) return;
  raf = requestAnimationFrame(draw);

  // reset canvas state every frame to avoid leaking filters/composites
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";

  if (!img) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    return;
  }

  // Advance phase timing
  if (phase === "dream" && phaseElapsed() > DURATION.dream) {
    setPhase("wake");
  }

  // -------- dream render --------
  if (phase === "dream") {
    t += 0.003;

    const dx = Math.sin(t) * 8;
    const dy = Math.cos(t * 0.7) * 6;

    // base image
    ctx.globalAlpha = 0.92;
    ctx.drawImage(img, dx, dy, canvas.width, canvas.height);

    // blur pulse
    ctx.filter = `blur(${Math.sin(t)*1.5 + 1.5}px)`;

    // hue shimmer
    ctx.globalCompositeOperation = "hue";
    ctx.fillStyle = `hsl(${(t*50)%360}, 50%, 50%)`;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";

    // occasional chromatic glitch + static
    if (Math.random() < 0.10) rgbShift(ctx, Math.floor(Math.random()*4));
    if (Math.random() < 0.20) addStatic(ctx, 0.08);

    // vignette
    const grd = ctx.createRadialGradient(
      canvas.width/2, canvas.height/2, Math.min(canvas.width, canvas.height)/4,
      canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/1.1
    );
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.24)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.restore();
    return;
  }

  // -------- wake render --------
  if (phase === "wake") {
    const te = phaseElapsed();
    const { wakeFade, wakeHold, wakeOut } = DURATION;

    // fade to black
    if (te <= wakeFade) {
      const k = te / wakeFade;
      ctx.globalAlpha = k;
      ctx.fillStyle = "#000";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.globalAlpha = 1;
    }
    // hold WAKE UP_
    else if (te <= wakeFade + wakeHold) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0,0,canvas.width,canvas.height);

      if (Math.random() > 0.15) {
        ctx.fillStyle = "#f472b6";
        ctx.font = "bold 60px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("WAKE UP_", canvas.width/2, canvas.height/2);
      }

      if (Math.random() < GLITCH.duringWake) {
        ctx.translate((Math.random()-0.5)*6, (Math.random()-0.5)*6);
      }
    }
    // fade out
    else if (te <= wakeFade + wakeHold + wakeOut) {
      const k = 1 - (te - wakeFade - wakeHold) / wakeOut;
      ctx.globalAlpha = k;
      ctx.fillStyle = "#000";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.globalAlpha = 1;
    }
    // done → auto reboot
    else {
      setPhase("done");
      cancelAnimationFrame(raf);
      running = false;
      setStatus("idle");

      // hard clear to black + one last WAKE UP_ frame
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = "#f472b6";
      ctx.font = "bold 60px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("WAKE UP_", canvas.width/2, canvas.height/2);

      // --- reboot after a pause ---
      setTimeout(async () => {
        // Optional: regenerate a new dream each cycle
        // promptEl.value = "dream " + Math.floor(Math.random()*9999);
        // img = await generate(promptEl.value);

        // default: reuse current image, just re-dream it
        phase = "dream";
        phaseT0 = performance.now();
        running = true;
        setStatus("animating");
        draw();
      }, 3000); // 3s pause
    }

    ctx.restore();
    return;
  }

  // -------- done (idle) --------
  // keep the canvas black (no residual frame)
  ctx.fillStyle = "#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();
}

// ---------- API ----------
async function generate(prompt) {
  setStatus("calling model…");
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await r.json();
  if (!data.url) throw new Error("no_image_returned");

  setStatus("loading image…");
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = data.url;
  await new Promise((res, rej) => {
    image.onload = () => res();
    image.onerror = rej;
  });
  return image;
}

// ---------- controls ----------
goBtn.addEventListener("click", async () => {
  try {
    cancelAnimationFrame(raf);
    running = true;
    setStatus("generating…");
    img = await generate(promptEl.value || "neural forest at dawn");
    // start fresh dream cycle
    t = 0;
    setPhase("dream");
    setStatus("animating");
    draw();
  } catch (e) {
    console.error(e);
    setStatus("error");
    alert("Generation failed. Check the server logs.");
  }
});

// Stop → gracefully enter wake phase (don’t hard-cut the frame)
function stop() {
  if (phase === "dream") setPhase("wake");
}
stopBtn.addEventListener("click", stop);

// default prompt
promptEl.value = "electric nostalgia";
