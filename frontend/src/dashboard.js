import React, {useEffect} from "react";
import {Layout, Row, Col, Card, Space, Button, Slider, Form} from "antd"; // Divider
import {HotTable} from '@handsontable/react';
import Plot from "react-plotly.js";
import {ImportOutlined, BarChartOutlined} from "@ant-design/icons"; // PlayCircleOutlined
import Handsontable from "handsontable";
// import {InlineMath} from "react-katex";

const {Content} = Layout;
const defaultItems = Handsontable.plugins.ContextMenu.DEFAULT_ITEMS;

// 传递 app.js 中的函数和变量
const Dashboard = ({
                       uiState, table,
                       actions, chart
                   }) => {
    // 从 table 里取出所需的变量或函数
    const {
        hotRef,
        tableConfig,
        setTableConfig,
        handleSetHeader,
        resetData,
    } = table;
    const {
        handleVisualizeClick,
        handlePredictClick,
        handlePredict,
        handleDatasetChangeClick
    } = actions;
    const {
        plot_result,
        params,
        setParams,
        metrics
    } = chart;

    // 在组件顶部定义 form 实例
    // Form.useForm() 这个 Hook 返回的是一个数组，数组的第一项才是真正的“表单实例对象
    const [form] = Form.useForm();
   // 监听到 params 变化时，手动同步给 form 内部
   // 这能解决“外部修改 params，滑块不跟着动”的问题
    useEffect(() => {
        form.setFieldsValue(params);
    }, [params, form]);

    return (
        <Content className="app-content-fluid">
            {/* 主容器：三栏布局，因为有三个 col */}
            {/* 三个lg的总数应该是24*/}
            <Row gutter={[12, 24]} align="top">

                {/* 左侧栏：操作控制区 (合并原来的两个小 Card) */}
                <Col xs={24} lg={4}>
                    {/*内部使用 <Space orientation="vertical"> 将 Data Actions 卡片和 Analysis 卡片垂直堆叠*/}
                    {/* size 表示 里面 card 的间距 */}
                    <Space orientation="vertical" size={24} style={{width: '100%'}}>

                        {/* 原左侧：Data Actions */}
                        <Card title="Data Actions" className="side-card">
                            <p className={"notice-text"}>
                                You can paste your data directly into the right table or
                                input data from Excel.
                            </p>
                            <Space orientation="vertical" style={{width: '100%'}}>
                                <Button
                                    // type={"primary"}
                                    block
                                    // size="large"
                                    className="common-button"
                                    icon={<ImportOutlined/>}>
                                    Import from Excel
                                </Button>
                                {/*<Divider/>*/}
                                <Button
                                    type="primary"
                                    block
                                    // size="large"
                                    icon={<BarChartOutlined/>}
                                    onClick={handleVisualizeClick}
                                    className="common-button"
                                >Visualize Input</Button>
                            </Space>
                        </Card>

                        {/* 原右侧：Analysis (移动到这里，实现上下排列) */}
                        <Card title="Predictors" className="side-card">
                            <Space orientation="vertical" style={{width: '100%'}}>
                                <Button
                                    // type="primary"
                                    block
                                    // size="large"
                                    // icon={<PlayCircleOutlined/>}
                                    onClick={handlePredictClick}
                                    className="common-button"
                                >
                                    Statistical methods
                                </Button>
                            </Space>
                        </Card>

                    </Space>
                </Col>

                {/*中间栏*/}
                <Col xs={24} lg={16}>
                    {/*内部使用 <Space orientation="vertical"> 将 Data Actions 卡片和 Analysis 卡片垂直堆叠*/}
                    <Space orientation="vertical" size={0} style={{width: '100%'}}>
                        {/* 左侧表格部分 */}
                        <Card
                            // title="Data Editor (Excel Style)"
                            className="main-card"
                            style={{
                                flex: 1,
                                minWidth: 0
                            }} // 关键点：flex: 1 让它撑满，minWidth: 0 防止 Flex 溢出
                        >
                            <div className="excel-editor-container">
                                <HotTable
                                    ref={hotRef}
                                    data={tableConfig.tableData}
                                    // map 第一个参数为当前元素本身
                                    colHeaders={tableConfig.columnOptions.map(options => options.label)}
                                    afterChange={(changes) => {
                                        if (changes) {
                                            const updatedData = hotRef.current.hotInstance.getData();
                                            setTableConfig(prev => ({...prev, tableData: updatedData}));
                                        }
                                    }}
                                    rowHeaders={true}
                                    height="262px"
                                    width="100%"
                                    licenseKey="non-commercial-and-evaluation"
                                    selectionMode="multiple"
                                    dragToFill={true}
                                    copyPaste={true}
                                    stretchH={'last'}
                                    className="custom-handsontable"
                                    contextMenu={{
                                        items: {
                                            ...defaultItems.reduce((acc, key) => {
                                                acc[key] = {};
                                                return acc;
                                            }, {}),
                                            "---------": {},
                                            rename_header: {
                                                name: "Rename column head",
                                                hidden: function () {
                                                    const selected = this.getSelectedLast();
                                                    if (!selected) return true;
                                                    return selected[0] !== -1;
                                                },
                                                callback: function (key, selection) {
                                                    const col = selection[0].start.col;
                                                    const headers = this.getColHeader();
                                                    const newName = prompt("New column head", headers[col]);
                                                    if (newName) {
                                                        headers[col] = newName;
                                                        // 更新实例（即时生效）
                                                        this.updateSettings({colHeaders: headers});

                                                        // setColumnOptions(prevOptions => {
                                                        //     const newOptions = [...prevOptions];
                                                        //     // 找到对应的配置项并更新 label
                                                        //     if (newOptions[col]) {
                                                        //         newOptions[col] = { ...newOptions[col], label: newName };
                                                        //     }
                                                        //     return newOptions;
                                                        // });
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </Card>

                        {/* 下方：可视化结果 (只有在 plot_result 存在时显示) */}
                        {plot_result && (
                            <Card
                                // title="Visualization"
                                className="plot-card">
                                <div style={{display: 'flex', justifyContent: 'center'}}>
                                    <Plot
                                        data={plot_result.data}
                                        revision={Date.now()} // 关键：强制 Plotly 识别更新
                                        layout={{
                                            autosize: true,
                                            showlegend: true,
                                            height: 320, // 稍微调整高度以适应布局
                                            paper_bgcolor: 'transparent',
                                            plot_bgcolor: 'transparent',
                                            font: {color: uiState.darkMode ? "#fff" : "#000"},
                                            margin: {t: 30, r: 30, b: 50, l: 60},
                                            xaxis: {
                                                // 修正：增加 text 键，并提供后备默认值
                                                title: {
                                                    text: plot_result.xAxisName || "Time index"
                                                },
                                                showline: true,
                                                linecolor: uiState.darkMode ? "#fff" : "#69666a",
                                                linewidth: 2,
                                                autorange: true,
                                                zeroline: false,
                                            },
                                            yaxis: {
                                                title: {text: "Value"},
                                                showline: true,
                                                linecolor: uiState.darkMode ? "#fff" : "#69666a",
                                                linewidth: 2,
                                                autorange: true,
                                                zeroline: false,
                                            },
                                        }}
                                        useResizeHandler={true}
                                        style={{width: "100%", height: "100%"}}
                                    />
                                </div>
                            </Card>
                        )}
                    </Space>
                </Col>

                {/*右侧栏*/}
                <Col xs={24} lg={4}>
                    <Space orientation="vertical" size={24} style={{width: '100%'}}>
                        <Card className="side-card">
                            <Space orientation="vertical" style={{width: '100%'}}>

                                {/*<Divider/>*/}

                                <Button block onClick={handleDatasetChangeClick}
                                    // size={"large"}
                                        className="common-button"
                                >
                                    Select some dataset
                                </Button>

                                <Button block onClick={resetData}
                                    // size={"large"}
                                        className="common-button"
                                >
                                    Reset to default data
                                </Button>

                                <Button block onClick={handleSetHeader}
                                    // size={"large"}
                                        className="common-button"
                                >
                                    Set first row as headers
                                </Button>
                            </Space>
                        </Card>

                        {uiState.isCardVisible && (
                            <Card className="side-card parameter" title={"Parameters"}>
                                {/* 局部样式控制*/}
                                {/* 这是 <span> 最核心的用法。它本身没有任何默认样式（没有边距、没有加粗），它的存在就是为了让你能给某一段文字加上 CSS*/}
                                {/*flex: 1：让元素自动填满父容器中所有剩余的可用空间*/}
                                <div className="parameter-slider">
                                    <Form
                                        form={form} // 必须绑定实例，为了跟踪参数值的实时变化
                                        initialValues={params}
                                        // 使用 layout="vertical" 可以让标签在滑块上方，"horizontal" 则在左侧
                                        layout="horizontal"
                                        // 固定 label 宽度，剩下的全给 slider
                                        // labelCol={{ flex: "60px" }}
                                        // 让 wrapper 自动伸展填充剩余空间
                                        // wrapperCol={{ flex: "auto" }}
                                        // 关键点 消除 Form.Item 的默认边距影响
                                        style={{width: '100%'}}
                                        colon={false} // 去掉冒号
                                        // 下面有更新change，这里就不用重复更新了
                                        // onValuesChange={(changed) => {
                                        //     setParams(prev => ({...prev, ...changed}));
                                        //     if ('alpha' in changed) {
                                        //        handlePredict(changed.alpha);
                                        //     }
                                        //     // if ('k' in changed) {
                                        //     //     handlePredict(changed.k);
                                        //     // }
                                        // }}
                                    >
                                        <Form.Item
                                            name="alpha"
                                            // 直接在这里整合文字和动态数值
                                            label={
                                                <span style={{fontWeight: "bold"}}>
                                                 α: <span style={{color: '#1890ff'}}>{params.alpha}</span>
                                                 </span>
                                            }
                                        >
                                            <Slider
                                                min={0}
                                                max={1}
                                                step={0.1}
                                                marks={{0: '0', 1: '1'}}
                                                /* 核心点 1：将状态绑定到 value，实现“反向同步” */
                                                value={params.alpha}

                                                // 当用户正在拖动时
                                                onChange={(val) => {
                                                    setParams(prev => ({...prev, alpha: val}));
                                                }}
                                                // 当用户松开鼠标时，才执行耗时的预测逻辑
                                                onChangeComplete={(val) => {
                                                    handlePredict(params.alpha); // 显式传入最新的值
                                                }}
                                            />
                                        </Form.Item>
                                    </Form>
                                </div>
                            </Card>
                        )}

                        {uiState.isCardVisible && (
                            <Card className="side-card erros" title={"Forecasting errors"}>
                                {/* 局部样式控制*/}
                                {/* 这是 <span> 最核心的用法。它本身没有任何默认样式（没有边距、没有加粗），它的存在就是为了让你能给某一段文字加上 CSS*/}
                                <span style={{fontWeight: "bold"}}>RMSE:</span> {metrics.RMSE.toFixed(2)}
                                <br/>
                                <span style={{fontWeight: "bold"}}>MAE:</span> {metrics.MAE.toFixed(2)}
                            </Card>
                        )}
                    </Space>
                </Col>
            </Row>
        </Content>
    );
};

export default Dashboard;