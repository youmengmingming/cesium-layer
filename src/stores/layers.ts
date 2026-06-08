import { defineStore } from 'pinia';
import * as Cesium from 'cesium';
import { useCesiumStore } from './cesium';
import { mapProvider } from '../map-engine/MapProvider';
import {
  exportLayers,
  exportSingleLayer,
  importLayers,
  importSingleLayer,
  deserializeEntity,
  LayerExportData,
} from '../utils/layerImportExport';

export interface LayerRecord {
  id: string;
  name: string;
  visible: boolean;
  entities: Record<string, Cesium.Entity>;
  primitives: Record<string, Cesium.Primitive>;
  createdAt: number;
}

interface LayerState {
  layers: Record<string, LayerRecord>;
  layerOrder: string[];
}

interface CreateLayerOptions {
  id?: string;
  name: string;
  visible?: boolean;
}

export const useLayerStore = defineStore('layer-store', {
  state: (): LayerState => ({
    layers: {},
    layerOrder: [],
  }),

  getters: {
    layerList(state): LayerRecord[] {
      return state.layerOrder.map((layerId) => state.layers[layerId]).filter(Boolean);
    },
  },

  actions: {
    createLayer(options: CreateLayerOptions) {
      const id =
        options.id ||
        `layer-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

      if (this.layers[id]) {
        return this.layers[id];
      }

      const layer: LayerRecord = {
        id,
        name: options.name,
        visible: options.visible ?? true,
        entities: {},
        primitives: {},
        createdAt: Date.now(),
      };

      this.layers[id] = layer;
      this.layerOrder.push(id);
      return layer;
    },

    attachEntity(layerId: string, entity: Cesium.Entity) {
      const layer = this.layers[layerId];
      if (!layer) {
        throw new Error(`Layer ${layerId} not found`);
      }

      const entityId = entity.id || `entity-${Cesium.createGuid()}`;
      if (!entity.id) {
        entity.id = entityId;
      }
      layer.entities[entityId] = entity;
    },

    attachPrimitive(layerId: string, primitive: Cesium.Primitive) {
      const layer = this.layers[layerId];
      if (!layer) {
        throw new Error(`Layer ${layerId} not found`);
      }

      const primitiveId = (primitive as any)._id || `primitive-${Cesium.createGuid()}`;
      (primitive as any)._id = primitiveId;
      layer.primitives[primitiveId] = primitive;
    },

    detachEntity(layerId: string, entityId: string) {
      const layer = this.layers[layerId];
      if (layer?.entities[entityId]) {
        delete layer.entities[entityId];
      }
    },

    detachPrimitive(layerId: string, primitiveId: string) {
      const layer = this.layers[layerId];
      if (layer?.primitives[primitiveId]) {
        delete layer.primitives[primitiveId];
      }
    },

    /**
     * 仅修改仓库中图层的可见性标记，不直接操作 Cesium 对象
     */
    setLayerVisibility(layerId: string, visible: boolean) {
      const layer = this.layers[layerId];
      if (layer) {
        layer.visible = visible;
      }
    },

    /**
     * 同时更新仓库和 Cesium 场景中的可见性
     * 这是给外部模块直接调用的图层“管理函数”之一
     */
    setLayerVisibilityWithViewer(layerId: string, visible: boolean) {
      this.setLayerVisibility(layerId, visible);
      const layer = this.layers[layerId];
      if (!layer) {
        return;
      }

      Object.values(layer.entities).forEach((entity) => {
        entity.show = visible;
      });
      Object.values(layer.primitives).forEach((primitive) => {
        primitive.show = visible;
      });
    },

    /**
     * 仅删除仓库中的图层记录
     */
    removeLayer(layerId: string) {
      if (this.layers[layerId]) {
        delete this.layers[layerId];
        this.layerOrder = this.layerOrder.filter((id) => id !== layerId);
      }
    },

    /**
     * 同时从 Cesium 场景和仓库中删除图层及其所有对象
     * 这是给外部模块直接调用的图层“管理函数”之一
     */
    removeLayerWithViewer(layerId: string) {
      const cesiumStore = useCesiumStore();
      const viewer = cesiumStore.getViewer;
      const layer = this.layers[layerId];

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

      this.removeLayer(layerId);
    },

    /**
     * 在指定图层中创建 Entity 并自动挂接到 Cesium Viewer
     * 外部模块可以直接调用这个仓库方法来完成“往图层里加 Entity”的流程
     */
    createEntityInLayer(layerId: string, entityOptions: Cesium.Entity.ConstructorOptions & { _config?: any }) {
      const cesiumStore = useCesiumStore();
      let viewer = cesiumStore.getViewer;

      if (!viewer) {
        viewer = mapProvider.engine?.getOriginalViewer();
      }

      // 当前引擎不是 Cesium 时跳过实体创建
      if (!viewer || !('entities' in (viewer as any))) {
        const layer = this.layers[layerId];
        if (!layer) {
          throw new Error(`Layer ${layerId} not found`);
        }
        return null;
      }

      const config = (entityOptions as any)._config;
      const cleanOptions = { ...entityOptions };
      delete (cleanOptions as any)._config;

      const entity = (viewer as any).entities.add(cleanOptions);
      
      if (config) {
        (entity as any)._config = config;
      }
      
      this.attachEntity(layerId, entity);
      entity.show = this.layers[layerId]?.visible ?? true;
      return entity;
    },

    /**
     * 在指定图层中创建 Primitive 并自动挂接到 Cesium Viewer
     * 外部模块可以直接调用这个仓库方法来完成“往图层里加 Primitive”的流程
     */
    createPrimitiveInLayer(layerId: string, primitive: Cesium.Primitive) {
      const cesiumStore = useCesiumStore();
      let viewer = cesiumStore.getViewer;

      if (!viewer) {
        viewer = mapProvider.engine?.getOriginalViewer();
      }

      if (!viewer || !('scene' in (viewer as any))) {
        const layer = this.layers[layerId];
        if (!layer) {
          throw new Error(`Layer ${layerId} not found`);
        }
        return null;
      }

      (viewer as any).scene.primitives.add(primitive);
      this.attachPrimitive(layerId, primitive);
      primitive.show = this.layers[layerId]?.visible ?? true;
      return primitive;
    },

    reset() {
      this.layers = {};
      this.layerOrder = [];
    },

    /**
     * 导出所有图层数据
     */
    exportAllLayers(): LayerExportData {
      return exportLayers(this.layerList);
    },

    /**
     * 导出单个图层数据
     */
    exportSingleLayer(layerId: string): LayerExportData | null {
      const layer = this.layers[layerId];
      if (!layer) {
        return null;
      }
      return exportSingleLayer(layer);
    },

    /**
     * 导入图层数据
     */
    importLayers(data: LayerExportData, merge: boolean = false) {
      if (!merge) {
        // 如果不合并，先清空现有图层
        const cesiumStore = useCesiumStore();
        const viewer = cesiumStore.getViewer;
        
        // 删除所有现有图层
        const layerIds = [...this.layerOrder];
        layerIds.forEach((layerId) => {
          this.removeLayerWithViewer(layerId);
        });
      }

      const importedData = importLayers(data);

      importedData.forEach(({ layer, entities }) => {
        // 如果合并模式且ID已存在，生成新ID
        let layerId = layer.id;
        if (merge && this.layers[layerId]) {
          // 生成新ID，但保留原始ID作为后缀以便识别
          layerId = `${layer.id}-imported-${Date.now()}`;
        }

        // 创建图层
        const newLayer = this.createLayer({
          id: layerId,
          name: merge && this.layers[layer.id] ? `${layer.name} (导入)` : layer.name,
          visible: layer.visible,
        });

        // 恢复创建时间
        if (layer.createdAt && !merge) {
          newLayer.createdAt = layer.createdAt;
        }

        // 导入entities
        entities.forEach((serializedEntity) => {
          try {
            const entityOptions = deserializeEntity(serializedEntity);
            // 如果合并模式，为entity生成新ID以避免冲突
            if (merge) {
              entityOptions.id = `${serializedEntity.id}-imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            }
            this.createEntityInLayer(newLayer.id, entityOptions);
          } catch (error) {
            console.error('导入实体失败:', serializedEntity, error);
          }
        });
      });
    },

    /**
     * 导入单个图层数据
     */
    importSingleLayer(data: LayerExportData, targetLayerId?: string, merge: boolean = false) {
      const importedData = importSingleLayer(data);
      if (!importedData) {
        return;
      }

      const { layer, entities } = importedData;

      // 如果指定了目标图层ID，则导入到该图层
      if (targetLayerId) {
        const targetLayer = this.layers[targetLayerId];
        if (!targetLayer) {
          throw new Error(`目标图层 ${targetLayerId} 不存在`);
        }

        // 导入entities到目标图层
        entities.forEach((serializedEntity) => {
          try {
            const entityOptions = deserializeEntity(serializedEntity);
            // 如果合并模式，为entity生成新ID以避免冲突
            if (merge) {
              entityOptions.id = `${serializedEntity.id}-imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            }
            this.createEntityInLayer(targetLayerId, entityOptions);
          } catch (error) {
            console.error('导入实体失败:', serializedEntity, error);
          }
        });
      } else {
        // 创建新图层
        let layerId = layer.id;
        if (merge && this.layers[layerId]) {
          layerId = `${layer.id}-imported-${Date.now()}`;
        }

        const newLayer = this.createLayer({
          id: layerId,
          name: merge && this.layers[layer.id] ? `${layer.name} (导入)` : layer.name,
          visible: layer.visible,
        });

        if (layer.createdAt && !merge) {
          newLayer.createdAt = layer.createdAt;
        }

        // 导入entities
        entities.forEach((serializedEntity) => {
          try {
            const entityOptions = deserializeEntity(serializedEntity);
            if (merge) {
              entityOptions.id = `${serializedEntity.id}-imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            }
            this.createEntityInLayer(newLayer.id, entityOptions);
          } catch (error) {
            console.error('导入实体失败:', serializedEntity, error);
          }
        });
      }
    },
  },
});


