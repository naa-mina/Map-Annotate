import { FeatureCollection, Feature, Geometry } from 'geojson';
import { LayerData, FeatureProperties } from '../types';

export const sanitizeProperties = (
  props: Record<string, any>
): Record<string, string | number | boolean | null> => {
  const cleaned: Record<string, string | number | boolean | null> = {};

  Object.entries(props || {}).forEach(([key, value]) => {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      cleaned[key] = value;
    } else if (Array.isArray(value)) {
      cleaned[key] = typeof value[0] === 'string' || typeof value[0] === 'number'
        ? value[0]
        : String(value[0]);
    } else {
      cleaned[key] = String(value);
    }
  });

  return cleaned;
};



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
    features: allFeatures.map(f => ({
      ...f,
      properties: sanitizeProperties(f.properties || {})
    })) 
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
  
  const cleanedFeatures: FeatureCollection = {
    ...layer.features,
    features: layer.features.features.map(f => ({
    ...f,
    properties: sanitizeProperties(f.properties || {})
    }))
  };

  const blob = new Blob([JSON.stringify(cleanedFeatures, null, 2)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${layer.name}.geojson`;
  a.click();
  URL.revokeObjectURL(url);
};