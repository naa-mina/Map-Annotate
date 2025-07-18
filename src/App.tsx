import React, { useState, useRef } from 'react';
import { MapContainer } from './components/MapContainer';
import { Sidebar } from './components/Sidebar';
import { MapControls } from './components/MapControls';
import { useLocalStorage } from './hooks/useLocalStorage';


import { LayerData, MapSettings, EditingFeature } from './types';
import { generateId, createEmptyFeatureCollection, exportGeoJSON } from './utils/mapHelpers';
import { Feature, FeatureCollection } from 'geojson';
import { LatLngBounds } from 'leaflet';

const defaultSettings: MapSettings = {
  baseLayer: 'nearmap',
  showAnnotations: true,
  center: [32.91, -96.57],
  zoom: 17
};

function App() {
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const zoomToFeatureRef = useRef<(feature: Feature) => void>();
  const [layers, setLayers] = useLocalStorage<LayerData[]>('geojson-layers', []);
  const [settings, setSettings] = useLocalStorage<MapSettings>('map-settings', defaultSettings);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState<'point' | 'line' | 'polygon' | null>(null);
  const [editingFeature, setEditingFeature] = useState<EditingFeature | null>(null);
  const coordinateZoomRef = useRef<(lat: number, lng: number) => void>();

  const handleCreateLayer = () => {
    const name = prompt('Enter layer name:');
    if (!name) return;

    const newLayer: LayerData = {
      id: generateId(),
      name,
      visible: true,
      features: createEmptyFeatureCollection()
    };

    setLayers(prev => [...prev, newLayer]);
    setActiveLayer(newLayer.id);
  };

  const handleImportGeoJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const geojson = JSON.parse(e.target?.result as string) as FeatureCollection;
        geojson.features.forEach(feature => {
          if (!feature.properties?.id) {
            feature.properties = { ...feature.properties, id: generateId() };
          }
        });
        const newLayer: LayerData = {
          id: generateId(),
          name: file.name.replace('.geojson', '').replace('.json', ''),
          visible: true,
          features: geojson
        };
        setLayers(prev => [...prev, newLayer]);
        setActiveLayer(newLayer.id);
      } catch (error) {
        alert('Error parsing GeoJSON file');
        console.error('Error parsing GeoJSON:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleLayerToggle = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const handleLayerRemove = (layerId: string) => {
    if (confirm('Are you sure you want to delete this layer?')) {
      setLayers(prev => prev.filter(layer => layer.id !== layerId));
      if (activeLayer === layerId) setActiveLayer(null);
    }
  };

  const handleLayerRename = (layerId: string, newName: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, name: newName } : layer
    ));
  };

  const handleLayerZoom = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || !layer.features.features.length) return;

    const bounds = new LatLngBounds([]);
    layer.features.features.forEach(feature => {
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates;
        bounds.extend([lat, lng]);
      } else if (feature.geometry.type === 'LineString') {
        feature.geometry.coordinates.forEach(coord => bounds.extend([coord[1], coord[0]]));
      } else if (feature.geometry.type === 'Polygon') {
        feature.geometry.coordinates[0].forEach(coord => bounds.extend([coord[1], coord[0]]));
      }
    });

    if (bounds.isValid() && zoomToFeatureRef.current) {
      const dummyFeature: Feature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [bounds.getWest(), bounds.getSouth()],
            [bounds.getEast(), bounds.getSouth()],
            [bounds.getEast(), bounds.getNorth()],
            [bounds.getWest(), bounds.getNorth()],
            [bounds.getWest(), bounds.getSouth()]
          ]]
        },
        properties: { id: 'layer-zoom' }
      };

      zoomToFeatureRef.current(dummyFeature);
    }
  };
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const handleZoomToCoord = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (!isNaN(lat) && !isNaN(lng) && coordinateZoomRef.current) {
      coordinateZoomRef.current(lat, lng);
    }
  };

  const handleFeatureCreate = (feature: Feature, layerId: string) => {
    const props = feature.properties || {};
    const cleanedProperties = {
    
      
      id: Array.isArray(props.id) ? props.id[0] : props.id,
      name: Array.isArray(props.name) ? props.name[0] : props.name,
      validated: Array.isArray(props.validated)
       ? props.validated[0]
       : props.validated ?? '1',
      ...props
    };
    
    const cleanedFeature: Feature = {
      ...feature,
      properties: cleanedProperties
    };
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        return { 
          ...layer, 
          features: { 
            ...layer.features, 
            features: [...layer.features.features, cleanedFeature]
          }
        };
      }

      return layer;
    }));

    if (zoomToFeatureRef.current) {
      zoomToFeatureRef.current(feature);
    }

    setDrawingMode(null);
  };

  const handleFeatureEdit = (editFeature: EditingFeature) => setEditingFeature(editFeature);

  const handleSaveFeature = (properties: any) => {
    if (!editingFeature) return;
    const updatedLayers = layers.map(layer => {
      if (layer.id === editingFeature.layerId) {
        return {
          ...layer,
          features: {
            ...layer.features,
            features: layer.features.features.map(feature => 
              feature.properties?.id === editingFeature.featureId
                ? { ...feature, properties: { ...feature.properties, ...properties } }
                : feature
            )
          }
        };
      }
      return layer;
    });
    setLayers(updatedLayers);
    setEditingFeature(null);
  };

  const handleExportAll = () => exportGeoJSON(layers, 'all-layers');
  const handleFeatureDelete = (layerId: string, featureId: string) => {
    setLayers(prev =>
      prev.map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            features: {
              ...layer.features,
              features: layer.features.features.filter(
                feature => feature.properties?.id !== featureId
              )
            }
          };
        }
        return layer;
      })
    );
  };


  return (
    <div className="relative w-full h-screen overflow-hidden">
      <MapContainer
        layers={layers}
        settings={settings}
        onSettingsChange={setSettings}
        activeLayer={activeLayer}
        drawingMode={drawingMode}
        onFeatureCreate={handleFeatureCreate}
        onFeatureEdit={handleFeatureEdit}
        onLayerBoundsRequest={handleLayerZoom}
        onZoomToFeature={(fn) => { zoomToFeatureRef.current = fn; }}
        selectedFeatureId={selectedFeatureId}
        onZoomToCoordinates={(fn) => { coordinateZoomRef.current = fn; }}
      />

      <Sidebar
        layers={layers}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onLayerToggle={handleLayerToggle}
        onLayerRemove={handleLayerRemove}
        onLayerZoom={handleLayerZoom}
        onLayerRename={handleLayerRename}
        onCreateLayer={handleCreateLayer}
        onImportGeoJSON={handleImportGeoJSON}
        activeLayer={activeLayer}
        onSetActiveLayer={setActiveLayer}
        editingFeature={editingFeature}
        onSaveFeature={handleSaveFeature}
        onCancelEdit={() => setEditingFeature(null)}
        onSelectFeature={setSelectedFeatureId}
        onFeatureDelete={handleFeatureDelete}
        onZoomToCoordinates={(lat, lng) => {
          coordinateZoomRef.current?.(lat, lng);
        }}
      />

      <MapControls
        settings={settings}
        onSettingsChange={setSettings}
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        onExportAll={handleExportAll}
        drawingMode={drawingMode}
        onDrawingModeChange={setDrawingMode}
      />

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors z-[999]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </div>
  );

}

export default App;
