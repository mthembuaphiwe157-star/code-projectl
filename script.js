// Background Music
const bgMusic = new Audio("sounds/bgmusic.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.3;

// Sound Effects
const clickSound = new Audio("sounds/click.mp3");
const swapSound = new Audio("sounds/swap.mp3");
const timerSound = new Audio("sounds/timerEnd.mp3");
const finishSound = new Audio("sounds/playerDone.mp3");
const leaderboardSound = new Audio("sounds/leaderboard.mp3");

// ========================================
// SOUND FUNCTIONS
// ========================================

function playClick() {
  clickSound.currentTime = 0;
  clickSound.play();
}

function playSwap() {
  swapSound.currentTime = 0;
  swapSound.play();
}

function playTimer() {
  timerSound.currentTime = 0;
  timerSound.play();
}

function playFinish() {
  finishSound.currentTime = 0;
  finishSound.play();
}

function playLeaderboard() {
  leaderboardSound.currentTime = 0;
  leaderboardSound.play();
}

// ========================================
// START BACKGROUND MUSIC
// ========================================

document.addEventListener("click", () => {
  bgMusic.play();
}, { once: true });


// ========================================
// GLOBAL CLICK SOUNDS
// ========================================

document.addEventListener("click", (e) => {

  if (
    e.target.tagName === "BUTTON" ||
    e.target.classList.contains("big-card") ||
    e.target.classList.contains("subgame-card") ||
    e.target.classList.contains("mode-opt")
  ) {
    playClick();
  }

});


/* ============ Sort Tournament — combined ============ */
const PALETTE_NUM = ['#ff9999','#ffcc99','#ffff99','#ccff99','#99ffff','#99ccff','#cc99ff','#ff99ff'];
const PALETTE_GH  = ["#ffb3ba","#ffdfba","#ffffba","#baffc9","#bae1ff","#d0bfff","#ff6b6b","#81ecec","#ffffff","#adff2f"];
const PALETTE_QS  = ['#f9a8d4','#fdba74','#fde68a','#86efac','#7dd3fc','#c4b5fd','#f87171','#34d399','#ffffff','#a3e635'];
const BOX_COLORS  = ['#fca5a5','#fdba74','#fde68a','#bbf7d0','#bae6fd','#c7d2fe','#ddd6fe'];

const $ = (id) => document.getElementById(id);
const screens = ['landing','bubble-picker','num-setup','num-intro','num-play','num-over',
                 'gh-setup','gh-color','gh-play','gh-modal','gh-over',
                 'quick-setup','quick-color','quick-intro','quick-play','quick-over'];
const history = [];

function show(name, push = true) {
  const cur = screens.find(s => !$('screen-'+s).classList.contains('hidden'));
  if (push && cur && cur !== name) history.push(cur);
  screens.forEach(s => $('screen-'+s).classList.add('hidden'));
  $('screen-'+name).classList.remove('hidden');
  $('backBtn').classList.toggle('hidden', name === 'landing');
}
function back() {
  const prev = history.pop() || 'landing';
  show(prev, false);
}

document.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (go) show(go.dataset.go);
});
$('backBtn').onclick = back;

function flash(msg, ok) {
  const f = $('feedback');
  f.textContent = msg;
  f.className = 'feedback show ' + (ok ? 'correct' : 'wrong');
  setTimeout(() => f.classList.remove('show'), 600);
}

/* ===== mode group helpers ===== */
function wireModeGroup(id, onChange) {
  const g = $(id);
  g.addEventListener('click', (e) => {
    const opt = e.target.closest('.mode-opt'); if (!opt) return;
    [...g.children].forEach(c => c.classList.remove('selected'));
    opt.classList.add('selected');
    onChange(opt.dataset.val);
  });
}

