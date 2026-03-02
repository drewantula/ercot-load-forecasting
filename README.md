# ERCOT Hourly Load Forecasting

Predicting Texas electricity demand using historical ERCOT load data, time-series feature engineering, and weather data from two major load centers.

## Results

| Model | MAE (MW) | RMSE (MW) |
|---|---|---|
| Lag-168 Baseline | 4,749 | 6,676 |
| Linear Regression | 2,167 | 3,014 |
| XGBoost + Weather | **2,077** | **2,827** |

XGBoost + Weather achieves a 56% reduction in MAE over the naive baseline.

## Features

| Feature | Description |
|---|---|
| lag_24 | Load 24 hours prior (same hour yesterday) |
| lag_168 | Load 168 hours prior (same hour last week) |
| rolling_24 | 24-hour rolling mean (lag-shifted to prevent leakage) |
| rolling_168 | 168-hour rolling mean (lag-shifted) |
| hour | Hour of day (0-23) |
| day_of_week | Day of week |
| month | Month of year |
| hi_dfw | Heat index at Dallas/Fort Worth |
| hi_hou | Heat index at Houston |
| wspd_dfw / wspd_hou | Wind speed at each city |

## Key Learnings

- Correlated features hurt performance. Using temp_f, temp_sq, and rhum alongside heat_index made the model worse. Replacing them with a single heat_index per city improved MAE by 18%.
- More features does not mean a better model — proven empirically on real data.
- Time-based train/test splits are required for time series to prevent data leakage.
- Rolling features must be lag-shifted so the window never includes the current hour.

## Data Sources

- ERCOT Native Load: https://www.ercot.com/gridinfo/load/load_hist
- Weather: Open-Meteo Historical API (free, no API key required)

## How to Run
```bash
pip install pandas numpy requests xgboost scikit-learn matplotlib openpyxl
```

Run notebooks in order: 01_Data_Prep.ipynb then 02_Modeling.ipynb
