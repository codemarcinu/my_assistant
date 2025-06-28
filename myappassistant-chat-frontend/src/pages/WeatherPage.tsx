import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Thermometer, Droplets, Wind, Sun, Cloud, CloudRain, CloudSnow } from 'lucide-react';
import { weatherAPI } from '../services/api';
import type { WeatherData, WeatherForecast } from '../types';

const WeatherPage: React.FC = () => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState('Warszawa');

  // Load weather data
  const loadWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load current weather
      const currentResponse = await weatherAPI.getCurrentWeather(location);
      setCurrentWeather(currentResponse.data);

      // Load forecast
      const forecastResponse = await weatherAPI.getForecast(location, 7);
      setForecast(forecastResponse.data.forecast || []);
    } catch (err) {
      setError('Błąd podczas ładowania danych pogodowych');
      console.error('Failed to load weather data:', err);
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    loadWeatherData();
  }, [loadWeatherData]);

  // Get weather icon based on condition
  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('sun') || conditionLower.includes('clear')) {
      return <Sun className="w-8 h-8 text-yellow-500" />;
    } else if (conditionLower.includes('cloud')) {
      return <Cloud className="w-8 h-8 text-gray-500" />;
    } else if (conditionLower.includes('rain')) {
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    } else if (conditionLower.includes('snow')) {
      return <CloudSnow className="w-8 h-8 text-blue-300" />;
    } else {
      return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  // Format date
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pl-PL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(dateObj);
  };

  // Format temperature
  const formatTemperature = (temp: number) => {
    return `${Math.round(temp)}°C`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Ładowanie danych pogodowych...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Pogoda
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Sprawdź aktualną pogodę i prognozę dla swojej lokalizacji.
        </p>
      </div>

      {/* Location Input */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Wprowadź lokalizację..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && loadWeatherData()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={loadWeatherData}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Szukaj
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Current Weather */}
      {currentWeather && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Main Weather Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {currentWeather.location}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {formatDate(new Date())}
                </p>
              </div>
              {getWeatherIcon(currentWeather.condition)}
            </div>
            
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {formatTemperature(currentWeather.temperature)}
              </div>
              <p className="text-gray-600 dark:text-gray-400 capitalize">
                {currentWeather.condition}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Wilgotność: {currentWeather.humidity}%
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Wind className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Wiatr: {currentWeather.windSpeed} km/h
                </span>
              </div>
            </div>
          </div>

          {/* Weather Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Szczegóły pogody
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Thermometer className="w-5 h-5 text-red-500" />
                  <span className="text-gray-700 dark:text-gray-300">Temperatura</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatTemperature(currentWeather.temperature)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">Wilgotność</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {currentWeather.humidity}%
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Wind className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Prędkość wiatru</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {currentWeather.windSpeed} km/h
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Lokalizacja</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {currentWeather.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weather Forecast */}
      {forecast.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            7-dniowa prognoza
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            {forecast.map((day, index) => (
              <div
                key={index}
                className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {formatDate(day.date)}
                </p>
                
                <div className="flex justify-center mb-2">
                  {getWeatherIcon(day.condition)}
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 capitalize">
                  {day.condition}
                </p>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatTemperature(day.temperature.max)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTemperature(day.temperature.min)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather Tips */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          💡 Wskazówki pogodowe
        </h3>
        <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
          {currentWeather && (
            <>
              {currentWeather.temperature > 25 && (
                <p>• Wysoka temperatura - pamiętaj o nawodnieniu i lekkich posiłkach</p>
              )}
              {currentWeather.temperature < 5 && (
                <p>• Niska temperatura - rozgrzewające posiłki będą idealne</p>
              )}
              {currentWeather.humidity > 80 && (
                <p>• Wysoka wilgotność - produkty mogą szybciej się psuć</p>
              )}
              {currentWeather.condition.toLowerCase().includes('rain') && (
                <p>• Deszczowa pogoda - idealny czas na gorące zupy i herbatę</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherPage;
