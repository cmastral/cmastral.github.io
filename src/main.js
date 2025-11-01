import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to  hihihih learn more
    </p>
  </div>
`

// Set current year
document.getElementById("year").textContent = new Date().getFullYear();

// Example interactive background
const c = document.getElementById("bg");
const ctx = c.getContext("2d");
let w, h, dots = [];

function resize() {
  w = c.width = innerWidth; h = c.height = innerHeight;
  dots = Array.from({length: 80}, () => ({
    x: Math.random()*w, y: Math.random()*h,
    vx: (Math.random()-0.5)*0.6, vy: (Math.random()-0.5)*0.6
  }));
}
addEventListener("resize", resize); resize();

function frame() {
  ctx.clearRect(0,0,w,h);
  ctx.globalAlpha = 0.6;
  dots.forEach(p=>{
    p.x+=p.vx; p.y+=p.vy;
    if (p.x<0||p.x>w) p.vx*=-1;
    if (p.y<0||p.y>h) p.vy*=-1;
    ctx.beginPath(); ctx.arc(p.x,p.y,1.5,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
  });
  requestAnimationFrame(frame);
}
frame();
