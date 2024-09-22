'use client'

import React, { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { ZoomIn, ZoomOut, Maximize, Layers, MapPin, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from '@/utils/supabase/client'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!

interface Marker {
  id?: number
  created_at?: string
  lng: number
  lat: number
  text: string
}

interface Props {
  initialLng: number
  initialLat: number
  initialZoom: number
}

export function MapPageComponent({ initialLng, initialLat, initialZoom }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const [lng, setLng] = useState(initialLng)
  const [lat, setLat] = useState(initialLat)
  const [zoom, setZoom] = useState(initialZoom)
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

    const fetchMarkers = async () => {
      const supabase = createClient()
      const { data: markers } = await supabase
        .from('markers')
        .select()

      if (markers) {
        for (const marker of markers) {
          const newMarker: Marker = {
            id: marker.id,
            lng: marker.lng,
            lat: marker.lat,
            text: marker.text
          }
          setMarkers(prev => [...prev, newMarker])
        }
      }
    }
    fetchMarkers()
  }, [lat, lng, zoom])

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
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map.current!)

      if (marker.id) {
        markersRef.current[marker.id] = mapboxMarker
      }

      popup.on('open', () => {
        const deleteButton = document.querySelector(`.delete-marker[data-id="${marker.id}"]`)
        if (deleteButton) {
          deleteButton.addEventListener('click', () => {
            if (marker.id) {
              handleRemoveMarker(marker.id)
            }
          })
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
      center: [initialLng, initialLat],
      zoom: initialZoom
    })
  }

  const handleToggleLayer = () => {
    const currentStyle = map.current!.getStyle()?.name
    const newStyle = currentStyle === 'Mapbox Streets' 
      ? 'mapbox://styles/mapbox/satellite-v9'
      : 'mapbox://styles/mapbox/streets-v11'
    map.current!.setStyle(newStyle)
  }

  const handleAddMarker = () => {
    setIsAddingMarker(true)
    const addMarkerListener = async (e: mapboxgl.MapMouseEvent) => {
      try {
        const supabase = createClient()
        const { data: marker } = await supabase
          .from('markers')
          .insert([{
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
            text: newMarkerText || 'New marker'
          }])
          .select()
          .limit(1)
          .single()

        const newMarker: Marker = {
          id: marker.id,
          lng: marker.lng,
          lat: marker.lat,
          text: marker.text
        }
        setMarkers(prev => [...prev, newMarker])
        setNewMarkerText('')
      } catch (e) {
        console.error(e)
      }
      setIsAddingMarker(false)
      map.current!.off('click', addMarkerListener)
    }
    map.current!.on('click', addMarkerListener)
  }

  const handleRemoveMarker = (id: number) => {
    try {
      const deleteMarker = async () => {
        const supabase = createClient()
        await supabase
          .from('markers')
          .delete()
          .eq('id', id)
      }
      deleteMarker()

      setMarkers(prev => prev.filter(marker => marker.id !== id))
      if (markersRef.current[id]) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    } catch (e) {
      console.error(e)
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
                  onClick={() => {
                    if (marker.id) {
                      handleRemoveMarker(marker.id)
                    }
                  }}
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