/* ===================== NUMERIC ===================== */
const NUM = { players: 1, diff: 'normal', cur: 1, nums: [], idx: 0, score: 0, time: 60, lb: [], timer: null };
wireModeGroup('num-diff', v => NUM.diff = v);
$('num-start').onclick = () => {
  NUM.players = clamp($('num-players').value, 1, 10);
  NUM.lb = []; NUM.cur = 1;
  $('num-intro-title').textContent = `READY, PLAYER ${NUM.cur}?`;
  show('num-intro');
};
$('num-intro-go').onclick = () => numStartTurn();
$('num-again').onclick = () => show('num-setup');

function numGen() {
  const arr = [];
  for (let i=0;i<8;i++) {
    let val, text;
    if (NUM.diff==='hard') {
      const ops=['+','*','-']; const op=ops[rand(3)];
      const a=rand(11)+2, b=rand(10)+1;
      if(op==='+'){val=a+b;text=`${a}+${b}`;} else if(op==='*'){val=a*b;text=`${a}*${b}`;} else {val=a-b;text=`${a}-${b}`;}
    } else if (NUM.diff==='easy') { val=rand(20)+1; text=val; }
    else { val=rand(100)+1; text=val; }
    arr.push({val, text, color: PALETTE_NUM[i]});
  }
  return numSorted(arr) ? numGen() : arr;
}
const numSorted = a => a.every((_,i)=>i===0||a[i-1].val<=a[i].val);

function numStartTurn() {
  NUM.nums = numGen(); NUM.idx = 0; NUM.score = 0; NUM.time = 60;
  numRender(); numHud();
  show('num-play');
  clearInterval(NUM.timer);
  NUM.timer = setInterval(() => {
    NUM.time--; numHud();
    if (NUM.time <= 0) {

  playTimer();

  numFinalize();
}
  }, 1000);
}
function numHud() {
  $('num-hud-p').textContent = NUM.cur;
  $('num-hud-s').textContent = NUM.score;
  $('num-hud-t').textContent = `00:${String(Math.max(0,NUM.time)).padStart(2,'0')}`;
}
function numRender() {
  const row = $('num-row'); row.innerHTML='';
  NUM.nums.forEach((n,i) => {
    const d = document.createElement('div');
    d.className = 'number-box' + (i===NUM.idx||i===NUM.idx+1 ? ' current-pair' : '');
    d.style.background = n.color; d.textContent = n.text;
    row.appendChild(d);
  });
}
document.querySelectorAll('[data-num-ans]').forEach(b => b.onclick = () => {
  const swap = b.dataset.numAns === '1';
  const v1 = NUM.nums[NUM.idx].val, v2 = NUM.nums[NUM.idx+1].val;
  let ok = false;
  if ((swap && v1>v2) || (!swap && v1<=v2)) {
    ok = true; NUM.score += 10;
    if (swap) {

  [NUM.nums[NUM.idx], NUM.nums[NUM.idx+1]] =
  [NUM.nums[NUM.idx+1], NUM.nums[NUM.idx]];

  playSwap();
}
  } else { NUM.score -= 5; }
  flash(ok?'✓ +10':'✗ -5', ok);
  if (numSorted(NUM.nums)) return numFinalize();
  NUM.idx = (NUM.idx+1 >= NUM.nums.length-1) ? 0 : NUM.idx+1;
  numRender(); numHud();
});
function numFinalize() {
  playFinish();
  clearInterval(NUM.timer);
  NUM.lb.push({id: NUM.cur, score: NUM.score, time: `00:${String(Math.max(0,NUM.time)).padStart(2,'0')}`});
  if (NUM.cur < NUM.players) {
    NUM.cur++;
    $('num-intro-title').textContent = `NEXT: PLAYER ${NUM.cur}`;
    show('num-intro');
  } else {
    const lb = $('num-lb'); lb.innerHTML='';
    [...NUM.lb].sort((a,b)=>b.score-a.score).forEach((e,i) => {
      const r = document.createElement('div'); r.className='lb-row';
      r.innerHTML = `<span>${['🥇','🥈','🥉'][i]||'#'+(i+1)} PLAYER ${e.id}</span><span>${e.score} pts · ⏱ ${e.time}</span>`;
      lb.appendChild(r);
    });
    playLeaderboard();
    show('num-over');
  }
}

