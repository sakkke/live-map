'use client'

import React, { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { ZoomIn, ZoomOut, Maximize, Layers } from 'lucide-react'
import { Button } from "@/components/ui/button"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

const INITIAL_LNG = -70.9
const INITIAL_LAT = 42.35
const INITIAL_ZOOM = 9

export function MapPageComponent() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [lng, setLng] = useState(INITIAL_LNG)
  const [lat, setLat] = useState(INITIAL_LAT)
  const [zoom, setZoom] = useState(INITIAL_ZOOM)

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

    const resizeMap = () => {
      map.current.resize()
    }
    window.addEventListener('resize', resizeMap)

    return () => {
      map.current.remove()
      window.removeEventListener('resize', resizeMap)
    }
  }, [])

  const handleZoomIn = () => {
    map.current.zoomIn()
  }

  const handleZoomOut = () => {
    map.current.zoomOut()
  }

  const handleResetView = () => {
    map.current.flyTo({
      center: [INITIAL_LNG, INITIAL_LAT],
      zoom: INITIAL_ZOOM
    })
  }

  const handleToggleLayer = () => {
    const currentStyle = map.current.getStyle().name
    const newStyle = currentStyle === 'Mapbox Streets' 
      ? 'mapbox://styles/mapbox/satellite-v9'
      : 'mapbox://styles/mapbox/streets-v11'
    map.current.setStyle(newStyle)
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="flex-grow relative">
        <div ref={mapContainer} className="h-full w-full" />
        <div className="absolute top-0 left-0 m-4 bg-white bg-opacity-80 p-2 rounded">
          Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
        </div>
      </div>
      <div className="bg-gray-100 p-4 flex justify-center space-x-4">
        <Button onClick={handleZoomIn} variant="outline" size="icon">
          <ZoomIn className="h-4 w-4" />
          <span className="sr-only">Zoom In</span>
        </Button>
        <Button onClick={handleZoomOut} variant="outline" size="icon">
          <ZoomOut className="h-4 w-4" />
          <span className="sr-only">Zoom Out</span>
        </Button>
        <Button onClick={handleResetView} variant="outline" size="icon">
          <Maximize className="h-4 w-4" />
          <span className="sr-only">Reset View</span>
        </Button>
        <Button onClick={handleToggleLayer} variant="outline" size="icon">
          <Layers className="h-4 w-4" />
          <span className="sr-only">Toggle Layer</span>
        </Button>
      </div>
    </div>
  )
}
