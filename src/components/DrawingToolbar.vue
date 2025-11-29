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
  background: #fff;
  color: #333;
  overflow-y: auto;
}

.drawing-toolbar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.drawing-toolbar__header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.drawing-toolbar__cancel {
  padding: 6px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.drawing-toolbar__cancel:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
  color: #333;
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
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.drawing-toolbar__select {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.drawing-toolbar__select:hover:not(:disabled) {
  border-color: #667eea;
}

.drawing-toolbar__select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.drawing-toolbar__select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.drawing-toolbar__hint {
  padding: 12px;
  border-radius: 8px;
  background: #fff3cd;
  color: #856404;
  font-size: 13px;
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
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  background: #fff;
  color: #333;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 80px;
  justify-content: center;
}

.drawing-toolbar__tool:hover:not(:disabled) {
  background: #f8f9ff;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.drawing-toolbar__tool.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: #fff;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.drawing-toolbar__tool.active .tool-icon {
  transform: scale(1.1);
}

.drawing-toolbar__tool:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f5f5f5;
}

.tool-icon {
  font-size: 24px;
  line-height: 1;
  transition: transform 0.2s;
}

.drawing-toolbar__tip {
  padding: 12px;
  border-radius: 8px;
  background: #e3f2fd;
  color: #1976d2;
  font-size: 13px;
  text-align: center;
  border: 1px solid #bbdefb;
  font-weight: 500;
}

.drawing-toolbar__tip p {
  margin: 0;
}
</style>

