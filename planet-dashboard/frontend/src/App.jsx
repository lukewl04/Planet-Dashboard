import { useEffect, useMemo, useState } from "react";
import SolarSystem from "./SolarSystem";
import "./themes.css";

const CITIES = [
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Washington D.C.", lat: 38.9072, lon: -77.0369 },
  { name: "Cairo", lat: 30.0444, lon: 31.2357 },
  { name: "Glasgow", lat: 55.8642, lon: -4.2518 },
  { name: "Wellington (NZ)", lat: -41.2865, lon: 174.7762 },
];

const API_BASE = "http://127.0.0.1:8000";

const planetAccent = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("mercury")) return { glow: "glow-cyan", dot: "dot-cyan" };
  if (n.includes("venus")) return { glow: "glow-amber", dot: "dot-amber" };
  if (n.includes("mars")) return { glow: "glow-red", dot: "dot-red" };
  if (n.includes("jupiter")) return { glow: "glow-orange", dot: "dot-orange" };
  if (n.includes("saturn")) return { glow: "glow-gold", dot: "dot-gold" };
  if (n.includes("uranus")) return { glow: "glow-sky", dot: "dot-sky" };
  if (n.includes("neptune")) return { glow: "glow-blue", dot: "dot-blue" };
  return { glow: "glow-purple", dot: "dot-purple" };
};

const formatTelemetry = (data) =>
  `UTC ${data.time_utc}  •  LAT ${data.lat.toFixed(4)}  •  LON ${data.lon.toFixed(4)}`;

function App() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [timeText, setTimeText] = useState("");
  const [planets, setPlanets] = useState([]);

  const visibleCount = useMemo(
    () => planets.filter((p) => p.visible).length,
    [planets]
  );

  useEffect(() => {
    let cancelled = false;

    const loadPlanets = async () => {
      try {
        const { lat, lon } = selectedCity;
        const res = await fetch(`${API_BASE}/planets?lat=${lat}&lon=${lon}`);
        const data = await res.json();

        if (cancelled) return;
        setTimeText(formatTelemetry(data));
        setPlanets(Array.isArray(data.planets) ? data.planets : []);
      } catch (err) {
        console.error("Error loading planets:", err);
        if (cancelled) return;
        setTimeText("Telemetry link lost. Retrying...");
        setPlanets([]);
      }
    };

    loadPlanets();
    const id = setInterval(loadPlanets, 60_000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedCity]);

  const handleCityChange = (e) => {
    const [latStr, lonStr] = e.target.value.split(",");
    const option = e.target.options[e.target.selectedIndex];

    setSelectedCity({
      name: option.text,
      lat: Number(latStr),
      lon: Number(lonStr),
    });
  };

  const handlePlanetClick = (p) => {
    const text = `${p.name} is at altitude ${p.alt.toFixed(0)} degrees`;
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  return (
    <div className="space-app">
      {/* Fixed background layers */}
      <div className="space-bg" />
      <div className="stars" />
      <div className="stars stars2" />
      <div className="vignette" />

      {/* UI content */}
      <div className="space-content">
        <div className="container-fluid py-4">
          <div className="container">
            <header className="mb-4 text-center">
              <div className="badge hud-badge mb-2">ORBITAL TELEMETRY</div>
              <h1 className="hud-title mb-1">Planet Tracker</h1>
              <div className="hud-sub">
                Mission target:{" "}
                <span className="hud-highlight">{selectedCity.name}</span>
                {" • "}
                Visible bodies:{" "}
                <span className="hud-highlight">{visibleCount}</span>
              </div>
            </header>

            <div className="row justify-content-center g-4">
              {/* Mission Control */}
              <section className="col-md-6 col-lg-5">
                <div className="hud-card h-100">
                  <div className="hud-card-header">
                    <div className="hud-chip">MISSION CONTROL</div>
                    <div className="hud-line" />
                  </div>

                  <div className="hud-card-body">
                    <label htmlFor="city" className="hud-label">
                      Ground Station
                    </label>

                    <select
                      id="city"
                      className="hud-select"
                      onChange={handleCityChange}
                      value={`${selectedCity.lat},${selectedCity.lon}`}
                    >
                      {CITIES.map((city) => (
                        <option
                          key={city.name}
                          value={`${city.lat},${city.lon}`}
                        >
                          {city.name}
                        </option>
                      ))}
                    </select>

                    <div className="hud-telemetry mt-3">
                      <div className="hud-telemetry-dot" />
                      <div className="hud-telemetry-text">
                        {timeText || "Linking to ephemeris..."}
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between mt-4 mb-2">
                      <h2 className="hud-section-title m-0">Planet Positions</h2>
                      <span className="hud-small">tap to speak</span>
                    </div>

                    {planets.length === 0 ? (
                      <div className="hud-empty">
                        <div className="spinner" />
                        <div className="hud-empty-text">
                          Awaiting telemetry...
                        </div>
                      </div>
                    ) : (
                      <div className="hud-list">
                        {planets.map((p) => {
                          const { glow, dot } = planetAccent(p.name);
                          return (
                            <button
                              key={p.name}
                              className={`hud-item ${glow}`}
                              onClick={() => handlePlanetClick(p)}
                              type="button"
                            >
                              <div className="d-flex align-items-start gap-3">
                                <div className={`hud-dot ${dot}`} />
                                <div className="flex-grow-1">
                                  <div
                                    className={`hud-item-title ${
                                      p.visible ? "is-visible" : ""
                                    }`}
                                  >
                                    {p.name}
                                  </div>
                                  <div className="hud-item-meta">
                                    ALT {p.alt.toFixed(2)}°{" "}
                                    <span className="hud-meta-divider">•</span>{" "}
                                    AZ {p.az.toFixed(2)}°
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`hud-pill ${
                                  p.visible ? "pill-ok" : "pill-off"
                                }`}
                              >
                                {p.visible ? "IN VIEW" : "BELOW HORIZON"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Simulation Bay */}
              <section className="col-md-6 col-lg-5">
                <div className="hud-card h-100">
                  <div className="hud-card-header">
                    <div className="hud-chip">SIMULATION BAY</div>
                    <div className="hud-line" />
                  </div>

                  <div className="hud-card-body d-flex flex-column align-items-center justify-content-center">
                    <div className="hud-frame w-100">
                      <SolarSystem />
                    </div>

                    <div className="hud-small mt-3 text-center">
                      Tip: match the “IN VIEW” planets with your local sky.
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
