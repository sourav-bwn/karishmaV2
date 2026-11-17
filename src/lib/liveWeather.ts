/* ------------------------------------------------------------------ *
 * Live weather via free, key-less APIs:
 *  - Open-Meteo forecast API (weather, UV, sunset, 5-day forecast)
 *  - Open-Meteo air-quality API (US AQI)
 *  - Open-Meteo geocoding API (city search)
 *  - BigDataCloud reverse-geocode-client (place name from coords)
 *
 * Privacy: the user's coordinates are only ever sent to these public
 * weather services directly from their browser. They are never sent
 * to our own server and never stored anywhere except the browser's
 * own localStorage (as the "last known location" fallback).
 * ------------------------------------------------------------------ */

export interface LiveWeather {
  placeName: string; // e.g. "Dostipur, West Bengal"
  tempC: number;
  condition: string;
  icon: "sun" | "cloud" | "rain";
  humidity: number;
  windKm: number;
  aqi: number | null; // US AQI, null when the air-quality service has no data
  uv: number | null;
  sunset: string; // "5:18 PM"
  advice: string;
  forecast: { day: string; tempC: number; icon: "sun" | "cloud" | "rain" }[];
}

export interface GeoPoint {
  lat: number;
  lon: number;
}

const LAST_LOCATION_KEY = "karishma.lastLocation.v1";

export function loadLastLocation(): (GeoPoint & { name: string }) | null {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.lat === "number" &&
      typeof parsed?.lon === "number" &&
      typeof parsed?.name === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLastLocation(loc: GeoPoint & { name: string }): void {
  try {
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(loc));
  } catch {
    /* private mode etc. - fine, no fallback */
  }
}

/* Ask the browser for the user's exact position. */
export function getBrowserPosition(timeoutMs = 12000): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 10 * 60 * 1000 }
    );
  });
}

