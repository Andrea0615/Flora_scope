# --- Librerías necesarias ---
import json
import pandas as pd
import matplotlib.pyplot as plt
import requests
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import os

# ------------------------------------------------------
# 1. Cargar el archivo JSON local (tus observaciones)
# ------------------------------------------------------
dirname = os.path.dirname(__file__)
path = os.path.join(dirname, "valleCentralData.json")

with open(path, "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"✅ Datos locales cargados: {data['count']} registros\n")

# Convertir a DataFrame
rows = []
for item in data["results"]:
    d = item["data"]

    def safe_bool(value):
        if isinstance(value, bool):
            return int(value)
        if isinstance(value, str):
            return 1 if value.lower() == "true" else 0
        return 0

    rows.append({
        "lat": item.get("latitude", d.get("landcoversMeasurementLatitude")),
        "lon": item.get("longitude", d.get("landcoversMeasurementLongitude")),
        "elev": item.get("elevation", d.get("landcoversMeasurementElevation", 0)),
        "dry": safe_bool(d.get("landcoversDryGround")),
        "leaves": safe_bool(d.get("landcoversLeavesOnTrees")),
        "water": safe_bool(d.get("landcoversStandingWater")),
        "date": item["measuredDate"]
    })

df = pd.DataFrame(rows)
df["date"] = pd.to_datetime(df["date"])
df["month"] = df["date"].dt.month

# Variable objetivo (riesgo floración)
df["flowering_risk"] = df.apply(
    lambda r: 1 if (r["leaves"] == 1 and r["dry"] == 0) else 0,
    axis=1
)

print("📄 Primeras filas de observaciones:\n", df.head(), "\n")

# ------------------------------------------------------
# 2. Descargar datos climáticos de Meteomatics
# ------------------------------------------------------
meteomatics_url = (
    "https://api.meteomatics.com/"
    "2013-01-01T00:00:00Z--2023-01-01T00:00:00Z:P1M/"
    "t_max_2m_24h:C,t_min_2m_24h:C,precip_24h:mm,"
    "global_rad:W,relative_humidity_2m:p/"
    "40.1999,-122.2011/json"
)

user = "sanchez_danna"
password = "M8NaYg3nbu9Zxa7Y22yi"

resp = requests.get(meteomatics_url, auth=(user, password))
clima = resp.json()

rows = []
for series in clima["data"]:
    param = series["parameter"]
    for v in series["coordinates"][0]["dates"]:
        rows.append({
            "date": v["date"][:10],
            param: v["value"]
        })

clima_df = pd.DataFrame(rows)
clima_df["date"] = pd.to_datetime(clima_df["date"])
clima_df["month"] = clima_df["date"].dt.month
clima_df = clima_df.groupby("month").mean().reset_index()

print("🌤 Clima procesado:\n", clima_df.head(), "\n")

# ------------------------------------------------------
# 3. Unir observaciones con clima
# ------------------------------------------------------
merged = pd.merge(df, clima_df, on="month", how="left")

features = ["lon", "lat", "elev", "dry", "leaves", "water",
            "t_max_2m_24h:C", "t_min_2m_24h:C", "precip_24h:mm",
            "global_rad:W", "relative_humidity_2m:p"]

X = merged[features]
y = merged["flowering_risk"]

# ------------------------------------------------------
# 4. Entrenar modelo
# ------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42, stratify=y
)

model = RandomForestClassifier(n_estimators=200, random_state=42)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

print("--- Reporte de clasificación ---")
print(classification_report(
    y_test, y_pred,
    labels=[0, 1],
    target_names=["Sin floración", "Floración probable"],
    zero_division=0
))

# ------------------------------------------------------
# 5. Estimar el mes más probable de floración (versión con probabilidades)
# ------------------------------------------------------

# Copiamos los datos climáticos promedio por mes
probs = clima_df.copy()

# Simulamos condiciones estacionales variables
probs_features = probs.assign(
    lon=df["lon"].mean(),
    lat=df["lat"].mean(),
    elev=df["elev"].mean(),
    dry=[1 if m in [5, 6, 7, 8] else 0 for m in probs["month"]],
    leaves=[1 if m in [3, 4, 5, 6, 7, 8] else 0 for m in probs["month"]],
    water=[1 if m in [11, 12, 1, 2] else 0 for m in probs["month"]]
)[features]

