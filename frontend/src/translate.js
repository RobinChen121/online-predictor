// 单独一个 js 文件才能完全保证翻译插件不被覆盖
import { useEffect, useRef } from "react";

export default function Translate() {
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // 1️⃣ Google 初始化函数（你原来的 googleTranslateElementInit）
        window.googleTranslateElementInit = () => {
            if (window.google) {
                new window.google.translate.TranslateElement(
                    {
                        pageLanguage: "en",
                        includedLanguages:
                            "en,zh-CN,zh-TW,ja,ko,de,ru,fr,es,it,pt,hi,ar,fa",
                        layout:
                        window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    },
                    "google_translate_element"
                );
            }
        };

        // 2️⃣ 动态加载 script
        const script = document.createElement("script");
        script.src =
            "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);

        // 3️⃣ 等插件加载后，处理语言显示 + localStorage
        const timer = setTimeout(() => {
            const langLink = document.querySelector(
                // ".VIpgJd-ZVi9od-xl07Ob-lTBxed"
            ".goog-te-combo"

            );
            const langSpan = langLink ? langLink.querySelector("span") : null;

            if (!langSpan) return;

            // 恢复语言
            const savedLang = localStorage.getItem("selectedLanguage") || "EN";
            langSpan.innerText = savedLang;

            // 监听变化
            const observer = new MutationObserver(() => {
                const newLang = langSpan.innerText.trim();
                if (newLang && newLang !== "En") {
                    localStorage.setItem("selectedLanguage", newLang);
                }
            });

            observer.observe(langSpan, {
                childList: true,
                subtree: true,
                characterData: true,
            });
        }, 1000);

        // 清理（避免内存泄漏）
        return () => clearTimeout(timer);
    }, []);

    return <div id="google_translate_element"></div>;
}
