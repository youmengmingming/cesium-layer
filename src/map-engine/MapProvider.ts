import { ref, type Ref } from 'vue';
import type { IMapEngine } from './core/interfaces';
import type { MapEngineType } from './core/types';
import { MapEngineFactory } from './factory';

class MapProvider {
  private static instance: MapProvider;
  private currentEngine: Ref<IMapEngine | null> = ref(null);
  private currentType: Ref<MapEngineType | null> = ref(null);

  private constructor() {}

  static getInstance(): MapProvider {
    if (!MapProvider.instance) {
      MapProvider.instance = new MapProvider();
    }
    return MapProvider.instance;
  }

  async initEngine(type: MapEngineType, container: HTMLElement, options?: any): Promise<IMapEngine> {
    if (this.currentEngine.value) {
      this.currentEngine.value.destroy();
    }
    container.innerHTML = '';
    const engine = MapEngineFactory.createEngine(type);
    await engine.init(container, options);
    
    this.currentEngine.value = engine;
    this.currentType.value = type;
    
    return engine;
  }

  get engine(): IMapEngine | null {
    return this.currentEngine.value;
  }

  get type(): MapEngineType | null {
    return this.currentType.value;
  }

  get drawing() {
    return this.currentEngine.value?.drawing;
  }

  get measurement() {
    return this.currentEngine.value?.measurement;
  }

  get layerManager() {
    return this.currentEngine.value?.layerManager;
  }
}

export const mapProvider = MapProvider.getInstance();
