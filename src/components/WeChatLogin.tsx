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
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const handleLoginClick = (e: React.MouseEvent, type: "wechat" | "phone_submit") => {
    if (!isChecked) {
      e.preventDefault();
      // Trigger checkbox shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    if (type === "wechat") {
      // Simulate direct WeChat OAuth session callback
      onLoginSuccess({
        ...initialUser,
        isLoggedIn: true,
      });
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChecked) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    if (phoneNumber && smsCode) {
      onLoginSuccess({
        ...initialUser,
        nickname: `手机用户_${phoneNumber.slice(-4)}`,
        isLoggedIn: true,
      });
    }
  };

  const sendSms = () => {
    if (!phoneNumber) return;
    setIsSendingSms(true);
    setTimeout(() => {
      setIsSendingSms(false);
      setSmsSent(true);
    }, 1000);
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
              alt="今天穿什么 Logo"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-gray-900 tracking-widest font-semibold">
            今天穿什么
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
            onClick={(e) => handleLoginClick(e, "wechat")}
            className="w-full bg-[#07C160] hover:bg-[#06ad56] text-white rounded-full py-4 flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md shadow-[#07C160]/20 cursor-pointer border border-transparent"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              chat
            </span>
            <span className="font-medium text-base tracking-widest font-sans">微信一键登录</span>
          </button>

          {/* Alternative Phone Login Button */}
          <button
            id="phone_login_trigger"
            onClick={() => setShowPhoneModal(true)}
            className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 rounded-full py-4 font-sans text-base font-bold tracking-widest transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            手机号登录 / 注册
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

      {/* Beautiful Modal for Phone OTP Login */}
      {showPhoneModal && (
        <div className="absolute inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-end justify-center md:items-center transition-all">
          <div className="w-full md:max-w-md bg-white/80 backdrop-blur-2xl border-t border-white/60 md:border rounded-t-[2rem] md:rounded-3xl p-8 shadow-2xl flex flex-col space-y-6 animate-[slideUp_0.3s_ease-out_forwards]">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200/50">
              <h3 className="font-serif text-xl font-semibold text-gray-900 tracking-wider">手机号安全登录</h3>
              <button
                id="close_phone_modal"
                onClick={() => setShowPhoneModal(false)}
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-gray-600 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handlePhoneSubmit} className="flex flex-col space-y-5">
              <div className="flex flex-col space-y-2">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">手机号码</label>
                <div className="flex space-x-2">
                  <div className="bg-white/50 border border-gray-200/60 rounded-xl px-4 py-3 text-sm text-gray-600 font-medium flex items-center shadow-sm">
                    +86
                  </div>
                  <input
                    id="phone_input"
                    type="tel"
                    placeholder="请输入11位中国大陆手机号"
                    maxLength={11}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 bg-white/50 border border-gray-200/60 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition-all shadow-sm placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">短信验证码</label>
                <div className="flex space-x-2">
                  <input
                    id="sms_code_input"
                    type="text"
                    placeholder="6位数字验证码"
                    maxLength={6}
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 bg-white/50 border border-gray-200/60 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-gray-400 focus:bg-white transition-all shadow-sm placeholder:text-gray-400"
                  />
                  <button
                    id="send_sms_btn"
                    type="button"
                    disabled={phoneNumber.length !== 11 || isSendingSms}
                    onClick={sendSms}
                    className="bg-gray-900 text-white disabled:bg-gray-200 disabled:text-gray-400 text-xs font-semibold px-5 rounded-xl transition-all active:scale-95 cursor-pointer shadow-md disabled:shadow-none"
                  >
                    {isSendingSms ? "发送中..." : smsSent ? "重新发送" : "获取验证码"}
                  </button>
                </div>
              </div>

              <button
                id="phone_login_submit"
                type="submit"
                onClick={(e) => handleLoginClick(e, "phone_submit")}
                disabled={phoneNumber.length !== 11 || smsCode.length !== 6}
                className="w-full bg-gray-900 text-white disabled:bg-gray-200 disabled:text-gray-400 rounded-2xl py-4 text-sm font-bold tracking-widest transition-all active:scale-95 shadow-lg shadow-gray-900/20 disabled:shadow-none cursor-pointer mt-4"
              >
                确认登录
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
