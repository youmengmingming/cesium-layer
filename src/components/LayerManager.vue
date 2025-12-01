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
  background: var(--color-background);
  color: var(--color-text);
  overflow-y: auto;
}

.layer-manager__header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--color-border-light);
}

.layer-manager__header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.layer-manager__form {
  display: flex;
  gap: 10px;
}

.layer-manager__input {
  flex: 1;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  transition: var(--transition-base);
}

.layer-manager__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.layer-manager__input::placeholder {
  color: var(--color-text-tertiary);
}

.layer-manager__button {
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  background: var(--color-primary-gradient);
  color: var(--color-text-inverse);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: var(--transition-base);
  white-space: nowrap;
}

.layer-manager__button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--color-shadow);
}

.layer-manager__button:active {
  transform: translateY(0);
}

.layer-manager__empty {
  margin-top: 40px;
  padding: 40px 20px;
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  background: var(--color-background-secondary);
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
}

.layer-manager__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.layer-card {
  padding: 16px;
  border-radius: var(--radius-lg);
  background: var(--color-background-secondary);
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid var(--color-border);
  transition: var(--transition-base);
}

.layer-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px var(--color-shadow-light);
}

.layer-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.layer-card__title {
  font-weight: 600;
  font-size: var(--font-size-md);
  color: var(--color-text);
  margin: 0;
}

.layer-card__subtitle {
  margin-top: 4px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.layer-card__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-button {
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: var(--transition-base);
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
  background-color: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(20px);
}
</style>


