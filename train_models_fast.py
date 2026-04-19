"""
Fast Model Training Script for POWERGRID ER-I Dashboard
Lightweight version for quick setup and deployment.
"""
import os
import pickle
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, f1_score, accuracy_score
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor, XGBClassifier
from prophet import Prophet
import lightgbm as lgb
import warnings
warnings.filterwarnings('ignore')

# Ensure directories exist
os.makedirs("models", exist_ok=True)
os.makedirs("data/synthetic", exist_ok=True)

print("=" * 60)
print("POWERGRID ER-I Fast Model Training")
print("=" * 60)

# Load data
print("\nLoading data...")
assets_df = pd.read_csv("data/synthetic/assets.csv")
sensor_df = pd.read_parquet("data/synthetic/sensor_readings.parquet")
posoco_df = pd.read_parquet("data/synthetic/posoco_grid_data.parquet")
outage_df = pd.read_csv("data/synthetic/outage_logs.csv")
lines_df = pd.read_csv("data/synthetic/transmission_lines.csv")
corridor_df = pd.read_csv("data/synthetic/corridor_segments.csv")
ndvi_df = pd.read_csv("data/synthetic/ndvi_timeseries.csv")

def add_temporal_features(df, timestamp_col='timestamp'):
    df[timestamp_col] = pd.to_datetime(df[timestamp_col])
    df['hour'] = df[timestamp_col].dt.hour
    df['dayofweek'] = df[timestamp_col].dt.dayofweek
    df['month'] = df[timestamp_col].dt.month
    return df

sensor_df = add_temporal_features(sensor_df)
posoco_df = add_temporal_features(posoco_df, 'timestamp')
outage_df['timestamp'] = pd.to_datetime(outage_df['timestamp'])

# ============================================
# MODEL 1: RUL Predictor (XGBoost)
# ============================================
print("\n[1/7] Training RUL Predictor...")

def create_rul_training_data(sensor_df, assets_df):
    training_rows = []
    for asset_id in sensor_df['asset_id'].unique()[:20]:  # Sample for speed
        asset_data = sensor_df[sensor_df['asset_id'] == asset_id].sort_values('timestamp')
        asset_info = assets_df[assets_df['asset_id'] == asset_id].iloc[0]
        for i in range(168, len(asset_data) - 720, 336):
            window = asset_data.iloc[i-168:i]
            future = asset_data.iloc[i:i+720]
            if len(future) == 0: continue
            current_health = window['health_index'].mean()
            future_health = future['health_index'].min()
            if future_health < 50:
                rul = future[future['health_index'] < 50]['timestamp'].min()
                rul_days = (rul - window['timestamp'].iloc[-1]).days if pd.notna(rul) else 180
            else:
                rul_days = 180
            training_rows.append({
                'asset_id': asset_id,
                'oil_temp_7d_mean': window['oil_temp'].mean(),
                'oil_temp_30d_mean': asset_data.iloc[max(0,i-720):i]['oil_temp'].mean(),
                'h2_ppm': window['h2_ppm'].iloc[-1],
                'ch4_ppm': window['ch4_ppm'].iloc[-1],
                'co_ppm': window['co_ppm'].iloc[-1],
                'load_pct_mean': window['load_pct'].mean(),
                'age_years': asset_info['age_years'],
                'days_since_maintenance': (window['timestamp'].iloc[-1] - pd.to_datetime(asset_info['last_maintenance'])).days,
                'health_index_current': current_health,
                'rul_days': max(0, min(rul_days, 365))
            })
    return pd.DataFrame(training_rows)

rul_train_df = create_rul_training_data(sensor_df, assets_df)
feature_cols = ['oil_temp_7d_mean', 'oil_temp_30d_mean', 'h2_ppm', 'ch4_ppm', 'co_ppm',
                'load_pct_mean', 'age_years', 'days_since_maintenance', 'health_index_current']

X_rul = rul_train_df[feature_cols]
y_rul = rul_train_df['rul_days']
X_train_rul, X_test_rul, y_train_rul, y_test_rul = train_test_split(X_rul, y_rul, test_size=0.2, random_state=42)

rul_model = XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.05, random_state=42)
rul_model.fit(X_train_rul, y_train_rul)
rul_mae = mean_absolute_error(y_test_rul, rul_model.predict(X_test_rul))
print(f"   RUL MAE: {rul_mae:.1f} days")

with open("models/rul_model.pkl", "wb") as f:
    pickle.dump(rul_model, f)

# ============================================
# MODEL 2: Lightweight Anomaly Detector
# ============================================
print("\n[2/7] Training Lightweight Anomaly Detector...")

