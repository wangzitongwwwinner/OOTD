export const tabs = ['home', 'scenes', 'wardrobe', 'fitting', 'calendar'];
export const homeTitle = '今天穿什么';

const sceneEmoji = { '地铁': '🚇', '公司': '🏢', '午饭外出': '🍜', '商场': '🛍️' };
export function formatItineraryItem(item) {
  return {
    time: item.time,
    scene: `${sceneEmoji[item.scene] || '📍'} ${item.scene}`,
    temperature: `${item.temperature}°`,
    duration: `约${item.duration}`
  };
}

export function createInitialState() {
  return {
    loggedIn: false,
    activeTab: 'home',
    feedback: '',
    scenes: [
      { name: '地铁', temperature: 24, feeling: '适中' },
      { name: '公司', temperature: 22, feeling: '偏冷' },
      { name: '午饭外出', temperature: 33, feeling: '偏热' },
      { name: '商场', temperature: 24, feeling: '偏凉' }
    ],
    itinerary: [
      { time: '08:00', scene: '地铁', temperature: 24, duration: '1小时' },
      { time: '09:00', scene: '公司', temperature: 22, duration: '9小时' },
      { time: '12:00', scene: '午饭外出', temperature: 33, duration: '1小时' }
    ]
  };
}

export const login = state => ({ ...state, loggedIn: true, activeTab: 'home' });
export const navigate = (state, activeTab) => tabs.includes(activeTab) ? { ...state, activeTab } : state;
export const submitFeedback = (state, feedback) => ({ ...state, feedback });
export const addItineraryItem = (state, item) => ({ ...state, itinerary: [...state.itinerary, item] });
export const removeItineraryItem = (state, index) => ({ ...state, itinerary: state.itinerary.filter((_, itemIndex) => itemIndex !== index) });
export const createScene = (state, scene) => ({ ...state, scenes: [...state.scenes, scene] });

const icons = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 11 12 3l9 8v9H15v-6H9v6H3z"/></svg>',
  scenes: '<svg viewBox="0 0 24 24"><path d="M12 22s7-6 7-13a7 7 0 1 0-14 0c0 7 7 13 7 13Z"/><circle cx="12" cy="9" r="2"/></svg>',
  wardrobe: '<svg viewBox="0 0 24 24"><path d="M8 6c0-2 1.5-3 4-3s4 1 4 3l5 4-3 4-2-2v9H8v-9l-2 2-3-4z"/></svg>',
  fitting: '<svg viewBox="0 0 24 24"><path d="m4 20 11-11 4 4L8 24H4zM14 8l2-2 4 4-2 2z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>'
};

const labels = { home: '首页', scenes: '场景库', wardrobe: '衣橱', fitting: '试穿', calendar: '日历' };

function weatherArt() {
  return '<div class="sun"></div><div class="cloud cloud-a"></div><div class="cloud cloud-b"></div>';
}

function loginView() {
  return `<main class="login-view">
    <div class="login-brand">今天穿什么</div>
    <section class="login-hero">${weatherArt()}<div class="login-copy"><strong>记住你的场景温度，</strong><br>每天少一点穿衣纠结。</div><p>同步场景、衣橱和每日穿搭记录</p></section>
    <button class="wechat-login" data-action="login"><span class="wechat-bubbles">●●</span> 微信一键登录</button>
    <p class="legal">登录即表示同意《用户协议》和《隐私政策》</p>
  </main>`;
}

function homeView(state) {
  const feedback = [['😋','穿对了'],['🥵','穿多了'],['🥶','穿少了']];
  return `<section class="page home-page">
    <header class="page-title">${homeTitle}</header>
    <article class="weather-card">
      <div class="weather-meta">📍 上海 · 浦东新区　7月10日 星期二</div>
      <div class="temperature">32°</div>
      <div class="weather-state">晴 · 体感34°</div>
      <div class="weather-details">湿度55%　最高35° / 最低24°</div>
      <div class="weather-visual">${weatherArt()}</div>
    </article>
    <article class="advice-card">
      <div class="advice-label">今天建议这样穿</div>
      <div class="advice-garment" role="img" aria-label="推荐衣物"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6c0-2 1.5-3 4-3s4 1 4 3l5 4-3 4-2-2v9H8v-9l-2 2-3-4z"/></svg></div>
      <h2>短袖 <em>+</em> 薄开衫 <em>+</em> 短裤</h2>
      <p>室外炎热，但公司约<strong>22°C且体感偏冷</strong>，建议<strong>可穿脱两件式</strong>，灵活应对温差。</p>
      <div class="tip">💡 午间外出会很热，薄开衫可留在办公室</div>
      <div class="feedback-row">${feedback.map(([emoji,text]) => `<button class="feedback ${state.feedback===text?'selected':''}" data-feedback="${text}"><b>${emoji}</b>${text}</button>`).join('')}</div>
    </article>
    <div class="section-heading"><h2>今天行程</h2><button data-action="add-trip">＋ 添加</button></div>
    <div class="timeline">${state.itinerary.map((item,index)=>{const row=formatItineraryItem(item);return `<div class="timeline-item"><i></i><strong>${row.time}</strong><div class="trip-parts"><span class="trip-scene">${row.scene}</span><span>${row.temperature}</span><span>${row.duration}</span><button class="trip-delete" data-action="remove-trip" data-index="${index}" aria-label="删除${item.scene}">×</button></div></div>`}).join('')}</div>
  </section>`;
}

