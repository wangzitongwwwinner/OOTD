import React, { useState, useEffect } from "react";
import { Scene, ItineraryItem, WeatherInfo, AiRecommendation, User } from "../types";

interface HomeViewProps {
  user: User;
  scenes: Scene[];
  itineraries: ItineraryItem[];
  onAddItinerary: (item: ItineraryItem) => void;
  onDeleteItinerary: (id: string) => void;
  onUpdateItinerary?: (item: ItineraryItem) => void;
  onOpenProfile: () => void;
  onTabChange: (tab: "home" | "scenes" | "wardrobe" | "tryon") => void;
}

export default function HomeView({
  user,
  scenes,
  itineraries,
  onAddItinerary,
  onDeleteItinerary,
  onUpdateItinerary,
  onOpenProfile,
  onTabChange,
}: HomeViewProps) {
  // Web prototype: represent the city returned by WeChat location as read-only.
  const selectedCity = "上海市";
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);

  // Itinerary addition form states
  const [showAddItin, setShowAddItin] = useState(false);
  const [newItinTime, setNewItinTime] = useState("08:30");
  const [newItinSceneId, setNewItinSceneId] = useState("");
  const [newItinDuration, setNewItinDuration] = useState(2);
  const [editingItineraryId, setEditingItineraryId] = useState<string | null>(null);

  // Fetch weather for the city identified by WeChat location.
  const fetchWeather = async (city: string) => {
    setLoadingWeather(true);
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      setWeather(data);
    } catch (e) {
      console.error("Error fetching weather:", e);
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity]);

  // Handle generating clothes recommendations with a simulated multi-step loader
  const handleGenerateRecommendation = async () => {
    setGenerating(true);
    setGeneratingStep(0);

    const stepInterval = setInterval(() => {
      setGeneratingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    try {
      // Map itineraries with scene data for API payload
      const itinPayload = itineraries.map((it) => {
        const scene = scenes.find((s) => s.id === it.sceneId);
        return {
          time: it.time,
          name: scene?.name || "未知场景",
          temperature: it.temperature,
          feel: scene?.feel || "舒适",
          duration: it.duration,
        };
      });

      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weather: weather,
          itineraries: itinPayload,
          recentFeel: user.recentFeel,
        }),
      });

      const data = await res.json();
      setRecommendation(data);
    } catch (e) {
      console.error("Error generating recommendation:", e);
    } finally {
      clearInterval(stepInterval);
      setGenerating(false);
    }
  };

  // Pre-fill the default selected scene on drawer open
  useEffect(() => {
    if (scenes.length > 0 && !newItinSceneId) {
      setNewItinSceneId(scenes[0].id);
    }
  }, [scenes, newItinSceneId]);

  const handleEditItineraryClick = (it: ItineraryItem) => {
    setEditingItineraryId(it.id);
    setNewItinTime(it.time);
    setNewItinSceneId(it.sceneId);
    setNewItinDuration(it.duration);
    setShowAddItin(true);
  };

  const handleCloseAddItin = () => {
    setShowAddItin(false);
    setEditingItineraryId(null);
    setNewInitsToDefault();
  };

  const setNewInitsToDefault = () => {
    setNewItinTime("08:30");
    if (scenes.length > 0) {
      setNewItinSceneId(scenes[0].id);
    }
    setNewItinDuration(2);
  };

  const handleAddItinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedScene = scenes.find((s) => s.id === newItinSceneId);
    if (!selectedScene) return;

    if (editingItineraryId) {
      const updatedItem: ItineraryItem = {
        id: editingItineraryId,
        time: newItinTime,
        sceneId: newItinSceneId,
        temperature: selectedScene.temperature,
        duration: Number(newItinDuration),
      };
      if (onUpdateItinerary) {
        onUpdateItinerary(updatedItem);
      } else {
        onDeleteItinerary(editingItineraryId);
        onAddItinerary(updatedItem);
      }
      setEditingItineraryId(null);
    } else {
      const newItem: ItineraryItem = {
        id: `itin-${Date.now()}`,
        time: newItinTime,
        sceneId: newItinSceneId,
        temperature: selectedScene.temperature,
        duration: Number(newItinDuration),
      };
      onAddItinerary(newItem);
    }
    setShowAddItin(false);
    setNewInitsToDefault();
  };

  // Multi-step loading messages
  const generatingMessages = [
    "分析当日紫外线系数与湿度分布...",
    "校准写字楼、商场、地铁温差曲线...",
    "正在融入您的「最近体感偏好」...",
    "综合全天行程，编排穿脱方案..."
  ];

  return (
    <div id="home_screen" className="relative pb-28 min-h-screen bg-[#faf9f7] text-[#1a1c1b] font-sans max-w-md mx-auto shadow-xl">
      {/* Top Header Bar */}
      <header className="flex justify-between items-center px-6 py-4 bg-white/70 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100">
        <div className="flex items-center space-x-1">
          <span className="material-symbols-outlined text-gray-800 text-2xl font-semibold">wb_sunny</span>
          <span className="font-serif text-xl font-extrabold tracking-tight text-gray-900">穿衣有数</span>
        </div>

        {/* Profile Avatar Trigger */}
        <button
          id="avatar_profile_trigger"
          onClick={onOpenProfile}
          className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden shadow-sm hover:ring-2 hover:ring-black transition-all cursor-pointer"
        >
          <img src={user.avatar} alt="Profile" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        </button>
      </header>

      {/* Weather Dashboard Widget */}
      <section className="px-6 mt-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-soft flex flex-col relative overflow-hidden">
          {/* Read-only city identified by WeChat location */}
          <div className="flex justify-between items-center z-10">
            <div
              id="located_city"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e1da] bg-[#f4f3f1] py-1.5 pl-3 pr-3 text-xs"
              aria-label={`微信定位城市：${selectedCity}`}
            >
              <span className="material-symbols-outlined text-sm text-[#685c50]">location_on</span>
              <span className="font-bold text-[#1a1c1b]">{selectedCity}</span>
              <span className="h-3 w-px bg-[#cfc4bd]" aria-hidden="true" />
              <span className="text-[10px] font-medium text-[#7e756f]">微信定位</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-[#685c50] tracking-wider uppercase bg-[#f0e0d0]/50 rounded-full px-2.5 py-0.5">
                {weather?.source || "和风天气"}
              </span>
              <button
                onClick={() => fetchWeather(selectedCity)}
                disabled={loadingWeather}
                className="w-7 h-7 rounded-full bg-gray-50 border border-gray-200 hover:border-black flex items-center justify-center text-gray-500 hover:text-black transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                title="刷新天气"
              >
                <span className={`material-symbols-outlined text-sm ${loadingWeather ? "animate-spin" : ""}`}>
                  refresh
                </span>
              </button>
            </div>
          </div>

          {loadingWeather ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-2">
              <span className="material-symbols-outlined text-2xl text-gray-400 animate-spin">sync</span>
              <span className="text-xs text-gray-400">更新气象数据中...</span>
            </div>
          ) : weather ? (
            <div className="mt-4 flex justify-between items-end z-10">
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-400 font-medium">{weather.date}</span>
                <span className="font-serif text-5xl font-extrabold tracking-tighter text-gray-900 mt-1">
                  {weather.temperature}°C
                </span>
                <span className="text-sm font-semibold text-gray-800 mt-1">{weather.weather}</span>
              </div>

              <div className="flex flex-col text-right text-xs text-gray-500 space-y-1">
                <div className="flex justify-end space-x-1.5">
                  <span className="text-gray-400">体感温:</span>
                  <span className="font-semibold text-gray-800">{weather.feelsLike}°C</span>
                </div>
                <div className="flex justify-end space-x-1.5">
                  <span className="text-gray-400">全温差:</span>
                  <span className="font-semibold text-gray-800">
                    {weather.low}°C ~ {weather.high}°C
                  </span>
                </div>
                <div className="flex justify-end space-x-1.5">
                  <span className="text-gray-400">紫外线:</span>
                  <span className="font-semibold text-gray-800">{weather.uvIndex}</span>
                </div>
                <div className="flex justify-end space-x-1.5">
                  <span className="text-gray-400">风速级:</span>
                  <span className="font-semibold text-gray-800">{weather.windSpeed}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-red-500">
              无法读取气象，请稍后重试
            </div>
          )}
        </div>
      </section>

      {/* AI Wardrobe Recommendation Section */}
      <section className="px-6 mt-8">
        {!recommendation && !generating ? (
          <div className="bg-[#2d2926] rounded-3xl p-6 text-center text-white shadow-lg shadow-black/10 flex flex-col items-center">
            <span className="material-symbols-outlined text-3xl text-gray-300 animate-pulse">cognition</span>
            <h4 className="font-serif text-lg font-bold mt-2">点击生成 AI 全天通勤建议</h4>
            <p className="text-xs text-white/70 max-w-[280px] mt-1.5 leading-relaxed font-light">
              融合当前城市的室外气温、空气湿度、紫外线及您今日的整套多场景行程，推荐最合理的穿脱搭配组合。
            </p>
            <button
              id="trigger_recommend_btn"
              onClick={handleGenerateRecommendation}
              className="mt-5 bg-white text-[#181512] font-semibold text-xs px-6 py-3 rounded-full hover:bg-gray-100 transition-all active:scale-95 shadow-md flex items-center space-x-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">smart_toy</span>
              <span>生成穿衣决策</span>
            </button>
          </div>
        ) : generating ? (
          <div className="bg-[#2d2926] rounded-3xl p-8 text-center text-white shadow-lg flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin mb-4" />
            <h4 className="font-serif text-md font-bold text-white">衣橱 AI 正在研判温度中...</h4>
            <p className="text-xs text-white/70 max-w-[240px] mt-2 h-8 font-light italic flex items-center justify-center">
              {generatingMessages[generatingStep]}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-soft p-6 flex flex-col animate-[fadeIn_0.4s_ease-out_forwards]">
            {/* Recommendation Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-1.5">
                <span className="material-symbols-outlined text-gray-800">smart_toy</span>
                <span className="font-serif text-base font-bold text-gray-900">AI 智能穿衣建议</span>
              </div>
              <span
                className={`text-[9px] font-bold rounded px-2 py-0.5 ${
                  recommendation.isAi ? "bg-[#07C160]/10 text-[#07C160]" : "bg-[#f0e0d0] text-[#6e6256]"
                }`}
              >
                {recommendation.isAi ? "🎯 智脑分析" : "📋 通用策略"}
              </span>
            </div>

            {/* Recommended Outfit Box */}
            <div className="mt-4 bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">今日穿配叠穿方案</span>
              <p className="text-sm font-bold text-gray-900 mt-1 leading-relaxed">
                {recommendation.recommendedOutfit}
              </p>
            </div>

            {/* Layering Logic Explanation */}
            <div className="mt-4 flex flex-col">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">气温与层叠逻辑依据</span>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed font-light">
                {recommendation.layeringExplanation}
              </p>
            </div>

            {/* Tips section */}
            <div className="mt-5 border-t border-dashed border-gray-100 pt-4 flex flex-col">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">全天通勤细节贴士</span>
              <div className="space-y-2">
                {recommendation.tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs text-gray-500 leading-relaxed">
                    <span className="text-[#685c50] text-sm leading-none mt-0.5">•</span>
                    <span className="font-light">{tip}</span>
                  </div>
                ))}
              </div>
            </div>


            {/* Regenerate Trigger */}
            <button
              onClick={handleGenerateRecommendation}
              className="mt-6 border border-gray-200 text-gray-600 hover:text-black py-2.5 rounded-full text-xs font-semibold hover:bg-gray-50 transition-all flex items-center justify-center space-x-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>重新分析今日搭配</span>
            </button>
          </div>
        )}
      </section>

      {/* Today's Commute Itinerary */}
      <section className="px-6 mt-8">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-gray-500 text-lg">calendar_today</span>
            <h3 className="font-serif text-base font-bold text-gray-900">今日通勤行程</h3>
          </div>
          <button
            id="add_itinerary_btn"
            onClick={() => setShowAddItin(true)}
            className="text-xs font-bold text-gray-800 hover:text-black flex items-center space-x-0.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            <span>添加行程</span>
          </button>
        </div>

        {itineraries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-xs text-gray-400">
            暂无计划，点击“添加行程”编排您的一天温差场景。
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-100">
            {itineraries
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((it) => {
                const scene = scenes.find((s) => s.id === it.sceneId);
                return (
                  <div key={it.id} className="p-4 flex justify-between items-center group">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-xs font-extrabold text-gray-800">{it.time}</span>
                        <span className="text-[9px] font-bold text-[#685c50] tracking-wider uppercase mt-1 px-1.5 py-0.5 bg-gray-100 rounded">
                          {it.duration}h
                        </span>
                      </div>

                      <div className="h-8 w-[1px] bg-gray-200" />

                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-bold text-gray-800">{scene?.name || "自定义行程"}</span>
                          {scene?.remark && (
                            <span className="text-[9px] font-bold text-[#685c50] bg-[#f0e0d0]/50 px-1.5 py-0.5 rounded-full">
                              {scene.remark}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className="text-[10px] font-medium text-gray-400">预估环境:</span>
                          <span className="text-[10px] font-bold text-gray-700">{it.temperature}°C</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              scene?.feel === "偏冷"
                                ? "bg-blue-50 text-blue-600"
                                : scene?.feel === "闷热"
                                ? "bg-red-50 text-red-600"
                                : scene?.feel === "微凉"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-green-50 text-green-600"
                            }`}
                          >
                            体感: {scene?.feel || "舒适"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditItineraryClick(it)}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-[#181512] transition-colors cursor-pointer"
                        title="编辑行程"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => onDeleteItinerary(it.id)}
                        className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="删除行程"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Itinerary Addition Floating Drawer / Dialog */}
      {showAddItin && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center md:items-center p-0 md:p-6">
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 animate-[slideUp_0.3s_ease-out_forwards]">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h4 className="font-serif text-lg font-bold text-gray-900">
                {editingItineraryId ? "编辑行程" : "规划新行程"}
              </h4>
              <button
                onClick={handleCloseAddItin}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleAddItinSubmit} className="flex flex-col space-y-4">
              {/* Select Time */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">出发时间</label>
                <input
                  type="time"
                  value={newItinTime}
                  onChange={(e) => setNewItinTime(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm font-semibold focus:outline-none focus:border-black"
                />
              </div>

              {/* Select Scene template */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">到达场景</label>
                <div className="relative">
                  <select
                    value={newItinSceneId}
                    onChange={(e) => setNewItinSceneId(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-black cursor-pointer"
                  >
                    {scenes.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name} ({sc.temperature}°C, 体感: {sc.feel})
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined text-gray-400 absolute right-3 top-3.5 pointer-events-none">
                    expand_more
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  没有找到场景？可以随时去下方的【场景库】页自定义您家、通勤车辆或常去商铺的估计温度。
                </p>
              </div>

              {/* Enter Estimated Duration */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  预计逗留时长 (小时)
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={newItinDuration}
                  onChange={(e) => setNewItinDuration(Math.max(1, Number(e.target.value)))}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-black"
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseAddItin}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-full py-3.5 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#181512] text-white rounded-full py-3.5 text-xs font-semibold hover:bg-black transition-all cursor-pointer"
                >
                  {editingItineraryId ? "保存修改" : "添加至今日日程"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
