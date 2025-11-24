import { computed } from 'vue';
import * as Cesium from 'cesium';
import { useCesiumStore } from '../stores/cesium';
import { useLayerStore } from '../stores/layers';

export interface LayerSummary {
  id: string;
  name: string;
  visible: boolean;
  entityCount: number;
  primitiveCount: number;
}

const ensureViewer = (viewer: Cesium.Viewer | null) => {
  if (!viewer) {
    throw new Error('Cesium Viewer 尚未初始化');
  }
  return viewer;
};

export function useLayerManager() {
  const cesiumStore = useCesiumStore();
  const layerStore = useLayerStore();

  const viewerRef = computed(() => cesiumStore.viewer);
  const layers = computed<LayerSummary[]>(() =>
    layerStore.layerList.map((layer) => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      entityCount: Object.keys(layer.entities).length,
      primitiveCount: Object.keys(layer.primitives).length,
    }))
  );

  const applyLayerVisibility = (layerId: string) => {
    const layer = layerStore.layers[layerId];
    if (!layer) {
      return;
    }

    const visible = layer.visible;
    Object.values(layer.entities).forEach((entity) => {
      entity.show = visible;
    });
    Object.values(layer.primitives).forEach((primitive) => {
      primitive.show = visible;
    });
  };

  const createLayer = (name: string, options?: { visible?: boolean; id?: string }) => {
    return layerStore.createLayer({
      name,
      visible: options?.visible,
      id: options?.id,
    });
  };

  const removeLayer = (layerId: string) => {
    const viewer = viewerRef.value;
    const layer = layerStore.layers[layerId];
    if (!layer) {
      return;
    }
    if (viewer) {
      Object.values(layer.entities).forEach((entity) => {
        viewer.entities.remove(entity);
      });
      Object.values(layer.primitives).forEach((primitive) => {
        viewer.scene.primitives.remove(primitive);
      });
    }
    layerStore.removeLayer(layerId);
  };

  const setLayerVisibility = (layerId: string, visible: boolean) => {
    layerStore.setLayerVisibility(layerId, visible);
    applyLayerVisibility(layerId);
  };

  const createEntityInLayer = (
    layerId: string,
    entityOptions: Cesium.Entity.ConstructorOptions
  ) => {
    const viewer = ensureViewer(viewerRef.value);
    const entity = viewer.entities.add(entityOptions);
    layerStore.attachEntity(layerId, entity);
    entity.show = layerStore.layers[layerId]?.visible ?? true;
    return entity;
  };

  const attachEntity = (layerId: string, entity: Cesium.Entity) => {
    layerStore.attachEntity(layerId, entity);
    entity.show = layerStore.layers[layerId]?.visible ?? true;
  };

  const createPrimitiveInLayer = (layerId: string, primitive: Cesium.Primitive) => {
    const viewer = ensureViewer(viewerRef.value);
    viewer.scene.primitives.add(primitive);
    layerStore.attachPrimitive(layerId, primitive);
    primitive.show = layerStore.layers[layerId]?.visible ?? true;
    return primitive;
  };

  const attachPrimitive = (layerId: string, primitive: Cesium.Primitive) => {
    layerStore.attachPrimitive(layerId, primitive);
    primitive.show = layerStore.layers[layerId]?.visible ?? true;
  };

  return {
    viewer: viewerRef,
    layers,
    createLayer,
    removeLayer,
    setLayerVisibility,
    createEntityInLayer,
    attachEntity,
    createPrimitiveInLayer,
    attachPrimitive,
  };
}


