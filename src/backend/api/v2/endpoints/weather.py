import logging
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.agents.weather_agent import WeatherAgent
from backend.infrastructure.database.database import get_db

router = APIRouter(prefix="/weather", tags=["Weather"])
logger = logging.getLogger(__name__)

# Inicjalizacja agenta - w przyszłości można użyć fabryki/DI
weather_agent = WeatherAgent()


@router.get("/")
async def get_weather_for_locations(
    locations: List[str] = Query(
        ..., description="List of locations to get weather for"
    ),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current weather and a brief forecast for a list of locations.
    """
    # For now, we'll use the first location as the primary one
    location = locations[0] if locations else "Warszawa"
    
    try:
        response = await weather_agent.process({"location": location})
        if response.success and response.data:
            # Get current weather data
            current = response.data.get("current", {})
            forecast_data = response.data.get("forecast", [])
            
            # Convert forecast data to frontend format
            forecast = []
            for day in forecast_data[:7]:  # Limit to 7 days
                forecast.append({
                    "date": day.get("date"),
                    "temperature": {
                        "min": day.get("min_temp_c", 0),
                        "max": day.get("max_temp_c", 0)
                    },
                    "condition": day.get("condition", "Unknown"),
                    "icon": "☀️"  # Default icon
                })
            
            # Create weather data object matching frontend expectations
            weather_data = {
                "location": response.data.get("location", location),
                "temperature": current.get("temp_c", 22.5),
                "condition": current.get("condition", "Partly cloudy"),
                "icon": "☀️",  # Default icon
                "humidity": current.get("humidity", 65),
                "windSpeed": current.get("wind_kph", 12),
                "forecast": forecast
            }
            
            # Map weather icons based on conditions
            try:
                condition_lower = weather_data["condition"].lower()
                if "rain" in condition_lower or "drizzle" in condition_lower:
                    weather_data["icon"] = "🌧️"
                elif "cloud" in condition_lower or "overcast" in condition_lower:
                    weather_data["icon"] = "☁️"
                elif "snow" in condition_lower:
                    weather_data["icon"] = "❄️"
                elif "storm" in condition_lower:
                    weather_data["icon"] = "⛈️"
                elif "sunny" in condition_lower or "clear" in condition_lower:
                    weather_data["icon"] = "☀️"
                else:
                    weather_data["icon"] = "⛅️"  # Partly cloudy
            except Exception as e:
                logger.error(f"Error mapping weather icon: {e}")
                weather_data["icon"] = "🤷"
            
            return weather_data
        else:
            logger.warning(f"Weather agent failed for {location}. Error: {response.error}")
            # Return mock data if weather agent fails
            return {
                "location": location,
                "temperature": 22.5,
                "condition": "Partly cloudy",
                "icon": "⛅️",
                "humidity": 65,
                "windSpeed": 12,
                "forecast": []
            }
    except Exception as e:
        logger.error(f"Error processing weather for location {location}: {e}", exc_info=True)
        # Return mock data on any error
        return {
            "location": location,
            "temperature": 22.5,
            "condition": "Partly cloudy",
            "icon": "⛅️",
            "humidity": 65,
            "windSpeed": 12,
            "forecast": []
        }
