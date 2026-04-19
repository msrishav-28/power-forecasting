"""
Model Training Script for POWERGRID ER-I Dashboard
Trains all ML models and saves them to the models/ directory.
"""
import os
import pickle
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, f1_score, accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder, StandardScaler
from xgboost import XGBRegressor, XGBClassifier
from prophet import Prophet
import lightgbm as lgb
import warnings
warnings.filterwarnings('ignore')

# Ensure directories exist
os.makedirs("models", exist_ok=True)
os.makedirs("data/synthetic", exist_ok=True)

print("=" * 60)
print("POWERGRID ER-I Model Training Pipeline")
print("=" * 60)

# First, generate data if not exists
if not os.path.exists("data/synthetic/sensor_readings.parquet"):
    print("\nGenerating synthetic data...")
    from utils.synthetic_generator import save_all_data
    save_all_data()

# Load data
print("\nLoading data...")
assets_df = pd.read_csv("data/synthetic/assets.csv")
sensor_df = pd.read_parquet("data/synthetic/sensor_readings.parquet")
posoco_df = pd.read_parquet("data/synthetic/posoco_grid_data.parquet")
outage_df = pd.read_csv("data/synthetic/outage_logs.csv")
lines_df = pd.read_csv("data/synthetic/transmission_lines.csv")

def add_temporal_features(df, timestamp_col='timestamp'):
    """Add temporal features to dataframe."""
    df[timestamp_col] = pd.to_datetime(df[timestamp_col])
    df['hour'] = df[timestamp_col].dt.hour
    df['dayofweek'] = df[timestamp_col].dt.dayofweek
    df['month'] = df[timestamp_col].dt.month
    df['dayofyear'] = df[timestamp_col].dt.dayofyear
    return df

sensor_df = add_temporal_features(sensor_df)
posoco_df = add_temporal_features(posoco_df, 'timestamp')
outage_df['timestamp'] = pd.to_datetime(outage_df['timestamp'])

# ============================================
# MODEL 1: RUL Predictor (XGBoost)
# ============================================
print("\n" + "=" * 60)
print("Training Model 1: Transformer RUL Predictor (XGBoost)")
print("=" * 60)

def create_rul_training_data(sensor_df, assets_df):
    """Create training data for RUL prediction."""
    training_rows = []
    
    for asset_id in sensor_df['asset_id'].unique():
        asset_data = sensor_df[sensor_df['asset_id'] == asset_id].sort_values('timestamp')
        asset_info = assets_df[assets_df['asset_id'] == asset_id].iloc[0]
        
        # Sample windows of data
        for i in range(168, len(asset_data) - 720, 168):  # Weekly steps, predict 30 days ahead
            window = asset_data.iloc[i-168:i]  # Last week
            future = asset_data.iloc[i:i+720]  # Next 30 days
            
            if len(future) == 0:
                continue
            
            # Calculate RUL based on health degradation
            current_health = window['health_index'].mean()
            future_health = future['health_index'].min()
            
            # RUL is days until health drops below 50
            if future_health < 50:
                rul = future[future['health_index'] < 50]['timestamp'].min()
                if pd.notna(rul):
                    rul_days = (rul - window['timestamp'].iloc[-1]).days
                else:
                    rul_days = 180
            else:
                rul_days = 180  # Max RUL
            
            row = {
                'asset_id': asset_id,
                'oil_temp_7d_mean': window['oil_temp'].mean(),
                'oil_temp_30d_mean': asset_data.iloc[max(0,i-720):i]['oil_temp'].mean(),
                'h2_ppm': window['h2_ppm'].iloc[-1],
                'ch4_ppm': window['ch4_ppm'].iloc[-1],
                'co_ppm': window['co_ppm'].iloc[-1],
                'load_pct_mean': window['load_pct'].mean(),
                'voltage_mean': window['voltage_kv'].mean(),
                'current_mean': window['current_a'].mean(),
                'age_years': asset_info['age_years'],
                'days_since_maintenance': (window['timestamp'].iloc[-1] - pd.to_datetime(asset_info['last_maintenance'])).days,
                'health_index_current': current_health,
                'rul_days': max(0, min(rul_days, 365))
            }
            training_rows.append(row)
    
    return pd.DataFrame(training_rows)

