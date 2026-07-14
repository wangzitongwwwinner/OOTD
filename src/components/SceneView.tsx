import React, { useState } from "react";
import { Scene, SceneCategory } from "../types";

interface SceneViewProps {
  scenes: Scene[];
  onAddScene: (scene: Scene) => void;
  onUpdateScene: (scene: Scene) => void;
  onDeleteScene: (id: string) => void;
}

export default function SceneView({ scenes, onAddScene, onUpdateScene, onDeleteScene }: SceneViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SceneCategory>("自定义");
  const [temperature, setTemperature] = useState(22);
  const [feel, setFeel] = useState<"偏冷" | "舒适" | "闷热" | "微凉">("舒适");
  const [remark, setRemark] = useState("");

  const openAddForm = () => {
    setEditingScene(null);
    setName("");
    setCategory("自定义");
    setTemperature(22);
    setFeel("舒适");
    setRemark("");
    setShowForm(true);
  };

  const openEditForm = (scene: Scene) => {
    setEditingScene(scene);
    setName(scene.name);
    setCategory(scene.category);
    setTemperature(scene.temperature);
    setFeel(scene.feel);
    setRemark(scene.remark || "");
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingScene) {
      onUpdateScene({
        ...editingScene,
        name,
        category,
        temperature,
        feel,
        remark: remark.trim(),
      });
    } else {
      const newScene: Scene = {
        id: `scene-${Date.now()}`,
        name,
        category,
        temperature,
        feel,
        remark: remark.trim(),
        isPreset: false,
      };
      onAddScene(newScene);
    }
    setShowForm(false);
  };

  // Helper to map category to icon
  const getCategoryIcon = (cat: SceneCategory) => {
    switch (cat) {
      case "办公室":
        return "business_center";
      case "家":
        return "home";
      case "地铁通勤":
        return "subway";
      case "商场":
        return "shopping_bag";
      case "户外":
        return "forest";
      default:
        return "widgets";
    }
  };

  return (
    <div id="scenes_screen" className="relative pb-28 min-h-screen bg-[#faf9f7] text-[#1a1c1b] font-sans max-w-md mx-auto shadow-xl">
      {/* Editorial Header */}
      <div className="px-6 pt-10 pb-6 flex flex-col">
        <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900">场景记忆</h2>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed font-light">
          记录您一天的日常生活微气候，在生成搭配建议时为您精确调整。
        </p>
      </div>

      {/* Scenario List */}
      <section className="px-6 space-y-4">
        {scenes.map((scene) => (
          <div
            key={scene.id}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              {/* Category Icon */}
              <div className="w-12 h-12 rounded-xl bg-[#faf9f7] border border-gray-100 flex items-center justify-center text-gray-700">
                <span className="material-symbols-outlined text-xl">
                  {getCategoryIcon(scene.category)}
                </span>
              </div>

              {/* Information */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-900">{scene.name}</span>
                  {scene.remark && (
                    <span className="text-[9px] font-bold text-[#685c50] bg-[#f0e0d0]/50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      {scene.remark}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 mt-1 text-xs">
                  <div className="flex items-center space-x-1 text-gray-500">
                    <span className="material-symbols-outlined text-xs text-gray-400">thermostat</span>
                    <span className="font-semibold">{scene.temperature}°C</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      scene.feel === "偏冷"
                        ? "bg-blue-50 text-blue-600"
                        : scene.feel === "闷热"
                        ? "bg-red-50 text-red-600"
                        : scene.feel === "微凉"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    体感: {scene.feel}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-1.5">
              <button
                onClick={() => openEditForm(scene)}
                className="w-8 h-8 rounded-full hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 cursor-pointer transition-colors"
                title="编辑"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>

              <button
                onClick={() => onDeleteScene(scene.id)}
                className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 cursor-pointer transition-colors"
                title="删除"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
        ))}

        {/* Add scenario entry card */}
        <button
          id="add_scene_trigger"
          onClick={openAddForm}
          className="w-full bg-white hover:bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-all"
        >
          <span className="material-symbols-outlined text-2xl text-gray-400">add_circle</span>
          <span className="text-sm font-semibold text-gray-700">添加新场景</span>
        </button>
      </section>

      {/* Scenario Add/Edit Form Drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center md:items-center p-0 md:p-6">
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 animate-[slideUp_0.3s_ease-out_forwards]">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h4 className="font-serif text-lg font-bold text-gray-900">
                {editingScene ? "编辑场景气候" : "创建自定义微气候"}
              </h4>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
              {/* Scene Name */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">场景名称</label>
                <input
                  type="text"
                  placeholder="例如: 书店、健身房、大平层"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={15}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-black"
                />
              </div>

              {/* Category */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">类型归属</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SceneCategory)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-black cursor-pointer"
                  >
                    {["办公室", "家", "地铁通勤", "商场", "户外", "自定义"].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined text-gray-400 absolute right-3 top-3.5 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Slider for Estimated temperature */}
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-500 uppercase tracking-wider">预估环境温度</span>
                  <span className="text-gray-900 font-extrabold">{temperature}°C</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={40}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-black cursor-pointer bg-gray-100 h-1.5 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>10°C (极冷空调/寒冬)</span>
                  <span>40°C (酷暑无冷气)</span>
                </div>
              </div>

              {/* Physical feel bias */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">在该温度下的体感</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["偏冷", "舒适", "闷热", "微凉"] as const).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFeel(tag)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        feel === tag
                          ? "bg-[#181512] text-white border-transparent"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remark / Notes */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">备注 (例如: 高频活动)</label>
                <input
                  type="text"
                  placeholder="添加特征备注，如“高频活动”、“午休场景”"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  maxLength={15}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-black"
                />
              </div>

              {/* Submit Actions */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-full py-3.5 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#181512] text-white rounded-full py-3.5 text-xs font-semibold hover:bg-black transition-all cursor-pointer"
                >
                  {editingScene ? "保存修改" : "确认新建"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
