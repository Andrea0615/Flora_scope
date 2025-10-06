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
## Requirements
  **Backend**
  | Tool    | Version (recommended) |
  |------   |----------|
  | Python  | ≥ 3.10   | 
  | pip     | latest   |
  | virtualenv (optional)    | latest   |

  **Frontend**
  | Tool    | Version (recommended) |
  |------   |----------|
  | Node.js | ≥ 18  | 
  | npm or yarn     | latest   |
  
  
## Backend Setup

### 1. Navigate to backend folder
``` 
cd Prediction_model_back 
``` 

### 2. Create and activate virtual environment (optional)
``` 
#Create 
python -m venv venv

#Activate 
source venv/bin/activate       # On Linux / Mac
# OR
venv\Scripts\activate          # On Windows
``` 

### 3. Install dependencies
``` 
pip install flask flask-cors pandas scikit-learn folium
``` 

### 4. Run backend server
``` 
python app.py
``` 

You should see something like:
``` 
 Running on http://127.0.0.1:5000
``` 

If the port 5000 is busy, change it in the last line of app.py:
``` 
app.run(debug=True, port=5001)
``` 

### 5. Verify API is working

Open your browser and go to:
``` 
http://127.0.0.1:5000/predict
``` 

You should get a JSON response like:
``` 
{
  "status": "ok",
  "predictions": [...],
  "monthlyProbs": [...],
  "peakMonth": 4,
  "peakMonthName": "April"
}
``` 

## Frontend Setup (React +  Vite)

### 1. Navigate to frontend folder
``` 
cd flora_scope_frontend
``` 

### 2. Install dependencies
``` 
npm install
``` 

### 3. Start development server
``` 
npm run dev
``` 

``` 
You’ll see something like:

  VITE v5.0.0  ready in 600ms
  ➜  Local:   http://localhost:5173/
``` 

Open that link in your browser.

## Connect Frontend and Backend
The frontend expects to reach the backend at:
``` 
http://127.0.0.1:5000/predict
``` 

Make sure:
- Flask (app.py) is running on port 5000
- React is running on 5173
- CORS is enabled in your backend (CORS(app) line must be present)
- You have axios installed in your frontend (npm install axios)

If you see:
``` 
⚠️ No se pudo conectar con el servidor Flask
``` 
It means Flask is not running, or the port is wrong.


## How to run?
### Backend
1. Clone or download this repository.
2. Add your Meteomatics API credentials inside the script:
``` 
user = "YOUR USER"
password = "YOUR PASSWORD"
``` 
Run the script:
``` 
python oficialPredictionRainforest.py
``` 

## Expected Output
1. Classification report (precision, recall, f1-score) for the trained model.
2. Flowering probability chart by month.
3. Interactive map (mapa_floracion.html) including:
    - NASA observation points (green = flowering likely, gray = no flowering).
    - Estimated most likely flowering month.
    - Custom legend with map symbols.
