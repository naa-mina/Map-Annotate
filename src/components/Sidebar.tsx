import React, { useState } from 'react';
import { LayerData, EditingFeature } from '../types';
import { ChevronRight, ChevronDown, Eye, EyeOff, Download, Trash2, ZoomIn, Plus, Upload } from 'lucide-react';
import { exportLayerGeoJSON } from '../utils/mapHelpers';

interface SidebarProps {
  layers: LayerData[];
  isOpen: boolean;
  onToggle: () => void;
  onLayerToggle: (layerId: string) => void;
  onLayerRemove: (layerId: string) => void;
  onLayerZoom: (layerId: string) => void;
  onLayerRename: (layerId: string, newName: string) => void;
  onCreateLayer: () => void;
  onImportGeoJSON: (file: File) => void;
  activeLayer: string | null;
  onSetActiveLayer: (layerId: string) => void;
  editingFeature: EditingFeature | null;
  onSaveFeature: (properties: any) => void;
  onCancelEdit: () => void;
  onSelectFeature: (featureId: string | null) => void;
  onFeatureDelete: (layerId: string, featureId: string) => void;
  onFeatureEdit: (editFeature: {
    layerId: string;
    featureId: string;
    properties: any;
  }) => void;
  onZoomToCoordinates: (lat: number, lng: number) => void;
  onZoomToFeature: (feature: Feature) => void;



}

