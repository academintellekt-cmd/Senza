// Охота на кружки — HUD single-line & points
const p1 = document.getElementById("player1");
const p2 = document.getElementById("player2");
const scoreTop = document.getElementById("scoreTop");
const scoreBottom = document.getElementById("scoreBottom");
const timerTop = document.getElementById("timerTop");
const timerBottom = document.getElementById("timerBottom");
const pointsTop = document.getElementById("pointsTop");
const pointsBottom = document.getElementById("pointsBottom");
const modal = document.getElementById("endModal");
const resultText = document.getElementById("resultText");
const newGameBtn = document.getElementById("newGameBtn");
const newGameTopBtn = document.getElementById("newGameTop");
const newGameBottomBtn = document.getElementById("newGameBottom");

let score1 = 0, score2 = 0;
let wins1 = 0, wins2 = 0;
let seconds = 20;
let tickTimer = null;
let lastHitTime = {1: 0, 2: 0};
let combo = {1: 0, 2: 0};
let running = false;

// WebAudio (простые бипы)
let audioCtx = null;
function beep(points){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = points >= 3 ? 880 : (points === 2 ? 660 : 520);
    gain.gain.value = 0.001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.16);
  }catch(e){}
}

function placeTarget(container, el, pxSize){
  const tries = 40;
  const w = container.clientWidth;
  const h = container.clientHeight;
  for(let i=0;i<tries;i++){
    const x = Math.random() * (w - pxSize);
    const y = Math.random() * (h - pxSize);
    let ok = true;
    for(const other of container.querySelectorAll(".target")){
      const ox = other.offsetLeft;
      const oy = other.offsetTop;
      const os = other.clientWidth;
      const cx = ox + os/2, cy = oy + os/2;
      const nx = x + pxSize/2, ny = y + pxSize/2;
      const dist = Math.hypot(cx-nx, cy-ny);
      if(dist < (os/2 + pxSize/2 + 4)) { ok = false; break; }
    }
    if(ok){
      el.style.left = `${x}px`;
      el.style.top  = `${y}px`;
      return true;
    }
  }
  el.style.left = `${Math.random()*(w - pxSize)}px`;
  el.style.top  = `${Math.random()*(h - pxSize)}px`;
  return false;
}

function spawnNeeded(container, player){
  while(container.querySelectorAll(".target").length < 2){
    const t = document.createElement("div");
    t.className = "target " + (player===1 ? "p1" : "p2");
    t.dataset.player = String(player);

    const minSide = Math.min(container.clientWidth, container.clientHeight);
    const sizePct = 10 + Math.random()*5;
    const px = Math.max(32, Math.round(minSide * sizePct / 100));
    t.style.width = t.style.height = px + "px";

    placeTarget(container, t, px);

    const life = setTimeout(()=>{
      if(t.isConnected){
        t.remove();
        spawnNeeded(container, player);
      }
    }, 2200);

    t.addEventListener("pointerdown", (e)=>{
      e.preventDefault();
      if(!running) return;
      clearTimeout(life);
      if(t.isConnected) t.remove();
      const rect = container.getBoundingClientRect();
      const localX = (e.clientX ?? (e.touches?.[0]?.clientX||0)) - rect.left;
      const localY = (e.clientY ?? (e.touches?.[0]?.clientY||0)) - rect.top;
      const gained = onHit(player);
      spawnNeeded(container, player);
      showPop(container, localX, localY, gained);
      beep(gained);
    }, {passive:false});

    container.appendChild(t);
  }
}

function showPop(container, x, y, points){
  const pop = document.createElement("div");
  pop.className = "pop " + (points>=3 ? "plus3" : points===2 ? "plus2" : "plus1");
  pop.textContent = points>0 ? "+" + points : "";
  pop.style.left = x + "px";
  pop.style.top  = y + "px";
  container.appendChild(pop);
  setTimeout(()=> pop.remove(), 700);
}

function onHit(player){
  const now = performance.now();
  let points = 1;
  if (now - lastHitTime[player] < 650){
    combo[player] += 1;
  } else {
    combo[player] = 1;
  }
  if (combo[player] === 2) points = 2;
  if (combo[player] >= 3) points = 3;

  lastHitTime[player] = now;
  if(player === 1){ score1 += points; } else { score2 += points; }
  updateHUD();
  return points;
}

function updateHUD(){
  if(pointsTop) pointsTop.textContent = `Очки: ${score1}`;
  if(pointsBottom) pointsBottom.textContent = `Очки: ${score2}`;
  scoreTop.textContent = `Победы: ${wins1} – ${wins2}`;
  scoreBottom.textContent = `Победы: ${wins2} – ${wins1}`;
  p1.classList.toggle("lead", score1 > score2);
  p2.classList.toggle("lead", score2 > score1);
}

function startGame(){
  score1 = 0; score2 = 0;
  combo[1] = combo[2] = 0;
  lastHitTime[1] = lastHitTime[2] = 0;
  seconds = 20;
  running = true;
  document.getElementById("endModal").classList.add("hidden");

  p1.innerHTML = ""; p2.innerHTML = "";
  spawnNeeded(p1, 1);
  spawnNeeded(p2, 2);

  clearInterval(tickTimer);
  timerTop.textContent = String(seconds);
  timerBottom.textContent = String(seconds);
  tickTimer = setInterval(()=>{
    seconds -= 1;
    timerTop.textContent = String(seconds);
    timerBottom.textContent = String(seconds);
    if(seconds <= 0){ endGame(); }
  }, 1000);

  updateHUD();
}

function endGame(){
  running = false;
  clearInterval(tickTimer);
  p1.querySelectorAll(".target").forEach(n=>n.remove());
  p2.querySelectorAll(".target").forEach(n=>n.remove());

  let text = "Ничья";
  if (score1 > score2){ text = "Победил Игрок 1"; wins1 += 1; }
  else if (score2 > score1){ text = "Победил Игрок 2"; wins2 += 1; }

  updateHUD();
  resultText.textContent = text;
  document.getElementById("endModal").classList.remove("hidden");
}

function goToMenu(){ window.location.href = "../../index.html"; }

window.addEventListener("resize", ()=>{
  if(!running) return;
  p1.innerHTML = ""; p2.innerHTML = "";
  spawnNeeded(p1, 1);
  spawnNeeded(p2, 2);
});

newGameBtn.addEventListener("click", startGame);
newGameTopBtn.addEventListener("click", startGame);
newGameBottomBtn.addEventListener("click", startGame);
window.addEventListener("load", startGame);
