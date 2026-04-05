import type { MapEngineType } from './core/types';
import type { IMapEngine } from './core/interfaces';
import { CesiumEngine } from './cesium/CesiumEngine';
import { OLEngine } from './ol/OLEngine';

export class MapEngineFactory {
  static createEngine(type: MapEngineType): IMapEngine {
    switch (type) {
      case 'cesium':
        return new CesiumEngine();
      case 'openlayers':
        return new OLEngine();
      case 'leaflet':
        throw new Error('Leaflet engine not implemented yet');
      default:
        throw new Error(`Unsupported map engine type: ${type}`);
    }
  }
}
