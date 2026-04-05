import type { IMeasurement } from '../core/interfaces';
import type { MeasurementType, MeasurementResult } from '../core/types';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw } from 'ol/interaction';
import { getArea, getLength } from 'ol/sphere';
import { LineString, Polygon, Point } from 'ol/geom';
import { toLonLat } from 'ol/proj';
import { OLLayerManager } from './OLLayerManager';

export class OLMeasurement implements IMeasurement {
  private map: Map;
  private layerManager: OLLayerManager;
  private source: VectorSource;
  private layer: VectorLayer<VectorSource>;
  private activeDraw: Draw | null = null;
  private activeType: MeasurementType = null;
  private isMeasuringState = false;
  private listeners: Record<string, Function[]> = {};

  constructor(map: Map, layerManager: OLLayerManager) {
    this.map = map;
    this.layerManager = layerManager;
    this.source = new VectorSource();
    this.layer = new VectorLayer({
      source: this.source,
    });
    this.map.addLayer(this.layer);
  }

  start(type: MeasurementType): void {
    this.stop();
    this.activeType = type;
    this.isMeasuringState = true;

    let olType: any;
    switch (type) {
      case 'distance':
        olType = 'LineString';
        break;
      case 'area':
        olType = 'Polygon';
        break;
      case 'point':
        olType = 'Point';
        break;
      default:
        return;
    }

    this.activeDraw = new Draw({
      source: this.source,
      type: olType,
    });

    this.activeDraw.on('drawstart', (evt) => {
      const sketch = evt.feature;
      sketch.getGeometry()?.on('change', (evt) => {
        const geom = evt.target;
        let result: MeasurementResult = {};
        if (geom instanceof LineString) {
          result.totalDistance = getLength(geom);
        } else if (geom instanceof Polygon) {
          result.area = getArea(geom);
        } else if (geom instanceof Point) {
          const coords = toLonLat(geom.getCoordinates());
          result.longitude = coords[0];
          result.latitude = coords[1];
        }
        this.emit('measure-change', result);
      });
    });

    this.activeDraw.on('drawend', (evt) => {
      const geom = evt.feature.getGeometry();
      if (geom instanceof Point) {
        const coords = toLonLat(geom.getCoordinates());
        this.emit('measure-change', {
          longitude: coords[0],
          latitude: coords[1],
        });
      }
    });

    this.map.addInteraction(this.activeDraw);
  }

  stop(): void {
    if (this.activeDraw) {
      this.map.removeInteraction(this.activeDraw);
      this.activeDraw = null;
    }
    this.activeType = null;
    this.isMeasuringState = false;
  }

  clear(): void {
    this.source.clear();
  }

  isActive(): boolean {
    return this.isMeasuringState;
  }

  getActiveType(): MeasurementType {
    return this.activeType;
  }

  on(event: 'measure-change', callback: (result: MeasurementResult) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  private emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }
}