# Usar predict_proba para obtener probabilidades (columna índice 1 = floración)
probs_pred = model.predict_proba(probs_features)
probs["prob_floracion"] = probs_pred[:, 1]  # tomamos la probabilidad de la clase 1

# Identificar el mes con mayor probabilidad
mes_probable = probs.loc[probs["prob_floracion"].idxmax(), "month"]

print("\n🌸 Probabilidades por mes:")
print(probs[["month", "prob_floracion"]])

print(f"\n🌼 El mes con mayor probabilidad de floración es: {mes_probable}")

# --- Visualización ---
plt.figure(figsize=(8, 5))
plt.plot(probs["month"], probs["prob_floracion"], marker="o", linewidth=2, color="orchid")
plt.title("Probabilidad estimada de floración por mes")
plt.xlabel("Mes")
plt.ylabel("Probabilidad de floración (0 a 1)")
plt.xticks(range(1, 13))
plt.ylim(0, 1)
plt.grid(True)

# Resaltar el mes más probable
plt.axvline(mes_probable, color="green", linestyle="--", label=f"Mes más probable: {mes_probable}")
plt.legend()
plt.show()

# ------------------------------------------------------
# 6. Visualización geoespacial con Folium
# ------------------------------------------------------
import folium
from folium.plugins import MarkerCluster

# Crear mapa centrado en la media de coordenadas
m = folium.Map(location=[df["lat"].mean(), df["lon"].mean()],
               zoom_start=8, tiles="CartoDB positron")

# Agrupar puntos para mejor visualización
marker_cluster = MarkerCluster().add_to(m)

# Predicciones sobre los datos reales de observación
predicciones = model.predict(X)
df["pred_flowering"] = predicciones

# Añadir marcadores según predicción
for _, row in df.iterrows():
    color = "green" if row["pred_flowering"] == 1 else "gray"
    tooltip = (f"<b>Coordenadas:</b> {row['lat']:.4f}, {row['lon']:.4f}<br>"
               f"<b>Elevación:</b> {row['elev']} m<br>"
               f"<b>Fecha medición:</b> {row['date'].strftime('%Y-%m-%d')}<br>"
               f"<b>Predicción:</b> {'🌼 Floración probable' if row['pred_flowering']==1 else 'Sin floración'}")
    folium.CircleMarker(
        location=[row["lat"], row["lon"]],
        radius=6,
        color=color,
        fill=True,
        fill_color=color,
        fill_opacity=0.7,
        tooltip=tooltip
    ).add_to(marker_cluster)

# Añadir marcador con el mes de floración más probable
meses = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
    5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
    9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
}

folium.Marker(
    [df["lat"].mean(), df["lon"].mean()],
    popup=(f"🌸 <b>Mes más probable de floración:</b> {meses.get(mes_probable, mes_probable)}"),
    icon=folium.Icon(color="green", icon="leaf")
).add_to(m)

# Guardar mapa interactivo
output_path = os.path.join(dirname, "mapa_floracion.html")
m.save(output_path)
# ------------------------------------------------------
# Añadir leyenda / simbología al mapa
# ------------------------------------------------------

legend_html = """
<div style="
    position: fixed;
    bottom: 50px;
    left: 50px;
    width: 250px;
    height: 120px;
    background-color: rgba(255, 255, 255, 0.85);
    border-radius: 10px;
    padding: 10px;
    font-size: 14px;
    font-family: Arial, sans-serif;
    box-shadow: 2px 2px 6px rgba(0,0,0,0.3);
    z-index:9999;
">
<b>🌸 Leyenda del mapa</b><br>
<svg height="12" width="12">
  <circle cx="6" cy="6" r="5" fill="green" stroke="green" stroke-width="1"/>
</svg> Floración probable<br>
<svg height="12" width="12">
  <circle cx="6" cy="6" r="5" fill="gray" stroke="gray" stroke-width="1"/>
</svg> Sin floración<br>
<svg height="12" width="12">
  <rect width="12" height="12" style="fill:#88cc88;stroke-width:1;stroke:#555"/>
</svg> Mes estimado de floración: <b>{mes}</b>
</div>
""".format(mes=meses.get(mes_probable, mes_probable))

m.get_root().html.add_child(folium.Element(legend_html))


print(f"🗺️  Mapa generado y guardado como: {output_path}")
print(f"🌼 Mes más probable de floración: {meses.get(mes_probable, mes_probable)}")
