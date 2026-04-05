export type MapEngineType = 'cesium' | 'openlayers' | 'leaflet';

export type DrawingType = 'point' | 'polyline' | 'polygon' | 'rectangle' | 'circle' | null;

export type MeasurementType = 'point' | 'distance' | 'area' | null;

export interface Position {
  lng: number;
  lat: number;
  alt?: number;
}

export interface DrawingConfig {
  propertyName?: string;
  fillColor?: string;
  fillColorAlpha?: number;
  lineColor?: string;
  lineColorAlpha?: number;
  lineWidth?: number;
  outline?: boolean;
  outlineColor?: string;
  outlineColorAlpha?: number;
  outlineWidth?: number;
  showPropertyName?: boolean;
  showLengthInfo?: boolean;
  showBorder?: boolean;
}

export interface MeasurementResult {
  distance?: number;
  totalDistance?: number;
  area?: number;
  elevation?: number;
  longitude?: number;
  latitude?: number;
  bearing?: number;
}
