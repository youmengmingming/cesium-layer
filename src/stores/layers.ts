import { defineStore } from 'pinia';
import * as Cesium from 'cesium';

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

    setLayerVisibility(layerId: string, visible: boolean) {
      const layer = this.layers[layerId];
      if (layer) {
        layer.visible = visible;
      }
    },

    removeLayer(layerId: string) {
      if (this.layers[layerId]) {
        delete this.layers[layerId];
        this.layerOrder = this.layerOrder.filter((id) => id !== layerId);
      }
    },

    reset() {
      this.layers = {};
      this.layerOrder = [];
    },
  },
});


