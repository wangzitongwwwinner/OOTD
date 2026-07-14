import React, { useState, useRef, useEffect } from "react";
import { Clothing, CanvasItem, SavedOutfit, ClothingCategory } from "../types";

interface TryOnViewProps {
  clothingList: Clothing[];
  savedOutfits: SavedOutfit[];
  onSaveOutfit: (outfit: SavedOutfit) => void;
  onDeleteOutfit: (id: string) => void;
}

export default function TryOnView({ clothingList, savedOutfits, onSaveOutfit, onDeleteOutfit }: TryOnViewProps) {
  // Navigation tabs: "试衣间" vs "我的搭配"
  const [activeSubTab, setActiveSubTab] = useState<"canvas" | "outfits">("canvas");

  // Filter dropdown states for Saved Outfits list (Screen 3)
  const [outfitSeasonFilter, setOutfitSeasonFilter] = useState<string>("全部");
  const [outfitColorFilter, setOutfitColorFilter] = useState<string>("全部");

  // Fitting room canvas states (Screen 4)
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Bottom drawer filter states for clothing selection
  const [drawerCategory, setDrawerCategory] = useState<ClothingCategory | "全部">("全部");
  const [drawerColor, setDrawerColor] = useState<string>("全部");

  // Save outfit form popup
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [outfitName, setOutfitName] = useState("");
  const [outfitSeason, setOutfitSeason] = useState<"春天" | "夏天" | "秋天" | "冬天">("秋天");
  const [outfitColorTag, setOutfitColorTag] = useState("蓝色");

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragItemRef = useRef<{ id: string; startX: number; startY: number; itemX: number; itemY: number } | null>(null);

  // Filter lists
  const availableColors = ["全部", "白色", "黑色", "蓝色", "灰色", "绿色", "棕色", "卡其色", "米色"];

  // 1. Add item to canvas
  const handleAddClothingToCanvas = (clothingId: string) => {
    // Generate a unique canvas item node
    const maxZ = canvasItems.reduce((max, item) => Math.max(max, item.zIndex), 0);
    const newItem: CanvasItem = {
      id: `node-${Date.now()}`,
      clothingId,
      x: 50, // center default x percentage
      y: 40, // center default y percentage
      scale: 1.0,
      zIndex: maxZ + 1,
    };
    setCanvasItems([...canvasItems, newItem]);
    setSelectedItemId(newItem.id);
  };

  // 2. Drag & Drop reposition engine inside the relative canvas
  const handleItemMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    const item = canvasItems.find((ci) => ci.id === itemId);
    if (!item) return;

    setSelectedItemId(itemId);

    dragItemRef.current = {
      id: itemId,
      startX: e.clientX,
      startY: e.clientY,
      itemX: item.x,
      itemY: item.y,
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragItemRef.current || !canvasRef.current) return;

    const dragInfo = dragItemRef.current;
    const canvasRect = canvasRef.current.getBoundingClientRect();

    // Calculate changes in pixels
    const deltaX = e.clientX - dragInfo.startX;
    const deltaY = e.clientY - dragInfo.startY;

    // Convert pixels delta to percentage delta relative to canvas size
    const deltaPercentX = (deltaX / canvasRect.width) * 100;
    const deltaPercentY = (deltaY / canvasRect.height) * 100;

    // Constrain position between 5% and 95%
    const newX = Math.min(95, Math.max(5, dragInfo.itemX + deltaPercentX));
    const newY = Math.min(95, Math.max(5, dragInfo.itemY + deltaPercentY));

    setCanvasItems((prev) =>
      prev.map((item) => (item.id === dragInfo.id ? { ...item, x: newX, y: newY } : item))
    );
  };

  const handleMouseUp = () => {
    dragItemRef.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  // Touch listener handles for mobile support
  const handleItemTouchStart = (e: React.TouchEvent, itemId: string) => {
    const item = canvasItems.find((ci) => ci.id === itemId);
    if (!item) return;

    setSelectedItemId(itemId);
    const touch = e.touches[0];

    dragItemRef.current = {
      id: itemId,
      startX: touch.clientX,
      startY: touch.clientY,
      itemX: item.x,
      itemY: item.y,
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!dragItemRef.current || !canvasRef.current) return;

    const dragInfo = dragItemRef.current;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];

    const deltaX = touch.clientX - dragInfo.startX;
    const deltaY = touch.clientY - dragInfo.startY;

    const deltaPercentX = (deltaX / canvasRect.width) * 100;
    const deltaPercentY = (deltaY / canvasRect.height) * 100;

    const newX = Math.min(95, Math.max(5, dragInfo.itemX + deltaPercentX));
    const newY = Math.min(95, Math.max(5, dragInfo.itemY + deltaPercentY));

    setCanvasItems((prev) =>
      prev.map((item) => (item.id === dragInfo.id ? { ...item, x: newX, y: newY } : item))
    );
  };

  const handleTouchEnd = () => {
    dragItemRef.current = null;
    window.removeEventListener("touchmove", handleTouchMove);
    window.removeEventListener("touchend", handleTouchEnd);
  };

  // Clean up global listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  // Click outside to deselect active garment automatically
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      if (!selectedItemId) return;
      const target = e.target as HTMLElement;

      // If the clicked target or any of its ancestors has "keep-selection" class, preserve selection
      if (target.closest(".keep-selection")) {
        return;
      }

      setSelectedItemId(null);
    };

    window.addEventListener("mousedown", handleGlobalClick);
    window.addEventListener("touchstart", handleGlobalClick);

    return () => {
      window.removeEventListener("mousedown", handleGlobalClick);
      window.removeEventListener("touchstart", handleGlobalClick);
    };
  }, [selectedItemId]);

  // 3. Canvas item actions
  const adjustZIndex = (id: string, direction: "up" | "down") => {
    setCanvasItems((prev) => {
      const items = [...prev];
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return prev;

      const currentItem = items[index];
      const otherItems = items.filter((item) => item.id !== id);

      if (direction === "up") {
        const nextZ = otherItems.reduce((max, item) => Math.max(max, item.zIndex), currentItem.zIndex);
        currentItem.zIndex = nextZ + 1;
      } else {
        const minZ = otherItems.reduce((min, item) => Math.min(min, item.zIndex), currentItem.zIndex);
        currentItem.zIndex = Math.max(1, minZ - 1);
      }

      return items;
    });
  };

  const handleRemoveFromCanvas = (id: string) => {
    setCanvasItems(canvasItems.filter((it) => it.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  const resetCanvas = () => {
    setCanvasItems([]);
    setSelectedItemId(null);
  };

  // 4. Save Current layout
  const triggerSaveOutfit = () => {
    if (canvasItems.length === 0) {
      alert("请先向试衣画布中添加衣物，再保存搭配。");
      return;
    }
    setOutfitName("");
    setShowSaveModal(true);
  };

  const handleSaveOutfitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outfitName.trim()) return;

    const newOutfit: SavedOutfit = {
      id: `outfit-${Date.now()}`,
      name: outfitName,
      canvasItems: [...canvasItems],
      season: outfitSeason,
      colorTag: outfitColorTag,
      createdAt: new Date().toLocaleDateString("zh-CN"),
    };

    onSaveOutfit(newOutfit);
    setShowSaveModal(false);
    setActiveSubTab("outfits");
  };

  // Load an existing outfit to canvas
  const handleLoadOutfitToCanvas = (outfit: SavedOutfit) => {
    setCanvasItems(outfit.canvasItems);
    setActiveSubTab("canvas");
    if (outfit.canvasItems.length > 0) {
      setSelectedItemId(outfit.canvasItems[0].id);
    }
  };

  // Filter drawer catalog
  const filteredDrawerClothing = clothingList.filter((item) => {
    const matchesCategory = drawerCategory === "全部" || item.category === drawerCategory;
    const matchesColor = drawerColor === "全部" || item.color === drawerColor;
    return matchesCategory && matchesColor;
  });

  // Filter saved outfits list
  const filteredSavedOutfits = savedOutfits.filter((item) => {
    const matchesSeason = outfitSeasonFilter === "全部" || item.season === outfitSeasonFilter;
    const matchesColor = outfitColorFilter === "全部" || item.colorTag === outfitColorFilter;
    return matchesSeason && matchesColor;
  });

  return (
    <div id="tryon_screen" className="relative pb-28 min-h-screen bg-[#faf9f7] text-[#1a1c1b] font-sans max-w-md mx-auto shadow-xl">
      {/* Top Segmented Tabs: "试衣间" vs "我的搭配" */}
      <header className="px-6 pt-6 pb-2 sticky top-0 bg-[#faf9f7] z-30 flex flex-col space-y-4">
        <div className="bg-[#efeeec] p-1 rounded-full grid grid-cols-2 relative shadow-inner">
          <button
            id="tab_canvas_view"
            onClick={() => setActiveSubTab("canvas")}
            className={`py-3 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === "canvas" ? "bg-[#181512] text-white shadow" : "text-gray-600 hover:text-black"
            }`}
          >
            试衣间
          </button>
          <button
            id="tab_outfits_view"
            onClick={() => setActiveSubTab("outfits")}
            className={`py-3 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === "outfits" ? "bg-[#181512] text-white shadow" : "text-gray-600 hover:text-black"
            }`}
          >
            我的搭配
          </button>
        </div>
      </header>

      {/* ======================= VIEW 1: TRY ON CANVAS ======================= */}
      {activeSubTab === "canvas" && (
        <div className="flex flex-col animate-[fadeIn_0.2s_ease-out]">
          {/* Main Board row */}
          <div className="px-6 grid grid-cols-12 gap-3 mt-2">
            {/* Left Hand: Layer Manager Panel (Screenshots: "已选") */}
            <div className="col-span-5 flex flex-col space-y-2 bg-white rounded-2xl border border-gray-100 p-2 shadow-soft max-h-[360px] overflow-y-auto">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100">
                已选衣物
              </span>

              {canvasItems.length === 0 ? (
                <p className="text-[10px] text-gray-400 text-center py-6">请从底部选择衣物</p>
              ) : (
                <div className="space-y-1.5 pt-1.5 flex-1">
                  {canvasItems
                    .sort((a, b) => b.zIndex - a.zIndex) // Display layers top to bottom
                    .map((item) => {
                      const clothing = clothingList.find((c) => c.id === item.clothingId);
                      const isSelected = selectedItemId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItemId(item.id)}
                          className={`keep-selection p-1.5 rounded-lg flex flex-col border transition-all cursor-pointer ${
                            isSelected ? "border-gray-800 bg-gray-50 font-semibold" : "border-gray-100 bg-white"
                          }`}
                        >
                          <span className="text-[10px] text-gray-800 truncate leading-tight">
                            {clothing?.name || "未知衣物"}
                          </span>

                          {/* Level modifiers */}
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-dashed border-gray-100 gap-1">
                            <div className="flex space-x-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  adjustZIndex(item.id, "up");
                                }}
                                title="上移图层"
                                className="w-4 h-4 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[10px]">arrow_upward</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  adjustZIndex(item.id, "down");
                                }}
                                title="下移图层"
                                className="w-4 h-4 rounded hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[10px]">arrow_downward</span>
                              </button>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFromCanvas(item.id);
                              }}
                              className="w-4 h-4 rounded hover:bg-red-50 flex items-center justify-center text-red-500 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[10px]">close</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Reset Canvas Control */}
              <button
                onClick={resetCanvas}
                className="w-full border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg py-2 text-[10px] font-semibold tracking-wide mt-2 cursor-pointer transition-colors"
              >
                重置画布
              </button>
            </div>

            {/* Right Hand: Coordinate Grid Drawing Board */}
            <div className="col-span-7 flex flex-col space-y-2">
              <div
                ref={canvasRef}
                className="w-full aspect-[3/4] rounded-2xl bg-white border border-gray-100 relative shadow-soft overflow-hidden bg-[radial-gradient(#cfc4bd_1px,transparent_1px)] [background-size:16px_16px]"
              >
                {/* Visual empty alert */}
                {canvasItems.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-gray-400 select-none pointer-events-none">
                    <span className="material-symbols-outlined text-3xl mb-1.5 animate-pulse">gesture</span>
                    <span className="text-xs font-semibold">试衣搭配画板</span>
                    <span className="text-[10px] mt-0.5">从底栏选取衣物，自由拖拽或调整层叠</span>
                  </div>
                )}

                {/* Draw active garments items */}
                {canvasItems.map((item) => {
                  const clothing = clothingList.find((c) => c.id === item.clothingId);
                  const isSelected = selectedItemId === item.id;
                  if (!clothing) return null;

                  return (
                    <div
                      key={item.id}
                      onMouseDown={(e) => handleItemMouseDown(e, item.id)}
                      onTouchStart={(e) => handleItemTouchStart(e, item.id)}
                      style={{
                        position: "absolute",
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        transform: `translate(-50%, -50%) scale(${item.scale})`,
                        zIndex: item.zIndex,
                        cursor: "grab",
                        userSelect: "none",
                      }}
                      className={`keep-selection max-w-[110px] max-h-[110px] p-2 aspect-square flex items-center justify-center rounded-xl transition-shadow ${
                        isSelected ? "border border-gray-800 bg-white/70 shadow-lg ring-1 ring-gray-800" : ""
                      }`}
                    >
                      <img
                        src={clothing.image}
                        alt={clothing.name}
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain pointer-events-none"
                      />

                      {/* Display small scale pill on selection */}
                      {isSelected && (
                        <div className="absolute -top-6 bg-gray-900 text-white rounded px-1.5 py-0.5 text-[8px] font-semibold leading-none pointer-events-none">
                          z-{item.zIndex} | {Math.round(item.scale * 100)}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selection Scale Modifier Tool Slider (only active if item selected) */}
              {selectedItemId && (
                <div className="keep-selection bg-white rounded-xl border border-gray-100 px-2.5 py-2 flex items-center justify-between space-x-1.5 shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 shrink-0 pl-1">缩放大小:</span>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.05}
                    value={canvasItems.find((it) => it.id === selectedItemId)?.scale || 1.0}
                    onChange={(e) => {
                      const newScale = Number(e.target.value);
                      setCanvasItems((prev) =>
                        prev.map((it) => (it.id === selectedItemId ? { ...it, scale: newScale } : it))
                      );
                    }}
                    className="flex-1 w-full mx-1 accent-[#181512] cursor-pointer h-1 rounded-full bg-gray-100 appearance-none"
                  />
                  <span className="font-mono text-[10px] font-semibold text-gray-700 shrink-0 w-8 text-right pr-1">
                    {Math.round((canvasItems.find((it) => it.id === selectedItemId)?.scale || 1.0) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Row: Save Outfit Control */}
          <div className="px-6 mt-4 flex space-x-3">
            <button
              onClick={triggerSaveOutfit}
              className="w-full bg-[#181512] hover:bg-black text-white rounded-full py-3.5 text-xs font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">favorite</span>
              <span>保存为我的推荐搭配</span>
            </button>
          </div>

          {/* Bottom Drawer section: Filter & select garments catalog to append */}
          <section className="px-6 mt-6 pb-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-soft flex flex-col space-y-4">
              <span className="text-xs font-bold text-gray-900">可选入库衣物</span>

              {/* Category tabs */}
              <div className="flex space-x-1.5 overflow-x-auto pb-1">
                {(["全部", "上衣", "下装", "鞋履", "配饰"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDrawerCategory(tab)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                      drawerCategory === tab
                        ? "bg-[#685c50] text-white"
                        : "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Items Horizontal Scroll */}
              {filteredDrawerClothing.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">无可用类别衣服</p>
              ) : (
                <div className="flex space-x-3 overflow-x-auto py-1 scrollbar-thin">
                  {filteredDrawerClothing.map((cloth) => (
                    <div
                      key={cloth.id}
                      onClick={() => handleAddClothingToCanvas(cloth.id)}
                      className="keep-selection w-20 bg-[#faf9f7] rounded-xl border border-gray-100 p-1.5 flex flex-col items-center shrink-0 hover:border-black cursor-pointer group active:scale-95 transition-all"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-100 flex items-center justify-center p-1">
                        <img
                          src={cloth.image}
                          alt={cloth.name}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[9px] text-gray-800 text-center truncate w-full mt-1.5 font-medium">
                        {cloth.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ======================= VIEW 2: SAVED OUTFITS LOOKBOOK ======================= */}
      {activeSubTab === "outfits" && (
        <div className="px-6 animate-[fadeIn_0.2s_ease-out]">
          {/* Header search controls */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            {/* Season Filter Dropdown */}
            <div className="relative">
              <select
                value={outfitSeasonFilter}
                onChange={(e) => setOutfitSeasonFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-full py-2.5 pl-4 pr-10 text-xs font-semibold text-gray-800 cursor-pointer focus:outline-none focus:border-black"
              >
                <option value="全部">季节: 全部</option>
                <option value="春天">春天</option>
                <option value="夏天">夏天</option>
                <option value="秋天">秋天</option>
                <option value="冬天">冬天</option>
              </select>
              <span className="material-symbols-outlined text-xs absolute right-3 top-3 text-gray-500 pointer-events-none">
                expand_more
              </span>
            </div>

            {/* Color Filter Dropdown */}
            <div className="relative">
              <select
                value={outfitColorFilter}
                onChange={(e) => setOutfitColorFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 rounded-full py-2.5 pl-4 pr-10 text-xs font-semibold text-gray-800 cursor-pointer focus:outline-none focus:border-black"
              >
                <option value="全部">色系: 全部</option>
                {availableColors.filter(c => c !== "全部").map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-xs absolute right-3 top-3 text-gray-500 pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Outfits grid list (Screen 3) */}
          <div className="mt-6 space-y-4">
            {filteredSavedOutfits.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center text-xs text-gray-400 border border-gray-100 shadow-soft">
                暂无保存的搭配。可以前往“试衣间”拼凑衣服并保存哦。
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredSavedOutfits.map((outfit) => (
                  <div
                    key={outfit.id}
                    className="bg-white rounded-3xl border border-gray-100 p-4 shadow-soft flex space-x-4 relative group hover:border-black transition-all"
                  >
                    {/* Compact preview graphic */}
                    <div className="w-24 aspect-[3/4] bg-white border border-gray-100 rounded-2xl relative overflow-hidden flex items-center justify-center shrink-0 animate-[fadeIn_0.3s_ease-out]">
                      {outfit.canvasItems.map((item) => {
                        const clothing = clothingList.find((c) => c.id === item.clothingId);
                        if (!clothing) return null;

                        const posZoom = 0.95;
                        const sizeZoom = 1.8;
                        const newX = 50 + (item.x - 50) * posZoom;
                        const newY = 50 + (item.y - 50) * posZoom;
                        const newScale = item.scale * sizeZoom;

                        return (
                          <div
                            key={item.id}
                            style={{
                              position: "absolute",
                              left: `${newX}%`,
                              top: `${newY}%`,
                              width: "27.5%",
                              transform: `translate(-50%, -50%) scale(${newScale})`,
                              zIndex: item.zIndex,
                            }}
                            className="aspect-square flex items-center justify-center"
                          >
                            <img
                              src={clothing.image}
                              alt="garment preview"
                              referrerPolicy="no-referrer"
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Outfit description & Actions */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex flex-col">
                        <h4 className="font-serif text-base font-bold text-gray-900">{outfit.name}</h4>
                        <span className="text-[10px] text-gray-400 mt-0.5">创建于 {outfit.createdAt}</span>

                        {/* Overlapping Thumbnails of items used */}
                        <div className="flex items-center -space-x-1.5 mt-2">
                          {outfit.canvasItems.map((ci) => {
                            const clothing = clothingList.find((c) => c.id === ci.clothingId);
                            if (!clothing) return null;
                            return (
                              <div
                                key={ci.id}
                                className="w-6 h-6 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden p-0.5"
                                title={clothing.name}
                              >
                                <img
                                  src={clothing.image}
                                  alt={clothing.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center space-x-1.5 mt-3">
                          <span className="text-[9px] font-bold text-[#6e6256] bg-[#f0e0d0]/50 px-2 py-0.5 rounded-full">
                            {outfit.season}
                          </span>
                          <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                            {outfit.colorTag}
                          </span>
                        </div>
                      </div>

                      {/* Launch & delete button */}
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={() => handleLoadOutfitToCanvas(outfit)}
                          className="bg-[#181512] text-white hover:bg-black rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">gesture</span>
                          <span>载入编辑</span>
                        </button>
                        <button
                          onClick={() => onDeleteOutfit(outfit.id)}
                          className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                          <span>删除</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outfit Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center md:items-center p-0 md:p-6">
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 animate-[slideUp_0.3s_ease-out_forwards]">

            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h4 className="font-serif text-lg font-bold text-gray-900">保存搭配创意</h4>
              <button
                onClick={() => setShowSaveModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveOutfitSubmit} className="flex flex-col space-y-4">
              {/* Outfit Name input */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">搭配名称</label>
                <input
                  type="text"
                  required
                  placeholder="如: 秋日复古通勤Look, 夏日空调房避暑搭配"
                  value={outfitName}
                  onChange={(e) => setOutfitName(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-black font-semibold text-gray-800"
                />
              </div>

              {/* Outfit Season */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">适用季节</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["春天", "夏天", "秋天", "冬天"] as const).map((season) => (
                    <button
                      key={season}
                      type="button"
                      onClick={() => setOutfitSeason(season)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                        outfitSeason === season
                          ? "bg-[#181512] text-white border-transparent"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {season}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Tag */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">色系标签</label>
                <div className="relative">
                  <select
                    value={outfitColorTag}
                    onChange={(e) => setOutfitColorTag(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-black cursor-pointer"
                  >
                    {availableColors.filter(c => c !== "全部").map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined text-gray-400 absolute right-3 top-3.5 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-full py-3.5 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#181512] text-white rounded-full py-3.5 text-xs font-semibold hover:bg-black cursor-pointer shadow-md"
                >
                  确认保存搭配
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