rul_train_df = create_rul_training_data(sensor_df, assets_df)
print(f"RUL training samples: {len(rul_train_df)}")

feature_cols = ['oil_temp_7d_mean', 'oil_temp_30d_mean', 'h2_ppm', 'ch4_ppm', 'co_ppm',
                'load_pct_mean', 'age_years', 'days_since_maintenance', 'health_index_current']

X_rul = rul_train_df[feature_cols]
y_rul = rul_train_df['rul_days']

X_train_rul, X_test_rul, y_train_rul, y_test_rul = train_test_split(X_rul, y_rul, test_size=0.2, random_state=42)

rul_model = XGBRegressor(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)
rul_model.fit(X_train_rul, y_train_rul)

rul_predictions = rul_model.predict(X_test_rul)
rul_mae = mean_absolute_error(y_test_rul, rul_predictions)
print(f"RUL Model MAE: {rul_mae:.1f} days")

with open("models/rul_model.pkl", "wb") as f:
    pickle.dump(rul_model, f)
print("RUL model saved to models/rul_model.pkl")

# ============================================
# MODEL 2: LSTM Autoencoder for Anomaly Detection
# ============================================
print("\n" + "=" * 60)
print("Training Model 2: LSTM Autoencoder (Anomaly Detection)")
print("=" * 60)

class LSTMAutoencoder(nn.Module):
    def __init__(self, n_features, hidden_size=64):
        super().__init__()
        self.hidden_size = hidden_size
        self.encoder = nn.LSTM(n_features, hidden_size, batch_first=True, num_layers=2, dropout=0.2)
        self.decoder = nn.LSTM(hidden_size, hidden_size, batch_first=True, num_layers=2, dropout=0.2)
        self.output_layer = nn.Linear(hidden_size, n_features)
    
    def forward(self, x):
        # x shape: (batch, seq_len, n_features)
        _, (hidden, _) = self.encoder(x)
        # hidden shape: (num_layers, batch, hidden_size)
        
        # Repeat hidden state for decoder input
        decoder_input = hidden[-1].unsqueeze(1).repeat(1, x.size(1), 1)
        out, _ = self.decoder(decoder_input)
        out = self.output_layer(out)
        return out

# Prepare sequences for LSTM
sequence_length = 48  # 48 hours
sensor_features = ['oil_temp', 'winding_temp', 'load_pct', 'h2_ppm', 'co_ppm']

def create_sequences(df, features, seq_length):
    """Create sequences for LSTM training."""
    sequences = []
    asset_ids = df['asset_id'].unique()
    
    for asset_id in asset_ids:
        asset_data = df[df['asset_id'] == asset_id].sort_values('timestamp')
        values = asset_data[features].values
        
        for i in range(len(values) - seq_length):
            seq = values[i:i+seq_length]
            # Normalize each sequence
            seq_mean = seq.mean(axis=0)
            seq_std = seq.std(axis=0) + 1e-8
            seq_normalized = (seq - seq_mean) / seq_std
            sequences.append(seq_normalized)
    
    return np.array(sequences)

print("Creating sequences for LSTM...")
sequences = create_sequences(sensor_df, sensor_features, sequence_length)
print(f"Total sequences: {len(sequences)}")

# Split train/test
train_size = int(0.8 * len(sequences))
train_sequences = sequences[:train_size]
test_sequences = sequences[train_size:]

# Convert to tensors
X_train = torch.FloatTensor(train_sequences)
X_test = torch.FloatTensor(test_sequences)

# Train LSTM Autoencoder
n_features = len(sensor_features)
hidden_size = 64
model = LSTMAutoencoder(n_features, hidden_size)
criterion = nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

print("Training LSTM Autoencoder...")
num_epochs = 20
batch_size = 32

train_dataset = torch.utils.data.TensorDataset(X_train)
train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

