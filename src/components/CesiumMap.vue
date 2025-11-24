<template>
  <div class="cesium-map-container" ref="mapContainerRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import * as Cesium from 'cesium';
import { cesiumConfig, type CesiumConfig } from '../config/cesium.config';
import { useCesiumStore } from '../stores/cesium';

interface Props {
  config?: Partial<CesiumConfig>;
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
});

const mapContainerRef = ref<HTMLDivElement | null>(null);
const cesiumStore = useCesiumStore();

// 合并配置
const getMergedConfig = (): CesiumConfig => {
  return {
    token: props.config.token || cesiumConfig.token,
    imageryProvider: {
      ...cesiumConfig.imageryProvider,
      ...props.config.imageryProvider,
    },
    terrainProvider: {
      ...cesiumConfig.terrainProvider,
      ...props.config.terrainProvider,
    },
  };
};

// 创建影像提供商
const createImageryProvider = (config: CesiumConfig): Cesium.ImageryProvider | undefined => {
  const imageryConfig = config.imageryProvider;
  
  if (!imageryConfig) {
    return undefined;
  }

  // 使用 Cesium Ion 默认影像
  if (imageryConfig.useIonImagery) {
    return new Cesium.IonImageryProvider({ assetId: 2 });
  }

  // 自定义影像提供商
  if (imageryConfig.type === 'osm') {
    return new Cesium.OpenStreetMapImageryProvider({
      url: 'https://a.tile.openstreetmap.org/',
    });
  }

  if (imageryConfig.type === 'bing') {
    return new Cesium.BingMapsImageryProvider({
      url: 'https://dev.virtualearth.net',
      key: imageryConfig.options?.key || '',
      mapStyle: imageryConfig.options?.mapStyle || Cesium.BingMapsStyle.AERIAL,
    });
  }

  if (imageryConfig.type === 'arcgis') {
    return new Cesium.ArcGisMapServerImageryProvider({
      url: imageryConfig.customImageryUrl || 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    });
  }

  if (imageryConfig.type === 'mapbox') {
    return new Cesium.MapboxImageryProvider({
      mapId: imageryConfig.options?.mapId || '',
      accessToken: imageryConfig.options?.accessToken || '',
    });
  }

  if (imageryConfig.type === 'custom' && imageryConfig.customImageryUrl) {
    return new Cesium.UrlTemplateImageryProvider({
      url: imageryConfig.customImageryUrl,
      ...imageryConfig.options,
    });
  }

  return undefined;
};

// 创建地形提供商
const createTerrainProvider = async (config: CesiumConfig): Promise<Cesium.TerrainProvider> => {
  const terrainConfig = config.terrainProvider;
  
  if (!terrainConfig) {
    // 默认使用椭球地形
    return new Cesium.EllipsoidTerrainProvider();
  }

  // 使用 Cesium Ion 默认地形（异步）
  if (terrainConfig.useIonTerrain) {
    try {
      // 使用 createWorldTerrainAsync 替代已弃用的 createWorldTerrain
      return await Cesium.createWorldTerrainAsync();
    } catch (error) {
      console.warn('创建 Cesium Ion 地形失败，使用椭球地形:', error);
      return new Cesium.EllipsoidTerrainProvider();
    }
  }

  // 自定义地形 URL（这里可以根据 URL 创建对应的地形提供商）
  if (terrainConfig.customTerrainUrl) {
    // 如果提供了自定义 URL，可以创建相应的地形提供商
    // 这里暂时返回椭球地形，可以根据实际需求扩展
    return new Cesium.EllipsoidTerrainProvider();
  }

  // 默认使用椭球地形
  return new Cesium.EllipsoidTerrainProvider();
};

// 初始化地图
const initMap = async () => {
  if (!mapContainerRef.value) {
    return;
  }

  const config = getMergedConfig();
  // 设置 Cesium Ion Token
  if (config.token && config.token !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZTQ4M2MzYS02YjI0LTRkN2YtYTcxNC1lZGNiZDUzNmVlNGEiLCJpZCI6MzYzMzI3LCJpYXQiOjE3NjM5ODEyODV9.cvweDrQKtp3UaWrVYjiAleWk3jwwxPKSH98ES40AN6U') {
    Cesium.Ion.defaultAccessToken = config.token;
  }

  // 创建影像提供商
  const imageryProvider = createImageryProvider(config);
  
  // 创建地形提供商（异步）
  const terrainProvider = await createTerrainProvider(config);

  // 如果已有 viewer，先销毁
  if (cesiumStore.viewer) {
    cesiumStore.destroyViewer();
  }

  // 创建 Viewer
  const viewer = new Cesium.Viewer(mapContainerRef.value, {
    imageryProvider: imageryProvider,
    terrainProvider: terrainProvider,
    baseLayerPicker: true, // 显示图层选择器
    geocoder: true, // 显示地理编码器
    homeButton: true, // 显示主页按钮
    sceneModePicker: true, // 显示场景模式选择器
    navigationHelpButton: false, // 显示导航帮助按钮
    animation: false, // 显示动画控件
    timeline: false, // 显示时间轴
    fullscreenButton: true, // 显示全屏按钮
    vrButton: false, // 隐藏 VR 按钮
    selectionIndicator: true, // 显示选择指示器
    infoBox: true, // 显示信息框
    shadows: false, // 关闭阴影以提高性能
    shouldAnimate: false, // 默认不播放动画
  });

  // 保存到 store
  cesiumStore.setViewer(viewer);
  cesiumStore.setConfig(config);

  // 设置默认视角（可选）
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.3974, 39.9093, 10000000), // 北京
  });
};

// 销毁地图
const destroyMap = () => {
  cesiumStore.destroyViewer();
};

onMounted(() => {
  initMap();
});

onUnmounted(() => {
  destroyMap();
});

// 监听配置变化
watch(
  () => props.config,
  async () => {
    if (cesiumStore.viewer) {
      destroyMap();
      await initMap();
    }
  },
  { deep: true }
);
</script>

<style scoped>
.cesium-map-container {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>

