'use client'

import React, { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { ZoomIn, ZoomOut, Maximize, Layers, MapPin, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

const INITIAL_LNG = -70.9
const INITIAL_LAT = 42.35
const INITIAL_ZOOM = 9

interface Marker {
  id: string
  lngLat: [number, number]
  text: string
}

export function MapPageComponent() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const [lng, setLng] = useState(INITIAL_LNG)
  const [lat, setLat] = useState(INITIAL_LAT)
  const [zoom, setZoom] = useState(INITIAL_ZOOM)
  const [markers, setMarkers] = useState<Marker[]>([])
  const [newMarkerText, setNewMarkerText] = useState('')
  const [isAddingMarker, setIsAddingMarker] = useState(false)

  useEffect(() => {
    if (map.current) return // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom
    })

    map.current.on('move', () => {
      setLng(Number(map.current!.getCenter().lng.toFixed(4)))
      setLat(Number(map.current!.getCenter().lat.toFixed(4)))
      setZoom(Number(map.current!.getZoom().toFixed(2)))
    })

    const resizeMap = () => {
      map.current!.resize()
    }
    window.addEventListener('resize', resizeMap)

    return () => {
      map.current!.remove()
      window.removeEventListener('resize', resizeMap)
    }
  }, [])

  useEffect(() => {
    if (!map.current) return

    // Remove existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove())
    markersRef.current = {}

    // Add new markers
    markers.forEach(marker => {
      const el = document.createElement('div')
      el.className = 'marker'
      el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      `

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div>
          <p>${marker.text}</p>
          <button class="delete-marker" data-id="${marker.id}">Delete</button>
        </div>
      `)

      const mapboxMarker = new mapboxgl.Marker(el)
        .setLngLat(marker.lngLat)
        .setPopup(popup)
        .addTo(map.current!)

      markersRef.current[marker.id] = mapboxMarker

      popup.on('open', () => {
        const deleteButton = document.querySelector(`.delete-marker[data-id="${marker.id}"]`)
        if (deleteButton) {
          deleteButton.addEventListener('click', () => handleRemoveMarker(marker.id))
        }
      })
    })
  }, [markers])

  const handleZoomIn = () => {
    map.current!.zoomIn()
  }

  const handleZoomOut = () => {
    map.current!.zoomOut()
  }

  const handleResetView = () => {
    map.current!.flyTo({
      center: [INITIAL_LNG, INITIAL_LAT],
      zoom: INITIAL_ZOOM
    })
  }

  const handleToggleLayer = () => {
    const currentStyle = map.current!.getStyle().name
    const newStyle = currentStyle === 'Mapbox Streets' 
      ? 'mapbox://styles/mapbox/satellite-v9'
      : 'mapbox://styles/mapbox/streets-v11'
    map.current!.setStyle(newStyle)
  }

  const handleAddMarker = () => {
    setIsAddingMarker(true)
    const addMarkerListener = (e: mapboxgl.MapMouseEvent & mapboxgl.EventData) => {
      const newMarker: Marker = {
        id: Date.now().toString(),
        lngLat: [e.lngLat.lng, e.lngLat.lat],
        text: newMarkerText || 'New marker'
      }
      setMarkers(prev => [...prev, newMarker])
      setNewMarkerText('')
      setIsAddingMarker(false)
      map.current!.off('click', addMarkerListener)
    }
    map.current!.on('click', addMarkerListener)
  }

  const handleRemoveMarker = (id: string) => {
    setMarkers(prev => prev.filter(marker => marker.id !== id))
    if (markersRef.current[id]) {
      markersRef.current[id].remove()
      delete markersRef.current[id]
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="flex-grow relative">
        <div ref={mapContainer} className="h-full w-full" />
        <div className="absolute top-0 left-0 m-4 bg-white bg-opacity-80 p-2 rounded">
          Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
        </div>
      </div>
      <div className="bg-gray-100 p-4 flex flex-wrap justify-center items-center gap-4">
        <div className="flex space-x-2">
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
        <div className="flex items-center space-x-2">
          <Label htmlFor="newMarkerText" className="sr-only">Marker Text</Label>
          <Input
            id="newMarkerText"
            value={newMarkerText}
            onChange={(e) => setNewMarkerText(e.target.value)}
            placeholder="Enter marker text"
            className="w-48"
          />
          <Button onClick={handleAddMarker} disabled={isAddingMarker}>
            <MapPin className="h-4 w-4 mr-2" />
            {isAddingMarker ? 'Click on map' : 'Add Marker'}
          </Button>
        </div>
      </div>
      {markers.length > 0 && (
        <div className="bg-white p-4 border-t">
          <h2 className="text-lg font-semibold mb-2">Markers</h2>
          <ul className="space-y-2">
            {markers.map(marker => (
              <li key={marker.id} className="flex items-center justify-between">
                <span>{marker.text}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveMarker(marker.id)}
                  aria-label={`Remove marker ${marker.text}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
