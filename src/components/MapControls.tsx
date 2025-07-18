import React from 'react';
import { MapSettings } from '../types';
import { Menu, Download, Settings } from 'lucide-react';

interface MapControlsProps {
  settings: MapSettings;
  onSettingsChange: (settings: MapSettings) => void;
  onSidebarToggle: () => void;
  onExportAll: () => void;
  drawingMode: 'point' | 'line' | 'polygon' | null;
  onDrawingModeChange: (mode: 'point' | 'line' | 'polygon' | null) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  settings,
  onSettingsChange,
  onSidebarToggle,
  onExportAll,
  drawingMode,
  onDrawingModeChange
}) => {
  return (
    <div className="fixed top-4 right-4 z-[1000] space-y-2">
      {/* Main Controls */}
      <div className="bg-white rounded-lg shadow-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onSidebarToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h3 className="font-semibold text-gray-800">Map Controls</h3>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Base Layer
          </label>
          <select
            value={settings.baseLayer}
            onChange={(e) => onSettingsChange({
              ...settings,
              baseLayer: e.target.value as 'nearmap' | 'osm'
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="nearmap">Nearmap</option>
            <option value="osm">OpenStreetMap</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Drawing Mode
          </label>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => onDrawingModeChange(drawingMode === 'point' ? null : 'point')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                drawingMode === 'point'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Point
            </button>
            <button
              onClick={() => onDrawingModeChange(drawingMode === 'line' ? null : 'line')}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                drawingMode === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => onDrawingModeChange(drawingMode === 'polygon' ? null : 'polygon')}
              className={`px-3 py-2 text-sm rounded-md transition-colors col-span-2 ${
                drawingMode === 'polygon'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Polygon
            </button>
          </div>
        </div>

        <button
          onClick={onExportAll}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">Validation Status</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Invalid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Valid</span>
          </div>
        </div>
      </div>
    </div>
  );
};