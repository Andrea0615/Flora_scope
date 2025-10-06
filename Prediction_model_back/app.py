from flask import Flask, jsonify, send_file
from flask_cors import CORS
import os
import json
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import folium
from folium.plugins import MarkerCluster

# ✅ Crear la app Flask antes de usar @app.route
app = Flask(__name__)
CORS(app)

# ---------------------------------------------------
# 1️⃣ Endpoint principal: ejecuta modelo y genera mapa
# ---------------------------------------------------
@app.route("/predict", methods=["GET"])
def run_model():
    dirname = os.path.dirname(__file__)
    path = os.path.join(dirname, "valleCentralData.json")

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

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

    df["flowering_risk"] = df.apply(
        lambda r: 1 if (r["leaves"] == 1 and r["dry"] == 0) else 0,
        axis=1
    )

    features = ["lon", "lat", "elev", "dry", "leaves", "water"]
    X_train, X_test, y_train, y_test = train_test_split(
        df[features], df["flowering_risk"], test_size=0.3, random_state=42
    )

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    df["pred_flowering"] = model.predict(df[features])

    # Crear mapa con Folium
    m = folium.Map(location=[df["lat"].mean(), df["lon"].mean()],
                   zoom_start=8, tiles="CartoDB positron")
    marker_cluster = MarkerCluster().add_to(m)

    for _, row in df.iterrows():
        color = "green" if row["pred_flowering"] == 1 else "gray"
        tooltip = (
            f"<b>Coordenadas:</b> ({row['lat']:.4f}, {row['lon']:.4f})<br>"
            f"<b>Predicción:</b> {'🌸 Floración probable' if row['pred_flowering'] == 1 else 'Sin floración'}"
        )
        folium.CircleMarker(
            location=[row["lat"], row["lon"]],
            radius=5,
            fill=True,
            fill_color=color,
            color=color,
            tooltip=tooltip
        ).add_to(marker_cluster)

    output_path = os.path.join(dirname, "mapa_floracion.html")
    m.save(output_path)

    predicciones = df[["lat", "lon", "elev", "date", "pred_flowering"]].to_dict(orient="records")

    return jsonify({
        "status": "ok",
        "map_url": "/mapa",
        "predictions": predicciones
    })


# ---------------------------------------------------
# 2️⃣ Endpoint para servir el mapa guardado
# ---------------------------------------------------
@app.route("/mapa", methods=["GET"])
def mostrar_mapa():
    dirname = os.path.dirname(__file__)
    path = os.path.join(dirname, "mapa_floracion.html")
    return send_file(path)


# ---------------------------------------------------
# 3️⃣ Iniciar servidor
# ---------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)

