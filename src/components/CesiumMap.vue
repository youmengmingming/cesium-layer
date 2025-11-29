<template>
  <div class="cesium-map-wrapper">
    <div class="cesium-map-container" ref="mapContainerRef"></div>
    <DrawingToolbar />
    <LayerManager />
    <!-- <div class="window-bridge-panel">
      <div class="window-bridge-row">
        <span>当前窗口：{{ roleLabel }}</span>
      </div>
      <div class="window-bridge-row">
        <span>连接状态：{{ connectionLabel }}</span>
        <button
          v-if="isPrimary"
          class="bridge-button"
          type="button"
          @click="handleOpenSecondary"
        >
          {{ connectionState === 'connected' ? '重新打开副窗口' : '打开副窗口' }}
        </button>
      </div>
      <p class="window-bridge-hint" v-if="isPrimary && connectionState !== 'connected'">
        打开副窗口后，两端会自动同步镜头视角。
      </p>
      <p class="window-bridge-hint" v-else>
        副窗口会实时接收主窗口的视角同步信息。
      </p>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, toRef, watch } from 'vue';
import type { CesiumConfig } from '../config/cesium.config';
import { useWindowBridge } from '../composables/useWindowBridge';
import { useCesiumViewer } from '../composables/useCesiumViewer';
import LayerManager from './LayerManager.vue';
import DrawingToolbar from './DrawingToolbar.vue';

interface Props {
  config?: Partial<CesiumConfig>;
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
});

const configRef = toRef(props, 'config');

const {
  init: initWindowBridge,
  role: bridgeRole,
  connectionState,
  openSecondaryWindow,
} = useWindowBridge();

const {
  containerRef: mapContainerRef,
  viewer,
  initViewer,
  destroyViewer,
} = useCesiumViewer();

const isPrimary = computed(() => bridgeRole.value === 'primary');
const roleLabel = computed(() => (isPrimary.value ? '主窗口' : '副窗口'));
const connectionLabel = computed(() => {
  if (connectionState.value === 'connected') {
    return '已连接';
  }
  if (connectionState.value === 'connecting') {
    return '连接中...';
  }
  return '单窗口模式';
});

const bootViewer = async () => {
  await initViewer(configRef.value || {});
};

const handleOpenSecondary = () => {
  if (isPrimary.value) {
    openSecondaryWindow();
  }
};

onMounted(async () => {
  initWindowBridge();
  await bootViewer();
});

onUnmounted(() => {
  destroyViewer();
});

watch(
  configRef,
  async () => {
    await bootViewer();
  },
  { deep: true }
);
</script>

<style scoped>
.cesium-map-wrapper {
  position: relative;
}

.cesium-map-container {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.window-bridge-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  max-width: 320px;
  backdrop-filter: blur(6px);
}

.window-bridge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bridge-button {
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  background: #3d82ff;
  color: #fff;
  transition: background 0.2s ease;
}

.bridge-button:hover {
  background: #2f6ddb;
}

.window-bridge-hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}
</style>

<style>
/* 隐藏 Cesium 的 logo 图标 */
.cesium-viewer-bottom {
  display: none !important;
}
</style>

