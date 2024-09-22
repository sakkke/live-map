'use client'

import React, { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

export function MapPageComponent() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [lng, setLng] = useState(-70.9)
  const [lat, setLat] = useState(42.35)
  const [zoom, setZoom] = useState(9)

  useEffect(() => {
    if (map.current) return // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom
    })

    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4))
      setLat(map.current.getCenter().lat.toFixed(4))
      setZoom(map.current.getZoom().toFixed(2))
    })

    // Ensure map fills the container on window resize
    const resizeMap = () => {
      map.current.resize()
    }
    window.addEventListener('resize', resizeMap)

    return () => {
      map.current.remove()
      window.removeEventListener('resize', resizeMap)
    }
  }, [])

  return (
    <div className="h-screen w-screen relative">
      <div ref={mapContainer} className="h-full w-full" />
      <div className="absolute top-0 left-0 m-4 bg-white bg-opacity-80 p-2 rounded">
        Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
      </div>
    </div>
  )
}
