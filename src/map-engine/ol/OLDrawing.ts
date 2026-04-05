import type { IDrawing } from '../core/interfaces';
import type { DrawingType, DrawingConfig } from '../core/types';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw } from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw';
import { Geometry } from 'ol/geom';
import { OLLayerManager } from './OLLayerManager';

export class OLDrawing implements IDrawing {
  private map: Map;
  private layerManager: OLLayerManager;
  private activeDraw: Draw | null = null;
  private activeType: DrawingType = null;
  private isDrawingState = false;
  private listeners: Record<string, Function[]> = {};

  constructor(map: Map, layerManager: OLLayerManager) {
    this.map = map;
    this.layerManager = layerManager;
  }

  start(type: DrawingType, layerId: string, config?: DrawingConfig): void {
    this.stop();
    this.activeType = type;
    this.isDrawingState = true;

    const olLayer = this.layerManager.getLayerInstance(layerId);
    if (!olLayer) {
      console.error(`Layer ${layerId} not found in OpenLayers`);
      return;
    }

    const source = olLayer.getSource();
    if (!source) {
      console.error(`Layer ${layerId} source not found in OpenLayers`);
      return;
    }

    let olType: any;
    let geometryFunction: any;

    switch (type) {
      case 'point':
        olType = 'Point';
        break;
      case 'polyline':
        olType = 'LineString';
        break;
      case 'polygon':
        olType = 'Polygon';
        break;
      case 'rectangle':
        olType = 'Circle';
        geometryFunction = createBox();
        break;
      case 'circle':
        olType = 'Circle';
        break;
      default:
        return;
    }

    this.activeDraw = new Draw({
      source: source as any,
      type: olType,
      geometryFunction: geometryFunction,
    });

    this.activeDraw.on('drawend', (event) => {
      const feature = event.feature;
      this.emit('draw-end', { type, feature });
    });

    this.map.addInteraction(this.activeDraw);
  }

  stop(): void {
    if (this.activeDraw) {
      this.map.removeInteraction(this.activeDraw);
      this.activeDraw = null;
    }
    this.activeType = null;
    this.isDrawingState = false;
  }

  clear(): void {
    const layers = this.layerManager.getLayers();
    layers.forEach(layerInfo => {
      const olLayer = this.layerManager.getLayerInstance(layerInfo.id);
      olLayer?.getSource()?.clear();
    });
  }

  isActive(): boolean {
    return this.isDrawingState;
  }

  getActiveType(): DrawingType {
    return this.activeType;
  }

  on(event: 'draw-end', callback: (data: any) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  private emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }
}
