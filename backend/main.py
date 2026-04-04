from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd

app = FastAPI()

# 解决跨域问题（前端访问必须）
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DataInput(BaseModel):
    data: list

@app.post("/predict")
def predict(input: DataInput):
    df = pd.DataFrame(input.data)

    df.columns = ["time", "value"]
    df["time"] = pd.to_datetime(df["time"])

    # 简单预测（滚动平均）
    df["pred"] = df["value"].rolling(3).mean()

    return {
        "time": df["time"].astype(str).tolist(),
        "value": df["value"].tolist(),
        "pred": df["pred"].bfill().tolist()
    }
