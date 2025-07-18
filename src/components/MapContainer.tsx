import React, { useRef, useEffect, useState } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import { Map as LeafletMap, LatLngBounds } from 'leaflet';
import { LayerData, MapSettings, EditingFeature } from '../types';
import { getFeatureStyle, generateId } from '../utils/mapHelpers';
import { Feature, Point, LineString, Polygon } from 'geojson';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';


// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapContainerProps {
  layers: LayerData[];
  settings: MapSettings;
  onSettingsChange: (settings: MapSettings) => void;
  activeLayer: string | null;
  drawingMode: 'point' | 'line' | 'polygon' | null;
  onFeatureCreate: (feature: Feature, layerId: string) => void;
  onFeatureEdit: (feature: EditingFeature) => void;
  onLayerBoundsRequest: (layerId: string) => LatLngBounds | null;
  onZoomToFeature: (fn: (feature: Feature) => void) => void; 
  selectedFeatureId: string | null;
  onZoomToCoordinates: (fn: (lat: number, lng: number) => void) => void;

}

const CopyCoordinatesOnClick = () => {
  useMapEvents({
    click: (e) => {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      const coordString = `${lat}, ${lng}`;

      navigator.clipboard.writeText(coordString)
        .then(() => {
          console.log(`📋 Clicked map: ${coordString}`);
          // You can also use toast.success(...) here
        })
        .catch((err) => {
          console.error('❌ Failed to copy coordinates:', err);
        });
    }
  });

  return null;
};


