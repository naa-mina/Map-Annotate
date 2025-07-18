import { FeatureCollection, Feature, Geometry } from 'geojson';
import { LayerData, FeatureProperties } from '../types';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const createEmptyFeatureCollection = (): FeatureCollection => ({
  type: 'FeatureCollection',
  features: []
});

export const getFeatureStyle = (properties: FeatureProperties) => {
  const validated = properties?.validated;
  let color = '#c72e28ff'; // red-500
  
  if (validated === '0') color = '#ef4444'; // red-500
  else if (validated === '2') color = '#10b981'; // green-500
  
  return {
    color,
    weight: 3,
    opacity: 0.8,
    fill: false
  };
};

export const exportGeoJSON = (layers: LayerData[], filename: string = 'layers') => {
  const allFeatures = layers.flatMap(layer => layer.features.features);
  const collection: FeatureCollection = {
    type: 'FeatureCollection',
    features: allFeatures
  };
  
  const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.geojson`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportLayerGeoJSON = (layer: LayerData) => {
  const blob = new Blob([JSON.stringify(layer.features, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${layer.name}.geojson`;
  a.click();
  URL.revokeObjectURL(url);
};