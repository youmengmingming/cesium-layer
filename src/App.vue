<template>
  <CesiumMap :config="mapConfig" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CesiumMap from './components/CesiumMap.vue';
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
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
