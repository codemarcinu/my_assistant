import React from 'react';

// src/components/WeatherCard.tsx
type WeatherCardProps = {
  location: string;
  temp: number;
  condition: string;
  forecast: string;
};

// Komponent wyświetlający kartę pogody.
const WeatherCard: React.FC<WeatherCardProps> = ({ location, temp, condition, forecast }) => {
  const icons: Record<string, string> = {
    Clear: "☀️",
    Clouds: "☁️",
    Rain: "🌧️",
    Snow: "❄️",
  };

  const icon = icons[condition] || "🌤️"; // Domyślna ikona, jeśli warunek nieznany

  return (
    <div className="bg-cosmic-primary-container-bg rounded-xl p-6 shadow-xl flex flex-col space-y-3 border border-cosmic-neutral-3 dark:bg-cosmic-neutral-9 dark:text-cosmic-bg dark:border-cosmic-neutral-8 transition-colors duration-300">
      <div className="flex justify-between items-center">
        <div className="text-2xl font-semibold text-cosmic-accent dark:text-cosmic-ext-blue">{location}</div>
        <div className="text-4xl">{icon} {temp}°C</div>
      </div>
      <div className="text-cosmic-neutral-8 text-lg dark:text-cosmic-neutral-3">{condition}</div>
      <div className="text-cosmic-neutral-7 text-md dark:text-cosmic-neutral-4">{forecast}</div>
    </div>
  );
};

export default WeatherCard; 