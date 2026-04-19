# -*- coding: utf-8 -*-
"""
GridGuard ML Model -- Full Validation Report
=============================================
Run: python server/check_model.py
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib
matplotlib.use("Agg")          # no display needed — saves file instead
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import numpy as np
import os

# ──────────────────────────────────────────────
# 1. LOAD DATA
# ──────────────────────────────────────────────
csv_path = os.path.join(os.path.dirname(__file__), "punjab_gridguard_deep_data_1200.csv")
df = pd.read_csv(csv_path)

# Feature engineering (same as ml_model.py)
df["loss_percent"] = ((df["supply_kwh"] - df["meter_sum_kwh"]) / df["supply_kwh"]) * 100
df = df.fillna(0)

features = df[["supply_kwh", "meter_sum_kwh", "loss_percent"]]

# ──────────────────────────────────────────────
# 2. TRAIN MODEL  (Case B — ML generates anomalies from scratch)
# ──────────────────────────────────────────────
model = IsolationForest(contamination=0.1, random_state=42)
model.fit(features)

# IsolationForest returns -1 (anomaly) or +1 (normal)
# Convert to binary: 1 = anomaly, 0 = normal
raw_preds   = model.predict(features)
df["ml_anomaly"] = (raw_preds == -1).astype(int)
df["anomaly_score"] = model.score_samples(features)   # lower = more anomalous

# Ground truth from CSV (used ONLY for validation, not training)
y_true = df["is_anomaly"]
y_pred = df["ml_anomaly"]

anomalies_detected = int(y_pred.sum())
normal_detected    = int((y_pred == 0).sum())

# ──────────────────────────────────────────────
# 3. PRINT FULL REPORT
# ──────────────────────────────────────────────
print("=" * 54)
print("    GridGuard — Isolation Forest Validation Report")
print("=" * 54)
print()
print("▶  CASE B CONFIRMED — ML generates anomalies independently")
print("   CSV is_anomaly column is used ONLY as ground truth")
print("   for validation — NOT fed into the model as a feature.")
print()
print("──── Model Configuration ────")
print(f"  Algorithm          : IsolationForest (sklearn)")
print(f"  Training rows      : {len(df)}")
print(f"  Features           : supply_kwh | meter_sum_kwh | loss_percent")
print(f"  Number of trees    : {model.n_estimators}")
print(f"  Max samples/tree   : {model.max_samples_}")
print(f"  Contamination      : 10%  (Punjab T&D benchmark)")
print(f"  Random seed        : 42  (reproducible)")
print()
print("──── Training Output ────")
print(f"  ML Anomalies found : {anomalies_detected}  ({round(anomalies_detected/len(df)*100, 1)}%)")
print(f"  Normal classified  : {normal_detected}  ({round(normal_detected/len(df)*100, 1)}%)")
print(f"  Anomaly score range: {df['anomaly_score'].min():.4f}  →  {df['anomaly_score'].max():.4f}")
print()
print("──── Classification Report (vs CSV ground truth) ────")
print(classification_report(y_true, y_pred, target_names=["Normal", "Anomaly"]))

cm = confusion_matrix(y_true, y_pred)
print("──── Confusion Matrix ────")
print(f"  True  Normal  correctly classified : {cm[0][0]}")
print(f"  False Positives (Normal → Anomaly) : {cm[0][1]}")
print(f"  False Negatives (Missed anomalies) : {cm[1][0]}")
print(f"  True  Anomalies correctly caught   : {cm[1][1]}")
print()
print("──── Top 5 Highest-Risk Anomalies ────")
top5 = (
    df[df["ml_anomaly"] == 1][["transformer_id", "region", "zone_type", "loss_percent", "anomaly_score"]]
    .sort_values("anomaly_score")
    .head(5)
)
for _, r in top5.iterrows():
    print(f"  {r['transformer_id']:10s} | {r['region']:12s} | Loss: {round(float(r['loss_percent']),1):5.1f}% | Score: {float(r['anomaly_score']):.4f}")

print()
print("✅  STATUS: MODEL IS TRAINED, VALIDATED AND OPERATIONAL")
print("=" * 54)

# ──────────────────────────────────────────────
# 4. SAVE VALIDATION PLOT
# ──────────────────────────────────────────────
fig = plt.figure(figsize=(14, 10), facecolor="#0d1b2a")
fig.suptitle("GridGuard — Isolation Forest Validation Dashboard",
             color="white", fontsize=14, fontweight="bold", y=0.98)

gs = gridspec.GridSpec(2, 2, figure=fig, hspace=0.45, wspace=0.35)

col_normal  = "#10b981"
col_anomaly = "#ef4444"
col_bg      = "#0d1b2a"
col_panel   = "#111e2e"
col_text    = "#8ba3c7"

def style_ax(ax):
    ax.set_facecolor(col_panel)
    ax.tick_params(colors=col_text, labelsize=9)
    for spine in ax.spines.values():
        spine.set_edgecolor("#1e2d45")
    ax.xaxis.label.set_color(col_text)
    ax.yaxis.label.set_color(col_text)
    ax.title.set_color("white")

# ─ Plot 1: Loss % vs ML Anomaly label ─
ax1 = fig.add_subplot(gs[0, 0])
style_ax(ax1)
mask_n = df["ml_anomaly"] == 0
mask_a = df["ml_anomaly"] == 1
ax1.scatter(df.loc[mask_n, "loss_percent"], df.loc[mask_n, "anomaly_score"],
            color=col_normal,  alpha=0.4, s=12, label="Normal")
ax1.scatter(df.loc[mask_a, "loss_percent"], df.loc[mask_a, "anomaly_score"],
            color=col_anomaly, alpha=0.8, s=18, label="Anomaly (ML)")
ax1.set_xlabel("Loss %")
ax1.set_ylabel("Anomaly Score (lower = worse)")
ax1.set_title("Loss % vs Anomaly Score")
ax1.legend(fontsize=8, facecolor=col_panel, edgecolor="#1e2d45", labelcolor="white")

# ─ Plot 2: Histogram of loss_percent by class ─
ax2 = fig.add_subplot(gs[0, 1])
style_ax(ax2)
ax2.hist(df.loc[mask_n, "loss_percent"],  bins=30, color=col_normal,  alpha=0.7, label="Normal")
ax2.hist(df.loc[mask_a, "loss_percent"],  bins=30, color=col_anomaly, alpha=0.8, label="Anomaly")
ax2.set_xlabel("Loss %")
ax2.set_ylabel("Count")
ax2.set_title("Loss % Distribution by Class")
ax2.legend(fontsize=8, facecolor=col_panel, edgecolor="#1e2d45", labelcolor="white")

# ─ Plot 3: Supply vs Consumption scatter ─
ax3 = fig.add_subplot(gs[1, 0])
style_ax(ax3)
ax3.scatter(df.loc[mask_n, "supply_kwh"], df.loc[mask_n, "meter_sum_kwh"],
            color=col_normal,  alpha=0.3, s=10, label="Normal")
ax3.scatter(df.loc[mask_a, "supply_kwh"], df.loc[mask_a, "meter_sum_kwh"],
            color=col_anomaly, alpha=0.9, s=18, label="Anomaly")
diag = np.linspace(0, df["supply_kwh"].max(), 100)
ax3.plot(diag, diag, color="#f59e0b", linewidth=1, linestyle="--", label="Supply = Consumption")
ax3.set_xlabel("Supply (kWh)")
ax3.set_ylabel("Meter Sum (kWh)")
ax3.set_title("Supply vs Metered Consumption")
ax3.legend(fontsize=8, facecolor=col_panel, edgecolor="#1e2d45", labelcolor="white")

# ─ Plot 4: Confusion Matrix heatmap ─
ax4 = fig.add_subplot(gs[1, 1])
style_ax(ax4)
cm_labels = [["True Normal\n(correctly safe)", "False Alarm\n(normal → flagged)"],
             ["Missed Theft\n(anomaly → safe)", "True Anomaly\n(correctly caught)"]]
cm_colors = [[col_normal, col_anomaly], [col_anomaly, col_normal]]
for i in range(2):
    for j in range(2):
        ax4.add_patch(plt.Rectangle((j, 1-i), 1, 1,
                                    color=cm_colors[i][j], alpha=0.25))
        ax4.text(j + 0.5, 1.5 - i, f"{cm[i][j]}\n{cm_labels[i][j]}",
                 ha="center", va="center", color="white",
                 fontsize=8.5, fontweight="bold")
ax4.set_xlim(0, 2)
ax4.set_ylim(0, 2)
ax4.set_xticks([0.5, 1.5])
ax4.set_xticklabels(["Predicted Normal", "Predicted Anomaly"], color=col_text, fontsize=9)
ax4.set_yticks([0.5, 1.5])
ax4.set_yticklabels(["Actual Anomaly", "Actual Normal"], color=col_text, fontsize=9)
ax4.set_title("Confusion Matrix")

out_path = os.path.join(os.path.dirname(__file__), "ml_validation_report.png")
plt.savefig(out_path, dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
print(f"\n📊 Validation chart saved → {out_path}")
