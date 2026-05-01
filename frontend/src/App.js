import React, {useState, useRef, useEffect} from "react";
import {
    Layout,
    Menu,
    Button,
    Tooltip,
    Radio,
    Space,
    message,
    Modal,
    Select,
    Form,
    ConfigProvider,
    theme,
    InputNumber,
    Divider
} from "antd";
import {SunOutlined, MoonOutlined} from "@ant-design/icons";
import {registerAllModules} from 'handsontable/registry';
import {useNavigate, Routes, Route, Navigate} from "react-router-dom";
// import 'katex/dist/katex.min.css';
// import {InlineMath} from "react-katex";

// 导入分出去的组件，即js文件
// ./ 表示 “当前文件所在的目录
import Dashboard from './dashboard'; // 自动找里面前缀是dashboard的文件
import AboutPage from './about';
import {airPassengers, shampooSales} from './dataset'
import Translate from './translate';

// 注意：如果 import 报错，请使用此路径或在 index.html 引入 CDN
// import 'handsontable/dist/handsontable.full.css';
import './styles/App.css';


registerAllModules(); // handsontable

const {Header, Footer} = Layout;

function App() {
    // navigate 可以控制跳转到其他页面
    const navigate = useNavigate();

    // 初始数据
    const initialData = [
        ['1', 20],
        ['2', 27],
        ['3', 25],
        ['4', 22],
        ['5', 18],
        ['6', 21],
        ['7', 26],
        ['8', 19],
        ['9', 16],
        ['10', 28],
        ['11', 25],
        ['12', 24],
        ['13', 17],
        ['14', 23],
        ['15', 27]
    ];
    // 创建一个能被 React 监测到的数据仓库: 变动的数据集和数据修改函数
    const initialColumns = ['Week', 'Calls'];
    // 转换为 Option 格式
    // 在 JavaScript 的箭头函数中，如果你使用了大括号 { ... }，它被视为一个代码块，你必须明确使用 return 关键字
    const headerToOption = (headers) =>
        headers.map((item, index) => ({label: item, value: index}));

    const DATASET_CONFIG = {
        air: {
            name: 'Air Passengers',
            data: airPassengers,
            headers: ['Month', 'Passengers']
        },
        shampoo: {
            name: 'Shampoo Sales',
            data: shampooSales,
            headers: ['Year-month', 'Sales']
        }
    };
    // 定义 Select dataset 的选项
    const datasetOptions = [
        {label: 'Air Passengers (1949-1960)', value: 'air'},
        {label: 'Shampoo Sales (3 Years)', value: 'shampoo'}
    ];

    // map 第一个参数为当前正在处理的元素，第二个为索引
    const initialColumnOptions = headerToOption(initialColumns);

    const [instance, setWasmInstance] = useState(null);
    const [plot_result, setResult] = useState(null);
    // 右边小括号里是初始值，仅在组件挂载时执行
    const [uiState, setUiState] = useState({
        darkMode: false,
        activeModal: null,
        isCardVisible: false
    });
    const [chartConfig, setChartConfig] = useState({
        xAxis: 'default_index',   // 横轴选中的列
        yAxes: [] // 纵轴选中的列（多选）
    });
    const [tableConfig, setTableConfig] = useState({
        columnOptions: initialColumnOptions,   // 存储列名
        tableData: initialData, // 纵轴选中的列（多选）
        selectDataset: 'air'
    });

    const [params, setParams] = useState({
        k: 3,
        alpha: 0.5,
        beta: 0.5
    });
    const [metrics, setMetrics] = useState({ RMSE: null, MAE: null });
    const [radioOption, setRaioOption] = useState(null);


    useEffect(() => {
        async function init() {
            // 检查全局变量是否存在（由 public/index.html 中的 <script> 标签注入）
            // 如果你在 emcc 编译时用了 -s EXPORT_NAME="createPredictModule"，这里就改用 window.createPredictModule
            const createModule = window.predictModule;

            if (typeof createModule !== 'function') {
                console.error("Wasm 脚本尚未加载，请确保 index.html 中已引入 predict.js");
                return;
            }

            try {
                const wasmModule = await createModule({
                    // 关键点：locateFile 决定了去哪里找 .wasm 文件
                    locateFile: (path) => {
                        if (path.endsWith('.wasm')) {
                            // 直接返回根目录下的文件名
                            // 这个地址容易出错，必须是能下载到wasm文件的那个地址
                            return '/predictor/predict.wasm';
                        }
                        return path;
                    }
                });

                console.log("WASM ready", wasmModule);
                setWasmInstance(wasmModule);
            } catch (e) {
                console.error("Wasm 初始化失败:", e);
            }
        }

        init();
        // [] 表示根据什么变量的变化才生效
    }, []);

    const hotRef = useRef(null);

    // 关闭弹窗的统一方法
    const closeModal = () => setUiState(prevState => ({...prevState, activeModal: null}));

    // useEffect(() => {
    //     // useEffect 的作用是当网页渲染之后的操作
    //     // 根据 columnOptions 实时更新选中的YAxes
    //     if (tableConfig.columnOptions.length > 1 && chartConfig.yAxes.length === 0) {
    //         setChartConfig(prevState => ({...prevState, yAxes: [tableConfig.columnOptions[1].value]}));
    //     }
    //     // [] 表示根据什么变量的变化才生效
    // }, [tableConfig.columnOptions, chartConfig.yAxes]);


    // --- 功能逻辑 ---
    const toggleTheme = () => {
        setUiState(prevState => ({...prevState, darkMode: !uiState.darkMode}))
    }

    const resetData = () => {
        // initialData 是你最初定义的那个空数组或默认数组
        // ... 是扩展运算符，将数组拆开再创建一个新数组
        setTableConfig(prevState => ({...prevState, tableData: initialData}));
        setTableConfig(prevState => ({...prevState, columnOptions: initialColumnOptions}));
    };

    const radioPredictionSelect = (e) => {
        setRaioOption(e.target.value);
    };

    const handleDatasetChange = (key) => {
        const selected = DATASET_CONFIG[key];

        // 更新表格数据
        setTableConfig(prevState => ({...prevState, tableData: selected.data}));

        // 更新标题
        setTableConfig(prevState => ({...prevState, columnOptions: headerToOption(selected.headers)}));
    };

    const handleDatasetChangeClick = () => {
        setUiState(prevState => ({...prevState, activeModal: 'select-dataset'}));
    }

    const movingAverage = (raw_data, k) => {
        if (k > raw_data.length) {
            message.warning('k is too large!');
            return;
        }

        const result = [];
        let windowSum = 0;

        for (let i = 0; i < raw_data.length + 1; i++) {
            // 加上当前进入窗口的值
            if (i > 0)
                windowSum += raw_data[i - 1];

            // 当索引达到 k-1 时，窗口正式填满，开始计算平均值
            if (i > k - 1) {
                // 计算平均值并推入结果
                result.push(windowSum / k);

                // 减去即将移出窗口的值（为下一次迭代做准备）
                windowSum -= raw_data[i - k];
            } else {
                // 窗口未满时，可以选择填充 null 或跳过
                result.push(null);
            }
        }
        message.success("Moving average prediction finished");
        return result;
    };

    const computeRMSE = (raw_data, predict_data) => {
        const n = raw_data.length;

        let sumSquaredError = 0;

        for (let i = 0; i < n; i++) {
            const actual = parseFloat(raw_data[i]);
            const predicted = parseFloat(predict_data[i]);

            const error = actual - predicted;
            sumSquaredError += error * error;
        }

        const rmse = Math.sqrt(sumSquaredError / n);
        setMetrics(prevState => ({...prevState, RMSE: rmse}));
    };

    const computeMAE = (raw_data, predict_data) => {
        const n = raw_data.length;

        let absoluteError = 0;

        for (let i = 0; i < n; i++) {
            const actual = parseFloat(raw_data[i]);
            const predicted = parseFloat(predict_data[i]);
            absoluteError += Math.abs(actual - predicted);
        }

        const mae = Math.sqrt(absoluteError / n);
        setMetrics(prevState => ({...prevState,MAE: mae}));
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
            setTableConfig(prevState => ({...prevState, tableData: remainingData}));
            setTableConfig(prevState => ({...prevState, columnOptions: newHeaders}));
        }
    };

    const handleVisualizeClick = () => {
        // 从 Handsontable 实例获取最新的列头
        const headers = hotRef.current.hotInstance.getColHeader();
        const options = headers.map((header, index) => ({
            label: header || `Column ${index + 1}`,
            value: index // 存索引，方便后面取数据
        }));

        setTableConfig(prevState => ({...prevState, columnOptions: options}));
        setUiState(prevState => ({...prevState, activeModal: 'visualization'}));
    };

    const handlePredictClick = () => {
        setUiState(prevState => ({...prevState, activeModal: 'statistical-prediction'}));
    };

    // async 是 Asynchronous（异步） 的缩写。它的核心作用是允许你在函数内部使用 await 关键字，
    // 从而用“写同步代码的方式”来处理异步操作
    const handlePredict = async () => {
        const hot = hotRef.current.hotInstance;
        // 从 Handsontable 实例获取最新的列头
        const headers = hot.getColHeader();
        const options = headers.map((header, index) => ({
            label: header || `Column ${index + 1}`,
            value: index // 存索引，方便后面取数据
        }));

        setTableConfig(prevState => ({...prevState, columnOptions: options}));
        if (!uiState.isCardVisible) {
            setUiState(prevState => ({...prevState, activeModal: 'statistical-prediction'}));
        }

        // yAxes 存储的是被选中的列索引
        if (!chartConfig.yAxes) {
            message.warning("Please select one column for prediction");
            return;
        }
        if (chartConfig.yAxes.length > 1) {
            message.warning("Please select only one column for prediction");
            return;
        }

        const rawData = hot.getDataAtCol(chartConfig.yAxes);

        // 过滤掉非数字或空值，转为浮点数
        const numericData = rawData
            .map(val => parseFloat(val))
            .filter(val => !isNaN(val));

        try {
            if (radioOption === 1) {
                let output = movingAverage(numericData, params.k);
                plotInputData("default_index", [chartConfig.yAxes], output);
                computeRMSE(numericData.slice(params.k), output.slice(params.k));
                computeMAE(numericData.slice(params.k), output.slice(params.k));
            }

            if (radioOption !== 1) {
                function arrayToVectorDouble(arr) {
                    let v = new instance.VectorDouble();
                    arr.forEach(x => v.push_back(x));
                    return v;
                }

                function vectorDoubleToArray(v) {
                    const arr = [];
                    const n = v.size();
                    for (let i = 0; i < n; i++) {
                        arr.push(v.get(i));
                    }
                    return arr;
                }

                let input_data = arrayToVectorDouble(numericData);
                const model = new instance.Predictor(input_data);
                let raw_output = model.singleSmooth(params.alpha);
                let output = vectorDoubleToArray(raw_output);
                // console.log(output);
                plotInputData("default_index", [chartConfig.yAxes], output);
                input_data.delete();
                raw_output.delete();
                model.delete();

                computeRMSE(numericData.slice(1), output.slice(1));
                computeMAE(numericData.slice(1), output.slice(1));
            }

            setUiState(prevState => ({...prevState, isCardVisible: true}));
        } catch (error) {
            message.error("Prediction failed.");
        }
    };

    // 可视化当前的输入数据（不运行预测模型）
    const plotInputData = (xIdx = "default_index", yIdxArray, predict_array) => {
        if (xIdx === null || !yIdxArray || yIdxArray.length === 0) {
            message.warning("Please select both X and Y columns").then(r => '');
            return;
        }

        // // 从 Handsontable 引用中获取实时数据实例
        // const hotInstance = hotRef.current.hotInstance;
        // // 获取所有数据（二维数组格式）
        // const tableData = hotInstance.getData(); // 获取所有行的数据 [[row1], [row2]...]

        // 数据清洗：过滤掉空的无效行
        const cleanData = tableConfig.tableData.filter(row => {
                // 检查 X 轴列是否有值
                // row["default_index"] 会返回 undefined, 它不等于 null, 也不是空值
                const hasX = row[xIdx] !== null && row[xIdx] !== '';
                // console.log(row[xIdx]);
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
                // js map 中，第一个参数是当前值，第二个是当前索引
                x: cleanData.map((_, index) => {
                        // 使用 String() 包裹，确保无论哪种情况返回的都是字符串
                        const val = xIdx === 'default_index' ? (index + 1) : cleanData[index][xIdx];
                        // const val = index + 1;
                        return String(val);
                    }
                ),

                y: cleanData.map(row => {
                    const val = row[yIdx];
                    // 尝试转换为数字，如果转换失败则保持原样（针对非数值轴）
                    return isNaN(parseFloat(val)) ? val : parseFloat(val);
                }),
                name: tableConfig.columnOptions[yIdx].label,
                type: 'scatter',
                mode: 'lines+markers'
            };
        });

        // 处理 predict_array (假设它是一个数值数组)
        // 若 predict_array 没有在调用函数时赋值，则它是 undefined, if (predict_array) 返回 false
        if (predict_array && predict_array.length > 0) {
            // const lastOriginalX = cleanData.length; // 默认索引情况

            // 构造预测数据的 X 轴：接在原始数据索引之后
            // js map 中，第一个参数是当前值，第二个是当前索引
            const predictX = predict_array.map((_, i) => String(i + 1));

            // 添加预测数据的 Trace, Trace 可以通过 push 添加
            traces.push({
                x: predictX,
                y: predict_array.map(val => isNaN(parseFloat(val)) ? val : parseFloat(val)),
                name: 'Forecast',
                type: 'scatter',
                mode: 'lines+markers',
                line: {dash: 'dot', color: 'red'}, // 使用虚线和红色区分预测值
                marker: {symbol: 'diamond'}
            });
        }

        // 获取选中的 X 轴列名
        const selectedXName = xIdx === 'default_index'
            ? "Time index"
            : (tableConfig.columnOptions.find(opt => opt.value === xIdx)?.label || "Time index");
        // 更新你的 plot_result 状态，让 Plot 组件渲染
        setResult({
            isCustomPlot: true,
            data: traces,
            xAxisName: selectedXName, // 新增：保存选中的 X 轴标题
        });

        // 提供用户反馈
        if (!uiState.isCardVisible)
            message.success(`Successfully visualized ${cleanData.length} data points.`).then(r => '');
    };

    return (
        // 1. 用 ConfigProvider 包裹整个应用或 Modal 所在区域
        <ConfigProvider
            theme={{
                // 2. 根据你的变量决定使用哪种算法
                algorithm: uiState.darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                token: {
                    // 试试这个紫色，或者换成你喜欢的任何颜色
                    colorPrimary: uiState.darkMode ? '#9e81d5' : '#311765',
                },
            }}
        >

            <Layout className={uiState.darkMode ? "dark" : "light"}>
                <Header className={`app-header ${uiState.darkMode ? "dark" : "light"}`}>
                    <div className="header-container">
                        {/* 左侧：Logo */}
                        <div className="header-left">
                            <div className="header-logo"
                                 style={{cursor: 'pointer'}}   // 鼠标悬停显示手型，提示可点击
                                 onClick={() => navigate("/")}   // 点击回到 Dashboard
                            >Dr Zhen Chen's Predictor
                            </div>
                        </div>

                        {/* --- 重点：重新找回的翻译插件容器 --- */}
                        <div className="header-center">
                            {/*<div id="google_translate_element"></div>*/}
                            <Translate/>
                        </div>
                        {/* ---------------------------------- */}

                        <div className="header-right">
                            <Space
                                // size="large"
                            >
                                <Menu theme={uiState.darkMode ? "dark" : "light"} mode="horizontal"
                                    // 使用路径作为 key，刷新页面也能正确高亮
                                      selectedKeys={[window.location.pathname]}
                                      onClick={({key}) => navigate(key)}
                                >
                                    <Menu.Item key="/">Home</Menu.Item>
                                    <Menu.Item key="/about">About</Menu.Item>
                                </Menu>

                                <Tooltip title="Switch Theme">
                                    <Button type="text" onClick={toggleTheme} className={"theme-button"}
                                            icon={uiState.darkMode ? <SunOutlined/> : <MoonOutlined/>}/>
                                </Tooltip>
                            </Space>
                        </div>
                    </div>
                </Header>

                {/*弹窗组件*/}
                <Modal
                    title="Select Columns for Visualization"
                    destroyOnHidden={true} //  每次打开都重新初始化内部组件
                    open={uiState.activeModal === 'visualization'}
                    onOk={() => {
                        plotInputData(chartConfig.xAxis, chartConfig.yAxes); // 确认时执行绘图逻辑
                        closeModal();
                    }}
                    onCancel={closeModal}
                >
                    <div
                        // style={{marginBottom: 16}}
                    >
                        <p>Select X-Axis (Horizontal):</p>
                        <Select
                            value={chartConfig.xAxis}
                            style={{width: '75%'}}
                            placeholder="Choose one column"
                            options={[
                                {label: 'Default (1, 2, 3...)', value: 'default_index'},
                                // ... 叫做扩展运算符，把数组里的每个元素展开放到新数组里
                                ...tableConfig.columnOptions
                            ]}
                            onChange={(val) => setChartConfig(prevState => ({xAxis: val}))}
                        />
                    </div>
                    <div>
                        <p>Select Y-Axis (Verticals):</p>
                        <Select
                            // value={yAxes}
                            mode="multiple" // 允许多选
                            style={{width: '75%'}}
                            placeholder="Choose one or more columns"
                            options={tableConfig.columnOptions}
                            onChange={(val) => setChartConfig(prevState => ({...prevState, yAxes: val}))}
                        />
                    </div>
                </Modal>

                <Modal
                    title="Prediction Settings"
                    open={uiState.activeModal === 'statistical-prediction'}
                    destroyOnHidden={true} //  每次打开都重新初始化内部组件
                    onOk={() => {
                        handlePredict(); // 确认时执行绘图逻辑
                        closeModal();
                    }}
                    onCancel={closeModal}
                >
                    <Form layout="horizontal">
                        <Form.Item label="Select data for prediction">
                            <Select
                                // mode="multiple"
                                options={tableConfig.columnOptions}
                                onChange={(val) => setChartConfig(prevState => ({...prevState, yAxes: val}))}
                            />
                        </Form.Item>
                    </Form>

                    <Radio.Group onChange={radioPredictionSelect} value={radioOption}>
                        <Space orientation="vertical">
                            <Radio value={1}>Weighted Average</Radio>
                            <Radio value={2}>Single Exponential Smoothing</Radio>
                            <Radio value={3}>Double Exponential Smoothing</Radio>
                            <Radio value={4}>Triple Exponential Smoothing</Radio>
                        </Space>
                    </Radio.Group>

                    {/*onValuesChange 是什么？*/}
                    {/* 这是 Form 组件的一个钩子函数（Callback）。每当用户在表单里输入一个字符、点击一个单选框或滑动进度条时，*/}
                    {/* 这个函数就会被触发*/}
                    <Form
                        // onValuesChange={(changedValues, allValues) => {
                        //     if ('alpha' in changedValues) {
                        //         // ...prev: 使用展开运算符（Spread Operator）把旧的所有参数“解构”出来
                        //         // 用新收到的 alpha 值覆盖掉旧的值
                        //         setParams(prev => ({...prev, alpha: changedValues.alpha}));
                        //     }
                        // 自动匹配改变的键值对并更新到 state
                        onValuesChange={(changedValues) => {
                            setParams(prev => ({...prev, ...changedValues}));
                        }}
                    >
                        {/* 动态显示区域 */}
                        <div style={{marginTop: 16}}>
                            {radioOption === 1 && (
                                // Form 组件中，label 和 name 扮演着完全不同的角色：
                                // label 是给用户看的（外观），而 name 是给代码看的（逻辑）
                                <Form.Item label={"k"} name={"k"}>
                                    {/* placeholder 这里设置淡色的占位值>*/}
                                    <InputNumber min={1} step={1} precision={0} placeholder={'3'}/>
                                </Form.Item>
                            )}

                            {radioOption === 2 && (
                                <Form.Item label={'α'} // <InlineMath math="\alpha" />}
                                           name={"alpha"}
                                    // initialValue={0.5}
                                >
                                    {/*// placeholder="please input the value of α: "*/}
                                    {/* placeholder 这里设置淡色的占位值*/}
                                    <InputNumber min={0} max={1} step={0.1} placeholder={'0.5'}/>
                                </Form.Item>
                            )}

                            {radioOption === 3 && (
                                // <>...</> 是 React Fragment，用来包多个组件（否则 JSX 会报错）
                                // flex 保证横排
                                // 这里的数字会被 react 自动转化为 px
                                <div style={{display: 'flex', gap: 30}}>
                                    <Form.Item label={'α'} style={{marginBottom: 0}}>
                                        <InputNumber min={0} max={1} step={0.1}/>
                                    </Form.Item>
                                    <Form.Item label={'β'} style={{marginBottom: 0}}>
                                        <InputNumber min={0} max={1} step={0.1}/>
                                    </Form.Item>
                                </div>
                            )}

                            {radioOption === 4 && (
                                // <>...</> 是 React Fragment，用来包多个组件（否则 JSX 会报错）
                                // flex 保证横排
                                // 这里的数字会被 react 自动转化为 px
                                <div style={{display: 'flex', gap: 30}}>
                                    <Form.Item label={'α'} style={{marginBottom: 0}}>
                                        <InputNumber min={0} max={1} step={0.1}/>
                                    </Form.Item>
                                    <Form.Item label={'β'} style={{marginBottom: 0}}>
                                        <InputNumber min={0} max={1} step={0.1}/>
                                    </Form.Item>
                                    <Form.Item label={'γ'} style={{marginBottom: 0}}>
                                        <InputNumber min={0} max={1} step={0.1}/>
                                    </Form.Item>
                                </div>
                            )}
                        </div>
                    </Form>
                    <Divider/>
                </Modal>

                <Modal
                    title="Select a dataset"
                    destroyOnHidden={true} //  每次打开都重新初始化内部组件
                    open={uiState.activeModal === 'select-dataset'}
                    onOk={() => {
                        handleDatasetChange(tableConfig.selectDataset);
                        closeModal();
                    }}
                    onCancel={closeModal}
                >
                    <Form layout="horizontal">
                        <Form.Item label="Datasets: ">
                            <Select
                                // mode="multiple"
                                // placeholder="Choose a dataset"
                                options={datasetOptions}
                                // 这里满的value是数据集的名称，一个字符串
                                onChange={(value) => setTableConfig(prevState => ({...prevState, selectDataset: value}))}
                                defaultValue={tableConfig.selectDataset} // 初始显示
                            />
                        </Form.Item>
                    </Form>
                </Modal>

                {/* 2. 核心修复：Routes 应该放在这里，控制主体内容的切换 */}
                <Routes>
                    <Route path="/" element={
                        <Dashboard
                            uiState={uiState}
                            table={{
                                hotRef,
                                tableConfig,
                                setTableConfig,
                                handleSetHeader,
                                resetData,
                            }}
                            actions={{
                                handleVisualizeClick,
                                handlePredictClick,
                                handlePredict,
                                handleDatasetChangeClick
                            }}
                            chart={{
                                plot_result,
                                params,
                                setParams,
                                metrics
                            }}
                        />
                    }/>
                    <Route path="/about" element={<AboutPage/>}/>
                    <Route path="*" element={
                        <Navigate to="/" replace/>}/> {/* 所有未匹配的都跳到 Dashboard */}
                </Routes>

                <Footer className="app-footer">An online forecaster ©Dr Zhen Chen 2026</Footer>
            </Layout>
        </ConfigProvider>);
}

export default App;