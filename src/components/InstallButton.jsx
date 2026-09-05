import { useEffect, useState } from "react";

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // كشف الايفون
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // لو التطبيق نزل خلاص اخفي الزرار
    window.addEventListener("appinstalled", () => {
      setShowButton(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowButton(false);
    }
    setDeferredPrompt(null);
  };

  if (!showButton) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-50">
      <button
        onClick={handleInstall}
        className="w-full md:w-auto bg-[#111827] text-white px-6 py-3 rounded-full shadow-2xl flex items-center justify-center gap-3 animate-bounce hover:scale-105 transition"
      >
        <span className="text-xl">⬇️</span>
        <span className="font-bold">ثبت تطبيق سوق فاقوس</span>
        <span className="bg-gradient-to-r from-purple-600 to-orange-400 text-white text-xs px-2 py-1 rounded-full">جديد</span>
      </button>

      {isIOS && (
         <p className="text-xs text-center mt-2 bg-white p-2 rounded-lg shadow">للايفون: دوس مشاركة ثم "إضافة إلى الشاشة الرئيسية"</p>
      )}
    </div>
  );
}