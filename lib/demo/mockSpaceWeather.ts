/**
 * Mock Space Weather Data
 * Provides realistic demo data for testing and fallback scenarios
 */

import type { SpaceWeatherData, SolarFlare, GeomagneticData, SolarWind } from '@/types/nasa';

/**
 * Generate mock solar wind data with realistic variation
 */
function generateMockSolarWind(): SolarWind {
  // Typical solar wind ranges with some randomness
  const baseSpeed = 400;
  const speedVariation = Math.random() * 200 - 100; // ±100 km/s
  
  return {
    speed: Math.round(baseSpeed + speedVariation),
    density: Math.round((5 + Math.random() * 10) * 10) / 10, // 5-15 particles/cm³
    temperature: Math.round((100000 + Math.random() * 100000) / 1000) * 1000, // 100k-200k K
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate mock geomagnetic data
 */
function generateMockGeomagnetic(): GeomagneticData {
  // Generate KP index (0-9, most commonly 2-4)
  const kp_index = Math.round(Math.random() * 5 + 1); // 1-6 range
  
  let storm_level = "None";
  if (kp_index >= 5) storm_level = "Minor";
  if (kp_index >= 6) storm_level = "Moderate";
  if (kp_index >= 7) storm_level = "Strong";
  if (kp_index >= 8) storm_level = "Severe";
  
  return {
    kp_index,
    storm_active: kp_index >= 5,
    storm_level,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate mock solar flares for the last 24 hours
 */
function generateMockFlares(): SolarFlare[] {
  const flares: SolarFlare[] = [];
  const now = Date.now();
  const flareCount = Math.floor(Math.random() * 5) + 2; // 2-6 flares
  
  const classTypes: Array<'C' | 'M' | 'X'> = ['C', 'C', 'C', 'M', 'M', 'X']; // C most common
  
  for (let i = 0; i < flareCount; i++) {
    const classType = classTypes[Math.floor(Math.random() * classTypes.length)];
    const magnitude = Math.round((Math.random() * 9 + 1) * 10) / 10; // 1.0-9.9
    
    // Random time in last 24 hours
    const timeOffset = Math.random() * 24 * 60 * 60 * 1000;
    const flareTime = new Date(now - timeOffset);
    const peakTime = new Date(flareTime.getTime() + 1000 * 60 * 15); // Peak 15 min after start
    
    flares.push({
      id: `MOCK-FLR-${Date.now()}-${i}`,
      flareClass: `${classType}${magnitude}`,
      classType,
      magnitude,
      timestamp: flareTime.toISOString(),
      sourceRegion: `AR${Math.floor(Math.random() * 3000 + 1000)}`,
      peakTime: peakTime.toISOString()
    });
  }
  
  // Sort by timestamp (newest first)
  return flares.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Get complete mock space weather data
 */
export function getMockSpaceWeather(): SpaceWeatherData {
  return {
    timestamp: new Date().toISOString(),
    solar_wind: generateMockSolarWind(),
    geomagnetic: generateMockGeomagnetic(),
    flares: generateMockFlares(),
    data_source: 'demo'
  };
}

/**
 * Get static demo data (consistent for testing)
 */
export function getStaticDemoData(): SpaceWeatherData {
  return {
    timestamp: new Date().toISOString(),
    solar_wind: {
      speed: 450,
      density: 8.5,
      temperature: 150000,
      timestamp: new Date().toISOString()
    },
    geomagnetic: {
      kp_index: 4,
      storm_active: false,
      storm_level: "None",
      timestamp: new Date().toISOString()
    },
    flares: [
      {
        id: "DEMO-FLR-001",
        flareClass: "M3.2",
        classType: "M",
        magnitude: 3.2,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sourceRegion: "AR1234",
        peakTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString()
      },
      {
        id: "DEMO-FLR-002",
        flareClass: "C5.7",
        classType: "C",
        magnitude: 5.7,
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        sourceRegion: "AR1234",
        peakTime: new Date(Date.now() - 6 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString()
      },
      {
        id: "DEMO-FLR-003",
        flareClass: "C2.1",
        classType: "C",
        magnitude: 2.1,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        sourceRegion: "AR1235",
        peakTime: new Date(Date.now() - 12 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString()
      }
    ],
    data_source: 'demo'
  };
}