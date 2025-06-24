import React, { useState, useEffect } from 'react';
import { useTheme } from '../../ThemeProvider';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
}

const WEATHER_ICONS: Record<string, string> = {
  'Clear': '☀️',
  'Clouds': '☁️',
  'Rain': '🌧️',
  'Snow': '❄️',
  'Thunderstorm': '⛈️',
  'Drizzle': '🌦️',
  'Mist': '🌫️',
  'Fog': '🌫️',
  'Haze': '🌫️',
  'Smoke': '🌫️',
  'Dust': '🌫️',
  'Sand': '🌫️',
  'Ash': '🌫️',
  'Squall': '💨',
  'Tornado': '🌪️',
};

export default function WeatherWidget() {
  const { resolvedTheme } = useTheme();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        // Mock data for now - replace with actual OpenWeatherMap API call
        const mockWeather: WeatherData = {
          location: 'Warszawa',
          temperature: 23,
          condition: 'Clear',
          description: 'Bezchmurnie',
          humidity: 65,
          windSpeed: 12
        };
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setWeather(mockWeather);
        setError(null);
      } catch (err) {
        setError('Nie udało się pobrać danych pogodowych');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600 dark:text-gray-300">Ładowanie...</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20">
        <span className="text-red-500">⚠️</span>
        <span className="text-sm text-red-600 dark:text-red-400">Błąd pogody</span>
      </div>
    );
  }

  const icon = WEATHER_ICONS[weather.condition] || '🌤️';

  return (
    <div className={`
      flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors
      ${resolvedTheme === 'dark' 
        ? 'bg-gray-700 hover:bg-gray-600' 
        : 'bg-gray-100 hover:bg-gray-200'
      }
    `}>
      {/* Weather Icon */}
      <div className="text-2xl">{icon}</div>
      
      {/* Weather Info */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {weather.temperature}°C
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {weather.location}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {weather.description}
        </span>
      </div>
    </div>
  );
} 