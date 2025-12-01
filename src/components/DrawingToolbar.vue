<template>
  <div class="drawing-toolbar">
    <div class="drawing-toolbar__header">
      <h3>标绘工具</h3>
      <button
        v-if="isDrawing"
        class="drawing-toolbar__cancel"
        type="button"
        @click="handleCancel"
      >
        取消
      </button>
    </div>

    <div class="drawing-toolbar__content">
      <div class="drawing-toolbar__layer-select">
        <label class="drawing-toolbar__label">选择图层：</label>
        <select
          v-model="selectedLayerId"
          class="drawing-toolbar__select"
          :disabled="isDrawing"
        >
          <option value="">请选择图层</option>
          <option v-for="layer in layers" :key="layer.id" :value="layer.id">
            {{ layer.name }}
          </option>
        </select>
      </div>

      <div v-if="!selectedLayerId" class="drawing-toolbar__hint">
        请先选择一个图层
      </div>

      <div v-else class="drawing-toolbar__tools">
        <button
          class="drawing-toolbar__tool"
          :class="{ active: activeType === 'point' }"
          type="button"
          :disabled="isDrawing && activeType !== 'point'"
          @click="handleStartDrawing('point')"
          title="点标绘（左键点击）"
        >
          <span class="tool-icon">📍</span>
          <span>点</span>
        </button>

        <button
          class="drawing-toolbar__tool"
          :class="{ active: activeType === 'polyline' }"
          type="button"
          :disabled="isDrawing && activeType !== 'polyline'"
          @click="handleStartDrawing('polyline')"
          title="折线标绘（左键添加点，右键结束）"
        >
          <span class="tool-icon">📏</span>
          <span>折线</span>
        </button>

        <button
          class="drawing-toolbar__tool"
          :class="{ active: activeType === 'polygon' }"
          type="button"
          :disabled="isDrawing && activeType !== 'polygon'"
          @click="handleStartDrawing('polygon')"
          title="多边形标绘（左键添加点，右键结束）"
        >
          <span class="tool-icon">🔷</span>
          <span>多边形</span>
        </button>

        <button
          class="drawing-toolbar__tool"
          :class="{ active: activeType === 'rectangle' }"
          type="button"
          :disabled="isDrawing && activeType !== 'rectangle'"
          @click="handleStartDrawing('rectangle')"
          title="矩形标绘（左键确定两点，右键结束）"
        >
          <span class="tool-icon">⬜</span>
          <span>矩形</span>
        </button>

        <button
          class="drawing-toolbar__tool"
          :class="{ active: activeType === 'circle' }"
          type="button"
          :disabled="isDrawing && activeType !== 'circle'"
          @click="handleStartDrawing('circle')"
          title="圆形标绘（左键确定圆心和半径，右键结束）"
        >
          <span class="tool-icon">⭕</span>
          <span>圆形</span>
        </button>
      </div>

      <div v-if="isDrawing" class="drawing-toolbar__tip">
        <p v-if="activeType === 'point'">点击地图添加点</p>
        <p v-else-if="activeType === 'polyline'">左键添加点，右键结束</p>
        <p v-else-if="activeType === 'polygon'">左键添加点，右键结束</p>
        <p v-else-if="activeType === 'rectangle'">左键确定两点，右键结束</p>
        <p v-else-if="activeType === 'circle'">左键确定圆心和半径，右键结束</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useLayerManager } from '../composables/useLayerManager';
import { useDrawing, type DrawingType } from '../composables/useDrawing';

const { layers, createLayer } = useLayerManager();
const { activeType, isDrawing, startDrawing, stopDrawing } = useDrawing();

const selectedLayerId = ref<string>('');

// 确保有默认图层
watch(
  layers,
  (newLayers) => {
    if (newLayers.length > 0 && !selectedLayerId.value) {
      selectedLayerId.value = newLayers[0].id;
    } else if (newLayers.length === 0) {
      selectedLayerId.value = '';
    }
  },
  { immediate: true }
);

// 如果没有图层，创建一个默认图层
if (layers.value.length === 0) {
  const defaultLayer = createLayer('标绘图层');
  selectedLayerId.value = defaultLayer.id;
}

const handleStartDrawing = (type: DrawingType) => {
  if (!selectedLayerId.value) {
    alert('请先选择一个图层');
    return;
  }

  if (isDrawing.value && activeType.value === type) {
    // 如果已经在绘制同类型，则停止
    stopDrawing();
  } else {
    startDrawing(type, selectedLayerId.value);
  }
};

const handleCancel = () => {
  stopDrawing();
};
</script>

<style scoped>
.drawing-toolbar {
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  color: var(--color-text);
  overflow-y: auto;
}

.drawing-toolbar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-border-light);
}

.drawing-toolbar__header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.drawing-toolbar__cancel {
  padding: 6px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-base);
  font-weight: 500;
}

.drawing-toolbar__cancel:hover {
  background: var(--color-background-secondary);
  border-color: var(--color-border-dark);
  color: var(--color-text);
}

.drawing-toolbar__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

.drawing-toolbar__layer-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drawing-toolbar__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.drawing-toolbar__select {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-base);
}

.drawing-toolbar__select:hover:not(:disabled) {
  border-color: var(--color-primary);
}

.drawing-toolbar__select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.drawing-toolbar__select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-background-secondary);
}

.drawing-toolbar__hint {
  padding: 12px;
  border-radius: var(--radius-md);
  background: #fff3cd;
  color: #856404;
  font-size: var(--font-size-sm);
  text-align: center;
  border: 1px solid #ffeaa7;
}

.drawing-toolbar__tools {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.drawing-toolbar__tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-background);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-base);
  min-height: 80px;
  justify-content: center;
}

.drawing-toolbar__tool:hover:not(:disabled) {
  background: var(--color-background-secondary);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--color-shadow-light);
}

.drawing-toolbar__tool.active {
  background: var(--color-primary-gradient);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
  box-shadow: 0 4px 16px var(--color-shadow);
}

.drawing-toolbar__tool.active .tool-icon {
  transform: scale(1.1);
}

.drawing-toolbar__tool:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--color-background-secondary);
}

.tool-icon {
  font-size: 24px;
  line-height: 1;
  transition: transform 0.2s;
}

.drawing-toolbar__tip {
  padding: 12px;
  border-radius: var(--radius-md);
  background: #e3f2fd;
  color: #1976d2;
  font-size: var(--font-size-sm);
  text-align: center;
  border: 1px solid #bbdefb;
  font-weight: 500;
}

.drawing-toolbar__tip p {
  margin: 0;
}
</style>