const DrawingHandler: React.FC<{
  drawingMode: 'point' | 'line' | 'polygon' | null;
  activeLayer: string | null;
  onFeatureCreate: (feature: Feature, layerId: string) => void;
}> = ({ drawingMode, activeLayer, onFeatureCreate }) => {
  const map = useMap();
  const isDrawing = useRef(false);
  const currentPath = useRef<L.LatLng[]>([]);
  const tempLayer = useRef<L.Layer | null>(null);
  const [, setRerender] = useState(false); // trigger UI updates
  const updateTempShape = () => {
    if (tempLayer.current) {
      map.removeLayer(tempLayer.current);
      tempLayer.current = null;
    }
    if (currentPath.current.length > 1) {
      const shape = drawingMode === 'line'
        ? L.polyline(currentPath.current, { color: '#3b82f6', weight: 3 })
        : L.polygon(currentPath.current, { color: '#3b82f6', weight: 3, fillOpacity: 0.2 });
      tempLayer.current = shape;
      map.addLayer(shape);
    }
  };
  const removeTempLayer = () => {
    if (tempLayer.current) {
      map.removeLayer(tempLayer.current);
      tempLayer.current = null;
    }
  };

  // Add points
  useMapEvents({
    click: (e) => {
      if (!drawingMode || !activeLayer) return;

      if (drawingMode === 'point') {
        const customName = prompt("Enter a name for this point:") || `Point ${Date.now()}`;
        const feature: Feature<Point> = {

          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [e.latlng.lng, e.latlng.lat]
          },
          properties: {
            id: generateId(),
            name: customName,
            validated: '1'
          }
        };
        onFeatureCreate(feature, activeLayer);
        return;
      }

      currentPath.current.push(e.latlng);
      isDrawing.current = true;
      setRerender((r) => !r);

      if (tempLayer.current) {
        map.removeLayer(tempLayer.current);
      }

      if (currentPath.current.length > 1) {
        const shape = drawingMode === 'line'
          ? L.polyline(currentPath.current, { color: '#3b82f6', weight: 3 })
          : L.polygon(currentPath.current, { color: '#3b82f6', weight: 3, fillOpacity: 0.3 });

        tempLayer.current = shape;
        map.addLayer(shape);
      }
    }
  });

  // Clean up layer
  useEffect(() => {
    return () => {
      if (tempLayer.current) {
        map.removeLayer(tempLayer.current);
      }
    };
  }, [drawingMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDrawing.current) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (currentPath.current.length > 0) {
          currentPath.current.pop(); // remove last point
          updateTempShape();
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        currentPath.current = [];
        isDrawing.current = false;
        removeTempLayer();
        setRerender(r => !r);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  useEffect(() => {
    map.doubleClickZoom.disable();
    return () => {
      map.doubleClickZoom.enable();
    };
  }, [map]);

  // Finalize drawing
  const finishDrawing = () => {
    if (!drawingMode || !activeLayer || currentPath.current.length < 2) return;

    const coords = currentPath.current.map(p => [p.lng, p.lat]);
    const CustomName = prompt(`Enter a name for this ${drawingMode}:`) || `${drawingMode} ${Date.now()}`;
    const feature: Feature<LineString | Polygon> = {

      type: 'Feature',
      geometry: {
        type: drawingMode === 'line' ? 'LineString' : 'Polygon',
        coordinates: drawingMode === 'line' ? coords : [coords]
      },
      properties: {
        id: generateId(),
        name: CustomName,
        validated: '1'
      }
    };

    onFeatureCreate(feature, activeLayer);

    currentPath.current = [];
    isDrawing.current = false;
    setRerender((r) => !r);

    if (tempLayer.current) {
      map.removeLayer(tempLayer.current);
      tempLayer.current = null;
    }
  };

  // Render the button outside the map via portal
  return isDrawing.current && typeof document !== 'undefined'
    ? createPortal(
        <button
          onClick={finishDrawing}
          className="fixed top-4 right-4 z-[1000] bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          Finish Drawing
        </button>,
        document.body
      )
    : null;
};

const onAnnotationsEdited = (e: any) => {
  const updatedGeoJson = e.layers.toGeoJSON();
  console.log("Edited GeoJSON:", updatedGeoJson);
  // TODO: send updated features back to App.tsx if needed
};



export const MapContainer: React.FC<MapContainerProps> = ({
  
  layers,
  settings,
  onSettingsChange,
  activeLayer,
  drawingMode,
  onFeatureCreate,
  onFeatureEdit,
  onLayerBoundsRequest,
  onZoomToFeature,
  selectedFeatureId,
  onZoomToCoordinates
}) => {
console.log("🟦 Selected feature ID in MapContainer:", selectedFeatureId);

  const mapRef = useRef<LeafletMap | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup>(null);
  const [drawReady, setDrawReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    
    onZoomToCoordinates((lat: number, lng: number) => {
      map.setView([lat, lng], 18); 
    }); 
  }, [onZoomToCoordinates]);
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    onZoomToFeature((feature: Feature) => {
      const bounds = L.geoJSON(feature).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds);
      }
    });
  }, [onZoomToFeature]);

  useEffect(() => {
    if (!featureGroupRef.current) return;

    const group = featureGroupRef.current;

    group.clearLayers(); // Clear any old layers before adding new ones

    layers
      .filter(layer => layer.visible)
      .forEach(layer => {
        const geoJsonLayer = L.geoJSON(layer.features, {
          onEachFeature: (feature, leafletLayer) => {
            leafletLayer.on('click', () => {
              if (feature?.properties?.id && activeLayer) {
                onFeatureEdit({
                  layerId: layer.id,
                  featureId: feature.properties.id,
                  properties: feature.properties
                });
              }
            });
          },
          style: (feature) => {
            const base = getFeatureStyle(feature?.properties);
            if (feature?.properties?.id === selectedFeatureId) {
              return {
                ...base,
                color: 'blue',
                weight: 6
              };
            }
            return base;
          }
        });

        geoJsonLayer.addTo(group);
      });
  }, [layers, activeLayer, selectedFeatureId]);


  const nearmapUrl = 'https://atlas-preprod.flyziplinedev.com/service?' +
    'SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&' +
    'LAYER=nearmap&STYLE=default&FORMAT=image/png&' +
    'TILEMATRIXSET=GLOBAL_WEBMERCATOR_HIGH_RES&' +
    'TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';

  const handleFeatureClick = (feature: any, layerId: string) => {
    if (feature.properties) {
      onFeatureEdit({
        layerId,
        featureId: feature.properties.id,
        properties: feature.properties
      });
    }
  };

  // Expose bounds calculation method
  React.useImperativeHandle(onLayerBoundsRequest, () => (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.features.features.length) return null;

    const bounds = new LatLngBounds([]);
    layer.features.features.forEach(feature => {
      if (feature.geometry.type === 'Point') {
        const coords = feature.geometry.coordinates;
        bounds.extend([coords[1], coords[0]]);
      } else if (feature.geometry.type === 'LineString') {
        feature.geometry.coordinates.forEach(coord => {
          bounds.extend([coord[1], coord[0]]);
        });
      } else if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates[0].forEach(coord => {
          bounds.extend([coord[1], coord[0]]);
        });
      }
    });
    return bounds;
  });

  return (
    <LeafletMapContainer
      ref={mapRef}
      center={settings.center}
      zoom={settings.zoom}
      className="w-full h-full"
      style={{ height: '100vh' }}
    >
      <TileLayer
        url={
          settings.baseLayer === 'nearmap' 
            ? nearmapUrl 
            : settings.baseLayer === 'esri'
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        }
        attribution={settings.baseLayer === 'nearmap' 
          ? '&copy; Nearmap / Zipline WMTS'
          :settings.baseLayer === 'esri'
          ? '&copy; Esri, Maxar, Earthstar Geographics'
          : '&copy; OpenStreetMap contributors'
        }
        tileSize={settings.baseLayer === 'nearmap' ? 256 : 256}
        minZoom={settings.baseLayer === 'nearmap' ? 1 : 0}
        maxZoom={settings.baseLayer === 'nearmap' ? 22 : 18}
      
      />
      <CopyCoordinatesOnClick /> 
      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position="topright"
          draw={{
            marker: false,
            polyline: false,
            polygon: false,
            rectangle: false,
            circle: false,
            circlemarker: false
          }}
          edit={{
            featureGroup: featureGroupRef.current!, 
            selectedPathOptions: {
              color: 'blue',
              weight: 4
              },
              remove: false
            }}
            onEdited={onAnnotationsEdited}
          />


          {layers.filter(layer => layer.visible).map(layer => (
            <GeoJSON
              key={layer.id + '-' + layer.features.features.length}
              data={layer.features}
              style={(feature) => {
                console.log("🔍 Feature ID:", feature?.properties?.id);
                console.log("✅ Is selected?", feature?.properties?.id === selectedFeatureId);
                const base = getFeatureStyle(feature?.properties);
                if (feature?.properties?.id === selectedFeatureId) {
                  return {
                    ...base,
                    color: 'blue',
                    weight: 6
                    
                  };
                }
                return base;
              }}

              onEachFeature={(feature, leafletLayer) => {
                leafletLayer.on('click', () => {
                  if (feature?.geometry?.type === 'Point') {
                    const [lng, lat] = feature.geometry.coordinates;
                    const coordString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    navigator.clipboard.writeText(coordString)
                      .then(() => {
                        console.log(`Copied coordinates: ${coordString}`);
                      })
                      .catch(err => {
                        console.error("Failed to copy", err);

                      });
                    
                  }  
                  if (feature?.properties?.id && activeLayer) {
                    onFeatureEdit({
                      layerId: activeLayer,
                      featureId: feature.properties.id,
                      properties: feature.properties,
                  });
                }
              });
            }}
            />
          ))}

          <DrawingHandler
            drawingMode={drawingMode}
            activeLayer={activeLayer}
            onFeatureCreate={onFeatureCreate}
          />
        </FeatureGroup>               
      </LeafletMapContainer>
    );
  };                 