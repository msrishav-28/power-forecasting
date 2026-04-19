"""
Synthetic Data Generator for POWERGRID ER-I Dashboard
Generates realistic transformer sensor data, grid operations data, and satellite corridor data.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import pickle
import os

np.random.seed(42)

# ========== MODULE 1: ASSET HEALTH DATA ==========

ASSETS = [
    {"asset_id": f"TF-{i:03d}", "substation": sub, "state": state, "capacity_mva": cap,
     "voltage_kv": kv, "age_years": age, "manufacturer": mfg}
    for i, (sub, state, cap, kv, age, mfg) in enumerate([
        # Bihar
        ("Patna_S/S", "Bihar", 315, 400, 12, "BHEL"), ("Gaya_S/S", "Bihar", 200, 220, 8, "ABB"),
        ("Muzaffarpur_S/S", "Bihar", 500, 765, 15, "Siemens"), ("Bhagalpur_S/S", "Bihar", 160, 220, 20, "BHEL"),
        ("Darbhanga_S/S", "Bihar", 200, 400, 6, "Crompton"),
        # Jharkhand
        ("Ranchi_S/S", "Jharkhand", 315, 400, 10, "ABB"), ("Jamshedpur_S/S", "Jharkhand", 500, 765, 18, "BHEL"),
        ("Dhanbad_S/S", "Jharkhand", 200, 220, 14, "Siemens"), ("Bokaro_S/S", "Jharkhand", 315, 400, 11, "Crompton"),
        ("Hazaribagh_S/S", "Jharkhand", 160, 220, 7, "ABB"),
        # West Bengal
        ("Kolkata_North_S/S", "West Bengal", 500, 765, 22, "BHEL"), ("Kolkata_South_S/S", "West Bengal", 500, 765, 19, "Siemens"),
        ("Howrah_S/S", "West Bengal", 315, 400, 9, "ABB"), ("Siliguri_S/S", "West Bengal", 200, 400, 13, "Crompton"),
        ("Asansol_S/S", "West Bengal", 315, 400, 16, "BHEL"), ("Durgapur_S/S", "West Bengal", 315, 400, 8, "Siemens"),
        # Odisha
        ("Bhubaneswar_S/S", "Odisha", 315, 400, 5, "ABB"), ("Cuttack_S/S", "Odisha", 200, 220, 17, "BHEL"),
        ("Rourkela_S/S", "Odisha", 315, 400, 12, "Crompton"), ("Berhampur_S/S", "Odisha", 160, 220, 9, "Siemens"),
        ("Sambalpur_S/S", "Odisha", 200, 400, 14, "ABB"),
        # Sikkim
        ("Gangtok_S/S", "Sikkim", 100, 220, 4, "Crompton"), ("Namchi_S/S", "Sikkim", 50, 132, 6, "BHEL"),
        # More assets
        ("Gaya_East_S/S", "Bihar", 160, 220, 11, "Siemens"), ("Arrah_S/S", "Bihar", 200, 220, 7, "ABB"),
        ("Deoghar_S/S", "Jharkhand", 160, 220, 13, "Crompton"), ("Chirkunda_S/S", "Jharkhand", 100, 132, 9, "BHEL"),
        ("Kharagpur_S/S", "West Bengal", 200, 220, 15, "Siemens"), ("Malda_S/S", "West Bengal", 160, 220, 18, "ABB"),
        ("Puri_S/S", "Odisha", 100, 132, 8, "Crompton"), ("Balasore_S/S", "Odisha", 160, 220, 10, "BHEL"),
        ("Rangpo_S/S", "Sikkim", 80, 132, 5, "Siemens"), ("Gyalshing_S/S", "Sikkim", 60, 132, 7, "ABB"),
    ], start=1)
]

FAULT_TYPES = [None, "overload", "insulation_degradation", "aging", None, None, None, None, None, None]

def generate_asset_data():
    """Generate master asset registry."""
    df_assets = pd.DataFrame(ASSETS)
    df_assets["fault_type"] = np.random.choice(FAULT_TYPES, len(df_assets))
    df_assets["last_maintenance"] = pd.to_datetime("2024-01-01") - pd.to_timedelta(np.random.randint(30, 730, len(df_assets)), unit="D")
    return df_assets

def generate_sensor_readings(asset_id, fault_type, age_years, start_date, end_date):
    """Generate hourly sensor readings for a transformer."""
    dates = pd.date_range(start_date, end_date, freq="1H")
    n = len(dates)
    
    # Base parameters affected by age and fault
    base_oil_temp = 55 + age_years * 0.5 + np.random.uniform(-5, 5)
    
    # Seasonal patterns - convert to numpy arrays
    hour_of_day = dates.hour.to_numpy()
    day_of_year = dates.dayofyear.to_numpy()
    dayofweek = dates.dayofweek.to_numpy()
    
    # Temperature cycles
    daily_cycle = 5 * np.sin(2 * np.pi * hour_of_day / 24 - np.pi/2)  # Peak in afternoon
    seasonal_cycle = 8 * np.sin(2 * np.pi * day_of_year / 365 - np.pi/2)  # Peak in summer
    
    # Base trends with aging
    age_trend = np.linspace(0, age_years * 0.3, n)
    
    # Generate oil temperature
    oil_temp = base_oil_temp + daily_cycle + seasonal_cycle + age_trend + np.random.normal(0, 2, n)
    
    # Winding temperature (typically 10-15°C higher)
    winding_temp = oil_temp + 12 + np.random.normal(0, 1.5, n)
    
    # Load percentage
    base_load = 70 + np.random.normal(0, 5)
    load_pattern = 15 * np.sin(2 * np.pi * hour_of_day / 24 - np.pi/3)  # Peak evening
    load_pattern += 10 * (dayofweek >= 5)  # Higher on weekends for some regions
    load_pct = base_load + load_pattern + age_trend * 0.3 + np.random.normal(0, 3, n)
    load_pct = np.clip(load_pct, 20, 110)
    
    # Dissolved Gas Analysis (DGA) - key indicators of transformer health
    # H2 (Hydrogen) - thermal and corona faults
    base_h2 = 20 + age_years * 2
    h2_ppm = base_h2 + np.random.exponential(10, n) + age_trend * 0.5
    
    # CH4 (Methane) - oil decomposition
    base_ch4 = 30 + age_years * 3
    ch4_ppm = base_ch4 + np.random.exponential(15, n) + age_trend * 0.3
    
    # C2H6 (Ethane) - overheating
    c2h6_ppm = 15 + age_years * 1.5 + np.random.exponential(8, n)
    
    # CO (Carbon Monoxide) - paper insulation degradation
    base_co = 100 + age_years * 10
    co_ppm = base_co + np.random.exponential(50, n) + age_trend * 2
    
    # Apply fault-specific patterns
    if fault_type == "overload":
        mid_point = n // 2
        oil_temp[mid_point:] = oil_temp[mid_point:] + np.linspace(0, 25, n - mid_point)
        load_pct[mid_point:] = np.clip(load_pct[mid_point:] + 20, 20, 110)
        h2_ppm[mid_point:] = h2_ppm[mid_point:] * np.linspace(1, 3, n - mid_point)
    elif fault_type == "insulation_degradation":
        co_ppm = co_ppm + np.linspace(0, 300, n)
        h2_ppm = h2_ppm + np.linspace(0, 100, n)
    elif fault_type == "aging":
        oil_temp = oil_temp + np.linspace(0, 15, n)
        winding_temp = winding_temp + np.linspace(0, 18, n)
    
    # Voltage and Current
    voltage_kv = 400 * (1 + np.random.normal(0, 0.02, n))
    current_a = (load_pct / 100) * 500 + np.random.normal(0, 10, n)
    
    # Compute health index (IEEE C57.104 inspired)
    health_index = compute_health_index_vectorized(oil_temp, h2_ppm, load_pct, co_ppm, winding_temp)
    
    return pd.DataFrame({
        "asset_id": asset_id,
        "timestamp": dates,
        "oil_temp": np.round(oil_temp, 2),
        "winding_temp": np.round(winding_temp, 2),
        "load_pct": np.round(load_pct, 1),
        "h2_ppm": np.round(h2_ppm, 1),
        "ch4_ppm": np.round(ch4_ppm, 1),
        "c2h6_ppm": np.round(c2h6_ppm, 1),
        "co_ppm": np.round(co_ppm, 1),
        "voltage_kv": np.round(voltage_kv, 2),
        "current_a": np.round(current_a, 1),
        "health_index": np.round(health_index, 1)
    })

def compute_health_index_vectorized(oil_temp, h2_ppm, load_pct, co_ppm, winding_temp):
    """Vectorized health index calculation."""
    score = 100.0
    
    # Oil temperature penalty
    score = np.where(oil_temp > 95, score - 20, score)
    score = np.where((oil_temp > 85) & (oil_temp <= 95), score - 10, score)
    
    # Winding temperature penalty
    score = np.where(winding_temp > 105, score - 15, score)
    score = np.where((winding_temp > 95) & (winding_temp <= 105), score - 8, score)
    
    # H2 ppm penalty (IEC 60599 thresholds)
    score = np.where(h2_ppm > 150, score - 25, score)
    score = np.where((h2_ppm > 100) & (h2_ppm <= 150), score - 12, score)
    score = np.where((h2_ppm > 50) & (h2_ppm <= 100), score - 5, score)
    
    # CO ppm penalty (paper insulation)
    score = np.where(co_ppm > 350, score - 20, score)
    score = np.where((co_ppm > 200) & (co_ppm <= 350), score - 10, score)
    
    # Load % penalty
    score = np.where(load_pct > 100, score - 15, score)
    score = np.where((load_pct > 90) & (load_pct <= 100), score - 7, score)
    score = np.where((load_pct > 80) & (load_pct <= 90), score - 3, score)
    
    return np.clip(score, 0, 100)

def generate_all_sensor_data(assets_df, start_date="2023-01-01", end_date="2024-12-31"):
    """Generate sensor readings for all assets."""
    all_readings = []
    for _, asset in assets_df.iterrows():
        readings = generate_sensor_readings(
            asset["asset_id"], asset["fault_type"], asset["age_years"],
            start_date, end_date
        )
        all_readings.append(readings)
    return pd.concat(all_readings, ignore_index=True)


# ========== MODULE 2: GRID OPERATIONS DATA ==========

def generate_posoco_data(start_date="2023-01-01", end_date="2024-12-31"):
    """Generate hourly grid operations data similar to POSOCO reports."""
    dates = pd.date_range(start_date, end_date, freq="1H")
    n = len(dates)
    
    hour = dates.hour
    dayofweek = dates.dayofweek
    month = dates.month
    dayofyear = dates.dayofyear
    
    # Base demand with seasonal pattern (higher in summer and winter)
    base_demand = 8500  # MW for ER-I region
    
    # Seasonal variation (peaks in June-July and December-January)
    seasonal = 1500 * np.sin(2 * np.pi * dayofyear / 365) + 800 * np.cos(2 * np.pi * dayofyear / 365)
    
    # Daily pattern - dual peak (morning and evening)
    daily = 800 * np.sin(2 * np.pi * (hour - 6) / 24) + 500 * np.sin(4 * np.pi * (hour - 8) / 24)
    
    # Weekend reduction
    weekend_factor = np.where(dayofweek >= 5, 0.9, 1.0)
    
    # Trend growth
    trend = np.linspace(0, 500, n)  # 500 MW growth over 2 years
    
    # Weather influence (simplified)
    temp_effect = 300 * np.sin(2 * np.pi * dayofyear / 365)  # AC load in summer
    
    # Random variations
    noise = np.random.normal(0, 200, n)
    
    demand_mw = (base_demand + seasonal + daily) * weekend_factor + trend + temp_effect + noise
    demand_mw = np.clip(demand_mw, 5000, 13000)
    
    # Grid frequency (typically 49.5-50.5 Hz)
    base_freq = 50.0
    freq_variation = -0.3 * (demand_mw - 8500) / 1000  # Lower when demand high
    freq_noise = np.random.normal(0, 0.05, n)
    frequency = base_freq + freq_variation + freq_noise
    
    # Generation mix
    thermal_mw = demand_mw * 0.65 + np.random.normal(0, 100, n)
    hydro_mw = demand_mw * 0.20 + 200 * np.sin(2 * np.pi * dayofyear / 365) + np.random.normal(0, 50, n)
    renewable_mw = demand_mw * 0.15 + np.linspace(0, 800, n) + np.random.normal(0, 80, n)  # Growing renewables
    
    # Weather data
    temperature = 25 + 12 * np.sin(2 * np.pi * (dayofyear - 100) / 365) + np.random.normal(0, 3, n)
    wind_speed = 8 + 4 * np.sin(2 * np.pi * dayofyear / 365) + np.random.exponential(2, n)
    solar_radiation = np.clip(800 * np.sin(np.pi * (hour - 6) / 12), 0, 1000) * (1 + 0.2 * np.sin(2 * np.pi * dayofyear / 365))
    rainfall = np.where((month >= 6) & (month <= 9), np.random.exponential(5, n), np.random.exponential(0.5, n))
    
    return pd.DataFrame({
        "timestamp": dates,
        "demand_mw": np.round(demand_mw, 1),
        "frequency_hz": np.round(frequency, 3),
        "thermal_mw": np.round(thermal_mw, 1),
        "hydro_mw": np.round(hydro_mw, 1),
        "renewable_mw": np.round(renewable_mw, 1),
        "temperature": np.round(temperature, 1),
        "wind_speed": np.round(wind_speed, 1),
        "solar_radiation": np.round(solar_radiation, 1),
        "rainfall_mm": np.round(rainfall, 2),
        "hour": hour,
        "dayofweek": dayofweek,
        "month": month
    })

OUTAGE_CAUSES = ["Lightning", "Tree Contact", "Bird/Animal", "Equipment Failure", "Human Error", "Overloading", "Unknown"]
OUTAGE_WEIGHTS = [0.25, 0.20, 0.10, 0.20, 0.10, 0.10, 0.05]

def generate_outage_data(n_outages=1500, start_date="2023-01-01", end_date="2024-12-31"):
    """Generate outage records with root causes."""
    start = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)
    
    outages = []
    for _ in range(n_outages):
        timestamp = start + timedelta(hours=np.random.randint(0, int((end - start).total_seconds() / 3600)))
        
        # Features influencing outage cause
        hour = timestamp.hour
        month = timestamp.month
        wind_speed = np.random.exponential(3) + (5 if month in [6, 7, 8, 9] else 0)  # Monsoon winds
        temperature = 25 + 10 * np.sin(2 * np.pi * timestamp.dayofyear / 365) + np.random.normal(0, 3)
        rainfall = np.random.exponential(10) if month in [6, 7, 8, 9] else np.random.exponential(1)
        load_pct = np.random.normal(75, 15)
        
        # Determine cause based on conditions
        if month in [3, 4, 5] and wind_speed > 8:  # Pre-monsoon storms
            cause = np.random.choice(["Lightning", "Tree Contact"], p=[0.6, 0.4])
        elif rainfall > 15:  # Heavy rain
            cause = np.random.choice(["Lightning", "Equipment Failure", "Tree Contact"], p=[0.5, 0.3, 0.2])
        elif load_pct > 95:
            cause = "Overloading"
        elif hour in [1, 2, 3, 4, 5]:
            cause = np.random.choice(["Equipment Failure", "Unknown"], p=[0.7, 0.3])
        else:
            cause = np.random.choice(OUTAGE_CAUSES, p=OUTAGE_WEIGHTS)
        
        # Duration based on cause
        duration_hours = {
            "Lightning": np.random.exponential(2),
            "Tree Contact": np.random.exponential(4),
            "Bird/Animal": np.random.exponential(1),
            "Equipment Failure": np.random.exponential(8),
            "Human Error": np.random.exponential(2),
            "Overloading": np.random.exponential(1.5),
            "Unknown": np.random.exponential(3)
        }[cause]
        
        outages.append({
            "timestamp": timestamp,
            "line_id": f"TL-{np.random.randint(1, 51):03d}",
            "voltage_kv": np.random.choice([220, 400, 765], p=[0.3, 0.5, 0.2]),
            "state": np.random.choice(["Bihar", "Jharkhand", "West Bengal", "Odisha", "Sikkim"]),
            "root_cause": cause,
            "duration_hours": round(duration_hours, 1),
            "load_mw_at_trip": round(np.random.normal(200, 50), 1),
            "hour_of_day": hour,
            "month": month,
            "wind_speed": round(wind_speed, 1),
            "rainfall_mm": round(rainfall, 2),
            "temperature": round(temperature, 1),
            "load_pct": round(load_pct, 1),
            "line_age_years": np.random.randint(1, 30)
        })
    
    return pd.DataFrame(outages)


def generate_transmission_lines():
    """Generate transmission line data for DLL calculations."""
    lines = []
    for i in range(1, 51):
        voltage = np.random.choice([220, 400, 765], p=[0.3, 0.5, 0.2])
        rated_capacity = {220: 400, 400: 1000, 765: 2200}[voltage]
        
        lines.append({
            "line_id": f"TL-{i:03d}",
            "from_substation": f"S/S-{np.random.randint(1, 30):02d}",
            "to_substation": f"S/S-{np.random.randint(1, 30):02d}",
            "voltage_kv": voltage,
            "rated_capacity_mw": rated_capacity,
            "length_km": round(np.random.uniform(50, 300), 1),
            "conductor_type": np.random.choice(["ACSR", "AAAC", "ACSS"], p=[0.5, 0.3, 0.2]),
            "age_years": np.random.randint(1, 30),
            "state": np.random.choice(["Bihar", "Jharkhand", "West Bengal", "Odisha", "Sikkim"])
        })
    
    return pd.DataFrame(lines)


# ========== MODULE 3: SATELLITE CORRIDOR DATA ==========

def generate_corridor_segments():
    """Generate transmission corridor segments with coordinates."""
    # Define major transmission corridors in ER-I region
    corridors = [
        # (segment_id, lat1, lon1, lat2, lon2, voltage_kv)
        ("C-001", 25.6, 85.1, 24.8, 85.5, 400, "Bihar"),
        ("C-002", 24.8, 85.5, 23.4, 85.3, 400, "Jharkhand"),
        ("C-003", 23.4, 85.3, 22.6, 88.4, 765, "West Bengal"),
        ("C-004", 22.6, 88.4, 20.3, 85.8, 400, "Odisha"),
        ("C-005", 27.3, 88.6, 25.6, 85.1, 220, "Sikkim-Bihar"),
        ("C-006", 25.0, 87.8, 23.8, 86.2, 400, "Jharkhand"),
        ("C-007", 23.8, 86.2, 22.5, 88.3, 400, "West Bengal"),
        ("C-008", 22.5, 88.3, 21.5, 86.0, 220, "Odisha"),
        ("C-009", 26.8, 88.2, 25.2, 87.5, 400, "West Bengal-Sikkim"),
        ("C-010", 25.2, 87.5, 24.0, 85.0, 765, "Bihar-Jharkhand"),
        ("C-011", 24.0, 85.0, 22.8, 84.2, 400, "Jharkhand-Odisha"),
        ("C-012", 22.8, 84.2, 20.8, 86.4, 400, "Odisha"),
        ("C-013", 25.4, 84.0, 24.2, 83.4, 220, "Bihar"),
        ("C-014", 24.2, 83.4, 23.0, 82.8, 400, "Jharkhand"),
        ("C-015", 23.0, 82.8, 21.5, 83.8, 765, "Odisha"),
    ]
    
    segments = []
    for seg_id, lat1, lon1, lat2, lon2, voltage, states in corridors:
        # Generate intermediate points
        n_points = 20
        lats = np.linspace(lat1, lat2, n_points)
        lons = np.linspace(lon1, lon2, n_points)
        
        # Generate NDVI and risk data
        base_ndvi = np.random.uniform(0.3, 0.6)
        
        segments.append({
            "segment_id": seg_id,
            "start_lat": lat1,
            "start_lon": lon1,
            "end_lat": lat2,
            "end_lon": lon2,
            "voltage_kv": voltage,
            "states": states,
            "length_km": round(np.sqrt((lat2-lat1)**2 + (lon2-lon1)**2) * 111, 1),
            "geometry_coords": [[lat, lon] for lat, lon in zip(lats, lons)],
            "base_ndvi": base_ndvi,
            "terrain_slope": round(np.random.uniform(0, 25), 1),
            "last_inspection": pd.to_datetime("2024-01-01") - pd.to_timedelta(np.random.randint(7, 60), unit="D")
        })
    
    return pd.DataFrame(segments)

def generate_ndvi_timeseries(corridor_df, start_date="2023-01-01", end_date="2024-12-31"):
    """Generate monthly NDVI time series for each corridor segment."""
    months = pd.date_range(start_date, end_date, freq="MS")
    records = []
    
    for _, corridor in corridor_df.iterrows():
        base_ndvi = corridor["base_ndvi"]
        
        for i, month in enumerate(months):
            # Seasonal NDVI pattern (higher in monsoon, lower in summer/winter)
            month_num = month.month
            seasonal = 0.15 * np.sin(2 * np.pi * (month_num - 3) / 12)  # Peak around June
            
            # Growth trend (vegetation grows over time)
            growth_trend = 0.02 * i / 12
            
            # Random variation
            noise = np.random.normal(0, 0.03)
            
            ndvi = base_ndvi + seasonal + growth_trend + noise
            ndvi = np.clip(ndvi, 0.1, 0.9)
            
            records.append({
                "segment_id": corridor["segment_id"],
                "month": month,
                "ndvi": round(ndvi, 3),
                "ndvi_3m_delta": round(growth_trend, 3),
                "ndvi_6m_delta": round(growth_trend * 2, 3),
                "ndvi_stddev": round(abs(noise) + 0.02, 3)
            })
    
    return pd.DataFrame(records)

def generate_risk_labels(ndvi_df):
    """Generate risk labels based on NDVI thresholds."""
    def ndvi_risk_label(row):
        if row["ndvi"] > 0.7 and row["ndvi_3m_delta"] > 0.05:
            return "Critical"
        elif row["ndvi"] > 0.55:
            return "High"
        elif row["ndvi"] > 0.35:
            return "Medium"
        else:
            return "Low"
    
    # Get latest NDVI for each segment
    latest_ndvi = ndvi_df.sort_values("month").groupby("segment_id").last().reset_index()
    latest_ndvi["risk_label"] = latest_ndvi.apply(ndvi_risk_label, axis=1)
    return latest_ndvi[["segment_id", "ndvi", "ndvi_3m_delta", "risk_label"]]


def save_all_data():
    """Generate and save all synthetic data."""
    os.makedirs("data/synthetic", exist_ok=True)
    
    print("Generating asset data...")
    assets_df = generate_asset_data()
    assets_df.to_csv("data/synthetic/assets.csv", index=False)
    
    print("Generating sensor readings...")
    sensor_df = generate_all_sensor_data(assets_df)
    sensor_df.to_parquet("data/synthetic/sensor_readings.parquet", index=False)
    
    print("Generating POSOCO grid data...")
    posoco_df = generate_posoco_data()
    posoco_df.to_parquet("data/synthetic/posoco_grid_data.parquet", index=False)
    
    print("Generating outage data...")
    outage_df = generate_outage_data()
    outage_df.to_csv("data/synthetic/outage_logs.csv", index=False)
    
    print("Generating transmission lines...")
    lines_df = generate_transmission_lines()
    lines_df.to_csv("data/synthetic/transmission_lines.csv", index=False)
    
    print("Generating corridor segments...")
    corridor_df = generate_corridor_segments()
    corridor_df.to_csv("data/synthetic/corridor_segments.csv", index=False)
    
    print("Generating NDVI time series...")
    ndvi_df = generate_ndvi_timeseries(corridor_df)
    ndvi_df.to_csv("data/synthetic/ndvi_timeseries.csv", index=False)
    
    print("Data generation complete!")
    
    return assets_df, sensor_df, posoco_df, outage_df, lines_df, corridor_df, ndvi_df


if __name__ == "__main__":
    save_all_data()
