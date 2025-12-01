import { ref, computed, onUnmounted } from 'vue';
import * as Cesium from 'cesium';
import { useCesiumStore } from '../stores/cesium';
import { useLayerStore } from '../stores/layers';
import type { EntityConfig } from '../utils/layerImportExport';

export type DrawingType = 'point' | 'polyline' | 'polygon' | 'rectangle' | 'circle' | null;

/**
 * 将十六进制颜色字符串转换为Cesium Color
 */
function hexToCesiumColor(hex: string, alpha?: number): Cesium.Color {
  const hexClean = hex.replace('#', '');
  let r: number, g: number, b: number, a: number;
  
  if (hexClean.length === 8) {
    r = parseInt(hexClean.substring(0, 2), 16);
    g = parseInt(hexClean.substring(2, 4), 16);
    b = parseInt(hexClean.substring(4, 6), 16);
    a = parseInt(hexClean.substring(6, 8), 16);
  } else if (hexClean.length === 6) {
    r = parseInt(hexClean.substring(0, 2), 16);
    g = parseInt(hexClean.substring(2, 4), 16);
    b = parseInt(hexClean.substring(4, 6), 16);
    a = alpha !== undefined ? Math.round(alpha * 255) : 255;
  } else {
    throw new Error(`Invalid hex color format: ${hex}`);
  }
  
  return Cesium.Color.fromBytes(r, g, b, a);
}

interface DrawingState {
  activeType: DrawingType;
  isDrawing: boolean;
  handler: Cesium.ScreenSpaceEventHandler | null;
  activeEntity: Cesium.Entity | null;
  positions: Cesium.Cartesian3[];
  startPosition: Cesium.Cartesian3 | null;
}

