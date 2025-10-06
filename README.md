# FloraScope by GaiaScope

## Overview
This project combines NASA Earth observation data (NASA GLOBE Observer) with climate data from the Meteomatics API to predict the month with the highest plant flowering in a specific region; this example is focused on Central Valley, California, USA.

It combines the climate data and field observations to:
- Train a Machine Learning model (Random Forest) that estimates blooming.
- Identify the most probable month of blooming for a given region.
- Display results on an interactive map and a web dashboard.

The project has two main components:
- **Backend** in Python : handles data processing, prediction, and API endpoints.
- **Frontend** in React : provides a user interface to visualize predictions.

## How do we adress the challenge?
This application addresses the **“BloomWatch: An Earth Observation Application for Global Flowering Phenology”** challenge from the NASA Space Apps Challenge 2025, which aims to create a dynamic tool using Earth observations to detect and visualize plant flowering 

## Project Structure
``` 
FloraScope/
│
├── Prediction_model_back/          # Flask backend
│   ├── app.py                      # Main backend API
│   ├── valleCentralData.json       # Dataset with observations
│   ├── mapa_floracion.html         # Auto-generated map (folium)
│   └── requirements.txt            # Python dependencies
│
├── flora_scope_frontend/           # React frontend
│   ├── src/
│   │   ├── FloraScope.jsx          # Main React component
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
└── README.md                       # Documentation (this file)

```

## Project Structure

```bash
Flora_scope/
│
├── Prediction_model_back/        # Flask backend
│   ├── app.py                     # Main backend logic (Flask API + Folium Map)
│   ├── valleCentralData.json      # Local dataset used for model training/testing
│   ├── mapa_floracion.html        # Auto-generated interactive map
│   └── requirements.txt           # Python dependencies
│
├── flora_scope_frontend/          # React frontend
│   ├── src/
│   │   ├── FloraScope.jsx         # Main React component
│   │   └── index.jsx              # React entry point
│   ├── package.json               # NPM configuration
│   └── tailwind.config.js         # Styling configuration
│
└── README.md           # Project documentation
```

---

## Requirements

### Backend (Flask)
Make sure you have **Python 3.10+** and **pip** installed.

```bash
pip install flask flask-cors pandas scikit-learn folium
```

Optionally, use a **virtual environment**:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend (React)
Make sure you have **Node.js (v18 or higher)** and **npm** installed.

```bash
npm install
npm run dev
```

---

## Running the Project

### 1️. Run the Flask Backend

```bash
cd Prediction_model_back
python app.py
```
The backend runs on:
```
http://127.0.0.1:5000/
```

Endpoints available:
- `/predict`: Runs the ML model and generates `mapa_floracion.html`.
- `/mapa`: Serves the interactive map generated with Folium.

### 2. Run the React Frontend

```bash
cd flora_scope_frontend
npm run dev
```
Frontend available at:
```
http://localhost:5173/
```

---

## How It Works?

### Step 1: Data Loading
The system loads local observations from `valleCentralData.json`, which includes geographic and environmental variables such as:
- Latitude, Longitude, Elevation
- Soil humidity, Vegetation, Standing Water
- Observation Date

### Step 2: Machine Learning Model
The backend uses a **Random Forest Classifier** to predict the probability of flowering based on environmental conditions.

### Step 3: Map Generation
The model predictions are visualized with **Folium** on an interactive map:
- Green markers → Probable flowering areas
- Gray markers → No flowering detected
- Clusters group nearby points for easier visualization

### Step 4: Frontend Integration
The React frontend connects to Flask through Axios:
- Fetches model predictions (`/predict`)
- Displays the generated map (`/mapa`)
- Shows peak flowering month and probability chart

---

## Key Design Decisions

| Component | Technology | Purpose |
|------------|-------------|----------|
| **Backend API** | Flask + scikit-learn | Model execution and API serving |
| **Visualization** | Folium | Interactive geospatial mapping |
| **Frontend** | React + TailwindCSS | Interactive UI |
| **Communication** | Axios + Flask-CORS | Secure data exchange between client/server |

---

## Frontend Features

- **Home (Hero)**: Introduction and access to the interactive map.  
- **Map View**: Embedded Flask map with a legend and region indicator (California).  
- **Analysis View**: Monthly flowering probabilities and peak month prediction.

---

## Example Backend Response

```json
{
  "status": "ok",
  "map_url": "/mapa",
  "predictions": [
    {"lat": 37.2, "lon": -121.5, "elev": 134, "date": "2023-03-15", "pred_flowering": 1},
    {"lat": 36.9, "lon": -120.9, "elev": 145, "date": "2023-04-02", "pred_flowering": 0}
  ]
}
```

---

## Why Flask + React Integration?

| Reason | Benefit |
|--------|----------|
| Flask handles ML logic | Allows integration of trained scikit-learn models |
| React provides UI | User-friendly visualization |
| CORS-enabled API | Secure cross-origin communication |
| Modular architecture | Each side (backend/frontend) can be deployed separately |

---

## Future Improvements

- Add **real-time probability maps** by date range.  
- Deploy on **Render** or **Vercel**.  
- Implement **user-uploaded observation datasets**.

---
