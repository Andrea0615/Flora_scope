# FloraScope by GaiaScope

## Overview
This project combines NASA Earth observation data with climate data from the Meteomatics API to predict the month with the highest plant flowering in a specific region.
It also generates visual outputs including probability charts and an interactive geospatial map.

## How do we adress the challenge?
This application addresses the **“BloomWatch: An Earth Observation Application for Global Flowering Phenology”** challenge from the NASA Space Apps Challenge 2025, which aims to create a dynamic tool using Earth observations to detect and visualize plant flowering events globally.

## Main Features
1. Load NASA observation data from a JSON file (valleCentralData.json).
2. Process and clean the data:
    - Convert categorical/boolean indicators into numerical values.
    - Define the target variable flowering_risk (0 = no flowering, 1 = flowering likely).
3. Download and process climate data (temperature, precipitation, radiation, humidity) using the Meteomatics API.
4. Train a Machine Learning model: 
    - Algorithm: RandomForestClassifier (Scikit-learn).
    - Model validation with a classification report.
5. Estimate the most likely month for flowering based on NASA observations and historical climate patterns.
6. Visualization:
    - Line chart of flowering probability by month.
    - Interactive Folium map displaying geolocated observations with predictions.
    - Custom legend with clear symbology.

## Project Structure -- //modificar archivos del repo final
``` 
FloraScope/
├── README.md              # This file
├── Makefile               # Build configuration
├── src/
│   ├── main.cpp           # Main program with menu
│   ├── sorting.h          # Function declarations
│   └── sorting.cpp        # YOUR IMPLEMENTATIONS GO HERE
├── tests/
│   ├── test_runner.cpp    # Test framework
│   └── test_cases.h       # Test cases
└── data/
    └── sample_data.txt    # Sample input data
```
## Requirements
- **Python 3.6** *or newer*
- **Python Libraries**:
  - pandas
  - matplotlib
  - requests
  - folium
  - scikit-learn

Use the following command in you terminal for installing the libraries
``` 
pip install pandas matplotlib requests folium scikit-learn
``` 

## How to run?
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
