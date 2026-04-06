import * as Cesium from 'cesium';
import type { IMapEngine, IDrawing, IMeasurement, ILayerManager } from '../core/interfaces';
import type { Position } from '../core/types';
import { CesiumDrawing } from './CesiumDrawing';
import { CesiumMeasurement } from './CesiumMeasurement';
import { CesiumLayerManager } from './CesiumLayerManager';
import { cesiumConfig, type CesiumConfig } from '../../config/cesium.config';
import { useCesiumStore } from '../../stores/cesium';

export class CesiumEngine implements IMapEngine {
  private viewer: Cesium.Viewer | null = null;
  private container: HTMLElement | null = null;
  
  public drawing!: IDrawing;
  public measurement!: IMeasurement;
  public layerManager!: ILayerManager;

  private listeners: Record<string, Function[]> = {};

  async init(container: HTMLElement, options?: Partial<CesiumConfig>): Promise<void> {
    const cesiumStore = useCesiumStore();
    this.container = container;
    const config = { ...cesiumConfig, ...options };

    if (config.token) {
      Cesium.Ion.defaultAccessToken = config.token;
    }

    const viewerOptions: any = {
      imageryProvider: new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/',
      }),
      baseLayerPicker: true,
      geocoder: true,
      homeButton: true,
      sceneModePicker: true,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      selectionIndicator: false,
      infoBox: false,
      shadows: false,
      shouldAnimate: false,
    };

    const instance = new Cesium.Viewer(container, viewerOptions);

    this.viewer = instance;

    // 同步更新 store，确保兼容性 (尽早更新)
    cesiumStore.setViewer(instance);
    cesiumStore.setConfig(config);

    this.drawing = new CesiumDrawing(instance);
    this.measurement = new CesiumMeasurement(instance);
    this.layerManager = new CesiumLayerManager(instance);

    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(116.3974, 39.9093, 10000000),
    });

    // 隐藏版权信息
    const attribution = container.querySelector('.cesium-viewer-bottom');
    if (attribution) {
      (attribution as HTMLElement).style.display = 'none';
    }
  }

  destroy(): void {
    if (this.viewer) {
      const cesiumStore = useCesiumStore();
      this.viewer.destroy();
      this.viewer = null;
      cesiumStore.setViewer(null);
    }
  }

  setView(center: Position, zoom: number): void {
    if (this.viewer) {
      this.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(center.lng, center.lat, zoom),
      });
    }
  }

  getOriginalViewer(): Cesium.Viewer | null {
    return this.viewer;
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
}
