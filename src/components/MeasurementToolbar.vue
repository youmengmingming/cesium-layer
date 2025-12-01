<template>
  <div class="measurement-toolbar">
    <div class="measurement-toolbar__header">
      <h3>测量工具</h3>
      <button
        v-if="isMeasuring"
        class="measurement-toolbar__cancel"
        type="button"
        @click="handleCancel"
      >
        取消
      </button>
    </div>

    <div class="measurement-toolbar__content">
      <div class="measurement-toolbar__tools">
        <button
          class="measurement-toolbar__tool"
          :class="{ active: activeType === 'point' }"
          type="button"
          :disabled="isMeasuring && activeType !== 'point'"
          @click="handleStartMeasurement('point')"
          title="点测量（显示经纬度和海拔）"
        >
          <span class="tool-icon">📍</span>
          <span>点测量</span>
        </button>

        <button
          class="measurement-toolbar__tool"
          :class="{ active: activeType === 'distance' }"
          type="button"
          :disabled="isMeasuring && activeType !== 'distance'"
          @click="handleStartMeasurement('distance')"
          title="距离测量（显示距离和方位）"
        >
          <span class="tool-icon">📏</span>
          <span>距离测量</span>
        </button>

        <button
          class="measurement-toolbar__tool"
          :class="{ active: activeType === 'area' }"
          type="button"
          :disabled="isMeasuring && activeType !== 'area'"
          @click="handleStartMeasurement('area')"
          title="面积测量"
        >
          <span class="tool-icon">🔷</span>
          <span>面积测量</span>
        </button>
      </div>

      <!-- 单位选择 -->
      <div v-if="activeType" class="measurement-toolbar__units">
        <!-- 点测量单位 -->
        <template v-if="activeType === 'point'">
          <div class="measurement-toolbar__unit-section">
            <label class="measurement-toolbar__label">海拔单位：</label>
            <select
              v-model="selectedElevationUnit"
              class="measurement-toolbar__select"
              @change="handleElevationUnitChange"
            >
              <option value="meter">米</option>
              <option value="foot">英尺</option>
            </select>
          </div>
        </template>

        <!-- 距离测量单位 -->
        <template v-if="activeType === 'distance'">
          <div class="measurement-toolbar__unit-section">
            <label class="measurement-toolbar__label">长度单位：</label>
            <select
              v-model="selectedLengthUnit"
              class="measurement-toolbar__select"
              @change="handleLengthUnitChange"
            >
              <option value="meter">米</option>
              <option value="kilometer">千米</option>
              <option value="foot">英尺</option>
              <option value="mile">英里</option>
              <option value="nautical-mile">海里</option>
            </select>
          </div>
        </template>

        <!-- 面积测量单位 -->
        <template v-if="activeType === 'area'">
          <div class="measurement-toolbar__unit-section">
            <label class="measurement-toolbar__label">面积单位：</label>
            <select
              v-model="selectedAreaUnit"
              class="measurement-toolbar__select"
              @change="handleAreaUnitChange"
            >
              <option value="square-meter">平方米</option>
              <option value="square-kilometer">平方千米</option>
              <option value="hectare">公顷</option>
              <option value="acre">英亩</option>
              <option value="square-foot">平方英尺</option>
            </select>
          </div>
        </template>
      </div>

      <!-- 测量结果显示 -->
      <div v-if="isMeasuring && currentMeasurement" class="measurement-toolbar__result">
        <div v-if="activeType === 'point'" class="measurement-result">
          <div class="measurement-result__item" v-if="currentMeasurement.longitude !== undefined">
            <span class="measurement-result__label">经度：</span>
            <span class="measurement-result__value">{{ currentMeasurement.longitude.toFixed(6) }}°</span>
          </div>
          <div class="measurement-result__item" v-if="currentMeasurement.latitude !== undefined">
            <span class="measurement-result__label">纬度：</span>
            <span class="measurement-result__value">{{ currentMeasurement.latitude.toFixed(6) }}°</span>
          </div>
          <div class="measurement-result__item" v-if="currentMeasurement.elevation !== undefined">
            <span class="measurement-result__label">海拔：</span>
            <span class="measurement-result__value">
              {{
                formatElevation(
                  currentMeasurement.elevation || 0,
                  elevationUnit
                )
              }}
            </span>
          </div>
        </div>

        <div v-if="activeType === 'distance'" class="measurement-result">
          <div class="measurement-result__item" v-if="currentMeasurement.distance !== undefined">
            <span class="measurement-result__label">当前段距离：</span>
            <span class="measurement-result__value">
              {{
                formatLength(
                  convertLength(currentMeasurement.distance || 0, 'meter', lengthUnit),
                  lengthUnit
                )
              }}
            </span>
          </div>
          <div class="measurement-result__item" v-if="currentMeasurement.totalDistance !== undefined">
            <span class="measurement-result__label">总距离：</span>
            <span class="measurement-result__value">
              {{
                formatLength(
                  convertLength(currentMeasurement.totalDistance || 0, 'meter', lengthUnit),
                  lengthUnit
                )
              }}
            </span>
          </div>
          <div class="measurement-result__item" v-if="currentMeasurement.bearing !== undefined">
            <span class="measurement-result__label">方位角：</span>
            <span class="measurement-result__value">{{ (currentMeasurement.bearing || 0).toFixed(1) }}°</span>
          </div>
        </div>

        <div v-if="activeType === 'area'" class="measurement-result">
          <div class="measurement-result__item" v-if="currentMeasurement.area !== undefined">
            <span class="measurement-result__label">面积：</span>
            <span class="measurement-result__value">
              {{
                formatArea(
                  convertArea(currentMeasurement.area || 0, 'square-meter', areaUnit),
                  areaUnit
                )
              }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="isMeasuring" class="measurement-toolbar__tip">
        <p v-if="activeType === 'point'">左键点击地图进行点测量</p>
        <p v-else-if="activeType === 'distance'">左键添加点，右键结束测量</p>
        <p v-else-if="activeType === 'area'">左键添加点，右键结束测量</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMeasurement, type MeasurementType } from '../composables/useMeasurement';
