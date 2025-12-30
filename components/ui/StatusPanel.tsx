'use client';

import { useAudioStore } from '@/store/audioStore';

/**
 * LoadingSkeleton Component
 * Displays a pulsing skeleton during data loading
 */
function LoadingSkeleton() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-3 p-6"
      role="status"
      aria-label="Loading space weather data"
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          Awaiting Telemetry...
        </span>
      </div>
      {/* Skeleton content */}
      <div className="w-full space-y-3">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-4 skeleton rounded w-1/2" />
        <div className="h-4 skeleton rounded w-2/3" />
      </div>
    </div>
  );
}

/**
 * KpIndexBar Component
 * Visual bar chart for Kp index with color coding
 */
function KpIndexBar({ value }: { value: number }) {
  return (
    <div
      className="flex gap-0.5 h-1.5 w-full"
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={9}
      aria-label={`Kp index: ${value.toFixed(1)} out of 9`}
    >
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm transition-colors ${i <= value
              ? i >= 5 ? 'bg-red-500' : i >= 4 ? 'bg-yellow-500' : 'bg-white'
              : 'bg-[#1a1a1a]'
            }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function StatusPanel() {
  const { spaceWeatherData, isLoading, error } = useAudioStore();

  if (isLoading && !spaceWeatherData) {
    return <LoadingSkeleton />;
  }

  if (error && !spaceWeatherData) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-center p-6 gap-2"
        role="alert"
      >
        <span className="text-red-400 text-xs font-mono">Connection Error</span>
        <span className="text-zinc-600 text-[10px]">{error}</span>
      </div>
    );
  }

  if (!spaceWeatherData) return null;

  const { solar_wind, geomagnetic, flares } = spaceWeatherData;

  // Determine storm severity for labels
  const getStormSeverity = (kp: number): string => {
    if (kp >= 7) return 'Severe Storm';
    if (kp >= 5) return 'Storm Active';
    if (kp >= 4) return 'Unsettled';
    return 'Quiet';
  };

  return (
    <div className="flex flex-col gap-4 h-full" role="region" aria-label="Space Weather Telemetry">

      {/* Solar Wind Section */}
      <article className="sx-panel" aria-labelledby="solar-wind-title">
        <div className="sx-panel-header">
          <span id="solar-wind-title" className="sx-panel-title">Solar Wind</span>
          <div className="flex items-center gap-1.5">
            <div className="status-dot active" aria-hidden="true" />
            <span className="text-[9px] text-zinc-500 font-mono">DSCOVR</span>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div className="flex justify-between items-baseline">
            <span className="sx-label">Velocity</span>
            <div className="text-right">
              <span
                className="sx-value-large"
                aria-label={`Solar wind velocity: ${solar_wind.speed.toFixed(0)} kilometers per second`}
              >
                {solar_wind.speed.toFixed(0)}
              </span>
              <span className="text-xs text-secondary ml-1">km/s</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#1a1a1a]">
            <div>
              <span className="sx-label block mb-1">Density</span>
              <span className="text-lg font-mono">{solar_wind.density.toFixed(1)}</span>
              <span className="text-[10px] text-secondary ml-1">p/cm³</span>
            </div>
            <div>
              <span className="sx-label block mb-1">Temp</span>
              <span className="text-lg font-mono">{(solar_wind.temperature / 1000).toFixed(0)}k</span>
              <span className="text-[10px] text-secondary ml-1">K</span>
            </div>
          </div>
        </div>
      </article>

      {/* Geomagnetic Section */}
      <article className="sx-panel" aria-labelledby="geomagnetic-title">
        <div className="sx-panel-header">
          <span id="geomagnetic-title" className="sx-panel-title">Geomagnetic</span>
          <span className="text-[9px] text-zinc-500 font-mono">NOAA SWPC</span>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <span className="sx-label block mb-1">Kp Index</span>
            <div className="flex items-baseline">
              <span
                className="text-2xl font-light"
                aria-label={`Kp index: ${geomagnetic.kp_index.toFixed(1)}`}
              >
                {geomagnetic.kp_index.toFixed(1)}
              </span>
              <span className="text-xs text-zinc-600 ml-1">/9</span>
            </div>
          </div>
          <div>
            <span className="sx-label block mb-1">Storm Status</span>
            <span
              className={`text-sm font-bold uppercase tracking-wider ${geomagnetic.kp_index >= 5 ? 'text-red-500 text-glow' : 'text-white'
                }`}
              role="status"
              aria-label={`Storm status: ${getStormSeverity(geomagnetic.kp_index)}`}
            >
              {geomagnetic.storm_level}
            </span>
          </div>
        </div>
        {/* Kp Bar Graph Visualization */}
        <div className="px-4 pb-4">
          <KpIndexBar value={geomagnetic.kp_index} />
        </div>
      </article>

      {/* Solar Flares List */}
      <article className="sx-panel flex-1 flex flex-col min-h-0" aria-labelledby="flares-title">
        <div className="sx-panel-header">
          <span id="flares-title" className="sx-panel-title">Solar Events (24h)</span>
          <span className="text-xs font-mono" aria-label={`${flares.length} solar events detected`}>
            {flares.length}
          </span>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar">
          {flares.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-600 font-mono">
              NO SIGNIFICANT FLARES DETECTED IN LAST 24H
            </div>
          ) : (
            <ul role="list" aria-label="Solar flare events">
              {flares.map((flare) => (
                <li
                  key={flare.id}
                  className="flex items-center justify-between p-2 bg-[#0c0c0c] border border-transparent hover:border-[#262626] transition-colors rounded-sm"
                >
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-bold font-mono ${flare.classType === 'X' ? 'text-red-500' :
                          flare.classType === 'M' ? 'text-yellow-500' : 'text-zinc-400'
                        }`}
                      aria-label={`${flare.classType}-class ${flare.magnitude.toFixed(1)} flare`}
                    >
                      {flare.classType}{flare.magnitude.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-zinc-600">{flare.sourceRegion}</span>
                  </div>
                  <time
                    className="text-[9px] font-mono text-zinc-500"
                    dateTime={flare.peakTime}
                  >
                    {new Date(flare.peakTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>
    </div>
  );
}