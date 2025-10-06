import React, { useState, useEffect } from 'react';
import axios from "axios";
import { MapPin, Leaf, TrendingUp, Calendar } from 'lucide-react';

// Región base de detección
const CENTRAL_VALLEY_BBOX = {
  minLon: -122.6, maxLon: -118.6,
  minLat: 35.0, maxLat: 39.2
};

function intersects(view, bbox) {
  if (!view) return false;
  const { minLon, minLat, maxLon, maxLat } = view;
  return !(maxLon < bbox.minLon || minLon > bbox.maxLon || maxLat < bbox.minLat || minLat > bbox.maxLat);
}

const monthNames = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec'
];

const FloraScope = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isInCentralValley, setIsInCentralValley] = useState(false);
  const [mapView, setMapView] = useState({
    centerLat: 37.1,
    centerLon: -120.6,
    zoom: 1
  });

  // --- Estados para datos reales ---
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Obtener datos desde Flask ---
  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("http://127.0.0.1:5000/predict");
      setData(res.data);
    } catch (err) {
      console.error("Error al conectar con Flask:", err);
      setError("No se pudo conectar con el servidor Flask.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  useEffect(() => {
    setTimeout(() => setMapLoaded(true), 500);
  }, []);

  useEffect(() => {
    const viewBounds = calculateViewBounds(mapView);
    setIsInCentralValley(intersects(viewBounds, CENTRAL_VALLEY_BBOX));
  }, [mapView]);

  function calculateViewBounds(view) {
    const latSpan = 10 / Math.pow(2, view.zoom - 1);
    const lonSpan = 15 / Math.pow(2, view.zoom - 1);
    return {
      minLat: view.centerLat - latSpan / 2,
      maxLat: view.centerLat + latSpan / 2,
      minLon: view.centerLon - lonSpan / 2,
      maxLon: view.centerLon + lonSpan / 2
    };
  }

  function focusOnCalifornia() {
    setMapView({
      centerLat: (CENTRAL_VALLEY_BBOX.minLat + CENTRAL_VALLEY_BBOX.maxLat) / 2,
      centerLon: (CENTRAL_VALLEY_BBOX.minLon + CENTRAL_VALLEY_BBOX.maxLon) / 2,
      zoom: 3
    });
  }

  // --- Estados de carga ---
  if (loading) {
    return <div className="text-center p-20 text-xl text-emerald-600">
      🌱 Cargando datos del servidor Flask...
    </div>;
  }

  if (error) {
    return <div className="text-center p-20 text-xl text-red-500">{error}</div>;
  }

  if (!data) {
    return <div className="text-center p-20 text-xl text-gray-500">
      Esperando datos del servidor...
    </div>;
  }

  // --- Extraer datos del backend ---
  const predictions = data.predictions || [];
  const monthlyProbs = data.monthlyProbs || [];
  const peakMonthName = data.peakMonthName || '---';
  const peakMonth = data.peakMonth || 0;

  // --- HERO ---
  const Hero = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-violet-50 to-amber-50 flex flex-col items-center justify-center">
      <Leaf className="w-20 h-20 text-emerald-600 mb-6 animate-bounce" />
      <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-violet-600 mb-4">
        FloraScope
      </h1>
      <p className="text-xl text-gray-700 mb-8 font-medium">
        Artificial intelligence to predict flowering from space and ground
      </p>
      <button
        onClick={() => setActiveSection('map')}
        className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:scale-105 transition"
      >
        <MapPin className="inline-block w-5 h-5 mr-2" />
        Explore flowering map
      </button>
    </div>
  );

  // --- MAPA ---
