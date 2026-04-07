import React, {useState, useRef} from "react";
import {Layout, Menu, Button, Tooltip, Space, message, Modal, Select} from "antd";
import {SunOutlined, MoonOutlined} from "@ant-design/icons";
import {registerAllModules} from 'handsontable/registry';
import {useNavigate, Routes, Route, Navigate} from "react-router-dom";
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [columnOptions, setColumnOptions] = useState([]); // 存储列名
    const [xAxis, setXAxis] = useState(null);               // 横轴选中的列
    const [yAxes, setYAxes] = useState([]);                 // 纵轴选中的列（多选）

    // 初始数据
    const initialData = [
        ['1', 20, ''],
        ['2', 27, ''],
        ['3', 25, ''],
        ['4', 22, ''],
        ['5', 18, ''],
        ['6', 21, ''],
        ['7', 26, ''],
        ['8', 19, ''],
        ['9', 16, ''],
        ['10', 28, ''],
        ['11', 25, ''],
        ['12', 24, '',],
        ['13', 17, ''],
        ['14', 23, ''],
        ['15', 27, '']
    ];// 创建一个能被 React 监测到的数据仓库: 变动的数据集和数据修改函数
    const initialColumns = ['Week', 'Calls', '', ''];
    const [tableData, setTableData] = useState(initialData);
    const [columns, setColumns] = useState(initialColumns);


    // --- 功能逻辑 ---
    const toggleTheme = () => {
        setDarkMode(!darkMode);
    }

    const resetData = () => {
        // initialData 是你最初定义的那个空数组或默认数组
        setTableData([...initialData]);
        setColumns([...initialColumns]);
    };

    // 更改表头名字
    const handleSetHeader = () => {
        const hotInstance = hotRef.current.hotInstance;
        const currentData = hotInstance.getData(); // 获取当前表格所有数据

        if (currentData.length > 0) {
            const newHeaders = currentData[0]; // 取第一行作为新标题
            const remainingData = currentData.slice(1); // 剩下的是数据部分

            // 更新状态或直接更新 Handsontable 设置
            hotInstance.updateSettings({
                colHeaders: newHeaders,
                data: remainingData
            });
            setTableData(remainingData);
            setColumns(newHeaders);
        }
    };

    const handleVisualizeClick = () => {
        // 从 Handsontable 实例获取最新的列头
        const headers = hotRef.current.hotInstance.getColHeader();
        const options = headers.map((header, index) => ({
            label: header || `Column ${index + 1}`,
            value: index // 存索引，方便后面取数据
        }));

        setColumnOptions(options);
        setIsModalOpen(true);
    };

    // 可视化当前的输入数据（不运行预测模型）
    const plotInputData = (xIdx, yIdxArray) => {
        if (xIdx === null || !yIdxArray || yIdxArray.length === 0) {
            message.warning("Please select both X and Y columns").then(r => '');
            return;
        }

        // 从 Handsontable 引用中获取实时数据实例
        const hotInstance = hotRef.current.hotInstance;
        // 获取所有数据（二维数组格式）
        const tableData = hotInstance.getData(); // 获取所有行的数据 [[row1], [row2]...]

        // 数据清洗：过滤掉空的无效行
        const cleanData = tableData.filter(row => {
                // 检查 X 轴列是否有值
                const hasX = row[xIdx] !== null && row[xIdx] !== '';
                // 检查所有选中的 Y 轴列是否有值 (使用 every 确保全都有值，或用 some 只要有一个有值)
                const hasY = yIdxArray.some(yIdx => row[yIdx] !== null && row[yIdx] !== '');

                return hasX && hasY;
            }
        );

        // 基本校验：如果没有有效数据，提示用户，不进行后续操作
        if (cleanData.length === 0) {
            return message.warning("Table is empty. Please enter or paste data first.");
        }

        // 构造 Plotly 需要的数据格式
        const traces = yIdxArray.map(yIdx => {
            return {
                // 第一个参数：当前元素的值（value)
                // 第二个参数：当前元素的索引（index）
                // 第三个参数：原数组本身（array
                x: cleanData.map((_, index) =>
                    xIdx === 'default_index' ? index + 1 : cleanData[index][xIdx]
                ),
                y: cleanData.map(row => {
                    const val = row[yIdx];
                    // 尝试转换为数字，如果转换失败则保持原样（针对非数值轴）
                    return isNaN(parseFloat(val)) ? val : parseFloat(val);
                }),
                name: columnOptions[yIdx].label,
                type: 'scatter',
                mode: 'lines+markers'
            };
        });

        // 获取选中的 X 轴列名
        const selectedXName = xIdx === 'default_index'
            ? "Time index"
            : (columnOptions.find(opt => opt.value === xIdx)?.label || "Time index");
        // 更新你的 result 状态，让 Plot 组件渲染
        setResult({
            isCustomPlot: true,
            data: traces,
            xAxisName: selectedXName, // 新增：保存选中的 X 轴标题
        });

        // 提供用户反馈
        message.success(`Successfully visualized ${cleanData.length} data points.`).then(r => '');
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
                         style={{cursor: 'pointer'}}   // 鼠标悬停显示手型，提示可点击
                         onClick={() => navigate("/")}   // 点击回到 Dashboard
                    >Dr Zhen Chen's Forecaster
                    </div>
                </div>

                {/* --- 重点：重新找回的翻译插件容器 --- */}
                <div className="header-center">
                    <div id="google_translate_element"></div>
                </div>
                {/* ---------------------------------- */}

                <div className="header-right">
                    <Space
                        // size="large"
                    >
                        <Menu theme={darkMode ? "dark" : "light"} mode="horizontal"
                            // 使用路径作为 key，刷新页面也能正确高亮
                              selectedKeys={[window.location.pathname]}
                              onClick={({key}) => navigate(key)}
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

        {/*弹窗组件*/}
        <Modal
            title="Select Columns for Visualization"
            destroyOnHidden={true} //  每次打开都重新初始化内部组件
            open={isModalOpen}
            onOk={() => {
                plotInputData(xAxis, yAxes); // 确认时执行绘图逻辑
                setIsModalOpen(false);
            }}
            onCancel={() => setIsModalOpen(false)}
        >
            <div style={{marginBottom: 16}}>
                <p>Select X-Axis (Horizontal):</p>
                <Select
                    style={{width: '75%'}}
                    placeholder="Choose one column"
                    options={[
                        { label: 'Default Index (1, 2, 3...)', value: 'default_index' },
                        // ... 叫做扩展运算符，把数组里的每个元素展开放到新数组里
                        ...columnOptions
                    ]}
                    onChange={(val) => setXAxis(val)}
                />
            </div>
            <div>
                <p>Select Y-Axis (Verticals):</p>
                <Select
                    mode="multiple" // 允许多选
                    style={{width: '75%'}}
                    placeholder="Choose one or more columns"
                    options={columnOptions}
                    // 关键配置：限制下拉菜单的高度并允许滚动
                    onChange={(val) => setYAxes(val)}
                />
            </div>
        </Modal>

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
                    handleVisualizeClick={handleVisualizeClick}
                    runPrediction={runPrediction}
                    result={result}
                />
            }/>
            <Route path="/about" element={<AboutPage/>}/>
            <Route path="*" element={<Navigate to="/" replace/>}/> {/* 所有未匹配的都跳到 Dashboard */}
        </Routes>

        <Footer className="app-footer">An online forecaster ©Dr Zhen Chen 2026</Footer>
    </Layout>);
}

export default App;