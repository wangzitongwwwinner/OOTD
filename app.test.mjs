import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, login, navigate, submitFeedback, addItineraryItem, removeItineraryItem, createScene, homeTitle, formatItineraryItem } from './app.mjs';

test('微信登录后进入首页', () => {
  const state = login(createInitialState());
  assert.equal(state.loggedIn, true);
  assert.equal(state.activeTab, 'home');
});

test('底部导航可切换五个一级页面', () => {
  const tabs = ['home', 'scenes', 'wardrobe', 'fitting', 'calendar'];
  for (const tab of tabs) {
    assert.equal(navigate(createInitialState(), tab).activeTab, tab);
  }
});

test('穿衣反馈只能选中一个状态', () => {
  const first = submitFeedback(createInitialState(), '穿多了');
  const second = submitFeedback(first, '穿少了');
  assert.equal(second.feedback, '穿少了');
});

test('可向今日行程添加场景', () => {
  const state = addItineraryItem(createInitialState(), {
    time: '18:30', scene: '商场', temperature: 24, duration: '2小时'
  });
  assert.equal(state.itinerary.at(-1).scene, '商场');
  assert.equal(state.itinerary.length, 4);
});

test('新建场景会同步到常用场景库', () => {
  const state = createScene(createInitialState(), { name: '健身房', temperature: 26, feeling: '偏热' });
  assert.deepEqual(state.scenes.at(-1), { name: '健身房', temperature: 26, feeling: '偏热' });
});

test('可从今日行程删除指定场景', () => {
  const initial = createInitialState();
  const state = removeItineraryItem(initial, 1);
  assert.equal(state.itinerary.length, 2);
  assert.equal(state.itinerary[0].scene, initial.itinerary[0].scene);
  assert.equal(state.itinerary[1].scene, initial.itinerary[2].scene);
});

test('首页使用确认后的标题', () => {
  assert.equal(homeTitle, '今天穿什么');
});

test('行程拆分为带表情的场景、温度和时长', () => {
  assert.deepEqual(
    formatItineraryItem({ time: '08:00', scene: '地铁', temperature: 24, duration: '1小时' }),
    { time: '08:00', scene: '🚇 地铁', temperature: '24°', duration: '约1小时' }
  );
});
