import { useEffect, useState } from "react";

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(true); // هنظهره دايما

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShow(false);
    } else {
      // لو المتصفح مش راضي، نعلمه ازاي يثبت يدوي
      alert("للتثبيت: دوس الـ 3 نقط فوق في كروم واختار 'تثبيت التطبيق' او 'Add to Home Screen'");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center">
      <button
        onClick={handleInstall}
        className="bg-[#111827] text-white px-8 py-4 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] font-bold text-lg flex items-center gap-2"
      >
        ⬇️ ثبت تطبيق سوق فاقوس الآن
      </button>
    </div>
  );
}