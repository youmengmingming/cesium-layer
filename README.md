# Cesium 地图项目

这是一个基于 Vue 3 + TypeScript + Vite + Cesium 的地图应用项目。

## 功能特性

- ✅ 完整的地图显示功能
- ✅ 可配置 Cesium Ion Token
- ✅ 支持多种地图数据源（Cesium Ion、OSM、Bing Maps、ArcGIS、Mapbox、自定义 URL）
- ✅ 可配置地形数据源
- ✅ 响应式设计，全屏地图显示

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置 Cesium Token

有两种方式配置 Cesium Ion Token：

#### 方式一：修改配置文件（推荐）

编辑 `src/config/cesium.config.ts` 文件，将 `token` 设置为您的 Cesium Ion Token：

```typescript
export const cesiumConfig: CesiumConfig = {
  token: 'YOUR_CESIUM_ION_TOKEN_HERE', // 替换为您的 Token
  // ...
};
```

#### 方式二：使用环境变量

创建 `.env` 文件：

```env
VITE_CESIUM_TOKEN=YOUR_CESIUM_ION_TOKEN_HERE
```

获取 Cesium Ion Token: https://cesium.com/ion/tokens

### 配置地图数据源

在 `src/config/cesium.config.ts` 中可以配置地图数据源：

```typescript
export const cesiumConfig: CesiumConfig = {
  token: 'YOUR_TOKEN',
  imageryProvider: {
    // 使用 Cesium Ion 默认影像
    useIonImagery: true,
    
    // 或者使用其他数据源
    // type: 'osm', // OpenStreetMap
    // type: 'arcgis', // ArcGIS
    // type: 'bing', // Bing Maps (需要 key)
    // type: 'mapbox', // Mapbox (需要 accessToken)
    // type: 'custom', // 自定义 URL
    // customImageryUrl: 'YOUR_IMAGERY_URL',
  },
  terrainProvider: {
    useIonTerrain: true, // 使用 Cesium Ion 默认地形
    // customTerrainUrl: 'YOUR_TERRAIN_URL',
  },
};
```

### 运行项目

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

## 项目结构

```
src/
├── config/
│   └── cesium.config.ts    # Cesium 配置文件（Token 和数据源配置）
├── components/
│   └── CesiumMap.vue       # 地图组件
├── App.vue                 # 主应用组件
└── main.ts                 # 入口文件
```

## 使用说明

### 在代码中动态配置地图

在 `src/App.vue` 中可以动态传入配置：

```vue
<template>
  <CesiumMap :config="mapConfig" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CesiumMap from './components/CesiumMap.vue';
import type { CesiumConfig } from './config/cesium.config';

const mapConfig = ref<Partial<CesiumConfig>>({
  token: 'YOUR_TOKEN',
  imageryProvider: {
    type: 'osm',
    useIonImagery: false,
  },
});
</script>
```

## 支持的数据源类型

- **Cesium Ion** (默认): 使用 Cesium Ion 的默认影像和地形
- **OpenStreetMap (OSM)**: 免费的开源地图
- **Bing Maps**: 需要 API Key
- **ArcGIS**: 支持 ArcGIS MapServer
- **Mapbox**: 需要 Access Token
- **自定义 URL**: 支持自定义影像服务 URL

## 注意事项

1. 使用 Cesium Ion 服务需要有效的 Token
2. 某些数据源（如 Bing Maps、Mapbox）需要额外的 API Key 或 Access Token
3. 如果未配置 Token，地图可能无法正常显示某些图层

## 相关链接

- [Cesium 官方文档](https://cesium.com/docs/cesiumjs-ref-doc/)
- [获取 Cesium Ion Token](https://cesium.com/ion/tokens)
- [Vue 3 文档](https://v3.vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
