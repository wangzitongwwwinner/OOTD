import React, { useState } from "react";
import { User } from "../types";

interface ProfileViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onBack: () => void;
  onSignOut: () => void;
}

export default function ProfileView({ user, onUpdateUser, onBack, onSignOut }: ProfileViewProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [locationGranted, setLocationGranted] = useState(true);
  const [dataManagementOpen, setDataManagementOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const updateFeel = (feel: "偏冷" | "舒适" | "偏热") => {
    onUpdateUser({ ...user, recentFeel: feel });
  };

  const faqs = [
    {
      q: "为什么建议中不包含衣橱里的具体款式？",
      a: "“穿衣有数”的核心定位是‘温差应对工具’。AI穿衣建议主要解决气温和天气对应的衣物品类与厚度问题，具体的审美搭配与款式挑选更适合由用户自己在‘试穿’画板上发挥创意。"
    },
    {
      q: "如何精准获取我所在办公大楼的估计温度？",
      a: "本应用致力于减少用户的认知成本。您不需要测量精确数字，只需根据平时感觉挑选‘偏冷、舒适、闷热、微凉’中的一项，并输入一个大概环境估计温度（如办公室常年22°C）即可。"
    },
    {
      q: "如何上传平整无背景的精美衣物？",
      a: "建议您将衣物平铺在纯色地面（如深色地板、床单）上，保证正面光线柔和，在手机正上方垂直拍摄。系统内置抠图功能会自动为您去除背景，生成高清透明材质卡片。"
    }
  ];

  return (
    <div id="profile_screen" className="relative min-h-screen bg-[#faf9f7] text-[#1a1c1b] pb-24 font-sans max-w-md mx-auto shadow-xl">
      {/* Top Bar with Back Action */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/60 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <button
          id="profile_back_btn"
          onClick={onBack}
          className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-800 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined font-semibold text-2xl">arrow_back</span>
        </button>
        <span className="font-serif text-lg font-bold text-gray-900">个人设置 & 偏好</span>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Hero Header */}
      <div className="px-6 py-8 flex flex-col items-center text-center bg-gradient-to-b from-white to-transparent">
        <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden mb-4 scale-100 transition-all hover:scale-105 duration-300">
          <img src={user.avatar} alt={user.nickname} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        </div>

        <h2 className="font-serif text-2xl font-bold text-gray-900 tracking-tight">{user.nickname}</h2>

        {/* Dynamic Body Feel Pill */}
        <div className="mt-4 inline-flex items-center bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5 space-x-1.5 shadow-sm">
          <span className="material-symbols-outlined text-sm text-[#685c50]" style={{ fontVariationSettings: "'FILL' 1" }}>
            ac_unit
          </span>
          <span className="text-xs text-gray-600 font-medium">最近体感: {user.recentFeel}</span>
        </div>
      </div>

      {/* Body feel selection (Bias controller) */}
      <section className="px-6 mb-8">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">我的抗寒体感倾向</h3>
        <div className="grid grid-cols-3 gap-2 bg-white p-1.5 rounded-xl border border-gray-100">
          {(["偏冷", "舒适", "偏热"] as const).map((feel) => (
            <button
              key={feel}
              onClick={() => updateFeel(feel)}
              className={`py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                user.recentFeel === feel
                  ? "bg-[#181512] text-white shadow-md shadow-black/10"
                  : "bg-transparent text-gray-600 hover:bg-gray-50"
              }`}
            >
              {feel === "偏冷" ? "🥶 " : feel === "舒适" ? "😋 " : "🥵 "}
              {feel}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
          * 设置后，AI 全天穿衣建议会自动结合您的抗寒特征（如：偏冷用户会建议额外增加保暖层外套）。
        </p>
      </section>

      {/* Main Settings Menu Items */}
      <div className="px-6 space-y-4">

        {/* Menu Block 1: Support & Questions */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center space-x-2">
            <span className="material-symbols-outlined text-gray-500 text-lg">help_outline</span>
            <span className="text-sm font-bold text-gray-800">帮助与支持</span>
          </div>

          <div className="divide-y divide-gray-100">
            {faqs.map((faq, i) => (
              <div key={i} className="px-5 py-3.5">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex justify-between items-center text-left text-sm font-medium text-gray-700 hover:text-gray-950 transition-colors cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  <span className={`material-symbols-outlined text-gray-400 text-lg transform transition-transform duration-300 ${activeFaq === i ? "rotate-180 text-gray-900" : ""}`}>
                    expand_more
                  </span>
                </button>
                {activeFaq === i && (
                  <p className="text-xs text-gray-500 leading-relaxed mt-2.5 pt-2 border-t border-dashed border-gray-100 animate-[fadeIn_0.2s_ease-out]">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Menu Block 2: Location and Privacy */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
          {/* Permission Settings */}
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="material-symbols-outlined text-gray-500">location_on</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">地理定位授权</span>
                <span className="text-[10px] text-gray-400">自动读取当前城市实时天气</span>
              </div>
            </div>
            <button
              onClick={() => setLocationGranted(!locationGranted)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                locationGranted ? "bg-[#181512]" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  locationGranted ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Data Management Option */}
          <div className="px-5 py-4">
            <button
              onClick={() => setDataManagementOpen(!dataManagementOpen)}
              className="w-full flex items-center justify-between text-left cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-gray-500">database</span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800">本地数据清理</span>
                  <span className="text-[10px] text-gray-400">重置衣橱、历史行程与自定义场景</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>

            {dataManagementOpen && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col space-y-3 animate-[fadeIn_0.2s_ease-out]">
                <p className="text-xs text-red-500">
                  ⚠️ 注意：此操作不可逆，将清除您的本地所有自定义行程、服装与搭配。
                </p>
                <button
                  onClick={() => {
                    localStorage.clear();
                    alert("数据已重置，刷新页面后将生效。");
                    window.location.reload();
                  }}
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg py-2.5 text-xs font-semibold transition-all cursor-pointer text-center"
                >
                  确 认 重 置
                </button>
              </div>
            )}
          </div>

          {/* Legal documentation buttons */}
          <div className="px-5 py-4 flex justify-between items-center text-sm font-bold text-gray-800">
            <div className="flex items-center space-x-3">
              <span className="material-symbols-outlined text-gray-500">policy</span>
              <span>用户协议 / 隐私政策</span>
            </div>
            <div className="flex space-x-2 text-xs text-gray-400 font-normal">
              <a href="#" className="hover:underline">协议</a>
              <span>·</span>
              <a href="#" className="hover:underline">隐私</a>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          id="sign_out_btn"
          onClick={onSignOut}
          className="w-full bg-white text-red-600 hover:bg-red-50 border border-red-100 rounded-2xl py-4 text-sm font-bold tracking-wide transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span>退出当前账户</span>
        </button>

      </div>
    </div>
  );
}
