import pandas as pd
from sklearn.ensemble import IsolationForest
import json
import sys
import os
import argparse
import random
from datetime import datetime, timedelta
import math

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--theft", action="store_true", help="Simulate active theft anomalies")
    args = parser.parse_args()

    try:
        # Load CSV from the same directory as script
        csv_path = os.path.join(os.path.dirname(__file__), "punjab_gridguard_deep_data_1200.csv")
        df = pd.read_csv(csv_path)

        # Feature engineering
        df["loss_percent"] = ((df["supply_kwh"] - df["meter_sum_kwh"]) / df["supply_kwh"]) * 100

        # Fill NaNs if any
        df = df.fillna(0)

        # Train model
        features = df[["supply_kwh", "meter_sum_kwh", "loss_percent"]]
        model = IsolationForest(contamination=0.1, random_state=42)
        model.fit(features)

        # Predict
        df["anomaly"] = model.predict(features)
        df["anomaly"] = df["anomaly"].apply(lambda x: 1 if x == -1 else 0)

        # Risk score
        df["risk_score"] = (df["loss_percent"] * 3).clip(0, 100)

        # Convert to JSON matching frontend requirements
        # Frontend expects: id, location, supply, consumption, loss, risk, status, lat, lon
        transformers = []
        alerts = []
        
        now = datetime.now()
        
        # Determine current second of the minute to create a "live wiggle" effect
        # This creates a small 10-second oscillation that makes the graph move naturally
        wiggle = 1.0 + (math.sin(now.second / 10.0) * 0.02) 

        # Real-world electricity load curve - multipliers by hour of day (0..23)
        # Based on typical Punjab residential/industrial load patterns:
        # Low 1-5am, ramp up 6-9am, industrial peak 10-12, small dip 13-14,
        # residential evening peak 17-21, fall off at night
        HOURLY_LOAD_CURVE = [
            0.55, 0.50, 0.48, 0.46, 0.48, 0.55,   # 0–5 am (night minimum)
            0.70, 0.85, 0.95, 1.00, 1.05, 1.08,   # 6–11 am (morning ramp + peak)
            1.05, 0.98, 0.95, 0.97, 1.00, 1.10,   # 12–17 pm (midday + pre-peak)
            1.15, 1.20, 1.18, 1.10, 0.90, 0.70,   # 18–23 pm (evening peak + wind down)
        ]

        current_hour = now.hour
        current_mult = HOURLY_LOAD_CURVE[current_hour]

        for idx, row in df.iterrows():
            base_supply = float(row["supply_kwh"])
            base_consume = float(row["meter_sum_kwh"])
            loss_pct = float(row["loss_percent"]) / 100.0
            is_anomaly = int(row["anomaly"]) == 1
            zone = str(row["zone_type"])
            
            # Baseline expectations based on typical zone metrics
            if "Industrial" in zone:
                expected_pct = 6.0
            elif "Commercial" in zone:
                expected_pct = 8.0
            elif "Agricultural" in zone:
                expected_pct = 14.0
            else:
                expected_pct = 11.0
                
            actual_loss_val = round(float(row["loss_percent"]), 1)
            deviation = round(actual_loss_val - expected_pct, 1)
            loss_kwh = round(base_supply - base_consume, 1)
            financial_cost = round(loss_kwh * 8.5) # Punjab avg industrial/commercial rate ₹8.5/unit

            ts = []
            for h in range(24):
                hr_label = f"{h:02d}:00"
                curve_mult = HOURLY_LOAD_CURVE[h]

                # Jagged noise ±10% per hour for natural variation
                noise = random.uniform(0.90, 1.10)
                supply_h = round(base_supply * curve_mult * noise, 1)

                # For anomalies: inject elevated loss in recent hours (16–23) to create visible divergence
                if is_anomaly and h >= 16:
                    theft_factor = 1.0 + (loss_pct * 1.5)
                    consume_h = round(base_consume * curve_mult * noise * theft_factor, 1)
                else:
                    consume_h = round(base_consume * curve_mult * noise, 1)

                ts.append({
                    "time": hr_label,
                    "supply": supply_h,
                    "consumption": consume_h
                })


            # Increased noise ±6% + drastic wiggle ±4% for high vibrancy
            # Using both sin and cos for a more dynamic "organic" feel
            wiggle_drastic = 1.0 + (math.sin(now.second / 5.0) * 0.04) + (math.cos(now.second / 3.0) * 0.02)
            live_noise = random.uniform(0.94, 1.06) * wiggle_drastic
            live_supply = round(base_supply * current_mult * live_noise)
            
            # Anomaly injection logic
            # If simulation mode is ON, artificially pick 5 transformers to show HIGH theft
            force_simulation = False
            if args.theft and (idx % 25 == 0): # Force simulation on every 25th row
                force_simulation = True

            if is_anomaly or force_simulation:
                # If forced simulation, use a very high theft factor (30-45% loss)
                if force_simulation:
                    live_theft_factor = 1.45 # 45% additional loss offset
                else:
                    live_theft_factor = 1.0 + (loss_pct * 1.5)
                
                live_consume = round(base_consume * current_mult * live_noise * (1.0 / live_theft_factor))
            else:
                live_consume = round(base_consume * current_mult * live_noise)

            # Re-calculate live loss and percentage
            live_loss_kwh = round(live_supply - live_consume, 1)
            live_actual_loss_pct = round((live_loss_kwh / live_supply * 100), 1) if live_supply > 0 else 0
            
            # THEFT CALCULATION logic: Anything above expected baseline is "Theft"
            technical_loss_kwh = live_supply * (expected_pct / 100)
            theft_kwh = max(0, live_loss_kwh - technical_loss_kwh)
            theft_loss_pct = round((theft_kwh / live_supply * 100), 1) if live_supply > 0 else 0
            theft_financial_cost = round(theft_kwh * 8.5) # Punjab revenue recovery rate
            
            total_loss_financial_cost = round(live_loss_kwh * 8.5)

            t = {
                "id": row["transformer_id"],
                "location": str(row["region"]) + " (" + zone + ")",
                "lat": float(row["lat"]),
                "lon": float(row["lon"]),
                "supply": live_supply,
                "consumption": live_consume,
                "total_loss": live_actual_loss_pct,
                "theft_loss": theft_loss_pct,
                "theft_kwh": round(theft_kwh, 1),
                "expected": expected_pct,
                "deviation": round(live_actual_loss_pct - expected_pct, 1),
                "total_loss_kwh": live_loss_kwh,
                "financial_loss": theft_financial_cost, # Focus on RECOVERY
                "total_financial_loss": total_loss_financial_cost,
                "risk": round(float(row["risk_score"])),
                "status": "critical" if is_anomaly and float(row["risk_score"]) >= 60 else "warning" if float(row["risk_score"]) >= 30 else "safe",
                "timeSeries": ts,
                "meters": []
            }
            transformers.append(t)
            
            # Generate Alert if anomalous
            if t["status"] == "critical":
                alerts.append({
                    "id": f"A-{t['id']}",
                    "transformer": t["id"],
                    "transformerId": t["id"],
                    "location": t["location"],
                    "type": "theft",
                    "severity": "critical",
                    "actionStatus": "open",
                    "loss": t["total_loss"],
                    "theft_loss": t["theft_loss"],
                    "expected": expected_pct,
                    "deviation": "+"+str(t["deviation"]) if t["deviation"] > 0 else str(t["deviation"]),
                    "loss_kwh": t["total_loss_kwh"],
                    "theft_kwh": t["theft_kwh"],
                    "financial_loss": theft_financial_cost,
                    "message": f"AI Engine flagged {t['theft_loss']}% active theft on {t['id']}. Baseline {expected_pct}% exceeded by {t['deviation']}%. Revenue Recovery potential: ₹{theft_financial_cost}.",
                    "time": "Just Now",
                    "timestamp": "Just Now",
                    "status": "active"
                })

        # --- Real Analytics aggregated from CSV ---

        # 1. By Region: total supply, consumption, avg loss, anomaly count
        by_region = df.groupby("region").agg(
            supply=("supply_kwh", "sum"),
            consumption=("meter_sum_kwh", "sum"),
            avg_loss=("loss_percent", "mean"),
            anomalies=("anomaly", "sum"),
            count=("transformer_id", "count")
        ).reset_index()
        region_data = []
        for _, r in by_region.iterrows():
            region_data.append({
                "region": str(r["region"]),
                "supply": round(float(r["supply"])),
                "consumption": round(float(r["consumption"])),
                "loss": round(float(r["avg_loss"]), 1),
                "anomalies": int(r["anomalies"]),
                "count": int(r["count"])
            })

        # 2. By Zone Type: same grouping
        by_zone = df.groupby("zone_type").agg(
            supply=("supply_kwh", "sum"),
            consumption=("meter_sum_kwh", "sum"),
            avg_loss=("loss_percent", "mean"),
            anomalies=("anomaly", "sum"),
            count=("transformer_id", "count")
        ).reset_index()
        zone_data = []
        for _, r in by_zone.iterrows():
            zone_data.append({
                "zone": str(r["zone_type"]),
                "supply": round(float(r["supply"])),
                "consumption": round(float(r["consumption"])),
                "loss": round(float(r["avg_loss"]), 1),
                "anomalies": int(r["anomalies"]),
                "count": int(r["count"])
            })

        # 3. Loss Distribution: bucket transformers by loss %
        loss_bins = [0, 5, 10, 15, 20, 30, 50, 100]
        loss_labels = ["0-5%", "5-10%", "10-15%", "15-20%", "20-30%", "30-50%", "50%+"]
        df["loss_bucket"] = pd.cut(df["loss_percent"], bins=loss_bins, labels=loss_labels, right=False)
        loss_dist = df.groupby("loss_bucket", observed=True).agg(
            count=("transformer_id", "count"),
            anomalies=("anomaly", "sum")
        ).reset_index()
        loss_data = []
        for _, r in loss_dist.iterrows():
            loss_data.append({
                "range": str(r["loss_bucket"]),
                "count": int(r["count"]),
                "anomalies": int(r["anomalies"])
            })

        output = {
            "transformers": transformers,
            "alerts": alerts,
            "analytics": {
                "byRegion": region_data,
                "byZone": zone_data,
                "lossDistribution": loss_data
            }
        }

        # Output to Node stdout
        print(json.dumps(output))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
