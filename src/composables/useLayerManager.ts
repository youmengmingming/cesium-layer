import { computed } from 'vue';
import * as Cesium from 'cesium';
import { mapProvider } from '../map-engine/MapProvider';
import { useLayerStore } from '../stores/layers';

export function useLayerManager() {
  const layerStore = useLayerStore();
  const layers = computed(() => mapProvider.layerManager?.getLayers() ?? []);
  const viewer = computed(() => mapProvider.engine?.getOriginalViewer() as Cesium.Viewer | null);

  const createLayer = (name: string, options?: { visible?: boolean; id?: string }) => {
    return mapProvider.layerManager?.addLayer(name, options);
  };

  const removeLayer = (layerId: string) => {
    mapProvider.layerManager?.removeLayer(layerId);
  };

  const setLayerVisibility = (layerId: string, visible: boolean) => {
    mapProvider.layerManager?.setVisibility(layerId, visible);
  };

  const createEntityInLayer = (layerId: string, entityOptions: Cesium.Entity.ConstructorOptions) => {
    return layerStore.createEntityInLayer(layerId, entityOptions);
  };

  const createPrimitiveInLayer = (layerId: string, primitive: Cesium.Primitive) => {
    return layerStore.createPrimitiveInLayer(layerId, primitive);
  };

  return {
    layers,
    viewer,
    createLayer,
    removeLayer,
    setLayerVisibility,
    createEntityInLayer,
    createPrimitiveInLayer,
  };
}


