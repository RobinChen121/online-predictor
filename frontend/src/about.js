import React, {useState, useEffect} from "react";
import ReactMarkdown from "react-markdown";
import 'github-markdown-css/github-markdown.css';
// 这里导入的是文件的 URL
import aboutRawPath from "./about.md";
import rehypeRaw from 'rehype-raw'; // 引入插件

const AboutPage = () => {
    const [content, setContent] = useState("");

    useEffect(() => {
        // 使用 fetch 去请求这个编译后的文件路径
        fetch(aboutRawPath)
            .then((res) => res.text())
            .then((text) => {
                setContent(text);
            })
            .catch((err) => {
                console.error("读取 Markdown 失败:", err);
                setContent("无法加载关于文档。");
            });
    }, []);

    return (
        <div style={{padding: 20, maxWidth: 900, margin: "0 auto", background: "transparent"}}>
            {/* 必须包裹在 markdown-body 类名下 */}
            <div className="markdown-body">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
            </div>
        </div>
    );
};

export default AboutPage;