function scenesView(state) {
  return `<section class="page"><header class="page-title">场景库</header><p class="subtitle">常去的地方，记住大概温度就好</p><div class="card-grid">
    ${state.scenes.map((scene, index) => `<article class="mini-card ${['lavender','yellow','blue'][index % 3]}"><span>${sceneEmoji[scene.name] || '📍'}</span><h3>${scene.name}</h3><b>约${scene.temperature}°</b><p>体感${scene.feeling}</p></article>`).join('')}
    <button class="add-card" data-action="open-scene">＋ 新增场景</button></div></section>`;
}

function wardrobeView() {
  return `<section class="page"><header class="page-title">我的衣橱</header><p class="subtitle">12 件衣物 · 最近更新今天</p><div class="filter-row"><button class="active">全部</button><button>上衣</button><button>下装</button><button>鞋子</button></div><div class="wardrobe-grid">
    ${[['👕','白色短袖'],['👔','蓝色衬衫'],['👖','直筒长裤'],['🧥','薄开衫'],['👟','白色运动鞋'],['🩳','浅色短裤']].map(([e,n])=>`<article><div>${e}</div><span>${n}</span></article>`).join('')}
  </div><button class="fab">＋</button></section>`;
}

function fittingView() {
  return `<section class="page fitting-page"><header class="page-title">自由试穿</header><p class="subtitle">拖动衣物，自由调整大小与位置</p>
    <div class="fitting-canvas" id="fitting-canvas"><div class="draggable cloth shirt" data-drag>👔</div><div class="draggable cloth pants" data-drag>👖</div><div class="draggable cloth shoes" data-drag>👟</div></div>
    <div class="canvas-tools"><button data-scale="down">缩小</button><button data-scale="up">放大</button><button data-action="save-look">保存搭配</button></div>
  </section>`;
}

function calendarView() {
  const days = Array.from({length:31},(_,i)=>i+1);
  return `<section class="page"><header class="page-title">穿搭日历</header><div class="month-row"><button>‹</button><b>2026年7月</b><button>›</button></div><div class="calendar-grid"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>${days.map(d=>`<button class="day ${[3,7,10,15].includes(d)?'has-look':''} ${d===10?'today':''}">${d}</button>`).join('')}</div><article class="calendar-detail"><b>7月10日 · 今天</b><p>地铁 → 公司 → 午饭外出</p><span>📷 点击上传今天的穿搭照片</span></article></section>`;
}

function nav(active) {
  return `<nav class="tabbar">${tabs.map(tab=>`<button data-tab="${tab}" class="${active===tab?'active':''}">${icons[tab]}<span>${labels[tab]}</span></button>`).join('')}</nav>`;
}

let state = createInitialState();
let selectedCloth = null;
let clothScale = 1;
let activeSheet = '';
let tripDraft = null;

const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[character]);

function tripSheet() {
  const draft = tripDraft || { scene: state.scenes[0].name, time: '18:30', temperature: state.scenes[0].temperature, duration: '1小时' };
  return `<div class="sheet-backdrop" data-action="close-sheet"></div><section class="bottom-sheet" aria-label="添加行程">
    <div class="sheet-handle"></div><header><h2>添加行程</h2><button data-action="close-sheet" aria-label="关闭">×</button></header>
    <div class="sheet-field"><label>选择场景</label><div class="scene-options">${state.scenes.map(scene => `<button class="scene-option ${draft.scene === scene.name ? 'selected' : ''}" data-action="select-scene" data-scene="${escapeHtml(scene.name)}">${sceneEmoji[scene.name] || '📍'} ${escapeHtml(scene.name)}</button>`).join('')}<button class="scene-option create" data-action="open-scene">＋ 新建</button></div></div>
    <label class="sheet-field">温度<input id="trip-temperature" type="number" min="-30" max="60" value="${draft.temperature}" required><span>°C</span></label>
    <div class="sheet-grid"><label class="sheet-field">开始时间<input id="trip-time" type="time" value="${draft.time}" required></label><label class="sheet-field">持续时间<select id="trip-duration"><option ${draft.duration === '30分钟' ? 'selected' : ''}>30分钟</option><option ${draft.duration === '1小时' ? 'selected' : ''}>1小时</option><option ${draft.duration === '2小时' ? 'selected' : ''}>2小时</option><option ${draft.duration === '4小时' ? 'selected' : ''}>4小时</option><option ${draft.duration === '9小时' ? 'selected' : ''}>9小时</option></select></label></div>
    <button class="sheet-submit" data-action="submit-trip">添加到行程</button>
  </section>`;
}

