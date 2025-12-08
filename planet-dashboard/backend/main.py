# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from astropy.coordinates import EarthLocation, AltAz, get_body
from astropy.time import Time
import astropy.units as u
from datetime import datetime
from astropy.coordinates import solar_system_ephemeris, get_body_barycentric_posvel
import math


app = FastAPI()

# Allow requests from a browser (localhost front-end)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # in dev, allow everything
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


PLANETS = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"]


@app.get("/solar_system")
def solar_system():
    """
    Return heliocentric-ish positions of planets in AU in a 2D plane.
    We use barycentric coordinates (close enough for a visualisation).
    """
    t = Time(datetime.utcnow())

    bodies = ["mercury", "venus", "earth", "mars", "jupiter", "saturn","uranus", "neptune"]

    data = []
    # Use a JPL ephemeris for accurate positions
    with solar_system_ephemeris.set("builtin"):
        for name in bodies:
            pos, vel = get_body_barycentric_posvel(name, t)
            # Cartesian position in AU
            x = pos.x.to(u.au).value
            y = pos.y.to(u.au).value
            z = pos.z.to(u.au).value
            r = math.sqrt(x**2 + y**2 + z**2)

            data.append({
                "name": name.capitalize(),
                "x": x,
                "y": y,
                "z": z,
                "r": r,
            })

    return {
        "time_utc": t.isot,
        "bodies": data,
    }


@app.get("/planets")
def planets_now(lat: float = 55.9533, lon: float = -3.1883):
    """
    lat, lon come from query params, e.g. /planets?lat=51.5&lon=-0.12
    Defaults are Edinburgh if none are provided.
    """
    print("DEBUG planets_now called with lat=", lat, "lon=", lon) 
    location = EarthLocation(
        lat=lat * u.deg,
        lon=lon * u.deg,
        height=50 * u.m,
    )

    t = Time(datetime.utcnow())
    frame = AltAz(obstime=t, location=location)

    data = []
    for name in PLANETS:
        body_altaz = get_body(name, t, location).transform_to(frame)
        data.append({
            "name": name.capitalize(),
            "alt": float(body_altaz.alt.deg),
            "az": float(body_altaz.az.deg),
            "visible": bool(body_altaz.alt.deg > 0),
        })

    return {
        "time_utc": t.isot,
        "lat": lat,
        "lon": lon,
        "planets": data,
    }

