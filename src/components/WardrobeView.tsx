import React, { useState } from "react";
import { Clothing, ClothingCategory } from "../types";

interface WardrobeViewProps {
  clothingList: Clothing[];
  onAddClothing: (item: Clothing) => void;
  onDeleteClothing: (id: string) => void;
  onUpdateClothing: (item: Clothing) => void;
}

export default function WardrobeView({ clothingList, onAddClothing, onDeleteClothing, onUpdateClothing }: WardrobeViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<ClothingCategory | "全部">("全部");
  const [selectedColor, setSelectedColor] = useState<string>("全部");

  // Clothing Upload Drawer States
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadCategory, setUploadCategory] = useState<ClothingCategory>("上衣");
  const [uploadColor, setUploadColor] = useState("黑色");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedPresetImage, setSelectedPresetImage] = useState(0);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemovedConfirmed, setBgRemovedConfirmed] = useState(false);

  // Category fallback images for simulated AI background extraction when user does not upload custom image
  const categoryFallbackImages: Record<ClothingCategory, string> = {
    "上衣": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80",
    "下装": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&auto=format&fit=crop&q=80",
    "鞋履": "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&auto=format&fit=crop&q=80",
    "配饰": "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cf4?w=400&auto=format&fit=crop&q=80",
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Edit Clothing States
  const [editingItem, setEditingItem] = useState<Clothing | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<ClothingCategory>("上衣");
  const [editColor, setEditColor] = useState("黑色");
  const [editImageUrl, setEditImageUrl] = useState("");

  // Available colors filter
  const colors = ["全部", "白色", "黑色", "蓝色", "灰色", "绿色", "棕色", "卡其色", "米色"];

  // Sample clothing mock images that fit our upscale minimalist aesthetic
  const presetApparelImages = [
    {
      name: "蓝色条纹衬衫",
      url: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=400&auto=format&fit=crop&q=80",
      color: "蓝色"
    },
    {
      name: "史努比短袖",
      url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&auto=format&fit=crop&q=80",
      color: "白色"
    },
    {
      name: "军绿色短裤",
      url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&auto=format&fit=crop&q=80",
      color: "绿色"
    },
    {
      name: "牛仔长裤",
      url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&auto=format&fit=crop&q=80",
      color: "蓝色"
    },
    {
      name: "白色运动鞋",
      url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&auto=format&fit=crop&q=80",
      color: "白色"
    },
    {
      name: "卡其休闲短裤",
      url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&auto=format&fit=crop&q=80",
      color: "卡其色"
    }
  ];

  // Filter list
  const filteredClothing = clothingList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryTab === "全部" || item.category === selectedCategoryTab;
    const matchesColor = selectedColor === "全部" || item.color === selectedColor;
    return matchesSearch && matchesCategory && matchesColor;
  });

  const handleStartRemoval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) return;

    setIsRemovingBg(true);
    // Simulate smart remove.bg API timing
    setTimeout(() => {
      setIsRemovingBg(false);
      setBgRemovedConfirmed(true);
    }, 1500);
  };

  const handleAddConfirm = () => {
    const finalImage = uploadedImageUrl || categoryFallbackImages[uploadCategory];
    const customItem: Clothing = {
      id: `cloth-${Date.now()}`,
      name: uploadName.trim(),
      category: uploadCategory,
      color: uploadColor,
      image: finalImage,
      isCustom: true
    };

    onAddClothing(customItem);
    setShowUploadForm(false);
    setUploadName("");
    setUploadedImageUrl(null);
    setBgRemovedConfirmed(false);
  };

  const handleEditClick = (item: Clothing) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditColor(item.color);
    setEditImageUrl(item.image);
  };

  const handleSaveEdit = () => {
    if (!editingItem || !editName.trim()) return;
    onUpdateClothing({
      ...editingItem,
      name: editName.trim(),
      category: editCategory,
      color: editColor,
      image: editImageUrl,
    });
    setEditingItem(null);
  };

  return (
    <div id="wardrobe_screen" className="relative pb-28 min-h-screen bg-[#faf9f7] text-[#1a1c1b] font-sans max-w-md mx-auto shadow-xl">
      {/* Editorial Header bar */}
      <div className="sticky top-0 z-30 bg-[#faf9f7] px-6 pt-10 pb-4 flex justify-between items-end">
        <div className="flex flex-col">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900">我的衣橱</h2>
          <span className="text-xs text-gray-400 mt-1">
            {clothingList.length} 件衣物 · 最近更新 今天
          </span>
        </div>

        {/* Floating Upload Trigger */}
        <button
          id="add_clothing_fab"
          onClick={() => setShowUploadForm(true)}
          className="bg-[#181512] text-white hover:bg-black rounded-full px-4 py-2 flex items-center space-x-1 shadow-md transition-all active:scale-95 text-xs font-semibold cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm font-bold">add</span>
          <span>录入衣物</span>
        </button>
      </div>

      {/* Search Input and dropdown filters */}
      <section className="px-6 space-y-3 mt-4">
        {/* Search bar */}
        <div className="relative">
          <input
            id="clothing_search"
            type="text"
            placeholder="搜索衣物名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-full pl-11 pr-5 py-3 text-xs focus:outline-none focus:border-black font-medium text-gray-800"
          />
          <span className="material-symbols-outlined absolute left-4 top-3.5 text-gray-400 text-lg">
            search
          </span>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {(["全部", "上衣", "下装", "鞋履", "配饰"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedCategoryTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedCategoryTab === tab
                  ? "bg-[#181512] text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Color filters Tab Selector */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {colors.map((col) => (
            <button
              key={col}
              onClick={() => setSelectedColor(col)}
              className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                selectedColor === col
                  ? "bg-[#181512] text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {col}
            </button>
          ))}
        </div>
      </section>

      {/* Clothes Card Grid */}
      <section className="px-6 mt-6">
        {filteredClothing.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-xs text-gray-400 border border-gray-100 shadow-soft">
            没有找到匹配的衣物卡片，点击“录入衣物”来丰富您的数码试衣间。
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredClothing.map((item) => (
              <div
                key={item.id}
                onClick={() => handleEditClick(item)}
                className="bg-white rounded-3xl border border-gray-100 p-3 shadow-soft flex flex-col group relative cursor-pointer hover:border-gray-300 active:scale-98 transition-all"
              >
                {/* Image Container */}
                <div className="bg-[#faf9f7] rounded-2xl w-full aspect-square overflow-hidden border border-gray-100/50 flex items-center justify-center relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Delete hovering indicator */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClothing(item.id);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-gray-400 transition-all cursor-pointer shadow-sm z-10"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>

                {/* Info and Tags */}
                <div className="mt-3 flex flex-col">
                  <h4 className="text-xs font-bold text-gray-900 truncate pr-1">{item.name}</h4>

                  <div className="flex items-center space-x-1.5 mt-2">
                    <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                      {item.category}
                    </span>
                    <span className="text-[9px] font-bold text-[#6e6256] bg-[#f0e0d0]/50 px-2 py-0.5 rounded-full">
                      {item.color}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Wardrobe Upload and simulated remove-bg Drawer */}
      {showUploadForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center md:items-center p-0 md:p-6">
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out_forwards]">

            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h4 className="font-serif text-lg font-bold text-gray-900">
                {bgRemovedConfirmed ? "抠图质量确认" : "智能衣物录入"}
              </h4>
              <button
                onClick={() => {
                  setShowUploadForm(false);
                  setBgRemovedConfirmed(false);
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Stage 1: Form & presets picker before removebg */}
            {!bgRemovedConfirmed && (
              <form onSubmit={handleStartRemoval} className="flex flex-col space-y-4">
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 text-[11px] text-gray-500 leading-relaxed">
                  💡 <b>拍照提示：</b> 将衣物平铺、使用与衣物颜色对比明显的背景（如深色地板拍摄浅色衬衫），系统抠图效果将完美展现。
                </div>

                {/* Enter garment name */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">衣物名称</label>
                  <input
                    type="text"
                    required
                    placeholder="如：黑色轻薄防晒衫、纯羊毛直筒裤"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-black"
                  />
                </div>

                {/* Clothing Category */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">分类</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["上衣", "下装", "鞋履", "配饰"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setUploadCategory(cat)}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                          uploadCategory === cat
                            ? "bg-[#181512] text-white border-transparent"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clothing main color */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">主色调</label>
                  <div className="relative">
                    <select
                      value={uploadColor}
                      onChange={(e) => setUploadColor(e.target.value)}
                      className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-black cursor-pointer"
                    >
                      {colors.filter(c => c !== "全部").map((col) => (
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

                {/* Real File Upload & Visual Schematic Guide */}
                <div className="flex flex-col space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    拍照或上传衣物原图
                  </label>

                  {/* Dashed Drag/Click Upload Zone */}
                  <label className="border-2 border-dashed border-gray-200 hover:border-[#181512] bg-[#faf9f7] rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-98 relative overflow-hidden group min-h-[110px]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {uploadedImageUrl ? (
                      <div className="flex items-center space-x-3 w-full animate-[fadeIn_0.2s_ease-out]">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-100 shrink-0 bg-white p-1">
                          <img
                            src={uploadedImageUrl}
                            alt="Custom upload"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-xs font-semibold text-gray-800 block truncate">已成功载入照片</span>
                          <span className="text-[10px] text-green-600 font-bold block mt-0.5 flex items-center">
                            <span className="material-symbols-outlined text-[11px] mr-1">check_circle</span>
                            已就绪，AI 准备提取
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setUploadedImageUrl(null);
                          }}
                          className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2 text-center">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-[#181512] shadow-sm transition-colors">
                          <span className="material-symbols-outlined text-xl">photo_camera</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">点击拍照或上传平铺衣物</p>
                          <p className="text-[10px] text-gray-400 mt-1">支持常见图片格式，将智能消除背景</p>
                        </div>
                      </div>
                    )}
                  </label>

                  {/* Elegant Comparative Photography Schematic Guide */}
                  <div className="border border-[#e6dfd5] bg-[#faf6f0] rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-[#735e4c]">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      <span>云端抠图对齐标准 (效果指南)</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-0.5">
                      {/* Good technique column */}
                      <div className="space-y-1.5 text-left">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center w-max">
                          正确录入 ✅
                        </span>
                        <ul className="text-[10px] text-[#736357] space-y-1 list-disc list-inside leading-tight font-medium">
                          <li>衣物展平，无折叠重合</li>
                          <li>纯色、高对比背景平铺</li>
                          <li>光线均匀，避免投影遮挡</li>
                        </ul>
                      </div>

                      {/* Bad technique column */}
                      <div className="space-y-1.5 text-left border-l border-amber-200/40 pl-3">
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded flex items-center w-max">
                          错误示例 ❌
                        </span>
                        <ul className="text-[10px] text-gray-400 space-y-1 list-disc list-inside leading-tight font-medium">
                          <li>衣服折皱，细节被遮盖</li>
                          <li>背景杂乱(花纹/多余杂物)</li>
                          <li>光线极暗，人影重合干扰</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action button trigger background removal */}
                <button
                  type="submit"
                  disabled={isRemovingBg}
                  className="w-full bg-[#181512] text-white disabled:bg-gray-300 disabled:text-gray-500 rounded-full py-4 text-xs font-semibold hover:bg-black transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  {isRemovingBg ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                      <span>智能抠图服务分析中 (2s)...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">photo_filter</span>
                      <span>云端AI抠图并录入衣橱</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Stage 2: After background removal confirm state */}
            {bgRemovedConfirmed && (
              <div className="flex flex-col space-y-4 items-center text-center">
                <span className="material-symbols-outlined text-3xl text-green-500">check_circle</span>
                <p className="text-sm font-bold text-gray-900">
                  背景消除大功告成！已成功提取透明图层
                </p>

                {/* Preview cards comparing raw vs removed */}
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-400 mb-1">拍摄原底片</span>
                    <div className="border border-gray-200 rounded-xl aspect-square w-full overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                      <img
                        src={uploadedImageUrl || categoryFallbackImages[uploadCategory]}
                        alt="raw garment"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-400 mb-1">透明底材质 (PNG)</span>
                    <div className="border border-gray-200 rounded-xl aspect-square w-full overflow-hidden bg-[radial-gradient(#e3e3e3_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center p-2">
                      <img
                        src={uploadedImageUrl || categoryFallbackImages[uploadCategory]}
                        alt="removed bg garment"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-gray-400 max-w-[280px]">
                  材质已转换为高清透明贴纸。您可以直接在底部的【试穿】画板中拖曳、缩放它，与牛仔裤及鞋履自由拼装！
                </div>

                <div className="flex space-x-3 w-full pt-3">
                  <button
                    onClick={() => setBgRemovedConfirmed(false)}
                    className="flex-1 border border-gray-200 text-gray-600 rounded-full py-3.5 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                  >
                    重新拍摄
                  </button>
                  <button
                    onClick={handleAddConfirm}
                    className="flex-1 bg-[#181512] text-white rounded-full py-3.5 text-xs font-semibold hover:bg-black cursor-pointer shadow-md"
                  >
                    确认入库
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Clothing Drawer / Dialog */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center md:items-center p-0 md:p-6 animate-[fadeIn_0.2s_ease-out_forwards]">
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out_forwards]">

            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h4 className="font-serif text-lg font-bold text-gray-900">
                编辑衣物信息
              </h4>
              <button
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex flex-col space-y-4 text-left">
              {/* Image Preview and Re-upload */}
              <div className="flex flex-col space-y-3">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">衣服照片</label>

                {/* Active Image Preview */}
                <div className="bg-[#faf9f7] rounded-2xl w-full h-44 overflow-hidden border border-gray-100 flex items-center justify-center relative p-3">
                  {editImageUrl ? (
                    <img
                      src={editImageUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs flex flex-col items-center space-y-2">
                      <span className="material-symbols-outlined text-3xl">photo</span>
                      <span>暂无图片</span>
                    </div>
                  )}
                </div>

                {/* File Upload Zone for Re-upload */}
                <label className="border border-gray-200 hover:border-[#181512] bg-white rounded-xl p-3 flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-98 hover:bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditFileChange}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-gray-500 text-sm">publish</span>
                  <span className="text-xs font-semibold text-gray-700">重新拍照或上传照片</span>
                </label>
              </div>

              {/* Enter garment name */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">衣物名称</label>
                <input
                  type="text"
                  required
                  placeholder="如：黑色轻薄防晒衫"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-black font-medium"
                />
              </div>

              {/* Clothing Category */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">分类</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["上衣", "下装", "鞋履", "配饰"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditCategory(cat)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                        editCategory === cat
                          ? "bg-[#181512] text-white border-transparent"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clothing main color */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">主色调</label>
                <div className="relative">
                  <select
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-black cursor-pointer font-medium"
                  >
                    {colors.filter(c => c !== "全部").map((col) => (
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

              {/* Save / Cancel buttons */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-full py-3.5 text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 bg-[#181512] text-white rounded-full py-3.5 text-xs font-semibold hover:bg-black cursor-pointer shadow-md"
                >
                  保存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
