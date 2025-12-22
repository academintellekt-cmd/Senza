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
const scoresText = document.getElementById("scoresText");
const newGameBtn = document.getElementById("newGameBtn");
const newGameTopBtn = document.getElementById("newGameTop");
const newGameBottomBtn = document.getElementById("newGameBottom");

let score1 = 0, score2 = 0;
let wins1 = 0, wins2 = 0;
let seconds = 30;
let tickTimer = null;
let cycleTimer = null;
let lastHitTime = {1: 0, 2: 0};
let combo = {1: 0, 2: 0};
let running = false;
let activePointers = new Set(); // Отслеживание активных касаний для мультитача
let cycleNumber = 0; // Общий счетчик циклов для обоих игроков

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

function beepBomb(){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = 200;
    gain.gain.value = 0.001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.21);
  }catch(e){}
}

function getRandomPosition(container, pxSize){
  const w = container.clientWidth;
  const h = container.clientHeight;
  const x = Math.random() * (w - pxSize);
  const y = Math.random() * (h - pxSize);
  return {x, y};
}

function placeObject(container, el, pxSize){
  const tries = 40;
  const w = container.clientWidth;
  const h = container.clientHeight;
  for(let i=0;i<tries;i++){
    const x = Math.random() * (w - pxSize);
    const y = Math.random() * (h - pxSize);
    let ok = true;
    for(const other of container.querySelectorAll(".target, .bomb")){
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
  // Если не удалось найти место без пересечений, размещаем случайно
  const pos = getRandomPosition(container, pxSize);
  el.style.left = `${pos.x}px`;
  el.style.top  = `${pos.y}px`;
  return false;
}

function createTarget(container, player){
  const minSide = Math.min(container.clientWidth, container.clientHeight);
  const sizePct = 10 + Math.random()*5;
  const px = Math.max(32, Math.round(minSide * sizePct / 100));
  
  const t = document.createElement("div");
  t.className = "target " + (player===1 ? "p1" : "p2");
  t.dataset.player = String(player);
  t.style.width = t.style.height = px + "px";

  placeObject(container, t, px);

  // Обработка мультитача через pointer events
  const handlePointerDown = (e) => {
    e.preventDefault();
    if(!running) return;
    
    const pointerId = e.pointerId;
    if(activePointers.has(pointerId)) return;
    if(!t.isConnected) return;
    
    activePointers.add(pointerId);
    if(t.isConnected) t.remove();
    
    const rect = container.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    const gained = onHit(player);
    showPop(container, localX, localY, gained);
    beep(gained);
    
    // Создаем новый кружок вместо удаленного
    createTarget(container, player);
    
    setTimeout(() => activePointers.delete(pointerId), 100);
  };
  
  const handlePointerUp = (e) => {
    activePointers.delete(e.pointerId);
  };
  
  const handlePointerCancel = (e) => {
    activePointers.delete(e.pointerId);
  };
  
  t.addEventListener("pointerdown", handlePointerDown, {passive:false});
  t.addEventListener("pointerup", handlePointerUp, {passive:false});
  t.addEventListener("pointercancel", handlePointerCancel, {passive:false});

  container.appendChild(t);
  return t;
}

// SVG бомбы
const bombSVG = `<svg fill="currentColor" height="100%" width="100%" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 512 512">
  <g>
    <path d="m411.313,123.313c6.25-6.25 6.25-16.375 0-22.625s-16.375-6.25-22.625,0l-32,32-9.375,9.375-20.688-20.688c-12.484-12.5-32.766-12.5-45.25,0l-16,16c-1.261,1.261-2.304,2.648-3.31,4.051-21.739-8.561-45.324-13.426-70.065-13.426-105.867,0-192,86.133-192,192s86.133,192 192,192 192-86.133 192-192c0-24.741-4.864-48.327-13.426-70.065 1.402-1.007 2.79-2.049 4.051-3.31l16-16c12.5-12.492 12.5-32.758 0-45.25l-20.688-20.688 9.375-9.375 32.001-31.999zm-219.313,100.687c-52.938,0-96,43.063-96,96 0,8.836-7.164,16-16,16s-16-7.164-16-16c0-70.578 57.422-128 128-128 8.836,0 16,7.164 16,16s-7.164,16-16,16z"/>
    <path d="m459.02,148.98c-6.25-6.25-16.375-6.25-22.625,0s-6.25,16.375 0,22.625l16,16c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688 6.25-6.25 6.25-16.375 0-22.625l-16.001-16z"/>
    <path d="m340.395,75.605c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688 6.25-6.25 6.25-16.375 0-22.625l-16-16c-6.25-6.25-16.375-6.25-22.625,0s-6.25,16.375 0,22.625l15.999,16z"/>
    <path d="m400,64c8.844,0 16-7.164 16-16v-32c0-8.836-7.156-16-16-16-8.844,0-16,7.164-16,16v32c0,8.836 7.156,16 16,16z"/>
    <path d="m496,96.586h-32c-8.844,0-16,7.164-16,16 0,8.836 7.156,16 16,16h32c8.844,0 16-7.164 16-16 0-8.836-7.156-16-16-16z"/>
    <path d="m436.98,75.605c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688l32-32c6.25-6.25 6.25-16.375 0-22.625s-16.375-6.25-22.625,0l-32,32c-6.251,6.25-6.251,16.375-0.001,22.625z"/>
  </g>
</svg>`;

function createBomb(container, player){
  const minSide = Math.min(container.clientWidth, container.clientHeight);
  const sizePct = 10 + Math.random()*5;
  const px = Math.max(32, Math.round(minSide * sizePct / 100));
  
  const bomb = document.createElement("div");
  bomb.className = "bomb " + (player===1 ? "p1" : "p2");
  bomb.dataset.player = String(player);
  bomb.style.width = bomb.style.height = px + "px";
  bomb.innerHTML = bombSVG;
  
  placeObject(container, bomb, px);
  
  // Обработка клика на бомбу
  const handleBombPointerDown = (e) => {
    e.preventDefault();
    if(!running) return;
    
    const pointerId = e.pointerId;
    if(activePointers.has(pointerId)) return;
    if(!bomb.isConnected) return;
    
    activePointers.add(pointerId);
    if(bomb.isConnected) bomb.remove();
    
    const rect = container.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    
    // Отнимаем 5 очков
    if(player === 1){ 
      score1 = Math.max(0, score1 - 5); 
    } else { 
      score2 = Math.max(0, score2 - 5); 
    }
    updateHUD();
    showPop(container, localX, localY, -5);
    beepBomb();
    
    // Создаем новый кружок вместо бомбы
    createTarget(container, player);
    
    setTimeout(() => activePointers.delete(pointerId), 100);
  };
  
  const handleBombPointerUp = (e) => {
    activePointers.delete(e.pointerId);
  };
  
  const handleBombPointerCancel = (e) => {
    activePointers.delete(e.pointerId);
  };
  
  bomb.addEventListener("pointerdown", handleBombPointerDown, {passive:false});
  bomb.addEventListener("pointerup", handleBombPointerUp, {passive:false});
  bomb.addEventListener("pointercancel", handleBombPointerCancel, {passive:false});
  
  container.appendChild(bomb);
  return bomb;
}

function showPop(container, x, y, points){
  const pop = document.createElement("div");
  pop.className = "pop " + (points>=3 ? "plus3" : points===2 ? "plus2" : "plus1");
  pop.textContent = points>0 ? "+" + points : (points < 0 ? String(points) : "");
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

function startCycle(){
  if(!running) return;
  
  cycleNumber += 1;
  
  // Удаляем все объекты с полей
  p1.querySelectorAll(".target, .bomb").forEach(n=>n.remove());
  p2.querySelectorAll(".target, .bomb").forEach(n=>n.remove());
  
  // Определяем, какой тип цикла: каждый третий цикл - 1 кружок + 1 бомба, иначе - 2 кружка
  const isBombCycle = cycleNumber % 3 === 0;
  
  if(isBombCycle){
    // Бомб-цикл: 1 кружок + 1 бомба для каждого игрока
    createTarget(p1, 1);
    createBomb(p1, 1);
    createTarget(p2, 2);
    createBomb(p2, 2);
  } else {
    // Обычный цикл: 2 кружка для каждого игрока
    createTarget(p1, 1);
    createTarget(p1, 1);
    createTarget(p2, 2);
    createTarget(p2, 2);
  }
}

function startGame(){
  score1 = 0; score2 = 0;
  combo[1] = combo[2] = 0;
  lastHitTime[1] = lastHitTime[2] = 0;
  cycleNumber = 0;
  seconds = 30;
  running = true;
  document.getElementById("endModal").classList.add("hidden");

  p1.innerHTML = ""; p2.innerHTML = "";

  clearInterval(tickTimer);
  clearInterval(cycleTimer);
  
  timerTop.textContent = String(seconds);
  timerBottom.textContent = String(seconds);
  
  tickTimer = setInterval(()=>{
    seconds -= 1;
    timerTop.textContent = String(seconds);
    timerBottom.textContent = String(seconds);
    if(seconds <= 0){ endGame(); }
  }, 1000);
  
  // Запускаем циклы каждые 2.5 секунды
  cycleTimer = setInterval(()=>{
    startCycle();
  }, 2500);
  
  // Запускаем первый цикл сразу
  startCycle();

  updateHUD();
}

function endGame(){
  running = false;
  clearInterval(tickTimer);
  clearInterval(cycleTimer);
  activePointers.clear(); // Очищаем активные касания
  p1.querySelectorAll(".target, .bomb").forEach(n=>n.remove());
  p2.querySelectorAll(".target, .bomb").forEach(n=>n.remove());

  let text = "Ничья";
  if (score1 > score2){ text = "Победил Игрок 1"; wins1 += 1; }
  else if (score2 > score1){ text = "Победил Игрок 2"; wins2 += 1; }

  updateHUD();
  resultText.textContent = text;
  scoresText.textContent = `Оранжевый ${score1} очков, Синий ${score2} очков`;
  document.getElementById("endModal").classList.remove("hidden");
}

function goToMenu(){ window.location.href = "../../index.html"; }

window.addEventListener("resize", ()=>{
  if(!running) return;
  activePointers.clear(); // Очищаем активные касания при изменении размера
  // При изменении размера пересоздаем объекты на новых позициях
  p1.querySelectorAll(".target, .bomb").forEach(n=>{
    const player = parseInt(n.dataset.player);
    n.remove();
    if(n.classList.contains("bomb")){
      createBomb(p1, player);
    } else {
      createTarget(p1, player);
    }
  });
  p2.querySelectorAll(".target, .bomb").forEach(n=>{
    const player = parseInt(n.dataset.player);
    n.remove();
    if(n.classList.contains("bomb")){
      createBomb(p2, player);
    } else {
      createTarget(p2, player);
    }
  });
});

newGameBtn.addEventListener("click", startGame);
newGameTopBtn.addEventListener("click", startGame);
newGameBottomBtn.addEventListener("click", startGame);
window.addEventListener("load", startGame);
