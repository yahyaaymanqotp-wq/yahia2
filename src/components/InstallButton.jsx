import { useEffect, useState } from "react";

export default function InstallButton() {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    const h = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  if (!prompt) return null; // مش هيظهر غير لما يكون جاهز للتثبيت المباشر

  return (
    <button
      onClick={async () => { prompt.prompt(); await prompt.userChoice; setPrompt(null); }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-8 py-4 rounded-full font-bold shadow-2xl"
    >
      ⬇️ تثبيت التطبيق الآن
    </button>
  );
}