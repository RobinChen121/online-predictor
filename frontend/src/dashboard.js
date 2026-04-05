import React from "react";
import {Layout, Row, Col, Card, Space, Button, Divider} from "antd";
import {HotTable} from '@handsontable/react';
import Plot from "react-plotly.js";
import {ImportOutlined, BarChartOutlined, PlayCircleOutlined} from "@ant-design/icons";

const {Content} = Layout;

const Dashboard = ({
                       darkMode, plotInputData, hotRef, tableData,
                       setTableData,
                       columns,
                       handleSetHeader, resetData, defaultItems, runPrediction, result
                   }) => {
    return (
        <Content className="app-content-fluid">
            {/* 主容器：两栏布局，因为有两个 col */}
            <Row gutter={[24, 24]} align="top">

                {/* 左侧栏：操作控制区 (合并原来的两个小 Card) */}
                <Col xs={24} lg={6}>
                    {/*内部使用 <Space orientation="vertical"> 将 Data Actions 卡片和 Analysis 卡片垂直堆叠*/}
                    {/* size 表示 里面 card 的间距 */}
                    <Space orientation="vertical" size={24} style={{width: '100%'}}>

                        {/* 原左侧：Data Actions */}
                        <Card title="Data Actions" className="side-card">
                            <Space orientation="vertical" style={{width: '100%'}}>
                                <p style={{fontSize: '12px'}} className={"notice-text"}>
                                    You can paste your data directly into the right table.
                                </p>
                                <Space orientation="horizontal" style={{display: "flex",
                                    justifyContent: "space-between"}}>
                                    <Button  onClick={handleSetHeader} className="table-button">
                                        Set first row as headers
                                    </Button>
                                    <Button  onClick={resetData} className="table-button">
                                        Reset
                                    </Button>
                                </Space>
                                <Divider className={"divider"}/>
                                <p style={{fontSize: '12px'}} className={"notice-text"}>
                                    You can also input data from Excel.
                                </p>
                                <Button type={"primary"}
                                        block
                                        size="large"
                                        className="common-button"
                                        icon={<ImportOutlined/>}>
                                    Import from Excel
                                </Button>
                                <Divider className={"divider"}/>
                                <Button
                                    type="primary"
                                    block
                                    size="large"
                                    icon={<BarChartOutlined/>}
                                    onClick={plotInputData}
                                    className="common-button"
                                >Visualize Input</Button>
                            </Space>
                        </Card>

                        {/* 原右侧：Analysis (移动到这里，实现上下排列) */}
                        <Card title="Analysis" className="side-card">
                            <Space orientation="vertical" style={{width: '100%'}}>
                                <Button
                                    type="primary"
                                    block
                                    size="large"
                                    icon={<PlayCircleOutlined/>}
                                    onClick={runPrediction}
                                    className="common-button"
                                >
                                    Run Predictor
                                </Button>
                            </Space>
                        </Card>

                    </Space>
                </Col>

                {/* 右侧栏：数据展示与绘图区 (宽度一致且上下对齐) */}
                <Col xs={24} lg={18}>
                    {/*内部使用 <Space orientation="vertical"> 将 Data Actions 卡片和 Analysis 卡片垂直堆叠*/}
                    <Space orientation="vertical" size={0} style={{width: '100%'}}>

                        {/* 上方：Handsontable */}
                        <Card
                            // title="Data Editor (Excel Style)"
                            className="main-card"
                            // extra={
                            //     <Space>
                            //         <Button size="small" onClick={handleSetHeader} className={"table-button"}>
                            //             Use first row as headers
                            //         </Button>
                            //         <Button size="small" danger onClick={resetData} className={"table-button"}>
                            //             Reset
                            //         </Button>
                            //     </Space>
                            // }
                        >
                            <div className="excel-editor-container">
                                <HotTable
                                    ref={hotRef}
                                    data={tableData}
                                    colHeaders={columns}
                                    afterChange={(changes) => {
                                        if (changes) {
                                            const updatedData = hotRef.current.hotInstance.getData();
                                            setTableData(updatedData);
                                        }
                                    }}
                                    rowHeaders={true}
                                    height="262px"
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
                                                        this.updateSettings({colHeaders: headers});
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </Card>

                        {/* 下方：可视化结果 (只有在 result 存在时显示) */}
                        {result && (
                            <Card
                                // title="Visualization"
                                className="plot-card">
                                <div style={{display: 'flex', justifyContent: 'center'}}>
                                    <Plot
                                        data={[{
                                            x: result.time,
                                            y: result.value,
                                            type: "scatter",
                                            mode: "lines+markers",
                                            name: "Actual",
                                        }, {
                                            x: result.time,
                                            y: result.pred,
                                            type: "scatter",
                                            mode: "lines",
                                            name: "Predicted",
                                            line: {dash: 'dot', color: '#6772e3'}
                                        }]}
                                        layout={{
                                            autosize: true,
                                            showlegend: true,
                                            height: 320, // 稍微调整高度以适应布局
                                            paper_bgcolor: 'transparent',
                                            plot_bgcolor: 'transparent',
                                            font: {color: darkMode ? '#eee' : '#333'},
                                            margin: {t: 30, r: 30, b: 50, l: 60},
                                            xaxis: {
                                                title: {text: "Time index"},
                                                showline: true,
                                                linecolor: darkMode ? '#d5cece' : '#302e2e',
                                                linewidth: 2,
                                                autorange: true,
                                            },
                                            yaxis: {
                                                title: {text: "Data Value"},
                                                showline: true,
                                                linecolor: darkMode ? '#d5cece' : '#302e2e',
                                                linewidth: 2,
                                                autorange: true,
                                            }
                                        }}
                                        useResizeHandler={true}
                                        // style={{width: "100%", height: "100%"}}
                                    />
                                </div>
                            </Card>
                        )}
                    </Space>
                </Col>
            </Row>
        </Content>
    );
};

export default Dashboard;