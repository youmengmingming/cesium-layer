# 多引擎地图框架项目

这是一个基于 Vue 3 + TypeScript + Vite 构建的高可扩展地图应用框架。本项目核心特点是实现了一层**地图引擎中间层**，使得业务逻辑（如标绘、测量、图层管理）与底层 GIS 框架（Cesium, OpenLayers 等）解耦。

## 🌟 核心特性

- **🚀 多引擎无缝切换**: 支持在 **Cesium (3D)** 和 **OpenLayers (2D)** 之间实时切换，业务状态自动同步。
- **抽象层设计**: 通过统一的接口定义（Drawing, Measurement, LayerManager），极大降低了更换或新增地图引擎的成本。
- **标绘工具**: 支持点、线、面、矩形、圆的统一标绘操作。
- **测量工具**: 提供坐标、距离、面积的跨引擎测量功能。
- **图层管理**: 统一的图层生命周期管理，支持跨引擎的图层显隐控制、删除及导入导出。
- **窗口联动**: 支持主副窗口视角实时同步（基于 BroadcastChannel）。

## 🏗️ 架构设计

项目采用适配器模式设计地图引擎层，目录结构如下：

```
src/map-engine/
├── core/               # 核心抽象接口与类型定义
│   ├── interfaces.ts   # IMapEngine, IDrawing, IMeasurement 等接口
│   └── types.ts        # 统一的坐标、配置、结果类型
├── cesium/             # Cesium 引擎具体实现
├── ol/                 # OpenLayers 引擎具体实现
├── MapProvider.ts      # 全局地图引擎单例管理器
└── factory.ts          # 引擎工厂，负责创建不同类型的适配器
```

## 🛠️ 快速开始

### 安装依赖

```bash
npm install
```

### 运行项目

```bash
npm run dev
```

### 切换地图引擎

在页面顶部的导航栏右侧，可以通过下拉框在 `Cesium (3D)` 和 `OpenLayers (2D)` 之间进行切换。

## 📖 开发者指南

### 如何添加新地图引擎（以 Leaflet 为例）

1. **创建适配器目录**: `src/map-engine/leaflet/`
2. **实现接口**:
   - 实现 `LeafletEngine` 类（继承 `IMapEngine`）
   - 实现 `LeafletDrawing` 类（继承 `IDrawing`）
   - 实现 `LeafletMeasurement` 类（继承 `IMeasurement`）
   - 实现 `LeafletLayerManager` 类（继承 `ILayerManager`）
3. **注册引擎**: 在 `src/map-engine/factory.ts` 的 `MapEngineFactory` 中添加 `leaflet` 类型分支。
4. **UI 集成**: 在 `AppHeader.vue` 的切换器中添加 `Leaflet` 选项。

### 在业务组件中使用

通过 `useDrawing`, `useMeasurement`, `useLayerManager` 等 Composable 函数调用地图功能，无需关心当前底层是哪个地图引擎。

```typescript
import { useDrawing } from '../composables/useDrawing';

const { startDrawing, stopDrawing } = useDrawing();

// 开始绘制多边形，无论当前是 Cesium 还是 OpenLayers，调用方式完全一致
startDrawing('polygon', 'layer-id');
```

## ⚙️ 配置说明

### Cesium 配置
编辑 `src/config/cesium.config.ts` 配置 Token 和默认数据源。

### OpenLayers 配置
目前使用默认的 OSM 数据源，可在 `src/map-engine/ol/OLEngine.ts` 中修改初始化配置。

## 🔗 相关技术栈

- [Vue 3](https://v3.vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Pinia](https://pinia.vuejs.org/)
- [Cesium](https://cesium.com/)
- [OpenLayers](https://openlayers.org/)
- [Vite](https://vitejs.dev/)