/* ===================== GUESS HEIGHT (short -> tall) ===================== */
const GH = { players:1, level:'countdown', cur:0, colors:[], heights:[], pair:0, score:0, time:0, scores:[], timer:null };
wireModeGroup('gh-level', v => GH.level = v);
$('gh-start').onclick = () => {
  GH.players = clamp($('gh-players').value, 1, 10);
  GH.cur = 0; GH.scores = []; GH.colors = [];
  ghRenderColors();
  $('gh-color-title').textContent = `Player ${GH.cur+1}: Pick a Color`;
  show('gh-color');
};
function ghRenderColors() {
  const g = $('gh-colors'); g.innerHTML='';
  PALETTE_GH.forEach(c => {
    const d = document.createElement('div');
    const taken = GH.colors.includes(c);
    d.className = 'color-dot' + (taken ? ' disabled' : '');
    d.style.background = c;
    if (!taken) d.onclick = () => ghStartTurn(c);
    g.appendChild(d);
  });
}
function ghStartTurn(color) {
  GH.colors[GH.cur] = color;
  GH.score = 0; GH.pair = 0;
  GH.time = GH.level==='countdown' ? 60 : 0;
  GH.heights = Array.from({length:6},()=>rand(80)+40);
  $('gh-submit').classList.toggle('hidden', GH.level !== 'stopwatch');
  ghRender(); ghHud();
  show('gh-play');
  clearInterval(GH.timer);
  GH.timer = setInterval(() => {
    if (GH.level==='countdown') {
       GH.time--;
        if (GH.time<=0) {
          playTimer();
          return ghFinish();
        }
    }
    else GH.time++;
    ghHud();
  }, 1000);
}
function ghHud() {
  $('gh-hud-p').textContent = GH.cur+1;
  $('gh-hud-s').textContent = GH.score;
  $('gh-hud-t').textContent = GH.level==='countdown' ? `00:${String(Math.max(0,GH.time)).padStart(2,'0')}` : `${GH.time}s`;
}
function ghRender() {
  const row = $('gh-row'); row.innerHTML='';
  GH.heights.forEach((h,i) => {
    const d = document.createElement('div');
    d.className = 'gh-char' + (i===GH.pair||i===GH.pair+1 ? ' active-pair' : '');
    d.style.fontSize = (h*1.8)+'px';
    d.style.color = GH.colors[GH.cur];
    d.textContent = '🧍🏻‍♂️';
    row.appendChild(d);
  });
}
document.querySelectorAll('[data-gh-ans]').forEach(b => b.onclick = () => {
  const wantsSwap = b.dataset.ghAns === '1';
  const shouldSwap = GH.heights[GH.pair+1] < GH.heights[GH.pair];
  const ok = wantsSwap === shouldSwap;
  GH.score += ok ? 10 : -10;
  flash(ok?'✓ +10':'✗ -10', ok);
  if (wantsSwap) {

  [GH.heights[GH.pair], GH.heights[GH.pair+1]] =
  [GH.heights[GH.pair+1], GH.heights[GH.pair]];

  playSwap();
}
  let np = GH.pair + 1;
  if (np >= GH.heights.length-1) {
    const sorted = GH.heights.every((v,i)=>i===0||GH.heights[i-1]<=v);
    if (sorted && GH.level==='countdown') return ghFinish();
    np = 0;
  }
  GH.pair = np; ghRender(); ghHud();
});
$('gh-submit').onclick = ghFinish;
function ghFinish() {
  playFinish();
  clearInterval(GH.timer);
  GH.scores.push({id: GH.cur+1, score: GH.score, time: GH.level==='countdown' ? 60-GH.time : GH.time, color: GH.colors[GH.cur]});
  $('gh-modal-row').style.display='none';
  $('gh-show').classList.remove('hidden');
  $('gh-proceed').classList.add('hidden');
  show('gh-modal');
}
$('gh-show').onclick = () => {
  const row = $('gh-modal-row'); row.innerHTML=''; row.style.display='flex';
  GH.heights.forEach(h => {
    const d = document.createElement('div'); d.className='gh-char';
    d.innerHTML = `<div style="font-size:${h*1.4}px;line-height:1">🧍🏻‍♂️</div><div class="gh-label">${h}cm</div>`;
    row.appendChild(d);
  });
  $('gh-show').classList.add('hidden');
  $('gh-proceed').classList.remove('hidden');
};
$('gh-proceed').onclick = () => {
  if (GH.cur+1 < GH.players) {
    GH.cur++;
    ghRenderColors();
    $('gh-color-title').textContent = `Player ${GH.cur+1}: Pick a Color`;
    show('gh-color');
  } else {
    const lb = $('gh-lb'); lb.innerHTML='';
    [...GH.scores].sort((a,b)=>b.score-a.score||a.time-b.time).forEach((s,i) => {
      const r = document.createElement('div'); r.className='lb-row'; r.style.color = s.color;
      r.innerHTML = `<span>${['🥇','🥈','🥉'][i]||'#'+(i+1)} PLAYER ${s.id}</span><span>${s.score} · ${s.time}s</span>`;
      lb.appendChild(r);
    });
    playLeaderboard();
    show('gh-over');
  }
};
$('gh-again').onclick = () => show('gh-setup');

