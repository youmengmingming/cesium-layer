import { ref, computed, onUnmounted } from 'vue';
import * as Cesium from 'cesium';
import { useCesiumStore } from '../stores/cesium';
import { useLayerStore } from '../stores/layers';

export type DrawingType = 'point' | 'polyline' | 'polygon' | 'rectangle' | 'circle' | null;

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
  const drawPoint = (layerId: string, position: Cesium.Cartesian3) => {
    const viewer = getViewer();
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);

    return layerStore.createEntityInLayer(layerId, {
      id: `point-${Date.now()}`,
      name: '标绘点',
      position: position,
      point: {
        pixelSize: 10,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      label: {
        text: `(${longitude.toFixed(6)}, ${latitude.toFixed(6)})`,
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -25),
      },
    });
  };

  /**
   * 创建折线标绘
   */
  const drawPolyline = (layerId: string, positions: Cesium.Cartesian3[]) => {
    if (positions.length < 2) {
      return null;
    }

    const entity = layerStore.createEntityInLayer(layerId, {
      id: `polyline-${Date.now()}`,
      name: '标绘线',
      polyline: {
        positions: positions,
        width: 3,
        material: Cesium.Color.CYAN,
        clampToGround: true,
        allowPicking: true,
      },
    });
    // 确保实体可以被拾取
    if (entity.polyline) {
      entity.polyline.allowPicking = true;
    }
    return entity;
  };

  /**
   * 创建多边形标绘
   */
  const drawPolygon = (layerId: string, positions: Cesium.Cartesian3[]) => {
    if (positions.length < 3) {
      return null;
    }

    const entity = layerStore.createEntityInLayer(layerId, {
      id: `polygon-${Date.now()}`,
      name: '标绘面',
      polygon: {
        hierarchy: positions,
        material: Cesium.Color.CYAN.withAlpha(0.5),
        outline: true,
        outlineColor: Cesium.Color.CYAN,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        allowPicking: true,
      },
    });
    // 确保实体可以被拾取
    if (entity.polygon) {
      entity.polygon.allowPicking = true;
    }
    return entity;
  };

  /**
   * 创建矩形标绘
   */
  const drawRectangle = (layerId: string, rectangle: Cesium.Rectangle) => {
    const entity = layerStore.createEntityInLayer(layerId, {
      id: `rectangle-${Date.now()}`,
      name: '标绘矩形',
      rectangle: {
        coordinates: rectangle,
        material: Cesium.Color.BLUE.withAlpha(0.5),
        outline: true,
        outlineColor: Cesium.Color.BLUE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        allowPicking: true,
      },
    });
    // 确保实体可以被拾取
    if (entity.rectangle) {
      entity.rectangle.allowPicking = true;
    }
    return entity;
  };

  /**
   * 创建圆形标绘
   */
  const drawCircle = (layerId: string, center: Cesium.Cartesian3, radius: number) => {
    return layerStore.createEntityInLayer(layerId, {
      id: `circle-${Date.now()}`,
      name: '标绘圆',
      position: center,
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
        drawPoint(layerId, cartesian);
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
        drawPolyline(layerId, state.value.positions);
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
        drawPolygon(layerId, state.value.positions);
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
          drawRectangle(layerId, rectangle);
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
          drawCircle(layerId, center, radius);
        }
      }
      stopDrawing();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  };

  /**
   * 开始标绘（统一入口）
   */
  const startDrawing = (type: DrawingType, layerId: string) => {
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
  };
}

