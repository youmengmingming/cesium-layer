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
  position: absolute;
  top: 16px;
  left: 16px;
  width: 280px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(17, 24, 39, 0.78);
  color: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.drawing-toolbar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.drawing-toolbar__header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.drawing-toolbar__cancel {
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: transparent;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.drawing-toolbar__cancel:hover {
  background: rgba(255, 255, 255, 0.1);
}

.drawing-toolbar__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drawing-toolbar__layer-select {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drawing-toolbar__label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.drawing-toolbar__select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.drawing-toolbar__select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.drawing-toolbar__hint {
  padding: 8px;
  border-radius: 6px;
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  font-size: 12px;
  text-align: center;
}

.drawing-toolbar__tools {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.drawing-toolbar__tool {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.drawing-toolbar__tool:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
}

.drawing-toolbar__tool.active {
  background: rgba(61, 130, 255, 0.3);
  border-color: #3d82ff;
  color: #fff;
}

.drawing-toolbar__tool:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tool-icon {
  font-size: 20px;
  line-height: 1;
}

.drawing-toolbar__tip {
  padding: 8px;
  border-radius: 6px;
  background: rgba(61, 130, 255, 0.2);
  color: #fff;
  font-size: 12px;
  text-align: center;
}

.drawing-toolbar__tip p {
  margin: 0;
}
</style>