/* ===================== QUICK SORT ===================== */
const QS = { players:2, mode:'countdown', list:[], colorIdx:0, cur:0, steps:[], stepIdx:0, score:0, time:0, timer:null };
wireModeGroup('qs-mode', v => QS.mode = v);
$('qs-start').onclick = () => {
  QS.players = clamp($('qs-players').value, 1, 10);
  QS.list = []; QS.colorIdx = 0;
  qsRenderColors();
  $('qs-color-title').textContent = `Player ${QS.colorIdx+1}: Pick a Color`;
  show('quick-color');
};
function qsRenderColors() {
  const g = $('qs-colors'); g.innerHTML='';
  PALETTE_QS.forEach(c => {
    const taken = QS.list.find(p=>p.color===c);
    const d = document.createElement('div');
    d.className = 'color-dot' + (taken ? ' disabled' : '');
    d.style.background = c;
    if (!taken) d.onclick = () => qsPickColor(c);
    g.appendChild(d);
  });
}
function qsPickColor(c) {
  QS.list.push({name:`Player ${QS.colorIdx+1}`, color:c, score:0});
  if (QS.colorIdx+1 < QS.players) {
    QS.colorIdx++;
    qsRenderColors();
    $('qs-color-title').textContent = `Player ${QS.colorIdx+1}: Pick a Color`;
  } else { QS.cur = 0; qsSetupTurn(); }
}
function qsBuildSteps(arr) {
  const steps = [];
  function rec(a, lo, hi) {
    if (lo>=hi) return;
    const mid = Math.floor((lo+hi)/2), pv = a[mid];
    const left=[], right=[];
    for (let i=lo;i<=hi;i++) {
      if (i===mid) continue;
      steps.push({arr:[...a], pivot:mid, compared:i, question:true, answer:a[i]<pv});
      if (a[i]<pv) left.push(a[i]); else right.push(a[i]);
    }
    let idx = lo;
    left.forEach(v=>a[idx++]=v);
    const finalP = idx; a[idx++] = pv;
    right.forEach(v=>a[idx++]=v);
    steps.push({arr:[...a], pivot:finalP, compared:-1, question:false});
    rec(a, lo, finalP-1); rec(a, finalP+1, hi);
  }
  rec([...arr], 0, arr.length-1);
  return steps;
}
function qsSetupTurn() {
  const pool = new Set();
  while (pool.size<7) pool.add(rand(90)+10);
  QS.steps = qsBuildSteps([...pool]);
  QS.stepIdx = 0; QS.score = 0;
  $('qs-intro-title').textContent = `READY, PLAYER ${QS.cur+1}?`;
  show('quick-intro');
}
$('qs-intro-go').onclick = () => {
  QS.time = QS.mode==='countdown' ? 60 : 0;
  qsHud(); qsRenderStep();
  show('quick-play');
  clearInterval(QS.timer);
  QS.timer = setInterval(() => {
    if (QS.mode==='countdown') {
       QS.time--;
        if (QS.time<=0) {
          playTimer();
          return qsEndTurn();
        }
    }
    else QS.time++;
    qsHud();
  }, 1000);
};
function qsHud() {
  $('qs-hud-p').textContent = QS.cur+1;
  $('qs-hud-s').textContent = QS.score;
  const a=Math.abs(QS.time), m=Math.floor(a/60), r=a%60;
  $('qs-hud-t').textContent = `${m}:${r<10?'0':''}${r}`;
}
function qsRenderStep() {
  if (QS.stepIdx >= QS.steps.length) return qsEndTurn();
  const s = QS.steps[QS.stepIdx];
  const row = $('qs-row'); row.innerHTML='';
  s.arr.forEach((v,i) => {
    const d = document.createElement('div');
    let cls='qs-box'; if(i===s.pivot)cls+=' pivot'; if(i===s.compared)cls+=' compared';
    d.className=cls; d.style.background = BOX_COLORS[i % BOX_COLORS.length];
    d.textContent = v; row.appendChild(d);
  });
  const q = $('qs-question');
  if (s.question) {
    q.innerHTML = `<p>Is <strong>${s.arr[s.compared]}</strong> less than pivot <strong>${s.arr[s.pivot]}</strong>?</p>
      <div class="action-row"><button class="btn-action btn-yes" data-qs-ans="1">YES</button>
      <button class="btn-action btn-no" data-qs-ans="0">NO</button></div>`;
    q.querySelectorAll('[data-qs-ans]').forEach(b => b.onclick = () => qsAnswer(b.dataset.qsAns==='1'));
  } else {
    q.innerHTML = `<h3 style="color:#c4b5fd">✓ PIVOT PLACED!</h3>`;
    setTimeout(() => { QS.stepIdx++; qsRenderStep(); }, 900);
  }
}
function qsAnswer(val) {
  const s = QS.steps[QS.stepIdx];
  const ok = val === s.answer;
  QS.score = Math.max(0, QS.score + (ok?10:-5));
  flash(ok?'✓ CORRECT +10':'✗ WRONG -5', ok);
  qsHud();
  setTimeout(() => { QS.stepIdx++; qsRenderStep(); }, 500);
}
function qsEndTurn() {
  playFinish();
  clearInterval(QS.timer);
  QS.list[QS.cur].score = QS.score;
  if (QS.cur+1 < QS.players) { QS.cur++; qsSetupTurn(); }
  else {
    const lb = $('qs-lb'); lb.innerHTML='';
    [...QS.list].sort((a,b)=>b.score-a.score).forEach((p,i) => {
      const r = document.createElement('div'); r.className='lb-row'; r.style.color = p.color;
      r.innerHTML = `<span>${['🥇','🥈','🥉'][i]||'#'+(i+1)} ${p.name}</span><span>${p.score} pts</span>`;
      lb.appendChild(r);
    });
    playLeaderboard();
    show('quick-over');
  }
}
$('qs-again').onclick = () => show('quick-setup');

/* utils */
function rand(n){return Math.floor(Math.random()*n);}
function clamp(v,a,b){v=Number(v)||a;return Math.max(a,Math.min(b,v));}

show('landing', false);