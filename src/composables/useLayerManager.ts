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

  /**
   * 创建图层（仅操作仓库，不依赖 Cesium）
   */
  const createLayer = (name: string, options?: { visible?: boolean; id?: string }) => {
    return layerStore.createLayer({
      name,
      visible: options?.visible,
      id: options?.id,
    });
  };

  /**
   * 同时从 Cesium 与仓库中删除图层
   * 实际逻辑由仓库负责，composable 只做薄封装
   */
  const removeLayer = (layerId: string) => {
    layerStore.removeLayerWithViewer(layerId);
  };

  /**
   * 设置图层可见性，并同步到 Cesium
   */
  const setLayerVisibility = (layerId: string, visible: boolean) => {
    layerStore.setLayerVisibilityWithViewer(layerId, visible);
  };

  /**
   * 在指定图层中创建 Entity，并挂接到 Cesium 场景
   * 这里直接复用仓库封装好的统一流程
   */
  const createEntityInLayer = (
    layerId: string,
    entityOptions: Cesium.Entity.ConstructorOptions
  ) => {
    return layerStore.createEntityInLayer(layerId, entityOptions);
  };

  /**
   * 将已有的 Entity 归属到某个图层（仅修改仓库，不负责添加到 viewer）
   */
  const attachEntity = (layerId: string, entity: Cesium.Entity) => {
    layerStore.attachEntity(layerId, entity);
    entity.show = layerStore.layers[layerId]?.visible ?? true;
  };

  /**
   * 在指定图层中创建 Primitive，并挂接到 Cesium 场景
   */
  const createPrimitiveInLayer = (layerId: string, primitive: Cesium.Primitive) => {
    return layerStore.createPrimitiveInLayer(layerId, primitive);
  };

  /**
   * 将已有的 Primitive 归属到某个图层（仅修改仓库，不负责添加到 viewer）
   */
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


