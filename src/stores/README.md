# Cesium Store 使用说明

## 安装依赖

在使用 store 之前，请确保已安装 Pinia：

```bash
npm install pinia
```

## 使用方式

### 在其他组件中使用 Cesium Viewer

```vue
<script setup lang="ts">
import { useCesiumStore } from '@/stores/cesium';

const cesiumStore = useCesiumStore();

// 获取 viewer 实例
const viewer = cesiumStore.getViewer;

// 检查是否已初始化
const isInitialized = cesiumStore.getIsInitialized;

// 使用 viewer（需要先检查是否为 null）
if (viewer) {
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(120, 30, 10000),
  });
}
</script>
```

### Store API

#### State
- `viewer`: Cesium.Viewer 实例（可能为 null）
- `isInitialized`: 是否已初始化
- `config`: 当前 Cesium 配置

#### Getters
- `getViewer`: 获取 Viewer 实例
- `getIsInitialized`: 获取初始化状态
- `getConfig`: 获取当前配置

#### Actions
- `setViewer(viewer: Cesium.Viewer | null)`: 设置 Viewer 实例
- `setConfig(config: CesiumConfig)`: 设置配置
- `destroyViewer()`: 销毁 Viewer 实例
- `reset()`: 重置整个 Store 状态