export function useDrawing() {
  const cesiumStore = useCesiumStore();
  const layerStore = useLayerStore();

  const state = ref<DrawingState>({
    activeType: null,
    isDrawing: false,
    handler: null,
    activeEntity: null,
    positions: [],
    startPosition: null,
  });

  const activeType = computed(() => state.value.activeType);
  const isDrawing = computed(() => state.value.isDrawing);

  /**
   * 获取当前 viewer
   */
  const getViewer = (): Cesium.Viewer => {
    const viewer = cesiumStore.getViewer;
    if (!viewer) {
      throw new Error('Cesium Viewer 尚未初始化');
    }
    return viewer;
  };

  /**
   * 清理当前标绘状态
   */
  const cleanup = () => {
    if (state.value.handler) {
      state.value.handler.destroy();
      state.value.handler = null;
    }
    state.value.activeEntity = null;
    state.value.positions = [];
    state.value.startPosition = null;
    state.value.isDrawing = false;
  };

  /**
   * 停止标绘
   */
  const stopDrawing = () => {
    cleanup();
    state.value.activeType = null;
  };

  /**
   * 创建点标绘
   */
  const drawPoint = (layerId: string, position: Cesium.Cartesian3, config?: EntityConfig) => {
    const viewer = getViewer();
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);

    const pointColor = config?.fillColor 
      ? hexToCesiumColor(config.fillColor, config.fillColorAlpha)
      : Cesium.Color.YELLOW;
    const outlineColor = config?.outlineColor
      ? hexToCesiumColor(config.outlineColor, config.outlineColorAlpha)
      : Cesium.Color.BLACK;

    const labelText = config?.showPropertyName && config?.propertyName
      ? config.propertyName
      : `(${longitude.toFixed(6)}, ${latitude.toFixed(6)})`;

    return layerStore.createEntityInLayer(layerId, {
      id: `point-${Date.now()}`,
      name: config?.propertyName || '标绘点',
      position: position,
      point: {
        pixelSize: config?.lineWidth || 10,
        color: pointColor,
        outlineColor: outlineColor,
        outlineWidth: config?.outlineWidth ?? 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      label: config?.showPropertyName || config?.showLengthInfo ? {
        text: labelText,
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -25),
      } : undefined,
      _config: config,
    });
  };

  /**
   * 创建折线标绘
   */
  const drawPolyline = (layerId: string, positions: Cesium.Cartesian3[], config?: EntityConfig) => {
    if (positions.length < 2) {
      return null;
    }

    const lineColor = config?.lineColor
      ? hexToCesiumColor(config.lineColor, config.lineColorAlpha)
      : Cesium.Color.CYAN;

    const entity = layerStore.createEntityInLayer(layerId, {
      id: `polyline-${Date.now()}`,
      name: config?.propertyName || '标绘线',
      polyline: {
        positions: positions,
        width: config?.lineWidth ?? 3,
        material: lineColor,
        clampToGround: true,
      },
      _config: config,
    });
    return entity;
  };

  /**
   * 创建多边形标绘
   */
  const drawPolygon = (layerId: string, positions: Cesium.Cartesian3[], config?: EntityConfig) => {
    if (positions.length < 3) {
      return null;
    }

    const fillColor = config?.fillColor
      ? hexToCesiumColor(config.fillColor, config.fillColorAlpha ?? 0.5)
      : Cesium.Color.CYAN.withAlpha(0.5);
    const outlineColor = config?.outlineColor
      ? hexToCesiumColor(config.outlineColor, config.outlineColorAlpha)
      : Cesium.Color.CYAN;

    const entity = layerStore.createEntityInLayer(layerId, {
      id: `polygon-${Date.now()}`,
      name: config?.propertyName || '标绘面',
      polygon: {
        hierarchy: positions,
        material: fillColor,
        outline: config?.showBorder ?? config?.outline ?? true,
        outlineColor: outlineColor,
        outlineWidth: config?.outlineWidth ?? 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      _config: config,
    });
    return entity;
  };

  /**
   * 创建矩形标绘
   */
  const drawRectangle = (layerId: string, rectangle: Cesium.Rectangle, config?: EntityConfig) => {
    const fillColor = config?.fillColor
      ? hexToCesiumColor(config.fillColor, config.fillColorAlpha ?? 0.5)
      : Cesium.Color.BLUE.withAlpha(0.5);
    const outlineColor = config?.outlineColor
      ? hexToCesiumColor(config.outlineColor, config.outlineColorAlpha)
      : Cesium.Color.BLUE;

    const entity = layerStore.createEntityInLayer(layerId, {
      id: `rectangle-${Date.now()}`,
      name: config?.propertyName || '标绘矩形',
      rectangle: {
        coordinates: rectangle,
        material: fillColor,
        outline: config?.showBorder ?? config?.outline ?? true,
        outlineColor: outlineColor,
        outlineWidth: config?.outlineWidth ?? 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      _config: config,
    });
    return entity;
  };

  /**
   * 创建圆形标绘
   */
  const drawCircle = (layerId: string, center: Cesium.Cartesian3, radius: number, config?: EntityConfig) => {
    const fillColor = config?.fillColor
      ? hexToCesiumColor(config.fillColor, config.fillColorAlpha ?? 0.5)
      : Cesium.Color.GREEN.withAlpha(0.5);
    const outlineColor = config?.outlineColor
      ? hexToCesiumColor(config.outlineColor, config.outlineColorAlpha)
      : Cesium.Color.GREEN;

    return layerStore.createEntityInLayer(layerId, {
      id: `circle-${Date.now()}`,
      name: config?.propertyName || '标绘圆',
      position: center,
      ellipse: {
        semiMajorAxis: radius,
        semiMinorAxis: radius,
        material: fillColor,
        outline: config?.showBorder ?? config?.outline ?? true,
        outlineColor: outlineColor,
        outlineWidth: config?.outlineWidth ?? 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      _config: config,
    });
  };

  /**
   * 开始点标绘
   */
  const startPointDrawing = (layerId: string) => {
    stopDrawing();
    const viewer = getViewer();
    state.value.activeType = 'point';
    state.value.isDrawing = true;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    state.value.handler = handler;

    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        drawPoint(layerId, cartesian, (state.value as any).config);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  /**
   * 开始折线标绘
   */
  const startPolylineDrawing = (layerId: string) => {
    stopDrawing();
    const viewer = getViewer();
    state.value.activeType = 'polyline';
    state.value.isDrawing = true;
    state.value.positions = [];

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    state.value.handler = handler;

    // 左键点击添加点
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        state.value.positions.push(cartesian);
        updatePolylinePreview(viewer);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动时实时更新预览
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (state.value.positions.length > 0) {
        updatePolylinePreview(viewer, movement.endPosition);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 右键结束
    handler.setInputAction(() => {
      if (state.value.positions.length >= 2) {
        if (state.value.activeEntity) {
          viewer.entities.remove(state.value.activeEntity);
          state.value.activeEntity = null;
        }
        drawPolyline(layerId, state.value.positions, (state.value as any).config);
      }
      stopDrawing();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  };

  /**
   * 更新折线预览
   */
  const updatePolylinePreview = (
    viewer: Cesium.Viewer,
    currentPosition?: Cesium.Cartesian2
  ) => {
    if (state.value.activeEntity) {
      viewer.entities.remove(state.value.activeEntity);
    }

    const positions = [...state.value.positions];
    if (currentPosition) {
      const cartesian = viewer.camera.pickEllipsoid(
        currentPosition,
        viewer.scene.globe.ellipsoid
      );
      if (cartesian && positions.length > 0) {
        positions.push(cartesian);
      }
    }

    if (positions.length >= 2) {
      state.value.activeEntity = viewer.entities.add({
        polyline: {
          positions: positions,
          width: 4,
          material: Cesium.Color.YELLOW,
          clampToGround: true,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, Number.MAX_VALUE),
        },
      });
    }
  };

  /**
   * 开始多边形标绘
   */
  const startPolygonDrawing = (layerId: string) => {
    stopDrawing();
    const viewer = getViewer();
    state.value.activeType = 'polygon';
    state.value.isDrawing = true;
    state.value.positions = [];

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    state.value.handler = handler;

    // 左键点击添加点
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        state.value.positions.push(cartesian);
        updatePolygonPreview(viewer);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动时实时更新预览
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (state.value.positions.length > 0) {
        updatePolygonPreview(viewer, movement.endPosition);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 右键结束
    handler.setInputAction(() => {
      if (state.value.positions.length >= 3) {
        if (state.value.activeEntity) {
          viewer.entities.remove(state.value.activeEntity);
          state.value.activeEntity = null;
        }
        drawPolygon(layerId, state.value.positions, (state.value as any).config);
      }
      stopDrawing();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  };

  /**
   * 更新多边形预览
   */
  const updatePolygonPreview = (
    viewer: Cesium.Viewer,
    currentPosition?: Cesium.Cartesian2
  ) => {
    if (state.value.activeEntity) {
      viewer.entities.remove(state.value.activeEntity);
    }

    const positions = [...state.value.positions];
    if (currentPosition) {
      const cartesian = viewer.camera.pickEllipsoid(
        currentPosition,
        viewer.scene.globe.ellipsoid
      );
      if (cartesian && positions.length > 0) {
        positions.push(cartesian);
      }
    }

    if (positions.length >= 3) {
      state.value.activeEntity = viewer.entities.add({
        polygon: {
          hierarchy: [...positions, positions[0]],
          material: Cesium.Color.YELLOW.withAlpha(0.6),
          outline: true,
          outlineColor: Cesium.Color.YELLOW,
          outlineWidth: 3,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
    } else if (positions.length >= 2) {
      state.value.activeEntity = viewer.entities.add({
        polyline: {
          positions: positions,
          width: 3,
          material: Cesium.Color.YELLOW,
          clampToGround: true,
        },
      });
    }
  };

  /**
   * 开始矩形标绘
   */
  const startRectangleDrawing = (layerId: string) => {
    stopDrawing();
    const viewer = getViewer();
    state.value.activeType = 'rectangle';
    state.value.isDrawing = true;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    state.value.handler = handler;

    // 左键点击确定第一个点
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        if (!state.value.startPosition) {
          state.value.startPosition = cartesian;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动时实时更新矩形预览
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (state.value.startPosition) {
        const cartesian = viewer.camera.pickEllipsoid(
          movement.endPosition,
          viewer.scene.globe.ellipsoid
        );
        if (cartesian) {
          // 计算矩形
          const start = state.value.startPosition;
          const end = cartesian;

          const startCartographic = Cesium.Cartographic.fromCartesian(start);
          const endCartographic = Cesium.Cartographic.fromCartesian(end);

          const west = Math.min(
            Cesium.Math.toDegrees(startCartographic.longitude),
            Cesium.Math.toDegrees(endCartographic.longitude)
          );
          const south = Math.min(
            Cesium.Math.toDegrees(startCartographic.latitude),
            Cesium.Math.toDegrees(endCartographic.latitude)
          );
          const east = Math.max(
            Cesium.Math.toDegrees(startCartographic.longitude),
            Cesium.Math.toDegrees(endCartographic.longitude)
          );
          const north = Math.max(
            Cesium.Math.toDegrees(startCartographic.latitude),
            Cesium.Math.toDegrees(endCartographic.latitude)
          );

          const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);

          // 更新临时矩形
          if (state.value.activeEntity) {
            viewer.entities.remove(state.value.activeEntity);
          }

          state.value.activeEntity = viewer.entities.add({
            rectangle: {
              coordinates: rectangle,
              material: Cesium.Color.YELLOW.withAlpha(0.6),
              outline: true,
              outlineColor: Cesium.Color.YELLOW,
              outlineWidth: 3,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
          });
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 右键结束
    handler.setInputAction(() => {
      if (state.value.startPosition && state.value.activeEntity) {
        const rectangle = (state.value.activeEntity.rectangle?.coordinates?.getValue(
          viewer.clock.currentTime
        ) as Cesium.Rectangle) || null;

        if (rectangle) {
          viewer.entities.remove(state.value.activeEntity);
          state.value.activeEntity = null;
          drawRectangle(layerId, rectangle, (state.value as any).config);
        }
      }
      stopDrawing();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  };

  /**
   * 开始圆形标绘
   */
  const startCircleDrawing = (layerId: string) => {
    stopDrawing();
    const viewer = getViewer();
    state.value.activeType = 'circle';
    state.value.isDrawing = true;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    state.value.handler = handler;

    // 左键点击确定圆心
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        if (!state.value.startPosition) {
          state.value.startPosition = cartesian;
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动时实时更新圆形预览
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (state.value.startPosition) {
        const cartesian = viewer.camera.pickEllipsoid(
          movement.endPosition,
          viewer.scene.globe.ellipsoid
        );
        if (cartesian) {
          // 计算半径
          const radius = Cesium.Cartesian3.distance(state.value.startPosition, cartesian);

          // 更新临时圆
          if (state.value.activeEntity) {
            viewer.entities.remove(state.value.activeEntity);
          }

          state.value.activeEntity = viewer.entities.add({
            position: state.value.startPosition,
            ellipse: {
              semiMajorAxis: radius,
              semiMinorAxis: radius,
              material: Cesium.Color.GREEN.withAlpha(0.5),
              outline: true,
              outlineColor: Cesium.Color.GREEN,
              outlineWidth: 2,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
          });
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 右键结束
    handler.setInputAction(() => {
      if (state.value.startPosition && state.value.activeEntity) {
        const ellipse = state.value.activeEntity.ellipse;
        if (ellipse) {
          const center = state.value.startPosition;
          const radius = ellipse.semiMajorAxis?.getValue(viewer.clock.currentTime) || 0;

          viewer.entities.remove(state.value.activeEntity);
          state.value.activeEntity = null;
          drawCircle(layerId, center, radius, (state.value as any).config);
        }
      }
      stopDrawing();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  };

  /**
   * 开始标绘（统一入口）
   */
  const startDrawing = (type: DrawingType, layerId: string, config?: EntityConfig) => {
    // 保存配置到state中，供后续使用
    (state.value as any).config = config;
    
    switch (type) {
      case 'point':
        startPointDrawing(layerId);
        break;
      case 'polyline':
        startPolylineDrawing(layerId);
        break;
      case 'polygon':
        startPolygonDrawing(layerId);
        break;
      case 'rectangle':
        startRectangleDrawing(layerId);
        break;
      case 'circle':
        startCircleDrawing(layerId);
        break;
      default:
        stopDrawing();
    }
  };

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup();
  });

  return {
    activeType,
    isDrawing,
    startDrawing,
    stopDrawing,
    drawPoint,
    drawPolyline,
    drawPolygon,
    drawRectangle,
    drawCircle,
  };
}

export type { EntityConfig };