class SimpleAutoencoder(nn.Module):
    def __init__(self, n_features):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(n_features, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU()
        )
        self.decoder = nn.Sequential(
            nn.Linear(8, 16),
            nn.ReLU(),
            nn.Linear(16, n_features)
        )
    
    def forward(self, x):
        return self.decoder(self.encoder(x))

# Use smaller dataset
sensor_features = ['oil_temp', 'winding_temp', 'load_pct', 'h2_ppm', 'co_ppm']
sample_sensor = sensor_df[sensor_df['asset_id'] == sensor_df['asset_id'].unique()[0]].tail(1000)
X_sensor = sample_sensor[sensor_features].values

# Normalize
X_mean = X_sensor.mean(axis=0)
X_std = X_sensor.std(axis=0) + 1e-8
X_normalized = (X_sensor - X_mean) / X_std

# Train simple autoencoder
model_ae = SimpleAutoencoder(len(sensor_features))
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model_ae.parameters(), lr=0.01)

X_tensor = torch.FloatTensor(X_normalized)
for epoch in range(50):
    model_ae.train()
    optimizer.zero_grad()
    reconstructed = model_ae(X_tensor)
    loss = criterion(reconstructed, X_tensor)
    loss.backward()
    optimizer.step()

model_ae.eval()
with torch.no_grad():
    reconstructed = model_ae(X_tensor)
    mse = torch.mean((X_tensor - reconstructed) ** 2, dim=1)
    threshold = torch.quantile(mse, 0.95).item()

torch.save({
    'model_state_dict': model_ae.state_dict(),
    'threshold': threshold,
    'feature_names': sensor_features,
    'mean': X_mean,
    'std': X_std
}, "models/anomaly_autoencoder.pt")
print(f"   Threshold: {threshold:.6f}")

# ============================================
# MODEL 3: Load Forecasting
# ============================================
print("\n[3/7] Training Load Forecaster...")

daily_load = posoco_df.groupby(posoco_df['timestamp'].dt.date).agg({
    'demand_mw': 'mean',
    'temperature': 'mean',
    'solar_radiation': 'mean',
    'wind_speed': 'mean'
}).reset_index()
daily_load.columns = ['ds', 'y', 'temperature', 'solar_radiation', 'wind_speed']
daily_load['ds'] = pd.to_datetime(daily_load['ds'])

prophet_model = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=True, changepoint_prior_scale=0.05)
prophet_model.add_regressor('temperature')
prophet_model.fit(daily_load)

prophet_forecast = prophet_model.predict(daily_load)
residuals = daily_load['y'] - prophet_forecast['yhat']

X_residual = daily_load[['temperature', 'solar_radiation', 'wind_speed']].values
xgb_residual = XGBRegressor(n_estimators=50, max_depth=4, learning_rate=0.05, random_state=42)
xgb_residual.fit(X_residual[:-30], residuals[:-30])

with open("models/load_forecast_prophet.pkl", "wb") as f:
    pickle.dump(prophet_model, f)
with open("models/load_forecast_xgb_residual.pkl", "wb") as f:
    pickle.dump(xgb_residual, f)
print("   Models saved")

# ============================================
# MODEL 4: Outage Classifier
# ============================================
print("\n[4/7] Training Outage Classifier...")

feature_cols_outage = ['hour_of_day', 'month', 'wind_speed', 'rainfall_mm', 'temperature', 'load_pct', 'line_age_years', 'voltage_kv']
X_outage = outage_df[feature_cols_outage]
y_outage = outage_df['root_cause']

le = LabelEncoder()
y_outage_encoded = le.fit_transform(y_outage)

X_train_out, X_test_out, y_train_out, y_test_out = train_test_split(X_outage, y_outage_encoded, test_size=0.2, random_state=42, stratify=y_outage_encoded)

outage_model = lgb.LGBMClassifier(n_estimators=100, max_depth=6, learning_rate=0.05, class_weight='balanced', random_state=42, verbose=-1)
outage_model.fit(X_train_out, y_train_out)

accuracy = accuracy_score(y_test_out, outage_model.predict(X_test_out))
print(f"   Accuracy: {accuracy:.3f}")

with open("models/outage_classifier.pkl", "wb") as f:
    pickle.dump(outage_model, f)
with open("models/outage_label_encoder.pkl", "wb") as f:
    pickle.dump(le, f)

# ============================================
# MODEL 5: DLL Predictor
# ============================================
print("\n[5/7] Training DLL Predictor...")

