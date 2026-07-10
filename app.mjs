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

function scenesView() {
  return `<section class="page"><header class="page-title">场景库</header><p class="subtitle">常去的地方，记住大概温度就好</p><div class="card-grid">
    <article class="mini-card lavender"><span>🏢</span><h3>公司</h3><b>约22°</b><p>体感偏冷</p></article>
    <article class="mini-card yellow"><span>🚇</span><h3>地铁</h3><b>约24°</b><p>体感适中</p></article>
    <article class="mini-card blue"><span>🛍️</span><h3>商场</h3><b>约24°</b><p>体感偏凉</p></article>
    <button class="add-card">＋ 新增场景</button></div></section>`;
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

function render() {
  const root = document.querySelector('#app');
  if (!root) return;
  if (!state.loggedIn) { root.innerHTML = loginView(); return; }
  const views = { home: homeView(state), scenes: scenesView(), wardrobe: wardrobeView(), fitting: fittingView(), calendar: calendarView() };
  root.innerHTML = `<main class="app-shell">${views[state.activeTab]}${nav(state.activeTab)}<div class="toast" aria-live="polite"></div></main>`;
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
    const target = event.target.closest('button');
    if (!target) return;
    if (target.dataset.action === 'login') state = login(state);
    else if (target.dataset.tab) state = navigate(state, target.dataset.tab);
    else if (target.dataset.feedback) { state = submitFeedback(state, target.dataset.feedback); showToast(`已记录：${state.feedback}`); }
    else if (target.dataset.action === 'add-trip') state = addItineraryItem(state, { time:'18:30', scene:'商场', temperature:24, duration:'2小时' });
    else if (target.dataset.action === 'remove-trip') state = removeItineraryItem(state, Number(target.dataset.index));
    else if (target.dataset.action === 'save-look') showToast('搭配已保存');
    else if (target.dataset.scale && selectedCloth) { clothScale += target.dataset.scale === 'up' ? .1 : -.1; clothScale = Math.max(.6, Math.min(1.8, clothScale)); selectedCloth.style.transform = `scale(${clothScale})`; }
    render();
  });
  render();
}
