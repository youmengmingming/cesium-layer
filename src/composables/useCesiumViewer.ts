import { ref } from 'vue';
import { mapProvider } from '../map-engine/MapProvider';
import type { MapEngineType } from '../map-engine/core/types';

export function useCesiumViewer() {
  const containerRef = ref<HTMLDivElement | null>(null);
  const engine = ref(mapProvider.engine);

  const initViewer = async (typeOrOptions: MapEngineType | any = 'cesium', options?: any) => {
    let type: MapEngineType = 'cesium';
    let finalOptions = options;

    if (typeof typeOrOptions === 'string') {
      type = typeOrOptions as MapEngineType;
    } else if (typeOrOptions && typeof typeOrOptions === 'object') {
      type = typeOrOptions.type || 'cesium';
      finalOptions = typeOrOptions;
    }

    if (!containerRef.value) return;
    const instance = await mapProvider.initEngine(type, containerRef.value, finalOptions);
    engine.value = instance;
  };

  const destroyViewer = () => {
    if (mapProvider.engine) {
      mapProvider.engine.destroy();
    }
  };

  return {
    containerRef,
    engine,
    initViewer,
    destroyViewer,
  };
}

