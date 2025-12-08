import { useEffect, useState } from "react";
import SolarSystem from "./SolarSystem";

const CITIES = [
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "London", lat: 51.5074, lon: -0.1278 },
  { name: "Washington D.C.", lat: 38.9072, lon: -77.0369 },
  { name: "Cairo", lat: 30.0444, lon: 31.2357 },
  { name: "Glasgow", lat: 55.8642, lon: -4.2518 },
  { name: "Wellington (NZ)", lat: -41.2865, lon: 174.7762 },
];

function App() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [timeText, setTimeText] = useState("");
  const [planets, setPlanets] = useState([]);

  const loadPlanets = async (city = selectedCity) => {
    try {
      const { lat, lon } = city;
      const url = `http://127.0.0.1:8000/planets?lat=${lat}&lon=${lon}`;
      console.log("Requesting:", url);

      const res = await fetch(url);
      const data = await res.json();

      setTimeText(
        `Time (UTC): ${data.time_utc} | Lat: ${data.lat.toFixed(
          4
        )}, Lon: ${data.lon.toFixed(4)}`
      );
      setPlanets(data.planets);
    } catch (err) {
      console.error("Error loading planets:", err);
      setTimeText("Failed to load data.");
      setPlanets([]);
    }
  };

  useEffect(() => {
    loadPlanets(selectedCity);

    const intervalId = setInterval(() => {
      loadPlanets(selectedCity);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [selectedCity]);

  const handleCityChange = (e) => {
    const [latStr, lonStr] = e.target.value.split(",");
    const city = {
      name: e.target.options[e.target.selectedIndex].text,
      lat: parseFloat(latStr),
      lon: parseFloat(lonStr),
    };
    setSelectedCity(city);
  };

  const handlePlanetClick = (p) => {
    const text = `${p.name} is at altitude ${p.alt.toFixed(0)} degrees`;
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };



  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        {/* Left column: Planet tracker */}
        <div className="col-md-6 col-lg-5 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h1 className="h3 mb-3 text-center">Planet Tracker</h1>

              <div className="mb-3">
                <label htmlFor="city" className="form-label">
                  City
                </label>
                <select
                  id="city"
                  className="form-select"
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
              </div>

              <p className="text-muted small">{timeText || "Loading..."}</p>

              <h2 className="h6 mt-3 mb-2">Planet positions</h2>

              {planets.length === 0 ? (
                <p className="text-muted">No data yet.</p>
              ) : (
                <ul className="list-group">
                  {planets.map((p) => (
                    <button
                      key={p.name}
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
                      onClick={() => handlePlanetClick(p)}
                    >
                      <div>
                        <div
                          className={
                            "fw-semibold" + (p.visible ? " text-success" : "")
                          }
                        >
                          {p.name}
                        </div>
                        <div className="small text-muted">
                          alt={p.alt.toFixed(2)}°, az={p.az.toFixed(2)}°
                        </div>
                      </div>
                      <span
                        className={
                          "badge rounded-pill " +
                          (p.visible ? "bg-success" : "bg-secondary")
                        }
                      >
                        {p.visible ? "Visible" : "Below horizon"}
                      </span>
                    </button>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Solar system visualisation */}
        <div className="col-md-6 col-lg-5 mb-4">
          <div className="card shadow-sm h-100 d-flex align-items-center justify-content-center">
            <div className="card-body d-flex flex-column align-items-center">
              <SolarSystem />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}

export default App;
