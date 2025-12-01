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
                @change="toggleLayer(layer.id, ($event.target as HTMLInputElement)?.checked ?? false)"
              />
              <span class="slider" />
            </label>
            <button class="icon-button" type="button" @click="removeLayer(layer.id)">
              删除
            </button>
          </div>
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
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  background: #fff;
  color: #333;
  overflow-y: auto;
}

.layer-manager__header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.layer-manager__header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.layer-manager__form {
  display: flex;
  gap: 10px;
}

.layer-manager__input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
  font-size: 14px;
  transition: all 0.2s;
}

.layer-manager__input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.layer-manager__input::placeholder {
  color: #999;
}

.layer-manager__button {
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
}

.layer-manager__button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.layer-manager__button:active {
  transform: translateY(0);
}

.layer-manager__empty {
  margin-top: 40px;
  padding: 40px 20px;
  text-align: center;
  font-size: 14px;
  color: #999;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #e0e0e0;
}

.layer-manager__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.layer-card {
  padding: 16px;
  border-radius: 12px;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.layer-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.layer-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.layer-card__title {
  font-weight: 600;
  font-size: 16px;
  color: #333;
  margin: 0;
}

.layer-card__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #666;
  margin: 0;
}

.layer-card__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-button {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #666;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.icon-button:hover {
  background: #fee;
  border-color: #fcc;
  color: #c33;
}

.layer-card__footer {
  display: flex;
  gap: 10px;
}

.footer-button {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #667eea;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.footer-button:hover {
  background: #f8f9ff;
  border-color: #667eea;
  transform: translateY(-1px);
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
  background-color: #ccc;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: #667eea;
}

input:checked + .slider:before {
  transform: translateX(20px);
}
</style>