for epoch in range(num_epochs):
    model.train()
    total_loss = 0
    for batch in train_loader:
        batch = batch[0]
        optimizer.zero_grad()
        reconstructed = model(batch)
        loss = criterion(reconstructed, batch)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    
    if (epoch + 1) % 5 == 0:
        print(f"Epoch {epoch+1}/{num_epochs}, Loss: {total_loss/len(train_loader):.6f}")

# Calculate reconstruction error threshold
model.eval()
with torch.no_grad():
    reconstructed = model(X_test)
    mse = torch.mean((X_test - reconstructed) ** 2, dim=[1, 2])
    threshold = torch.quantile(mse, 0.95).item()

print(f"Anomaly detection threshold (95th percentile): {threshold:.6f}")

# Save model
torch.save({
    'model_state_dict': model.state_dict(),
    'threshold': threshold,
    'feature_names': sensor_features,
    'sequence_length': sequence_length,
    'hidden_size': hidden_size
}, "models/anomaly_autoencoder.pt")
print("LSTM Autoencoder saved to models/anomaly_autoencoder.pt")

# ============================================
# MODEL 3: Load Forecasting (Prophet + XGBoost)
# ============================================
print("\n" + "=" * 60)
print("Training Model 3: Load Forecasting (Prophet + XGBoost)")
print("=" * 60)

# Prepare daily data for Prophet
daily_load = posoco_df.groupby(posoco_df['timestamp'].dt.date).agg({
    'demand_mw': 'mean',
    'temperature': 'mean',
    'solar_radiation': 'mean',
    'wind_speed': 'mean'
}).reset_index()
daily_load.columns = ['ds', 'y', 'temperature', 'solar_radiation', 'wind_speed']
daily_load['ds'] = pd.to_datetime(daily_load['ds'])

# Train Prophet
print("Training Prophet model...")
prophet_model = Prophet(
    daily_seasonality=False,
    weekly_seasonality=True,
    yearly_seasonality=True,
    changepoint_prior_scale=0.05
)
prophet_model.add_regressor('temperature')
prophet_model.add_regressor('solar_radiation')
prophet_model.fit(daily_load)

# Get Prophet predictions and residuals
prophet_forecast = prophet_model.predict(daily_load)
residuals = daily_load['y'] - prophet_forecast['yhat']

# Train XGBoost on residuals
print("Training XGBoost residual model...")
X_residual = daily_load[['temperature', 'solar_radiation', 'wind_speed']].values
y_residual = residuals.values

xgb_residual = XGBRegressor(
    n_estimators=100,
    max_depth=5,
    learning_rate=0.05,
    random_state=42
)
xgb_residual.fit(X_residual[:-30], y_residual[:-30])  # Hold out last 30 days

# Evaluate
residual_pred = xgb_residual.predict(X_residual[-30:])
final_predictions = prophet_forecast['yhat'][-30:].values + residual_pred
actual = daily_load['y'][-30:].values
mape = np.mean(np.abs((actual - final_predictions) / actual)) * 100
print(f"Load Forecast MAPE: {mape:.2f}%")

# Save models
with open("models/load_forecast_prophet.pkl", "wb") as f:
    pickle.dump(prophet_model, f)
with open("models/load_forecast_xgb_residual.pkl", "wb") as f:
    pickle.dump(xgb_residual, f)
print("Load forecast models saved")

# ============================================
# MODEL 4: Outage Root Cause Classifier
# ============================================
print("\n" + "=" * 60)
print("Training Model 4: Outage Root Cause Classifier")
print("=" * 60)

# Prepare features
feature_cols_outage = ['hour_of_day', 'month', 'wind_speed', 'rainfall_mm', 'temperature', 
                       'load_pct', 'line_age_years', 'voltage_kv']

X_outage = outage_df[feature_cols_outage]
y_outage = outage_df['root_cause']

# Encode labels
le = LabelEncoder()
y_outage_encoded = le.fit_transform(y_outage)

X_train_out, X_test_out, y_train_out, y_test_out = train_test_split(
    X_outage, y_outage_encoded, test_size=0.2, random_state=42, stratify=y_outage_encoded
)

# Train LightGBM classifier
outage_model = lgb.LGBMClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    class_weight='balanced',
    random_state=42,
    verbose=-1
)
outage_model.fit(X_train_out, y_train_out)

