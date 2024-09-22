"use client";

import { MapPageComponent } from "@/components/map-page";
import { useEffect, useState } from "react";

export default function Home() {
  const [lng, setLng] = useState<number | null>(null);
  const [lat, setLat] = useState<number | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      setLng(position.coords.longitude);
      setLat(position.coords.latitude);
    })
  }, []);

  return (
    <>
      {lng && lat && <MapPageComponent
        initialLng={lng}
        initialLat={lat}
        initialZoom={9}
      />}
    </>
  );
}