export const Sidebar: React.FC<SidebarProps> = ({
  layers,
  isOpen,
  onToggle,
  onLayerToggle,
  onLayerRemove,
  onLayerZoom,
  onLayerRename,
  onCreateLayer,
  onImportGeoJSON,
  activeLayer,
  onSetActiveLayer,
  editingFeature,
  onSaveFeature,
  onCancelEdit,
  onFeatureEdit,
  onSelectFeature,
  onFeatureDelete,
  onZoomToCoordinates,
  onZoomToFeature
  
}) => {
  const [expandedLayers, setExpandedLayers] = useState<Record<string, boolean>>({});
  const toggleLayerExpanded = (layerId: string) => {
    setExpandedLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingProperties, setEditingProperties] = useState<any>({});

  React.useEffect(() => {
    if (editingFeature) {
      setEditingProperties(editingFeature.properties);
    }
  }, [editingFeature]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportGeoJSON(file);
      event.target.value = ''; // Reset input
    }
  };
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const handleZoomToCoord = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);

    if (!isNaN(lat) && !isNaN(lng)) {
      onZoomToCoordinates(lat, lng);
    } else {
      alert('Please enter valid coordinates');
    }
  };


  const handleSaveFeature = () => {
    onSaveFeature(editingProperties);
    setEditingProperties({});
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-transform duration-300 z-[1000] ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`} style={{ width: '320px' }}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Layer Manager</h2>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {editingFeature ? (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-3">Edit Feature</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingProperties.name || ''}
                  onChange={(e) => setEditingProperties({
                    ...editingProperties,
                    name: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingProperties.description || ''}
                  onChange={(e) => setEditingProperties({
                    ...editingProperties,
                    description: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validation Status
                </label>
                <select
                  value={editingProperties.validated || '1'}
                  onChange={(e) => setEditingProperties({
                    ...editingProperties,
                    validated: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="0">Invalid (Red)</option>
                  <option value="1">Pending (Gray)</option>
                  <option value="2">Valid (Green)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveFeature}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={onCancelEdit}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex gap-2 mb-4">
          <button
            onClick={onCreateLayer}
            className="flex-1 bg-green-600 text-white py-2 px-3 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Layer
          </button>
          <label className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".geojson,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="mt-4 p-3 border-t border-gray-200">
          <h3 className="text-sm font-semibold mb-2">Zoom to Coordinates</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              placeholder="Latitude"
              className="flex-1 px-2 py-1 border rounded text-sm"
            />
            <input
              type="number"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              placeholder="Longitude"
              className="flex-1 px-2 py-1 border rounded text-sm"
            />
          </div>
          <button
            onClick={handleZoomToCoord}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
          >
            Zoom
          </button>
        </div>

        <div className="space-y-2">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className={`border rounded-lg p-3 transition-all ${
                activeLayer === layer.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Layer name & visibility toggle */}
              <div className="flex items-center justify-between mb-2">
                {editingName === layer.id ? (
                  <input
                    type="text"
                    value={layer.name}
                    onChange={(e) => onLayerRename(layer.id, e.target.value)}
                    onBlur={() => setEditingName(null)}
                    onKeyPress={(e) => e.key === 'Enter' && setEditingName(null)}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 font-medium text-gray-800 cursor-pointer hover:text-blue-600 flex items-center gap-2"
                    onClick={() => toggleLayerExpanded(layer.id)}
                  >
                    <span>{expandedLayers[layer.id] ? '🔽' : '▶️'}</span>
                    
                  
                    {editingName === layer.id ? (
                      <input
                        type="text"
                        value={layer.name}
                        onChange={(e) => onLayerRename(layer.id, e.target.value)}
                        onBlur={() => setEditingName(null)}
                        onKeyPress={(e) => e.key === 'Enter' && setEditingName(null)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={(e) => {                      
                          e.stopPropagation();
                          setEditingName(layer.id);
                        }}
                      >
                        {layer.name}
                       </span>
                    )}
                    </span>
                )}
                <button
                  onClick={() => onLayerToggle(layer.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {layer.visible ? (
                    <Eye className="w-4 h-4 text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            
              <div className="flex gap-1">
                <button
                  onClick={() => onSetActiveLayer(layer.id)}
                  disabled={layer.id === 'permanent'}
                  className={`px-2 py-1 text-xs rounded ${
                    layer.id === 'permanent'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {activeLayer === layer.id ? 'Active' : 'Select'}
                </button>
                <button
                  onClick={() => onLayerZoom(layer.id)}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                <button
                  onClick={() => exportLayerGeoJSON(layer)}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  <Download className="w-3 h-3" />
                </button>
              {layer.id !== 'permanent' && (
                <button
                  onClick={() => onLayerRemove(layer.id)}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
              </div>
             
              <div className="mt-2 text-xs text-gray-500">
                {layer.features.features.length} features
              </div>

              {/* ✅ Feature list under the layer */}
              {expandedLayers[layer.id] && layer.features.features.length > 0 && (
                <ul className="mt-2 pl-4 text-sm text-gray-800 space-y-1">
                  {layer.features.features.map((feature) => ( 
                    <li
                      key={feature.properties?.id}
                      className="flex items-center justify-between text-sm text-gray-800 hover:text-blue-600"
                    > 
      
                      <span
                        className="cursor-pointer flex-1"
                        onClick={() => {
                          onSetActiveLayer(layer.id);
                          const clickedId = feature.properties?.id;
                          
                          onSelectFeature((prev) => (prev === clickedId ? null : clickedId));
                          onFeatureEdit({
                            layerId: layer.id,
                            featureId: feature.properties?.id,
                            properties: feature.properties
                          });
                          onZoomToFeature({
                            type: 'Feature',
                            geometry: feature.geometry,
                            properties: feature.properties
                          });
                        }}
                      >
                        <span className="text-sm text-gray-800">
                          {layer.id === 'permanent'
                            ? `ID: ${feature.properties?.id ?? '—'} (${feature.geometry.type})`
                            : `${feature.properties?.name || 'Unnamed'} (${feature.geometry.type})`}
                        </span>
                      </span>
                    {layer.id !== 'permanent' && (
                      <button
                        onClick={() => onFeatureDelete(layer.id, feature.properties?.id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                        title="Delete annotation"
                      >
                        🗑️
                      </button>
                    )}
                    </li>
                  ))}
                </ul>
              )}  

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};