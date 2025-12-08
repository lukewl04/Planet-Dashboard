import { useEffect, useState } from "react";
import "./solar-system.css";

function SolarSystem() {
  const [bodies, setBodies] = useState([]);
  const [timeText, setTimeText] = useState("");

  useEffect(() => {
    const loadSolarSystem = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/solar_system");
        const data = await res.json();
        setBodies(data.bodies);
        setTimeText(data.time_utc);
      } catch (err) {
        console.error("Error loading solar system data:", err);
      }
    };

    loadSolarSystem();
    const intervalId = setInterval(loadSolarSystem, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  if (!bodies.length) {
    return (
      <div className="solar-system-wrapper">
        <p className="text-muted small mb-0">Loading solar system...</p>
      </div>
    );
  }

  const size = 320;
  const center = size / 2;

  // Compute nice evenly spaced radii so everything stays inside the disc
  const maxRadius = 140; // max usable radius in px ( < size/2 )
  const bodiesWithRadius = bodies.map((b, index) => {
    // index 0..N-1 → radii like ~20,40,60,... inside maxRadius
    const radiusPx =
      maxRadius * ((index + 1) / (bodies.length + 1));
    return { ...b, radiusPx };
  });

  return (
    <div className="solar-system-wrapper">
      <h2 className="h6 mb-1 text-center">Solar system (top-down)</h2>
      <p className="text-muted small text-center mb-2">
        Ephemeris time: {timeText}
      </p>

      <div className="solar-system">
        <div className="sun" />

        {/* Orbits */}
        {bodiesWithRadius.map((b) => (
          <div
            key={b.name + "-orbit"}
            className="orbit-circle"
            style={{
              width: b.radiusPx * 2,
              height: b.radiusPx * 2,
              left: center - b.radiusPx,
              top: center - b.radiusPx,
            }}
          />
        ))}

        {/* Planets – angle from real data, radius from our pretty spacing */}
        {bodiesWithRadius.map((b) => {
          const theta = Math.atan2(b.y, b.x); // real angle from ephemeris
          const left = center + b.radiusPx * Math.cos(theta);
          const top = center - b.radiusPx * Math.sin(theta);

          return (
            <div
              key={b.name}
              className={`planet-dot planet-${b.name.toLowerCase()}`}
              style={{ left, top }}
              title={`${b.name} (r=${b.r.toFixed(2)} AU)`}
            />
          );
        })}
      </div>

      <div className="solar-legend mt-2">
        {bodiesWithRadius.map((b) => (
          <span key={b.name} className="legend-item">
            <span className={`legend-dot planet-${b.name.toLowerCase()}`} />
            {b.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default SolarSystem;
