import React, {useState, useRef} from "react";
import {Layout, Menu, Button, Tooltip, Space, message} from "antd";
import {SunOutlined, MoonOutlined} from "@ant-design/icons";
import Handsontable from 'handsontable';
import {registerAllModules} from 'handsontable/registry';
import { useNavigate, Routes, Route, Navigate } from "react-router-dom";
// 导入分出去的组件，即js文件
import Dashboard from './dashboard';
import AboutPage from './about';

// 注意：如果 import 报错，请使用此路径或在 index.html 引入 CDN
// import 'handsontable/dist/handsontable.full.css';
import './styles/App.css';

registerAllModules();


const {Header, Footer} = Layout;

function App() {
    const navigate = useNavigate();

    const [result, setResult] = useState(null);
    // 右边小括号的内容为左边第一个变量，传递到函数的值，函数名为第二个元素
    const [darkMode, setDarkMode] = useState(false);
    const hotRef = useRef(null);

    // 初始数据
    const initialData = [
        ['1', 20, '', ''],
        ['2', 27, '', ''],
        ['3', 25, '', ''],
        ['4', 22, '', ''],
        ['5', 18, '', ''],
        ['6', 21, '', ''],
        ['7', 26, '', ''],
        ['8', 19, '', ''],
        ['9', 16, '', ''],
        ['10', 28, '', ''],
        ['11', 25, '', ''],
        ['12', 24, '', ''],
        ['13', 17, '', ''],
        ['14', 23, '', ''],
        ['15', 27, '', '']
    ];// 创建一个能被 React 监测到的数据仓库: 变动的数据集和数据修改函数
    const initialColumns = ['Week', 'Calls', '', ''];
    const [tableData, setTableData] = useState(initialData);
    const [columns, setColumns] = useState(initialColumns);

    const defaultItems = Handsontable.plugins.ContextMenu.DEFAULT_ITEMS;

    // --- 功能逻辑 ---
    const toggleTheme = () => {
        setDarkMode(!darkMode);
    }


    const resetData = () => {
        // initialData 是你最初定义的那个空数组或默认数组
        setTableData([...initialData]);
        setColumns([...initialColumns]);
    };

    const handleSetHeader = () => {
        const hotInstance = hotRef.current.hotInstance;
        const currentData = hotInstance.getData(); // 获取当前表格所有数据

        if (currentData.length > 0) {
            const newHeaders = currentData[0]; // 取第一行作为新标题
            const remainingData = currentData.slice(1); // 剩下的是数据部分

            // 更新状态或直接更新 Handsontable 设置
            hotInstance.updateSettings({
                colHeaders : newHeaders,
                data: remainingData
            });
            setTableData(remainingData);
            setColumns(newHeaders);
        }
    };

    // 可视化当前的输入数据（不运行预测模型）
    const plotInputData = (e) => {

        // 1. 从 Handsontable 引用中获取实时数据实例
        const hotInstance = hotRef.current.hotInstance;
        // 获取所有数据（二维数组格式）
        const tableData = hotInstance.getData();

        // 2. 数据清洗：过滤掉日期(col 0)或数值(col 1)为空的无效行
        const cleanData = tableData.filter(row => row[0] && row[1]);

        // 3. 基本校验：如果没有有效数据，提示用户，不进行后续操作
        if (cleanData.length === 0) {
            return message.warning("Table is empty. Please enter or paste data first.");
        }

        // 4. 数据格式化：将二维数组转为 Plotly 所需的 X (时间轴) 和 Y (数值轴) 数组
        const times = cleanData.map(row => row[0]); // 提取第一列作为时间/索引
        const values = cleanData.map(row => row[1]); // 提取第二列作为数值

        // 5. 构造一个专用于展示原数据的“结果”对象
        // 我们只填充 time 和 value，将 pred (预测值) 设为空数组
        // 这样下面的绘图组件就会只画出“真实值”那条线
        const inputDataVisualization = {
            time: times, value: values, pred: [], // 这里是关键，设为空，表示此时没有预测结果
        };

        // 6. 更新状态，触发页面下方的 <Plot /> 组件重新渲染
        setResult(inputDataVisualization);

        // 7. 提供用户反馈
        message.success(`Successfully visualized ${cleanData.length} data points.`);
    };

    // 运行预测
    const runPrediction = async () => {
        const tableData = hotRef.current.hotInstance.getData();
        const cleanData = tableData.filter(row => row[0] && row[1]);
        if (cleanData.length === 0) return message.warning("请先输入有效数据！");

        try {
            const res = await fetch("http://127.0.0.1:8000/predict", {
                method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({data: cleanData}),
            });
            const json = await res.json();
            setResult(json);
            message.success("预测完成！");
        } catch (error) {
            message.error("预测请求失败，请检查后端服务。");
        }
    };

    return (<Layout className={darkMode ? "dark" : "light"}>
        <Header className={`app-header ${darkMode ? "dark" : "light"}`}>
            <div className="header-container">
                {/* 左侧：Logo */}
                <div className="header-left">
                    <div className="header-logo"
                         style={{ cursor: 'pointer' }}   // 鼠标悬停显示手型，提示可点击
                         onClick={() => navigate("/")}   // 点击回到 Dashboard
                     >Dr Zhen Chen's Forecaster</div>
                </div>

                {/* --- 重点：重新找回的翻译插件容器 --- */}
                <div className="header-center">
                    <div id="google_translate_element"></div>
                </div>
                {/* ---------------------------------- */}

                <div className="header-right">
                    <Space size="large">
                        <Menu theme={darkMode ? "dark" : "light"} mode="horizontal"
                            // 使用路径作为 key，刷新页面也能正确高亮
                              selectedKeys={[window.location.pathname]}
                              onClick={({ key }) => navigate(key)}
                        >
                            <Menu.Item key="/">Dashboard</Menu.Item>
                            <Menu.Item key="/about">About</Menu.Item>
                        </Menu>

                        <Tooltip title="Switch Theme">
                            <Button type="text" onClick={toggleTheme} className={"theme-button"}
                                    icon={darkMode ? <SunOutlined/> : <MoonOutlined/>}/>
                        </Tooltip>
                    </Space>
                </div>
            </div>
        </Header>

        {/* 2. 核心修复：Routes 应该放在这里，控制主体内容的切换 */}
        <Routes>
            <Route path="/" element={
                <Dashboard
                    darkMode={darkMode}
                    plotInputData={plotInputData}
                    hotRef={hotRef}
                    tableData={tableData}
                    setTableData={setTableData} // <--- 确保这里也写了传递逻辑
                    columns={columns}
                    handleSetHeader={handleSetHeader}
                    resetData={resetData}
                    defaultItems={defaultItems}
                    runPrediction={runPrediction}
                    result={result}
                />
            } />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />  {/* 所有未匹配的都跳到 Dashboard */}
        </Routes>

        <Footer className="app-footer">An online forecaster ©Dr Zhen Chen 2026</Footer>
    </Layout>);
}

export default App;