n_samples = 2000
dll_training_data = []
for _ in range(n_samples):
    ambient_temp = np.random.uniform(20, 50)
    wind_speed = np.random.uniform(0, 15)
    solar_rad = np.random.uniform(0, 1000)
    line_length = np.random.uniform(50, 300)
    voltage = np.random.choice([220, 400, 765])
    temp_derate = 1 - 0.004 * (ambient_temp - 25)
    wind_cooling = 0.01 * wind_speed
    solar_heating = -0.002 * solar_rad / 100
    ampacity_factor = temp_derate + wind_cooling + solar_heating
    ampacity_factor = np.clip(ampacity_factor, 0.5, 1.3)
    base_rating = {220: 400, 400: 1000, 765: 2200}[voltage]
    actual_rating = base_rating * ampacity_factor
    current_load = actual_rating * np.random.uniform(0.6, 0.95)
    dll_utilization = (current_load / actual_rating) * 100
    dll_training_data.append({
        'ambient_temp': ambient_temp,
        'wind_speed': wind_speed,
        'solar_radiation': solar_rad,
        'line_length_km': line_length,
        'voltage_220': 1 if voltage == 220 else 0,
        'voltage_400': 1 if voltage == 400 else 0,
        'voltage_765': 1 if voltage == 765 else 0,
        'dll_utilization': dll_utilization
    })

dll_df = pd.DataFrame(dll_training_data)
feature_cols_dll = ['ambient_temp', 'wind_speed', 'solar_radiation', 'line_length_km', 'voltage_220', 'voltage_400', 'voltage_765']

X_dll = dll_df[feature_cols_dll]
y_dll = dll_df['dll_utilization']
X_train_dll, X_test_dll, y_train_dll, y_test_dll = train_test_split(X_dll, y_dll, test_size=0.2, random_state=42)

dll_model = XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.05, random_state=42)
dll_model.fit(X_train_dll, y_train_dll)

with open("models/dll_predictor.pkl", "wb") as f:
    pickle.dump(dll_model, f)
print("   Model saved")

# ============================================
# MODEL 6: NDVI Risk Classifier
# ============================================
print("\n[6/7] Training NDVI Risk Classifier...")

ndvi_df['month'] = pd.to_datetime(ndvi_df['month'])
latest_ndvi = ndvi_df.sort_values('month').groupby('segment_id').last().reset_index()
latest_ndvi = latest_ndvi.merge(corridor_df[['segment_id', 'terrain_slope']], on='segment_id')

def ndvi_risk_label(row):
    if row['ndvi'] > 0.7 and row['ndvi_3m_delta'] > 0.05:
        return "Critical"
    elif row['ndvi'] > 0.55:
        return "High"
    elif row['ndvi'] > 0.35:
        return "Medium"
    else:
        return "Low"

latest_ndvi['risk_label'] = latest_ndvi.apply(ndvi_risk_label, axis=1)

feature_cols_ndvi = ['ndvi', 'ndvi_3m_delta', 'ndvi_6m_delta', 'ndvi_stddev', 'terrain_slope']
X_ndvi = latest_ndvi[feature_cols_ndvi]
y_ndvi = latest_ndvi['risk_label']

le_ndvi = LabelEncoder()
y_ndvi_encoded = le_ndvi.fit_transform(y_ndvi)

X_train_ndvi, X_test_ndvi, y_train_ndvi, y_test_ndvi = train_test_split(X_ndvi, y_ndvi_encoded, test_size=0.2, random_state=42, stratify=y_ndvi_encoded)

ndvi_risk_model = XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.05, random_state=42)
ndvi_risk_model.fit(X_train_ndvi, y_train_ndvi)

with open("models/ndvi_risk_classifier.pkl", "wb") as f:
    pickle.dump(ndvi_risk_model, f)
with open("models/ndvi_risk_encoder.pkl", "wb") as f:
    pickle.dump(le_ndvi, f)
print("   Model saved")

# ============================================
# MODEL 7: Vegetation Forecasters
# ============================================
print("\n[7/7] Training Vegetation Forecasters...")

vegetation_forecasters = {}
segments = ndvi_df['segment_id'].unique()[:3]

for segment in segments:
    segment_data = ndvi_df[ndvi_df['segment_id'] == segment][['month', 'ndvi']].rename(columns={'month': 'ds', 'ndvi': 'y'})
    segment_data['ds'] = pd.to_datetime(segment_data['ds'])
    if len(segment_data) >= 12:
        m = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False, changepoint_prior_scale=0.1)
        m.fit(segment_data)
        vegetation_forecasters[segment] = m

with open("models/vegetation_forecasters.pkl", "wb") as f:
    pickle.dump(vegetation_forecasters, f)
print(f"   {len(vegetation_forecasters)} forecasters saved")

# ============================================
# Summary
# ============================================
print("\n" + "=" * 60)
print("Training Complete!")
print("=" * 60)
print("All 7 models saved to models/ directory")
print("=" * 60)