# Evaluate
outage_pred = outage_model.predict(X_test_out)
accuracy = accuracy_score(y_test_out, outage_pred)
f1 = f1_score(y_test_out, outage_pred, average='weighted')
print(f"Outage Classifier Accuracy: {accuracy:.3f}")
print(f"Outage Classifier Weighted F1: {f1:.3f}")

# Save model and encoder
with open("models/outage_classifier.pkl", "wb") as f:
    pickle.dump(outage_model, f)
with open("models/outage_label_encoder.pkl", "wb") as f:
    pickle.dump(le, f)
print("Outage classifier saved")

# ============================================
# MODEL 5: Dynamic Line Loading (DLL) Predictor
# ============================================
print("\n" + "=" * 60)
print("Training Model 5: Dynamic Line Loading (DLL) Predictor")
print("=" * 60)

# Generate training data for DLL
# DLL depends on weather and line characteristics
n_samples = 5000
dll_training_data = []

for _ in range(n_samples):
    ambient_temp = np.random.uniform(20, 50)
    wind_speed = np.random.uniform(0, 15)
    solar_rad = np.random.uniform(0, 1000)
    line_length = np.random.uniform(50, 300)
    conductor_type = np.random.choice(["ACSR", "AAAC", "ACSS"])
    voltage = np.random.choice([220, 400, 765])
    
    # Calculate ampacity factor based on IEEE 738 inspired formula
    temp_derate = 1 - 0.004 * (ambient_temp - 25)
    wind_cooling = 0.01 * wind_speed
    solar_heating = -0.002 * solar_rad / 100
    ampacity_factor = temp_derate + wind_cooling + solar_heating
    ampacity_factor = np.clip(ampacity_factor, 0.5, 1.3)
    
    # Base thermal rating
    base_rating = {220: 400, 400: 1000, 765: 2200}[voltage]
    actual_rating = base_rating * ampacity_factor
    
    # Current load (typically 60-95% of rating)
    current_load = actual_rating * np.random.uniform(0.6, 0.95)
    dll_utilization = (current_load / actual_rating) * 100
    
    dll_training_data.append({
        'ambient_temp': ambient_temp,
        'wind_speed': wind_speed,
        'solar_radiation': solar_rad,
        'line_length_km': line_length,
        'conductor_acsr': 1 if conductor_type == "ACSR" else 0,
        'conductor_aaac': 1 if conductor_type == "AAAC" else 0,
        'conductor_acss': 1 if conductor_type == "ACSS" else 0,
        'voltage_220': 1 if voltage == 220 else 0,
        'voltage_400': 1 if voltage == 400 else 0,
        'voltage_765': 1 if voltage == 765 else 0,
        'ampacity_factor': ampacity_factor,
        'dll_utilization': dll_utilization
    })

dll_df = pd.DataFrame(dll_training_data)

feature_cols_dll = ['ambient_temp', 'wind_speed', 'solar_radiation', 'line_length_km',
                    'conductor_acsr', 'conductor_aaac', 'voltage_220', 'voltage_400', 'voltage_765']

X_dll = dll_df[feature_cols_dll]
y_dll = dll_df['dll_utilization']

X_train_dll, X_test_dll, y_train_dll, y_test_dll = train_test_split(X_dll, y_dll, test_size=0.2, random_state=42)

dll_model = XGBRegressor(
    n_estimators=150,
    max_depth=5,
    learning_rate=0.05,
    random_state=42
)
dll_model.fit(X_train_dll, y_train_dll)

dll_pred = dll_model.predict(X_test_dll)
dll_rmse = np.sqrt(mean_squared_error(y_test_dll, dll_pred))
print(f"DLL Predictor RMSE: {dll_rmse:.2f}% utilization")

with open("models/dll_predictor.pkl", "wb") as f:
    pickle.dump(dll_model, f)
print("DLL predictor saved")

# ============================================
# MODEL 6: NDVI Risk Classifier
# ============================================
print("\n" + "=" * 60)
print("Training Model 6: NDVI Risk Classifier")
print("=" * 60)

