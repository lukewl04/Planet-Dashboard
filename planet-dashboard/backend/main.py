# backend/main.py
from datetime import datetime, timezone
import math

import astropy.units as u
from astropy.coordinates import (
    AltAz,
    EarthLocation,
    get_body,
    get_body_barycentric_posvel,
    solar_system_ephemeris,
)
from astropy.time import Time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Planet Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev only — lock this down in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PLANETS = ("mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune")
SOLAR_SYSTEM_BODIES = ("mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune")

DEFAULT_LAT = 55.9533  # Edinburgh
DEFAULT_LON = -3.1883
DEFAULT_HEIGHT_M = 50


def now_utc() -> Time:
    return Time(datetime.now(timezone.utc))


def to_location(lat: float, lon: float, height_m: float = DEFAULT_HEIGHT_M) -> EarthLocation:
    return EarthLocation(lat=lat * u.deg, lon=lon * u.deg, height=height_m * u.m)


@app.get("/solar_system")
def solar_system():
    """Return barycentric planet positions (AU) for a simple solar system visualisation."""
    t = now_utc()
    bodies = []

    # "builtin" is fine for a visualisation; switch to a JPL ephemeris if you need higher accuracy
    with solar_system_ephemeris.set("builtin"):
        for name in SOLAR_SYSTEM_BODIES:
            pos, _vel = get_body_barycentric_posvel(name, t)

            x = pos.x.to_value(u.au)
            y = pos.y.to_value(u.au)
            z = pos.z.to_value(u.au)
            r = math.sqrt(x * x + y * y + z * z)

            bodies.append(
                {
                    "name": name.capitalize(),
                    "x": x,
                    "y": y,
                    "z": z,
                    "r": r,
                }
            )

    return {"time_utc": t.isot, "bodies": bodies}


@app.get("/planets")
def planets_now(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON):
    """Return current planet alt/az for a given lat/lon (defaults to Edinburgh)."""
    t = now_utc()
    location = to_location(lat, lon)
    frame = AltAz(obstime=t, location=location)

    planets = []
    for name in PLANETS:
        altaz = get_body(name, t, location).transform_to(frame)
        alt = float(altaz.alt.deg)
        az = float(altaz.az.deg)

        planets.append(
            {
                "name": name.capitalize(),
                "alt": alt,
                "az": az,
                "visible": alt > 0.0,
            }
        )

    return {"time_utc": t.isot, "lat": lat, "lon": lon, "planets": planets}
