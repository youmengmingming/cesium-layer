import type { 
  DrawingType, 
  MeasurementType, 
  Position, 
  DrawingConfig, 
  MeasurementResult 
} from './types';

export interface IMapEngine {
  init(container: HTMLElement, options?: any): Promise<void>;
  destroy(): void;
  setView(center: Position, zoom: number): void;
  getOriginalViewer(): any;
  
  // 核心功能接口
  drawing: IDrawing;
  measurement: IMeasurement;
  layerManager: ILayerManager;
  
  // 事件监听
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback: (...args: any[]) => void): void;
}

export interface IDrawing {
  start(type: DrawingType, layerId: string, config?: DrawingConfig): void;
  stop(): void;
  clear(): void;
  isActive(): boolean;
  getActiveType(): DrawingType;
  on(event: 'draw-end', callback: (data: any) => void): void;
}

export interface IMeasurement {
  start(type: MeasurementType): void;
  stop(): void;
  clear(): void;
  isActive(): boolean;
  getActiveType(): MeasurementType;
  on(event: 'measure-change', callback: (result: MeasurementResult) => void): void;
}

export interface ILayer {
  id: string;
  name: string;
  visible: boolean;
  type: string;
}

export interface ILayerManager {
  addLayer(name: string, options?: { visible?: boolean; id?: string }): ILayer;
  removeLayer(id: string): void;
  setVisibility(id: string, visible: boolean): void;
  getLayers(): ILayer[];
}