/* Place name for coordinates (free client-side reverse geocoding). */
export async function reverseGeocode(p: GeoPoint): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${p.lat}&longitude=${p.lon}&localityLanguage=en`
    );
    if (!res.ok) throw new Error("reverse geocode failed");
    const j = await res.json();
    const parts = [j.city || j.locality, j.principalSubdivision, j.countryName].filter(
      (s) => typeof s === "string" && s.trim().length > 0
    );
    if (parts.length === 0) throw new Error("empty");
    // De-duplicate (city sometimes equals subdivision)
    const unique = parts.filter((s, i) => parts.indexOf(s) === i);
    return unique.join(", ");
  } catch {
    return `${p.lat.toFixed(2)}°, ${p.lon.toFixed(2)}°`;
  }
}

export interface CityResult {
  name: string;
  country: string;
  admin1?: string;
  lat: number;
  lon: number;
}

/* Search cities by name (Open-Meteo geocoding, free, no key). */
export async function searchCities(query: string): Promise<CityResult[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
  );
  if (!res.ok) throw new Error("city search failed");
  const j = await res.json();
  const results = Array.isArray(j.results) ? j.results : [];
  return results.map((r: any) => ({
    name: r.name,
    country: r.country || "",
    admin1: r.admin1,
    lat: r.latitude,
    lon: r.longitude,
  }));
}

/* WMO weather-code -> friendly condition + icon bucket. */
function describeWeatherCode(code: number, isDay: boolean): { condition: string; icon: "sun" | "cloud" | "rain" } {
  if (code === 0) return { condition: isDay ? "Clear & Sunny" : "Clear Night Sky", icon: "sun" };
  if (code === 1) return { condition: "Mostly Clear", icon: "sun" };
  if (code === 2) return { condition: "Partly Cloudy", icon: "cloud" };
  if (code === 3) return { condition: "Overcast", icon: "cloud" };
  if (code === 45 || code === 48) return { condition: "Foggy", icon: "cloud" };
  if (code >= 51 && code <= 57) return { condition: "Light Drizzle", icon: "rain" };
  if (code >= 61 && code <= 67) return { condition: code >= 65 ? "Heavy Rain" : "Rainy", icon: "rain" };
  if (code >= 71 && code <= 77) return { condition: "Snowfall", icon: "rain" };
  if (code >= 80 && code <= 82) return { condition: "Rain Showers", icon: "rain" };
  if (code === 85 || code === 86) return { condition: "Snow Showers", icon: "rain" };
  if (code >= 95) return { condition: "Thunderstorm", icon: "rain" };
  return { condition: "Changing Skies", icon: "cloud" };
}

function aqiLabel(aqi: number): string {
  if (aqi <= 50) return "Good • Clean";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function uvLabel(uv: number): string {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

export function aqiCaption(aqi: number | null): string {
  return aqi == null ? "No data nearby" : aqiLabel(aqi);
}

export function uvCaption(uv: number | null): string {
  return uv == null ? "No data" : uvLabel(uv);
}

function buildAdvice(w: { tempC: number; icon: string; humidity: number; windKm: number; aqi: number | null; uv: number | null }, place: string): string {
  const bits: string[] = [];
  if (w.tempC >= 35) bits.push("It's very hot in " + place + " - stay hydrated and avoid the afternoon sun.");
  else if (w.tempC >= 28) bits.push("Warm weather in " + place + " - light cotton clothes and plenty of water will keep you comfortable.");
  else if (w.tempC >= 18) bits.push("Pleasant temperatures in " + place + " - a great time to be out and about.");
  else if (w.tempC >= 8) bits.push("It's cool in " + place + " - keep a light jacket handy.");
  else bits.push("It's cold in " + place + " - layer up and stay warm.");
  if (w.icon === "rain") bits.push("Rain is around, so carry an umbrella before heading out.");
  if (w.uv != null && w.uv >= 6) bits.push("UV is high right now - sunscreen is a good idea.");
  if (w.aqi != null && w.aqi > 100) bits.push("Air quality is not great - consider a mask if you're outside for long.");
  return bits.join(" ") + " ☕✨";
}

function formatSunset(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* Fetch current conditions + forecast for coordinates. Never fabricates:
   if a service fails, the corresponding value is null and the UI says so. */
export async function fetchLiveWeather(p: GeoPoint, placeName: string): Promise<LiveWeather> {
  const wxUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day` +
    `&daily=weather_code,temperature_2m_max,sunset,uv_index_max&timezone=auto&forecast_days=6`;
  const aqUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${p.lat}&longitude=${p.lon}&current=us_aqi`;

  const wxRes = await fetch(wxUrl);
  if (!wxRes.ok) throw new Error("weather fetch failed");
  const wx = await wxRes.json();
  if (!wx?.current || !wx?.daily) throw new Error("bad weather payload");

  // Air quality is best-effort: some coordinates have no coverage.
  let aqi: number | null = null;
  try {
    const aqRes = await fetch(aqUrl);
    if (aqRes.ok) {
      const aq = await aqRes.json();
      if (typeof aq?.current?.us_aqi === "number") aqi = Math.round(aq.current.us_aqi);
    }
  } catch {
    /* leave null - the UI shows "No data nearby" */
  }

  const code: number = wx.current.weather_code ?? 2;
  const isDay = wx.current.is_day !== 0;
  const { condition, icon } = describeWeatherCode(code, isDay);

  const uvToday = typeof wx.daily.uv_index_max?.[0] === "number" ? Math.round(wx.daily.uv_index_max[0]) : null;

  const forecast: LiveWeather["forecast"] = [];
  for (let i = 1; i <= 5 && i < (wx.daily.time?.length || 0); i++) {
    const date = new Date(wx.daily.time[i] + "T12:00:00");
    const fcode = wx.daily.weather_code?.[i] ?? 2;
    forecast.push({
      day: DAY_NAMES[date.getDay()],
      tempC: Math.round(wx.daily.temperature_2m_max[i]),
      icon: describeWeatherCode(fcode, true).icon,
    });
  }

  const core = {
    tempC: Math.round(wx.current.temperature_2m),
    condition,
    icon,
    humidity: Math.round(wx.current.relative_humidity_2m),
    windKm: Math.round(wx.current.wind_speed_10m),
    aqi,
    uv: uvToday,
    sunset: formatSunset(wx.daily.sunset?.[0] || ""),
  };

  return {
    placeName,
    ...core,
    advice: buildAdvice(core, placeName.split(",")[0]),
    forecast,
  };
}
