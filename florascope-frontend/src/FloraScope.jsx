import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import { MapPin, Leaf, TrendingUp, Droplets, Sun, Calendar, Github, FileText, Focus } from 'lucide-react';

// Región de detección
const CENTRAL_VALLEY_BBOX = {
  minLon: -122.6, maxLon: -118.6,
  minLat: 35.0, maxLat: 39.2
};

function intersects(view, bbox) {
  if (!view) return false;
  const { minLon, minLat, maxLon, maxLat } = view;
  return !(maxLon < bbox.minLon || minLon > bbox.maxLon || maxLat < bbox.minLat || minLat > bbox.maxLat);
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  // 🔥 NUEVO: estados para datos del backend
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔥 NUEVO: función para obtener datos desde Flask
  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get("http://127.0.0.1:5000/predict");
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Error al conectar con el backend:", err);
      setError("No se pudo conectar con el servidor Flask.");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Ejecutar una vez al montar
  useEffect(() => {
    fetchPredictions();
  }, []);

  // Mapa animado
  useEffect(() => {
    setTimeout(() => setMapLoaded(true), 500);
  }, []);

  // Detección de región
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

  // 🔥 Mostrar mensajes de carga o error
  if (loading) {
    return <div className="text-center p-20 text-xl text-emerald-600">🌱 Cargando datos desde el servidor...</div>;
  }

  if (error) {
    return <div className="text-center p-20 text-xl text-red-500">⚠️ {error}</div>;
  }

  // 🔥 Evitar error si aún no hay datos
  const predictions = data ? data.predictions : [];
  const monthlyProbs = data ? data.monthlyProbs : [];
  const peakMonthName = data ? data.peakMonthName : '---';
  const peakMonth = data ? data.peakMonth : 0;

  // --- COMPONENTES VISUALES ---
  const Hero = () => (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-violet-50 to-amber-50 flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          >
            🌸
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <div className="mb-6 animate-bounce">
          <Leaf className="w-20 h-20 mx-auto text-emerald-600" />
        </div>
        <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-emerald-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent animate-gradient">
          FloraScope
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 mb-4 font-medium">
          Artificial intelligence to predict flowering from space and ground
        </p>
        <button
          onClick={() => setActiveSection('map')}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
        >
          <MapPin className="w-5 h-5" />
          Explore flowering map
        </button>
      </div>
    </div>
  );

  const MapView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-gray-800">
            Interactive Predictions Map
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative">
          <div className="h-[600px] flex items-center justify-center bg-gradient-to-br from-emerald-100 to-blue-100 relative">
            {predictions.length === 0 ? (
              <p className="text-gray-600 text-lg">No prediction data available yet 🌿</p>
            ) : (
              predictions.map((point, idx) => {
                const x = ((point.lon + 122.3) * 200) % 100;
                const y = ((40.5 - point.lat) * 300) % 100;
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedPoint(point)}
                    className="absolute cursor-pointer"
                    style={{
                      left: `${30 + x * 0.4}%`,
                      top: `${20 + y * 0.6}%`
                    }}
                  >
                    <div
                      className={`w-4 h-4 rounded-full ${
                        point.pred_flowering === 1 ? 'bg-emerald-500' : 'bg-gray-400'
                      } border-2 border-white shadow-lg`}
                    />
                  </div>
                );
              })
            )}

            {/* Leyenda */}
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <div className="font-bold mb-3 flex items-center gap-2 text-gray-800">
                <Leaf className="w-5 h-5 text-emerald-600" />
                Map Legend
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
                  <span className="text-gray-700">Flowering likely</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400 border border-white" />
                  <span className="text-gray-700">No flowering</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                  <Calendar className="w-3 h-3 text-emerald-600" />
                  <span className="text-gray-700 font-medium">Peak month: {peakMonthName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ChartView = () => {
    const maxProb = Math.max(...(monthlyProbs.map(m => m.prob)));
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-emerald-50 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">
            Monthly Flowering Probabilities
          </h2>
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="h-80 flex items-end justify-around gap-2 px-4">
              {monthlyProbs.map((item, idx) => {
                const height = (item.prob / maxProb) * 100;
                const isPeak = item.month === peakMonth;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full h-64 flex items-end">
                      <div
                        className={`w-full rounded-t-lg ${
                          isPeak
                            ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
                            : 'bg-gradient-to-t from-violet-400 to-violet-300'
                        }`}
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs ${isPeak ? 'text-emerald-700 font-bold' : 'text-gray-600'}`}>
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

  const Navigation = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div onClick={() => setActiveSection('hero')} className="flex items-center gap-2 cursor-pointer">
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
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
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