// --- MAPA ---
const MapView = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-12 px-6">
    <div className="max-w-7xl mx-auto">
      {/* Título y botón */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-4xl font-bold text-gray-800">
          Interactive Flowering Map
        </h2>
        <button
          onClick={focusOnCalifornia}
          className="bg-white/90 backdrop-blur-sm hover:bg-white text-emerald-600 px-4 py-2 rounded-lg shadow-lg font-semibold text-sm flex items-center gap-2 transition-all hover:shadow-xl"
        >
          <MapPin className="w-4 h-4" />
          Focus California
        </button>
      </div>

      {/* Explicación general */}
      <p className="text-gray-600 text-md mb-6 max-w-3xl">
        This interactive map visualizes the <span className="font-semibold text-emerald-600">predicted flowering zones</span> 
        in California’s Central Valley. Each cluster represents an observation site analyzed by the AI model.
      </p>

      {/* IFRAME: Mapa embebido desde Flask */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative">
        <iframe
          src="http://127.0.0.1:5000/mapa"
          title="Mapa de Floración"
          className="w-full h-[600px] border-0 rounded-xl"
        />

        {/* 📘 Leyenda del mapa */}
        <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <div className="font-bold mb-3 flex items-center gap-2 text-gray-800">
            <Leaf className="w-5 h-5 text-emerald-600" />
            Map Legend
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border border-white" />
              <span className="text-gray-700">High flowering probability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400 border border-white" />
              <span className="text-gray-700">Low or no flowering</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🟢 Botón para ir al análisis */}
      <div className="flex justify-center mt-10">
        <button
          onClick={() => setActiveSection('chart')}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-violet-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
        >
          <TrendingUp className="w-5 h-5" />
          View Month with Highest Probability
        </button>
      </div>

      {/* Nota al pie */}
      <p className="text-center text-gray-500 mt-6 text-sm">
        🌸 The visualization is dynamically generated from live model predictions served by the Flask backend.
      </p>
    </div>
  </div>
);



  // --- GRÁFICO ---
  // --- GRÁFICO ---
const ChartView = () => {
  const maxProb = Math.max(...(monthlyProbs.map(m => m.prob || 0)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-emerald-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Monthly Flowering Probabilities
        </h2>

        {/* Tarjeta destacada */}
        <div className="bg-gradient-to-r from-emerald-100 to-violet-100 border border-emerald-200 rounded-xl shadow-md mb-8 p-6 text-center">
          <h3 className="text-2xl font-bold text-emerald-700 mb-2 flex items-center justify-center gap-2">
            🌼 Peak Flowering Month: 
            <span className="text-violet-700">{peakMonthName}</span>
          </h3>
          <p className="text-gray-700 max-w-2xl mx-auto">
            The AI model predicts <span className="font-semibold text-emerald-700">{peakMonthName}</span> as the period with the 
            <span className="font-semibold"> highest probability of flowering</span> based on environmental indicators such as 
            soil humidity, vegetation greenness, and temperature variation.
          </p>
        </div>

        {/* Gráfica de barras */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="h-80 flex items-end justify-around gap-2">
            {monthlyProbs.map((item, idx) => {
              const height = (item.prob / maxProb) * 100;
              const isPeak = item.month === peakMonth;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 relative">
                  <div className="w-full bg-gray-200 h-64 rounded-lg relative flex items-end">
                    <div
                      className={`rounded-t-lg transition-all ${isPeak ? 'bg-emerald-500 animate-pulse shadow-lg' : 'bg-violet-400'}`}
                      style={{ height: `${height}%`, width: '100%' }}
                    />
                    {isPeak && (
                      <span className="absolute -top-6 text-2xl animate-bounce">🌸</span>
                    )}
                  </div>
                  <span className={`${isPeak ? 'text-emerald-700 font-bold' : 'text-gray-600'}`}>
                    {monthNames[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};


  // --- NAVBAR ---
  const Navigation = () => (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-md z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div
          onClick={() => setActiveSection('hero')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Leaf className="w-7 h-7 text-emerald-600" />
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent">
            FloraScope
          </span>
        </div>
        <div className="flex gap-6">
          {[
            { id: 'hero', label: 'Home', icon: Leaf },
            { id: 'map', label: 'Map', icon: MapPin },
            { id: 'chart', label: 'Analysis', icon: TrendingUp }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium ${
                activeSection === item.id
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );

  // --- RETURN PRINCIPAL ---
  return (
    <div className="font-sans">
      <Navigation />
      <div className="pt-20">
        {activeSection === 'hero' && <Hero />}
        {activeSection === 'map' && <MapView />}
        {activeSection === 'chart' && <ChartView />}
      </div>
    </div>
  );
};

export default FloraScope;

