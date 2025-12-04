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
  activePrimitive: Cesium.Primitive | Cesium.PointPrimitive | null;
  positions: Cesium.Cartesian3[];
  startPosition: Cesium.Cartesian3 | null;
  previewPrimitive: Cesium.Primitive | null;
  previewRectangle: Cesium.Rectangle | null;
  previewCircleRadius: number | null;
}

export function useDrawing() {
  const cesiumStore = useCesiumStore();
  const layerStore = useLayerStore();

  const state = ref<DrawingState>({
    activeType: null,
    isDrawing: false,
    handler: null,
    activePrimitive: null,
    positions: [],
    startPosition: null,
    previewPrimitive: null,
    previewRectangle: null,
    previewCircleRadius: null,
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
    const viewer = cesiumStore.getViewer;
    if (viewer && state.value.previewPrimitive) {
      viewer.scene.primitives.remove(state.value.previewPrimitive);
      state.value.previewPrimitive = null;
    }
    state.value.activePrimitive = null;
    state.value.positions = [];
    state.value.startPosition = null;
    state.value.previewRectangle = null;
    state.value.previewCircleRadius = null;
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
   * 创建点标绘（使用Primitive）
   */
  const drawPoint = (layerId: string, position: Cesium.Cartesian3, config?: EntityConfig) => {
    const viewer = getViewer();
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);

    const pointColor = config?.fillColor 
      ? hexToCesiumColor(config.fillColor, config.fillColorAlpha)
      : Cesium.Color.YELLOW;

    const pointPrimitiveCollection = new Cesium.PointPrimitiveCollection();
    const pointPrimitive = pointPrimitiveCollection.add({
      position: position,
      pixelSize: config?.lineWidth || 10,
      color: pointColor,
      outlineColor: config?.outlineColor
        ? hexToCesiumColor(config.outlineColor, config.outlineColorAlpha)
        : Cesium.Color.BLACK,
      outlineWidth: config?.outlineWidth ?? 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    });

    // 存储配置和元数据
    (pointPrimitiveCollection as any)._id = `point-${Date.now()}`;
    (pointPrimitiveCollection as any)._name = config?.propertyName || '标绘点';
    (pointPrimitiveCollection as any)._config = config;
    (pointPrimitiveCollection as any)._type = 'point';
    (pointPrimitiveCollection as any)._position = position; // 存储位置信息用于高亮

    // 如果需要标签，使用Billboard或Label
    if (config?.showPropertyName || config?.showLengthInfo) {
      const labelText = config?.showPropertyName && config?.propertyName
        ? config.propertyName
        : `(${longitude.toFixed(6)}, ${latitude.toFixed(6)})`;
      
      const labelPrimitive = new Cesium.LabelCollection();
      labelPrimitive.add({
        position: position,
        text: labelText,
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -25),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      });
      
      viewer.scene.primitives.add(labelPrimitive);
      layerStore.attachPrimitive(layerId, labelPrimitive as any);
    }

    const primitive = layerStore.createPrimitiveInLayer(layerId, pointPrimitiveCollection as any);
    return primitive;
  };

  /**
   * 创建折线标绘（使用Primitive）
   */
  const drawPolyline = (layerId: string, positions: Cesium.Cartesian3[], config?: EntityConfig) => {
    if (positions.length < 2) {
      return null;
    }

    const lineColor = config?.lineColor
      ? hexToCesiumColor(config.lineColor, config.lineColorAlpha)
      : Cesium.Color.CYAN;

    const polylineGeometry = new Cesium.PolylineGeometry({
      positions: positions,
      width: config?.lineWidth ?? 3,
      vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
    });

    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: polylineGeometry,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(lineColor),
        },
      }),
      appearance: new Cesium.PolylineColorAppearance({
        translucent: lineColor.alpha < 1.0,
      }),
      asynchronous: false,
    });

    // 存储配置和元数据
    (primitive as any)._id = `polyline-${Date.now()}`;
    (primitive as any)._name = config?.propertyName || '标绘线';
    (primitive as any)._config = config;
    (primitive as any)._type = 'polyline';
    (primitive as any)._positions = positions; // 存储位置信息用于高亮

    return layerStore.createPrimitiveInLayer(layerId, primitive);
  };

  /**
   * 创建多边形标绘（使用Primitive）
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

    const polygonGeometry = new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(positions),
      height: 0,
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    });

    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: polygonGeometry,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(fillColor),
        },
      }),
      appearance: new Cesium.PerInstanceColorAppearance({
        translucent: fillColor.alpha < 1.0,
        closed: true,
      }),
      asynchronous: false,
    });

    // 存储配置和元数据
    (primitive as any)._id = `polygon-${Date.now()}`;
    (primitive as any)._name = config?.propertyName || '标绘面';
    (primitive as any)._config = config;
    (primitive as any)._type = 'polygon';
    (primitive as any)._positions = positions; // 存储位置信息用于高亮

    const result = layerStore.createPrimitiveInLayer(layerId, primitive);

    // 如果需要边框，单独创建一个折线Primitive
    if (config?.showBorder ?? config?.outline ?? true) {
      const outlinePositions = [...positions, positions[0]]; // 闭合多边形
      const outlineGeometry = new Cesium.PolylineGeometry({
        positions: outlinePositions,
        width: config?.outlineWidth ?? 2,
        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
      });

      const outlinePrimitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: outlineGeometry,
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(outlineColor),
          },
        }),
        appearance: new Cesium.PolylineColorAppearance(),
        asynchronous: false,
      });

      // 将边框primitive关联到同一个图层
      (outlinePrimitive as any)._id = `polygon-outline-${Date.now()}`;
      (outlinePrimitive as any)._parentId = (primitive as any)._id;
      layerStore.attachPrimitive(layerId, outlinePrimitive);
      const viewer = getViewer();
      viewer.scene.primitives.add(outlinePrimitive);
      outlinePrimitive.show = layerStore.layers[layerId]?.visible ?? true;
    }

    return result;
  };

  /**
   * 创建矩形标绘（使用Primitive）
   */
  const drawRectangle = (layerId: string, rectangle: Cesium.Rectangle, config?: EntityConfig) => {
    const fillColor = config?.fillColor
      ? hexToCesiumColor(config.fillColor, config.fillColorAlpha ?? 0.5)
      : Cesium.Color.BLUE.withAlpha(0.5);
    const outlineColor = config?.outlineColor
      ? hexToCesiumColor(config.outlineColor, config.outlineColorAlpha)
      : Cesium.Color.BLUE;

    const rectangleGeometry = new Cesium.RectangleGeometry({
      rectangle: rectangle,
      height: 0,
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    });

    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: rectangleGeometry,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(fillColor),
        },
      }),
      appearance: new Cesium.PerInstanceColorAppearance({
        translucent: fillColor.alpha < 1.0,
        closed: true,
      }),
      asynchronous: false,
    });

    // 存储配置和元数据
    (primitive as any)._id = `rectangle-${Date.now()}`;
    (primitive as any)._name = config?.propertyName || '标绘矩形';
    (primitive as any)._config = config;
    (primitive as any)._type = 'rectangle';
    (primitive as any)._rectangle = rectangle; // 存储矩形信息用于高亮

    const result = layerStore.createPrimitiveInLayer(layerId, primitive);

    // 如果需要边框，单独创建一个折线Primitive
    if (config?.showBorder ?? config?.outline ?? true) {
      const southwest = Cesium.Cartesian3.fromRadians(
        rectangle.west,
        rectangle.south,
        0
      );
      const southeast = Cesium.Cartesian3.fromRadians(
        rectangle.east,
        rectangle.south,
        0
      );
      const northeast = Cesium.Cartesian3.fromRadians(
        rectangle.east,
        rectangle.north,
        0
      );
      const northwest = Cesium.Cartesian3.fromRadians(
        rectangle.west,
        rectangle.north,
        0
      );
      const outlinePositions = [
        southwest,
        southeast,
        northeast,
        northwest,
        southwest, // 闭合
      ];
      const outlineGeometry = new Cesium.PolylineGeometry({
        positions: outlinePositions,
        width: config?.outlineWidth ?? 2,
        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
      });

      const outlinePrimitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: outlineGeometry,
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(outlineColor),
          },
        }),
        appearance: new Cesium.PolylineColorAppearance(),
        asynchronous: false,
      });

      // 将边框primitive关联到同一个图层
      (outlinePrimitive as any)._id = `rectangle-outline-${Date.now()}`;
      (outlinePrimitive as any)._parentId = (primitive as any)._id;
      layerStore.attachPrimitive(layerId, outlinePrimitive);
      const viewer = getViewer();
      viewer.scene.primitives.add(outlinePrimitive);
      outlinePrimitive.show = layerStore.layers[layerId]?.visible ?? true;
    }

    return result;
  };

  /**
   * 创建圆形标绘（使用Primitive）
   */
  const drawCircle = (layerId: string, center: Cesium.Cartesian3, radius: number, config?: EntityConfig) => {
    const fillColor = config?.fillColor
      ? hexToCesiumColor(config.fillColor, config.fillColorAlpha ?? 0.5)
      : Cesium.Color.GREEN.withAlpha(0.5);
    const outlineColor = config?.outlineColor
      ? hexToCesiumColor(config.outlineColor, config.outlineColorAlpha)
      : Cesium.Color.GREEN;

    // 计算圆形上的点，使用PolygonGeometry来绘制圆形
    const cartographic = Cesium.Cartographic.fromCartesian(center);
    const positions: Cesium.Cartesian3[] = [];
    const numPoints = 64;
    
    // 计算圆形轮廓点 - 使用简化的方法
    // 计算单位圆上的点，然后根据半径和中心点进行变换
    const normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(center, new Cesium.Cartesian3());
    const east = Cesium.Cartesian3.cross(
      Cesium.Cartesian3.UNIT_Z,
      normal,
      new Cesium.Cartesian3()
    );
    Cesium.Cartesian3.normalize(east, east);
    const north = Cesium.Cartesian3.cross(normal, east, new Cesium.Cartesian3());
    Cesium.Cartesian3.normalize(north, north);
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Cesium.Math.TWO_PI;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      
      // 在切平面上计算点
      const point = new Cesium.Cartesian3();
      Cesium.Cartesian3.multiplyByScalar(east, radius * cosAngle, point);
      const northComponent = new Cesium.Cartesian3();
      Cesium.Cartesian3.multiplyByScalar(north, radius * sinAngle, northComponent);
      Cesium.Cartesian3.add(point, northComponent, point);
      Cesium.Cartesian3.add(center, point, point);
      
      // 将点投影到椭球面上
      const cartographicPoint = Cesium.Cartographic.fromCartesian(point);
      positions.push(Cesium.Cartesian3.fromRadians(
        cartographicPoint.longitude,
        cartographicPoint.latitude,
        cartographic.height
      ));
    }

    const polygonGeometry = new Cesium.PolygonGeometry({
      polygonHierarchy: new Cesium.PolygonHierarchy(positions),
      height: 0,
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
    });

    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: polygonGeometry,
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(fillColor),
        },
      }),
      appearance: new Cesium.PerInstanceColorAppearance({
        translucent: fillColor.alpha < 1.0,
        closed: true,
      }),
      asynchronous: false,
    });

    // 存储配置和元数据
    (primitive as any)._id = `circle-${Date.now()}`;
    (primitive as any)._name = config?.propertyName || '标绘圆';
    (primitive as any)._config = config;
    (primitive as any)._type = 'circle';
    (primitive as any)._center = center; // 存储中心点用于高亮
    (primitive as any)._radius = radius; // 存储半径用于高亮
    (primitive as any)._positions = positions; // 存储位置信息用于高亮

    const result = layerStore.createPrimitiveInLayer(layerId, primitive);

    // 如果需要边框，单独创建一个折线Primitive（圆形轮廓）
    if (config?.showBorder ?? config?.outline ?? true) {
      const outlinePositions = [...positions, positions[0]]; // 闭合圆形

      const outlineGeometry = new Cesium.PolylineGeometry({
        positions: outlinePositions,
        width: config?.outlineWidth ?? 2,
        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
      });

      const outlinePrimitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: outlineGeometry,
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(outlineColor),
          },
        }),
        appearance: new Cesium.PolylineColorAppearance(),
        asynchronous: false,
      });

      // 将边框primitive关联到同一个图层
      (outlinePrimitive as any)._id = `circle-outline-${Date.now()}`;
      (outlinePrimitive as any)._parentId = (primitive as any)._id;
      layerStore.attachPrimitive(layerId, outlinePrimitive);
      const viewer = getViewer();
      viewer.scene.primitives.add(outlinePrimitive);
      outlinePrimitive.show = layerStore.layers[layerId]?.visible ?? true;
    }

    return result;
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
        if (state.value.previewPrimitive) {
          viewer.scene.primitives.remove(state.value.previewPrimitive);
          state.value.previewPrimitive = null;
        }
        drawPolyline(layerId, state.value.positions, (state.value as any).config);
      }
      stopDrawing();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  };

  /**
   * 更新折线预览（使用Primitive）
   */
  const updatePolylinePreview = (
    viewer: Cesium.Viewer,
    currentPosition?: Cesium.Cartesian2
  ) => {
    if (state.value.previewPrimitive) {
      viewer.scene.primitives.remove(state.value.previewPrimitive);
      state.value.previewPrimitive = null;
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
      const polylineGeometry = new Cesium.PolylineGeometry({
        positions: positions,
        width: 4,
        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
      });

      const primitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: polylineGeometry,
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW),
          },
        }),
        appearance: new Cesium.PolylineColorAppearance(),
        asynchronous: false,
      });

      viewer.scene.primitives.add(primitive);
      state.value.previewPrimitive = primitive;
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
        if (state.value.previewPrimitive) {
          viewer.scene.primitives.remove(state.value.previewPrimitive);
          state.value.previewPrimitive = null;
        }
        drawPolygon(layerId, state.value.positions, (state.value as any).config);
      }
      stopDrawing();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  };

  /**
   * 更新多边形预览（使用Primitive）
   */
  const updatePolygonPreview = (
    viewer: Cesium.Viewer,
    currentPosition?: Cesium.Cartesian2
  ) => {
    if (state.value.previewPrimitive) {
      viewer.scene.primitives.remove(state.value.previewPrimitive);
      state.value.previewPrimitive = null;
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
      const closedPositions = [...positions, positions[0]];
      const polygonGeometry = new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(closedPositions),
        height: 0,
        vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
      });

      const primitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: polygonGeometry,
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW.withAlpha(0.6)),
          },
        }),
        appearance: new Cesium.PerInstanceColorAppearance({
          translucent: true,
          closed: true,
        }),
        asynchronous: false,
      });

      viewer.scene.primitives.add(primitive);
      state.value.previewPrimitive = primitive;
    } else if (positions.length >= 2) {
      const polylineGeometry = new Cesium.PolylineGeometry({
        positions: positions,
        width: 3,
        vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
      });

      const primitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: polylineGeometry,
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW),
          },
        }),
        appearance: new Cesium.PolylineColorAppearance(),
        asynchronous: false,
      });

      viewer.scene.primitives.add(primitive);
      state.value.previewPrimitive = primitive;
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
          state.value.previewRectangle = rectangle;

          // 更新临时矩形
          if (state.value.previewPrimitive) {
            viewer.scene.primitives.remove(state.value.previewPrimitive);
            state.value.previewPrimitive = null;
          }

          const rectangleGeometry = new Cesium.RectangleGeometry({
            rectangle: rectangle,
            height: 0,
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
          });

          const southwest = Cesium.Cartesian3.fromRadians(
            rectangle.west,
            rectangle.south,
            0
          );
          const southeast = Cesium.Cartesian3.fromRadians(
            rectangle.east,
            rectangle.south,
            0
          );
          const northeast = Cesium.Cartesian3.fromRadians(
            rectangle.east,
            rectangle.north,
            0
          );
          const northwest = Cesium.Cartesian3.fromRadians(
            rectangle.west,
            rectangle.north,
            0
          );
          const outlinePositions = [
            southwest,
            southeast,
            northeast,
            northwest,
            southwest,
          ];
          const outlineGeometry = new Cesium.PolylineGeometry({
            positions: outlinePositions,
            width: 3,
            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
          });

          const primitive = new Cesium.Primitive({
            geometryInstances: new Cesium.GeometryInstance({
              geometry: rectangleGeometry,
              attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW.withAlpha(0.6)),
              },
            }),
            appearance: new Cesium.PerInstanceColorAppearance({
              translucent: true,
              closed: true,
            }),
            asynchronous: false,
          });

          viewer.scene.primitives.add(primitive);
          state.value.previewPrimitive = primitive;
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 右键结束
    handler.setInputAction(() => {
      if (state.value.startPosition && state.value.previewRectangle) {
        viewer.scene.primitives.remove(state.value.previewPrimitive!);
        state.value.previewPrimitive = null;
        drawRectangle(layerId, state.value.previewRectangle, (state.value as any).config);
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
          state.value.previewCircleRadius = radius;

          // 更新临时圆
          if (state.value.previewPrimitive) {
            viewer.scene.primitives.remove(state.value.previewPrimitive);
            state.value.previewPrimitive = null;
          }

          // 计算圆形预览点
          const cartographic = Cesium.Cartographic.fromCartesian(state.value.startPosition);
          const positions: Cesium.Cartesian3[] = [];
          const numPoints = 64;
          
          // 计算圆形轮廓点 - 使用简化的方法
          const normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(
            state.value.startPosition,
            new Cesium.Cartesian3()
          );
          const east = Cesium.Cartesian3.cross(
            Cesium.Cartesian3.UNIT_Z,
            normal,
            new Cesium.Cartesian3()
          );
          Cesium.Cartesian3.normalize(east, east);
          const north = Cesium.Cartesian3.cross(normal, east, new Cesium.Cartesian3());
          Cesium.Cartesian3.normalize(north, north);
          
          for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Cesium.Math.TWO_PI;
            const cosAngle = Math.cos(angle);
            const sinAngle = Math.sin(angle);
            
            // 在切平面上计算点
            const point = new Cesium.Cartesian3();
            Cesium.Cartesian3.multiplyByScalar(east, radius * cosAngle, point);
            const northComponent = new Cesium.Cartesian3();
            Cesium.Cartesian3.multiplyByScalar(north, radius * sinAngle, northComponent);
            Cesium.Cartesian3.add(point, northComponent, point);
            Cesium.Cartesian3.add(state.value.startPosition, point, point);
            
            // 将点投影到椭球面上
            const cartographicPoint = Cesium.Cartographic.fromCartesian(point);
            positions.push(Cesium.Cartesian3.fromRadians(
              cartographicPoint.longitude,
              cartographicPoint.latitude,
              cartographic.height
            ));
          }

          const polygonGeometry = new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(positions),
            height: 0,
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
          });

          const primitive = new Cesium.Primitive({
            geometryInstances: new Cesium.GeometryInstance({
              geometry: polygonGeometry,
              attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.GREEN.withAlpha(0.5)),
              },
            }),
            appearance: new Cesium.PerInstanceColorAppearance({
              translucent: true,
              closed: true,
            }),
            asynchronous: false,
          });

          viewer.scene.primitives.add(primitive);
          state.value.previewPrimitive = primitive;
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 右键结束
    handler.setInputAction(() => {
      if (state.value.startPosition && state.value.previewCircleRadius !== null) {
        viewer.scene.primitives.remove(state.value.previewPrimitive!);
        state.value.previewPrimitive = null;
        drawCircle(layerId, state.value.startPosition, state.value.previewCircleRadius, (state.value as any).config);
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

