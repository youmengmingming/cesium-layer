<template>
  <div class="app-container">
    <!-- 标题栏 -->
    <AppHeader />
    
    <!-- 地图容器 -->
    <div class="map-container">
      <CesiumMap :config="mapConfig" />
    </div>
    
    <!-- 渲染所有窗口 -->
    <DraggableWindow
      v-for="widget in widgets"
      :key="widget.id"
      :id="widget.id"
      :component="widget.component"
      :title="widget.title"
      :props="widget.props"
      :events="widget.events"
      :width="widget.width"
      :height="widget.height"
      :x="widget.x"
      :y="widget.y"
      :min-width="widget.minWidth"
      :min-height="widget.minHeight"
      :resizable="widget.resizable"
      :minimizable="widget.minimizable"
      :maximizable="widget.maximizable"
      :closable="widget.closable"
      :z-index="widget.zIndex"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import CesiumMap from './components/CesiumMap.vue';
import DraggableWindow from './components/DraggableWindow.vue';
import AppHeader from './components/AppHeader.vue';
import { useWidgetStore } from './stores/widgets';
import type { CesiumConfig } from './config/cesium.config';

// 可以在这里动态配置地图参数
// 如果需要通过界面配置，可以将 mapConfig 改为响应式对象，并提供配置界面
const mapConfig = ref<Partial<CesiumConfig>>({
  // 示例：覆盖默认配置
  // token: 'YOUR_TOKEN_HERE',
  // imageryProvider: {
  //   type: 'osm',
  //   useIonImagery: false,
  // },
});

// 获取所有窗口
const widgetStore = useWidgetStore();
const widgets = computed(() => widgetStore.getWidgets);
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--color-background);
  color: var(--color-text);
}

.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: 60px; /* 为固定定位的标题栏留出空间 */
  box-sizing: border-box; /* 确保 padding 包含在高度内 */
}

.map-container {
  flex: 1 1 auto; /* 允许 flex 子元素增长和收缩 */
  width: 100%;
  min-height: 0; /* 确保 flex 子元素可以正确收缩 */
  position: relative;
  overflow: hidden;
}
</style>