import {
  type LengthUnit,
  type AreaUnit,
  type ElevationUnit,
  convertLength,
  convertArea,
  convertElevation,
  formatLength,
  formatArea,
  formatElevation,
} from '../utils/unitConverter';

const {
  activeType,
  isMeasuring,
  currentMeasurement,
  lengthUnit,
  areaUnit,
  elevationUnit,
  startMeasurement,
  stopMeasurement,
  setLengthUnit,
  setAreaUnit,
  setElevationUnit,
} = useMeasurement();

const selectedLengthUnit = ref<LengthUnit>(lengthUnit.value);
const selectedAreaUnit = ref<AreaUnit>(areaUnit.value);
const selectedElevationUnit = ref<ElevationUnit>(elevationUnit.value);

// 同步单位状态
watch(lengthUnit, (newUnit) => {
  selectedLengthUnit.value = newUnit;
});

watch(areaUnit, (newUnit) => {
  selectedAreaUnit.value = newUnit;
});

watch(elevationUnit, (newUnit) => {
  selectedElevationUnit.value = newUnit;
});

const handleStartMeasurement = (type: MeasurementType) => {
  if (isMeasuring.value && activeType.value === type) {
    // 如果已经在测量同类型，则停止
    stopMeasurement();
  } else {
    startMeasurement(type);
  }
};

const handleCancel = () => {
  stopMeasurement();
};

const handleLengthUnitChange = () => {
  setLengthUnit(selectedLengthUnit.value);
};

const handleAreaUnitChange = () => {
  setAreaUnit(selectedAreaUnit.value);
};

const handleElevationUnitChange = () => {
  setElevationUnit(selectedElevationUnit.value);
};
</script>

<style scoped>
.measurement-toolbar {
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  color: var(--color-text);
  overflow-y: auto;
}

.measurement-toolbar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-border-light);
}

.measurement-toolbar__header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
}

.measurement-toolbar__cancel {
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

.measurement-toolbar__cancel:hover {
  background: var(--color-background-secondary);
  border-color: var(--color-border-dark);
  color: var(--color-text);
}

.measurement-toolbar__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

.measurement-toolbar__tools {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.measurement-toolbar__tool {
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

.measurement-toolbar__tool:hover:not(:disabled) {
  background: var(--color-background-secondary);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--color-shadow-light);
}

.measurement-toolbar__tool.active {
  background: var(--color-primary-gradient);
  border-color: var(--color-primary);
  color: var(--color-text-inverse);
  box-shadow: 0 4px 16px var(--color-shadow);
}

.measurement-toolbar__tool.active .tool-icon {
  transform: scale(1.1);
}

.measurement-toolbar__tool:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: var(--color-background-secondary);
}

.tool-icon {
  font-size: 24px;
  line-height: 1;
  transition: transform 0.2s;
}

.measurement-toolbar__units {
  padding: 16px;
  border-radius: var(--radius-md);
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
}

.measurement-toolbar__unit-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.measurement-toolbar__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.measurement-toolbar__select {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-base);
}

.measurement-toolbar__select:hover {
  border-color: var(--color-primary);
}

.measurement-toolbar__select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.measurement-toolbar__result {
  padding: 16px;
  border-radius: var(--radius-md);
  background: #e3f2fd;
  border: 1px solid #bbdefb;
}

.measurement-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.measurement-result__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
}

.measurement-result__label {
  color: #1976d2;
  font-weight: 500;
}

.measurement-result__value {
  color: #0d47a1;
  font-weight: 600;
}

.measurement-toolbar__tip {
  padding: 12px;
  border-radius: var(--radius-md);
  background: #fff3cd;
  color: #856404;
  font-size: var(--font-size-sm);
  text-align: center;
  border: 1px solid #ffeaa7;
  font-weight: 500;
}

.measurement-toolbar__tip p {
  margin: 0;
}
</style>

