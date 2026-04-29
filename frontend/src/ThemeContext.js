import React, { createContext, useState, useContext } from 'react';

// Context 对象如同一个组件树里的“无线广播站”
// 在没有 Context 之前，React 传递数据像“接力赛”，必须一层层把 Props 传下去。
// 有了 Context，父组件就像开了个直播间，任何子组件只要“点个关注”（使用 Hook），就能直接接收到信号，
// 不管它们隔了多少层

// 1. 创建 Context 对象
const ThemeContext = createContext();

// 2. 创建 Provider 组件
// 如果把 Context 对象 比作一个广播电台，那么 Provider 就是那个信号发射塔。
// 在 React 中，Provider 是 Context 对象自带的一个特殊组件。它的唯一任务就是：确定数据的“覆盖范围”，并把具体的数据发出去。
export const ThemeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(false);

    const toggleDarkMode = () => setDarkMode(!darkMode);

    return (
        // 将状态和修改状态的函数都传下去
        <ThemeContext.Provider value={{ darkMode, setDarkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

// 3. 自定义 Hook（方便后续调用）
export const useTheme = () => useContext(ThemeContext);