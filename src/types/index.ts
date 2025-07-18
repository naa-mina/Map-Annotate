import { FeatureCollection, Feature, Geometry } from 'geojson';

export interface LayerData {
  id: string;
  name: string;
  visible: boolean;
  features: FeatureCollection;
  color?: string;
}

export interface FeatureProperties {
  id?: string;
  name?: string;
  description?: string;
  validated?: '0' | '1' | '2'; // 0: invalid, 1: pending, 2: valid
  type?: string;
  [key: string]: any;
}

export interface EditingFeature {
  layerId: string;
  featureId: string;
  properties: FeatureProperties;
}

export interface MapSettings {
  baseLayer: 'nearmap' | 'osm';
  showAnnotations: boolean;
  center: [number, number];
  zoom: number;
}