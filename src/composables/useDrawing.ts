import { computed } from 'vue';
import { mapProvider } from '../map-engine/MapProvider';
import type { DrawingType, DrawingConfig } from '../map-engine/core/types';

export type { DrawingType, DrawingConfig };

export function useDrawing() {
  const isDrawing = computed(() => mapProvider.drawing?.isActive() ?? false);
  const activeType = computed(() => mapProvider.drawing?.getActiveType() ?? null);

  const startDrawing = (type: DrawingType, layerId: string, config?: DrawingConfig) => {
    mapProvider.drawing?.start(type, layerId, config);
  };

  const stopDrawing = () => {
    mapProvider.drawing?.stop();
  };

  return {
    isDrawing,
    activeType,
    startDrawing,
    stopDrawing,
  };
}
