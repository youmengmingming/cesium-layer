<template>
  <div class="layer-manager">
    <div class="layer-manager__header">
      <h3>图层管理</h3>
      <form class="layer-manager__form" @submit.prevent="handleCreateLayer">
        <input
          v-model="newLayerName"
          type="text"
          class="layer-manager__input"
          placeholder="输入图层名称"
        />
        <button class="layer-manager__button" type="submit">创建</button>
      </form>
    </div>

    <div v-if="layers.length === 0" class="layer-manager__empty">
      暂无图层，请创建一个新的图层。
    </div>

    <div v-else class="layer-manager__list">
      <div class="layer-card" v-for="layer in layers" :key="layer.id">
        <div class="layer-card__header">
          <div>
            <p class="layer-card__title">{{ layer.name }}</p>
            <p class="layer-card__subtitle">
              {{ layer.entityCount }} entities · {{ layer.primitiveCount }} primitives
            </p>
          </div>
          <div class="layer-card__actions">
            <label class="switch">
              <input
                type="checkbox"
                :checked="layer.visible"
                @change="toggleLayer(layer.id, $event.target?.checked ?? false)"
              />
              <span class="slider" />
            </label>
            <button class="icon-button" type="button" @click="removeLayer(layer.id)">
              删除
            </button>
          </div>
        </div>
        <div class="layer-card__footer">
          <button type="button" class="footer-button" @click="addSampleEntity(layer.id)">
            添加示例实体
          </button>
          <button type="button" class="footer-button" @click="addSamplePrimitive(layer.id)">
            添加示例 Primitive
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import * as Cesium from 'cesium';
import { useLayerManager } from '../composables/useLayerManager';

const {
  layers,
  viewer,
  createLayer,
  setLayerVisibility,
  removeLayer,
  createEntityInLayer,
  createPrimitiveInLayer,
} = useLayerManager();

const newLayerName = ref('');
const seeded = ref(false);

const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

const addSampleEntity = (layerId: string) => {
  if (!viewer.value) {
    return;
  }
  const entityPosition = Cesium.Cartesian3.fromDegrees(
    randomInRange(70, 130),
    randomInRange(15, 45),
    randomInRange(10000, 50000)
  );

  createEntityInLayer(layerId, {
    id: `sample-entity-${Date.now()}`,
    name: '示例实体',
    position: entityPosition,
    point: {
      pixelSize: 12,
      color: Cesium.Color.CYAN,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
    },
    label: {
      text: '示例',
      font: '14px sans-serif',
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      outlineWidth: 2,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -20),
    },
  });
};

const addSamplePrimitive = (layerId: string) => {
  if (!viewer.value) {
    return;
  }
  const rectangle = Cesium.Rectangle.fromDegrees(
    randomInRange(100, 110),
    randomInRange(20, 30),
    randomInRange(110, 120),
    randomInRange(30, 40)
  );

  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.RectangleGeometry({
        rectangle,
        height: 0,
      }),
    }),
    appearance: new Cesium.MaterialAppearance({
      material: Cesium.Material.fromType('Color', {
        color: Cesium.Color.fromRandom({ alpha: 0.5 }),
      }),
    }),
  });

  createPrimitiveInLayer(layerId, primitive);
};

const handleCreateLayer = () => {
  const name = newLayerName.value.trim();
  if (!name) {
    return;
  }
  createLayer(name);
  newLayerName.value = '';
};

const ensureDefaultLayer = () => {
  if (layers.value.length === 0) {
    const defaultLayer = createLayer('默认图层');
    return defaultLayer.id;
  }
  return layers.value[0].id;
};

const seedLayerContent = () => {
  if (seeded.value) {
    return;
  }
  const defaultLayerId = ensureDefaultLayer();
  if (viewer.value) {
    addSampleEntity(defaultLayerId);
    addSamplePrimitive(defaultLayerId);
    seeded.value = true;
  }
};

onMounted(seedLayerContent);

watch(
  viewer,
  () => {
    seedLayerContent();
  },
  { immediate: true }
);

const toggleLayer = (layerId: string, visible: boolean) => {
  setLayerVisibility(layerId, visible);
};
</script>

<style scoped>
.layer-manager {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 320px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 16px;
  border-radius: 12px;
  background: rgba(17, 24, 39, 0.78);
  color: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.layer-manager__header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layer-manager__form {
  display: flex;
  gap: 8px;
}

.layer-manager__input {
  flex: 1;
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
}

.layer-manager__button {
  border: none;
  border-radius: 8px;
  padding: 0 12px;
  background: #3d82ff;
  color: #fff;
  cursor: pointer;
}

.layer-manager__empty {
  margin-top: 24px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.layer-manager__list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layer-card {
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.layer-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.layer-card__title {
  font-weight: 600;
  font-size: 15px;
}

.layer-card__subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}

.layer-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-button {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.layer-card__footer {
  display: flex;
  gap: 8px;
}

.footer-button {
  flex: 1;
  padding: 6px 8px;
  border-radius: 6px;
  border: none;
  background: rgba(59, 130, 246, 0.6);
  color: #fff;
  cursor: pointer;
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.3);
  transition: 0.2s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3d82ff;
}

input:checked + .slider:before {
  transform: translateX(20px);
}
</style>


