import React, { useState } from "react";
import { User } from "../types";
import brandLogo from "../assets/images/产品logo.jpg";

interface WeChatLoginProps {
  onLoginSuccess: (user: User) => void;
  initialUser: User;
}

export default function WeChatLogin({ onLoginSuccess, initialUser }: WeChatLoginProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleLoginClick = (e: React.MouseEvent) => {
    if (!isChecked) {
      e.preventDefault();
      // Trigger checkbox shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // Simulate direct WeChat OAuth session callback
    onLoginSuccess({
      ...initialUser,
      isLoggedIn: true,
    });
  };

  return (
    <div id="login_screen" className="relative h-screen max-w-md mx-auto overflow-hidden font-sans antialiased shadow-2xl bg-[#fafafa]">
      {/* Login Portal Main Body */}
      <main className="relative z-10 h-full w-full flex flex-col justify-between px-8 py-12 md:py-16">

        {/* Brand Header */}
        <div className="flex flex-col items-center mt-16 md:mt-24 text-center">
          <div className="w-24 h-24 mb-6 relative flex items-center justify-center rounded-full border border-gray-200 bg-white p-[2px] shadow-sm">
            <img
              src={brandLogo}
              alt="穿衣有数 Logo"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-gray-900 tracking-widest font-semibold">
            穿衣有数
          </h1>
          <div className="w-12 h-[1px] bg-gray-300 my-6"></div>
          <p className="font-serif text-sm md:text-base text-gray-500 max-w-[280px] leading-relaxed tracking-widest">
            让每一天的穿衣决策，都成为一种享受。
          </p>
        </div>

        {/* Action Controls & Footer */}
        <div className="w-full pb-8 md:pb-12 space-y-5">
          {/* WeChat Login Action Button */}
          <button
            id="wechat_login_btn"
            onClick={handleLoginClick}
            className="w-full bg-[#07C160] hover:bg-[#06ad56] text-white rounded-full py-4 flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md shadow-[#07C160]/20 cursor-pointer border border-transparent"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              chat
            </span>
            <span className="font-medium text-base tracking-widest font-sans">微信一键登录</span>
          </button>

          {/* Agreement Checkbox Segment */}
          <div
            id="agreement_terms"
            className={`flex items-start justify-center space-x-2 px-4 transition-all duration-300 ${
              isShaking ? "animate-[bounce_0.4s_ease-in-out_infinite] text-red-500" : ""
            }`}
          >
            <div className="relative flex items-center mt-1">
              <input
                id="terms_checkbox"
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="w-4 h-4 rounded-sm border-gray-400 bg-white/50 text-gray-900 transition-all cursor-pointer accent-gray-900 focus:ring-0 focus:ring-offset-0 appearance-none border checked:bg-gray-900 checked:border-gray-900"
              />
              {isChecked && (
                <span className="material-symbols-outlined absolute inset-0 text-xs text-white font-bold pointer-events-none flex items-center justify-center">
                  check
                </span>
              )}
            </div>
            <label
              htmlFor="terms_checkbox"
              className={`font-sans text-xs leading-tight cursor-pointer text-center select-none ${
                isShaking ? "text-red-500 font-semibold" : "text-gray-500"
              }`}
            >
              已阅读并同意{" "}
              <a href="#" onClick={(e) => e.stopPropagation()} className="text-gray-800 hover:text-black hover:underline underline-offset-2">
                《用户协议》
              </a>{" "}
              和{" "}
              <a href="#" onClick={(e) => e.stopPropagation()} className="text-gray-800 hover:text-black hover:underline underline-offset-2">
                《隐私政策》
              </a>
            </label>
          </div>
        </div>
      </main>

    </div>
  );
}
