import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import type { IMapEngine, IDrawing, IMeasurement, ILayerManager } from '../core/interfaces';
import type { Position } from '../core/types';
import { OLDrawing } from './OLDrawing';
import { OLMeasurement } from './OLMeasurement';
import { OLLayerManager } from './OLLayerManager';
import 'ol/ol.css';

export class OLEngine implements IMapEngine {
  private map: Map | null = null;
  private container: HTMLElement | null = null;
  
  public drawing!: IDrawing;
  public measurement!: IMeasurement;
  public layerManager!: ILayerManager;

  private listeners: Record<string, Function[]> = {};

  async init(container: HTMLElement, options?: any): Promise<void> {
    this.container = container;
    
    this.map = new Map({
      target: container,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([116.3974, 39.9093]),
        zoom: 10,
      }),
    });

    this.layerManager = new OLLayerManager(this.map);
    this.drawing = new OLDrawing(this.map, this.layerManager as OLLayerManager);
    this.measurement = new OLMeasurement(this.map, this.layerManager as OLLayerManager);

    // 监听视图变化等
    this.map.on('moveend', () => {
      this.emit('view-change', {
        center: this.map?.getView().getCenter(),
        zoom: this.map?.getView().getZoom(),
      });
    });
  }

  destroy(): void {
    if (this.map) {
      this.map.setTarget(undefined);
      this.map = null;
    }
  }

  setView(center: Position, zoom: number): void {
    if (this.map) {
      this.map.getView().animate({
        center: fromLonLat([center.lng, center.lat]),
        zoom: zoom,
        duration: 500,
      });
    }
  }

  getOriginalViewer(): Map | null {
    return this.map;
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    }
  }

  private emit(event: string, ...args: any[]): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(...args));
    }
  }
}