# Load NDVI data
ndvi_df = pd.read_csv("data/synthetic/ndvi_timeseries.csv")
ndvi_df['month'] = pd.to_datetime(ndvi_df['month'])

# Get latest NDVI for each segment with features
latest_ndvi = ndvi_df.sort_values('month').groupby('segment_id').last().reset_index()

# Add corridor features
corridor_df = pd.read_csv("data/synthetic/corridor_segments.csv")
ndvi_risk_df = latest_ndvi.merge(corridor_df[['segment_id', 'terrain_slope', 'length_km']], on='segment_id')

# Create risk labels based on NDVI thresholds
def ndvi_risk_label(row):
    if row['ndvi'] > 0.7 and row['ndvi_3m_delta'] > 0.05:
        return "Critical"
    elif row['ndvi'] > 0.55:
        return "High"
    elif row['ndvi'] > 0.35:
        return "Medium"
    else:
        return "Low"

ndvi_risk_df['risk_label'] = ndvi_risk_df.apply(ndvi_risk_label, axis=1)

feature_cols_ndvi = ['ndvi', 'ndvi_3m_delta', 'ndvi_6m_delta', 'ndvi_stddev', 'terrain_slope']
X_ndvi = ndvi_risk_df[feature_cols_ndvi]
y_ndvi = ndvi_risk_df['risk_label']

le_ndvi = LabelEncoder()
y_ndvi_encoded = le_ndvi.fit_transform(y_ndvi)

X_train_ndvi, X_test_ndvi, y_train_ndvi, y_test_ndvi = train_test_split(
    X_ndvi, y_ndvi_encoded, test_size=0.2, random_state=42, stratify=y_ndvi_encoded
)

ndvi_risk_model = XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.05,
    random_state=42
)
ndvi_risk_model.fit(X_train_ndvi, y_train_ndvi)

ndvi_pred = ndvi_risk_model.predict(X_test_ndvi)
f1_ndvi = f1_score(y_test_ndvi, ndvi_pred, average='weighted')
print(f"NDVI Risk Classifier Weighted F1: {f1_ndvi:.3f}")

with open("models/ndvi_risk_classifier.pkl", "wb") as f:
    pickle.dump(ndvi_risk_model, f)
with open("models/ndvi_risk_encoder.pkl", "wb") as f:
    pickle.dump(le_ndvi, f)
print("NDVI risk classifier saved")

# ============================================
# MODEL 7: Vegetation Growth Forecasting (Prophet per segment)
# ============================================
print("\n" + "=" * 60)
print("Training Model 7: Vegetation Growth Forecasters")
print("=" * 60)

# Train a Prophet model for each segment
vegetation_forecasters = {}
segments = ndvi_df['segment_id'].unique()

for segment in segments[:5]:  # Train for first 5 segments as examples
    segment_data = ndvi_df[ndvi_df['segment_id'] == segment][['month', 'ndvi']].rename(
        columns={'month': 'ds', 'ndvi': 'y'}
    )
    
    if len(segment_data) >= 12:  # Need at least 12 months
        m = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=False,
            daily_seasonality=False,
            changepoint_prior_scale=0.1
        )
        m.fit(segment_data)
        vegetation_forecasters[segment] = m

with open("models/vegetation_forecasters.pkl", "wb") as f:
    pickle.dump(vegetation_forecasters, f)
print(f"Vegetation forecasters saved for {len(vegetation_forecasters)} segments")

# ============================================
# Summary
# ============================================
print("\n" + "=" * 60)
print("Model Training Summary")
print("=" * 60)
print(f"1. RUL Predictor (XGBoost): MAE = {rul_mae:.1f} days")
print(f"2. LSTM Autoencoder: Threshold = {threshold:.6f}")
print(f"3. Load Forecast: MAPE = {mape:.2f}%")
print(f"4. Outage Classifier: Accuracy = {accuracy:.3f}")
print(f"5. DLL Predictor: RMSE = {dll_rmse:.2f}%")
print(f"6. NDVI Risk Classifier: F1 = {f1_ndvi:.3f}")
print(f"7. Vegetation Forecasters: {len(vegetation_forecasters)} segments")
print("\nAll models saved to models/ directory")
print("=" * 60)