function sceneSheet() {
  return `<div class="sheet-backdrop" data-action="close-sheet"></div><section class="bottom-sheet" aria-label="新建场景">
    <div class="sheet-handle"></div><header><h2>新建场景</h2><button data-action="back-trip" aria-label="返回">‹</button></header>
    <label class="sheet-field">场景名称<input id="scene-name" type="text" maxlength="12" placeholder="例如：健身房" required></label>
    <label class="sheet-field">默认温度<input id="scene-temperature" type="number" min="-30" max="60" placeholder="26" required><span>°C</span></label>
    <label class="sheet-field">体感<select id="scene-feeling"><option>偏冷</option><option selected>适中</option><option>偏热</option></select></label>
    <button class="sheet-submit" data-action="submit-scene">保存场景</button>
  </section>`;
}

function render() {
  const root = document.querySelector('#app');
  if (!root) return;
  if (!state.loggedIn) { root.innerHTML = loginView(); return; }
  const views = { home: homeView(state), scenes: scenesView(state), wardrobe: wardrobeView(), fitting: fittingView(), calendar: calendarView() };
  root.innerHTML = `<main class="app-shell">${views[state.activeTab]}${nav(state.activeTab)}<div class="toast" aria-live="polite"></div>${activeSheet === 'trip' ? tripSheet() : activeSheet === 'scene' ? sceneSheet() : ''}</main>`;
  enableDrag();
}

function showToast(message) {
  const toast = document.querySelector('.toast');
  if (!toast) return;
  toast.textContent = message; toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'), 1500);
}

function enableDrag() {
  document.querySelectorAll('[data-drag]').forEach(el => {
    el.addEventListener('pointerdown', event => {
      selectedCloth = el;
      el.setPointerCapture(event.pointerId);
      const rect = el.getBoundingClientRect();
      const offset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      el.onpointermove = move => {
        const canvas = document.querySelector('#fitting-canvas').getBoundingClientRect();
        el.style.left = `${move.clientX - canvas.left - offset.x}px`;
        el.style.top = `${move.clientY - canvas.top - offset.y}px`;
      };
      el.onpointerup = () => { el.onpointermove = null; el.onpointerup = null; };
    });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', event => {
    const target = event.target.closest('button, [data-action="close-sheet"]');
    if (!target) return;
    if (target.dataset.action === 'login') state = login(state);
    else if (target.dataset.tab) state = navigate(state, target.dataset.tab);
    else if (target.dataset.feedback) { state = submitFeedback(state, target.dataset.feedback); showToast(`已记录：${state.feedback}`); }
    else if (target.dataset.action === 'add-trip') { tripDraft = { scene: state.scenes[0].name, time:'18:30', temperature:state.scenes[0].temperature, duration:'1小时' }; activeSheet = 'trip'; }
    else if (target.dataset.action === 'open-scene') activeSheet = 'scene';
    else if (target.dataset.action === 'back-trip') activeSheet = 'trip';
    else if (target.dataset.action === 'close-sheet') activeSheet = '';
    else if (target.dataset.action === 'select-scene') { const scene = state.scenes.find(item => item.name === target.dataset.scene); tripDraft = { ...tripDraft, scene: scene.name, temperature: scene.temperature }; activeSheet = 'trip'; }
    else if (target.dataset.action === 'submit-scene') {
      const name = document.querySelector('#scene-name').value.trim();
      const temperature = Number(document.querySelector('#scene-temperature').value);
      const feeling = document.querySelector('#scene-feeling').value;
      if (!name || !Number.isFinite(temperature)) { showToast('请完整填写场景信息'); return; }
      state = createScene(state, { name, temperature, feeling });
      tripDraft = { ...tripDraft, scene: name, temperature };
      activeSheet = 'trip';
    }
    else if (target.dataset.action === 'submit-trip') {
      const time = document.querySelector('#trip-time').value;
      const temperature = Number(document.querySelector('#trip-temperature').value);
      const duration = document.querySelector('#trip-duration').value;
      if (!time || !tripDraft?.scene || !Number.isFinite(temperature)) { showToast('请完整填写行程信息'); return; }
      state = addItineraryItem(state, { time, scene: tripDraft.scene, temperature, duration });
      activeSheet = ''; tripDraft = null;
    }
    else if (target.dataset.action === 'remove-trip') state = removeItineraryItem(state, Number(target.dataset.index));
    else if (target.dataset.action === 'save-look') showToast('搭配已保存');
    else if (target.dataset.scale && selectedCloth) { clothScale += target.dataset.scale === 'up' ? .1 : -.1; clothScale = Math.max(.6, Math.min(1.8, clothScale)); selectedCloth.style.transform = `scale(${clothScale})`; }
    render();
  });
  render();
}
