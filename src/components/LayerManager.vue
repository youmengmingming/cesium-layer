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
      <div class="layer-manager__actions">
        <button class="layer-manager__action-button" type="button" @click="handleExport">
          <span>📥</span> 导出图层
        </button>
        <button class="layer-manager__action-button" type="button" @click="handleImport">
          <span>📤</span> 导入图层
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          style="display: none"
          @change="handleFileSelect"
        />
      </div>
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
        <div class="layer-card__footer">
          <button class="layer-card__footer-button" type="button" @click="handleExportLayer(layer.id)">
            <span>📥</span> 导出
          </button>
          <button class="layer-card__footer-button" type="button" @click="handleImportLayer(layer.id)">
            <span>📤</span> 导入
          </button>
          <input
            :ref="(el) => setFileInputRef(el, layer.id)"
            type="file"
            accept=".json"
            style="display: none"
            @change="(e) => handleLayerFileSelect(e, layer.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import * as Cesium from 'cesium';
import { useLayerManager } from '../composables/useLayerManager';
import { useLayerStore } from '../stores/layers';
import type { LayerExportData } from '../utils/layerImportExport';

const {
  layers,
  viewer,
  createLayer,
  setLayerVisibility,
  removeLayer,
  createEntityInLayer,
  createPrimitiveInLayer,
} = useLayerManager();

const layerStore = useLayerStore();
const newLayerName = ref('');
const seeded = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const layerFileInputRefs = ref<Record<string, HTMLInputElement>>({});

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

/**
 * 导出图层数据
 */
const handleExport = () => {
  try {
    const exportData = layerStore.exportAllLayers();
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `layers-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('导出图层失败:', error);
    alert('导出图层失败，请查看控制台获取详细信息');
  }
};

/**
 * 导入图层数据
 */
const handleImport = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

/**
 * 处理文件选择（全部图层导入）
 */
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const data: LayerExportData = JSON.parse(content);

      // 询问用户是合并还是替换
      const merge = confirm(
        '是否合并到现有图层？\n点击"确定"合并，点击"取消"替换所有图层'
      );

      layerStore.importLayers(data, merge);
      alert('导入成功！');
    } catch (error) {
      console.error('导入图层失败:', error);
      alert('导入图层失败，请检查文件格式是否正确');
    } finally {
      // 清空文件选择，以便可以重复选择同一文件
      if (target) {
        target.value = '';
      }
    }
  };
  reader.readAsText(file);
};

/**
 * 设置图层文件输入引用
 */
const setFileInputRef = (el: any, layerId: string) => {
  if (el) {
    layerFileInputRefs.value[layerId] = el as HTMLInputElement;
  }
};

/**
 * 导出单个图层
 */
const handleExportLayer = (layerId: string) => {
  try {
    const exportData = layerStore.exportSingleLayer(layerId);
    if (!exportData) {
      alert('图层不存在');
      return;
    }

    const layer = layerStore.layers[layerId];
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `layer-${layer.name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('导出图层失败:', error);
    alert('导出图层失败，请查看控制台获取详细信息');
  }
};

/**
 * 导入单个图层
 */
const handleImportLayer = (layerId: string) => {
  const input = layerFileInputRefs.value[layerId];
  if (input) {
    input.click();
  }
};

/**
 * 处理图层文件选择
 */
const handleLayerFileSelect = (event: Event, layerId: string) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const data: LayerExportData = JSON.parse(content);

      // 询问用户是合并到当前图层还是创建新图层
      const merge = confirm(
        `是否合并到当前图层"${layerStore.layers[layerId]?.name}"？\n点击"确定"合并到当前图层，点击"取消"创建新图层`
      );

      layerStore.importSingleLayer(data, merge ? layerId : undefined, merge);
      alert('导入成功！');
    } catch (error) {
      console.error('导入图层失败:', error);
      alert('导入图层失败，请检查文件格式是否正确');
    } finally {
      // 清空文件选择，以便可以重复选择同一文件
      if (target) {
        target.value = '';
      }
    }
  };
  reader.readAsText(file);
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

.layer-manager__actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.layer-manager__action-button {
  flex: 1;
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 16px;
  background: var(--color-background-secondary);
  color: var(--color-text);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--color-border);
}

.layer-manager__action-button:hover {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--color-shadow-light);
}

.layer-manager__action-button:active {
  transform: translateY(0);
}

.layer-manager__action-button span {
  font-size: var(--font-size-md);
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
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.layer-card__footer-button {
  flex: 1;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.layer-card__footer-button:hover {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--color-shadow-light);
}

.layer-card__footer-button:active {
  transform: translateY(0);
}

.layer-card__footer-button span {
  font-size: var(--font-size-md);
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


