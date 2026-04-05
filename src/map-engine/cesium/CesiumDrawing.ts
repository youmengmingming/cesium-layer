import * as Cesium from 'cesium';
import type { IDrawing } from '../core/interfaces';
import type { DrawingType, DrawingConfig } from '../core/types';
import { useLayerStore } from '../../stores/layers';

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

export class CesiumDrawing implements IDrawing {
  private viewer: Cesium.Viewer;
  private layerStore = useLayerStore();
  private activeType: DrawingType = null;
  private isDrawingState = false;
  private handler: Cesium.ScreenSpaceEventHandler | null = null;
  private positions: Cesium.Cartesian3[] = [];
  private startPosition: Cesium.Cartesian3 | null = null;
  private previewPrimitive: Cesium.Primitive | null = null;
  private previewRectangle: Cesium.Rectangle | null = null;
  private previewCircleRadius: number | null = null;
  private currentConfig: DrawingConfig | undefined;
  private currentLayerId: string = '';

  private listeners: Record<string, Function[]> = {};

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  start(type: DrawingType, layerId: string, config?: DrawingConfig): void {
    this.stop();
    this.activeType = type;
    
    // 确保 layerId 是字符串，防止误传对象
    this.currentLayerId = typeof layerId === 'object' ? (layerId as any).id : layerId;
    
    this.currentConfig = config;
    this.isDrawingState = true;

    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    switch (type) {
      case 'point':
        this.startPointDrawing();
        break;
      case 'polyline':
        this.startPolylineDrawing();
        break;
      case 'polygon':
        this.startPolygonDrawing();
        break;
      case 'rectangle':
        this.startRectangleDrawing();
        break;
      case 'circle':
        this.startCircleDrawing();
        break;
      default:
        this.stop();
    }
  }

  stop(): void {
    this.cleanup();
    this.activeType = null;
  }

  clear(): void {
    // 这里清空所有标绘（由 LayerManager 处理更合适，或者在本类中管理所有创建的实体）
  }

  isActive(): boolean {
    return this.isDrawingState;
  }

  getActiveType(): DrawingType {
    return this.activeType;
  }

  on(event: 'draw-end', callback: (data: any) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  private emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  private cleanup(): void {
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
    if (this.previewPrimitive) {
      this.viewer.scene.primitives.remove(this.previewPrimitive);
      this.previewPrimitive = null;
    }
    this.positions = [];
    this.startPosition = null;
    this.previewRectangle = null;
    this.previewCircleRadius = null;
    this.isDrawingState = false;
  }

  private startPointDrawing(): void {
    this.handler?.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (cartesian) {
        this.drawPoint(this.currentLayerId, cartesian, this.currentConfig);
        this.emit('draw-end', { type: 'point', position: cartesian });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  private drawPoint(layerId: string, position: Cesium.Cartesian3, config?: DrawingConfig) {
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);

    const pointColor = config?.fillColor 
      ? hexToCesiumColor(config.fillColor, config.fillColorAlpha)
      : Cesium.Color.YELLOW;

    const pointPrimitiveCollection = new Cesium.PointPrimitiveCollection();
    pointPrimitiveCollection.add({
      position: position,
      pixelSize: config?.lineWidth || 10,
      color: pointColor,
      outlineColor: config?.outlineColor
        ? hexToCesiumColor(config.outlineColor, config.outlineColorAlpha)
        : Cesium.Color.BLACK,
      outlineWidth: config?.outlineWidth ?? 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    });

    (pointPrimitiveCollection as any)._id = `point-${Date.now()}`;
    (pointPrimitiveCollection as any)._name = config?.propertyName || '标绘点';
    (pointPrimitiveCollection as any)._config = config;
    (pointPrimitiveCollection as any)._type = 'point';
    (pointPrimitiveCollection as any)._position = position;

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
      
      this.viewer.scene.primitives.add(labelPrimitive);
      this.layerStore.attachPrimitive(layerId, labelPrimitive as any);
    }

    return this.layerStore.createPrimitiveInLayer(layerId, pointPrimitiveCollection as any);
  }

  // 其他标绘逻辑（Polyline, Polygon, etc.）
  private startPolylineDrawing(): void {
    this.handler?.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (cartesian) {
        this.positions.push(cartesian);
        this.updatePolylinePreview();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.handler?.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (this.positions.length > 0) {
        this.updatePolylinePreview(movement.endPosition);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.handler?.setInputAction(() => {
      if (this.positions.length >= 2) {
        if (this.previewPrimitive) {
          this.viewer.scene.primitives.remove(this.previewPrimitive);
          this.previewPrimitive = null;
        }
        this.drawPolyline(this.currentLayerId, this.positions, this.currentConfig);
        this.emit('draw-end', { type: 'polyline', positions: [...this.positions] });
      }
      this.stop();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  private drawPolyline(layerId: string, positions: Cesium.Cartesian3[], config?: DrawingConfig) {
    if (positions.length < 2) return null;
    const lineColor = config?.lineColor ? hexToCesiumColor(config.lineColor, config.lineColorAlpha) : Cesium.Color.CYAN;
    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.PolylineGeometry({
          positions: positions,
          width: config?.lineWidth ?? 3,
          vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
        }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(lineColor) },
      }),
      appearance: new Cesium.PolylineColorAppearance({ translucent: lineColor.alpha < 1.0 }),
      asynchronous: false,
    });
    (primitive as any)._id = `polyline-${Date.now()}`;
    (primitive as any)._type = 'polyline';
    (primitive as any)._positions = positions;
    return this.layerStore.createPrimitiveInLayer(layerId, primitive);
  }

  private updatePolylinePreview(currentPosition?: Cesium.Cartesian2) {
    if (this.previewPrimitive) {
      this.viewer.scene.primitives.remove(this.previewPrimitive);
      this.previewPrimitive = null;
    }
    const positions = [...this.positions];
    if (currentPosition) {
      const cartesian = this.viewer.camera.pickEllipsoid(currentPosition, this.viewer.scene.globe.ellipsoid);
      if (cartesian && positions.length > 0) positions.push(cartesian);
    }
    if (positions.length >= 2) {
      const primitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolylineGeometry({
            positions: positions,
            width: 4,
            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
          }),
          attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW) },
        }),
        appearance: new Cesium.PolylineColorAppearance(),
        asynchronous: false,
      });
      this.viewer.scene.primitives.add(primitive);
      this.previewPrimitive = primitive;
    }
  }

  private startPolygonDrawing(): void {
    this.handler?.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (cartesian) {
        this.positions.push(cartesian);
        this.updatePolygonPreview();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.handler?.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (this.positions.length > 0) {
        this.updatePolygonPreview(movement.endPosition);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.handler?.setInputAction(() => {
      if (this.positions.length >= 3) {
        if (this.previewPrimitive) {
          this.viewer.scene.primitives.remove(this.previewPrimitive);
          this.previewPrimitive = null;
        }
        this.drawPolygon(this.currentLayerId, this.positions, this.currentConfig);
        this.emit('draw-end', { type: 'polygon', positions: [...this.positions] });
      }
      this.stop();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  private drawPolygon(layerId: string, positions: Cesium.Cartesian3[], config?: DrawingConfig) {
    if (positions.length < 3) return null;
    const fillColor = config?.fillColor ? hexToCesiumColor(config.fillColor, config.fillColorAlpha ?? 0.5) : Cesium.Color.CYAN.withAlpha(0.5);
    const outlineColor = config?.outlineColor ? hexToCesiumColor(config.outlineColor, config.outlineColorAlpha) : Cesium.Color.CYAN;
    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(positions),
          height: 0,
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(fillColor) },
      }),
      appearance: new Cesium.PerInstanceColorAppearance({ translucent: fillColor.alpha < 1.0, closed: true }),
      asynchronous: false,
    });
    (primitive as any)._id = `polygon-${Date.now()}`;
    (primitive as any)._type = 'polygon';
    (primitive as any)._positions = positions;
    const result = this.layerStore.createPrimitiveInLayer(layerId, primitive);

    if (config?.showBorder ?? config?.outline ?? true) {
      const outlinePositions = [...positions, positions[0]];
      const outlinePrimitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolylineGeometry({
            positions: outlinePositions,
            width: config?.outlineWidth ?? 2,
            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
          }),
          attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(outlineColor) },
        }),
        appearance: new Cesium.PolylineColorAppearance(),
        asynchronous: false,
      });
      (outlinePrimitive as any)._id = `polygon-outline-${Date.now()}`;
      (outlinePrimitive as any)._parentId = (primitive as any)._id;
      this.layerStore.attachPrimitive(layerId, outlinePrimitive);
      this.viewer.scene.primitives.add(outlinePrimitive);
      outlinePrimitive.show = this.layerStore.layers[layerId]?.visible ?? true;
    }
    return result;
  }

  private updatePolygonPreview(currentPosition?: Cesium.Cartesian2) {
    if (this.previewPrimitive) {
      this.viewer.scene.primitives.remove(this.previewPrimitive);
      this.previewPrimitive = null;
    }
    const positions = [...this.positions];
    if (currentPosition) {
      const cartesian = this.viewer.camera.pickEllipsoid(currentPosition, this.viewer.scene.globe.ellipsoid);
      if (cartesian && positions.length > 0) positions.push(cartesian);
    }
    if (positions.length >= 3) {
      const closedPositions = [...positions, positions[0]];
      const primitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolygonGeometry({
            polygonHierarchy: new Cesium.PolygonHierarchy(closedPositions),
            height: 0,
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
          }),
          attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW.withAlpha(0.6)) },
        }),
        appearance: new Cesium.PerInstanceColorAppearance({ translucent: true, closed: true }),
        asynchronous: false,
      });
      this.viewer.scene.primitives.add(primitive);
      this.previewPrimitive = primitive;
    } else if (positions.length >= 2) {
      const primitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolylineGeometry({
            positions: positions,
            width: 3,
            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
          }),
          attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW) },
        }),
        appearance: new Cesium.PolylineColorAppearance(),
        asynchronous: false,
      });
      this.viewer.scene.primitives.add(primitive);
      this.previewPrimitive = primitive;
    }
  }

  private startRectangleDrawing(): void {
    this.handler?.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (cartesian && !this.startPosition) this.startPosition = cartesian;
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.handler?.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (this.startPosition) {
        const cartesian = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (cartesian) {
          const startCartographic = Cesium.Cartographic.fromCartesian(this.startPosition);
          const endCartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const west = Math.min(Cesium.Math.toDegrees(startCartographic.longitude), Cesium.Math.toDegrees(endCartographic.longitude));
          const south = Math.min(Cesium.Math.toDegrees(startCartographic.latitude), Cesium.Math.toDegrees(endCartographic.latitude));
          const east = Math.max(Cesium.Math.toDegrees(startCartographic.longitude), Cesium.Math.toDegrees(endCartographic.longitude));
          const north = Math.max(Cesium.Math.toDegrees(startCartographic.latitude), Cesium.Math.toDegrees(endCartographic.latitude));
          const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
          this.previewRectangle = rectangle;
          this.updateRectanglePreview(rectangle);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.handler?.setInputAction(() => {
      if (this.startPosition && this.previewRectangle) {
        if (this.previewPrimitive) {
          this.viewer.scene.primitives.remove(this.previewPrimitive);
          this.previewPrimitive = null;
        }
        this.drawRectangle(this.currentLayerId, this.previewRectangle, this.currentConfig);
        this.emit('draw-end', { type: 'rectangle', rectangle: this.previewRectangle });
      }
      this.stop();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  private drawRectangle(layerId: string, rectangle: Cesium.Rectangle, config?: DrawingConfig) {
    const fillColor = config?.fillColor ? hexToCesiumColor(config.fillColor, config.fillColorAlpha ?? 0.5) : Cesium.Color.BLUE.withAlpha(0.5);
    const outlineColor = config?.outlineColor ? hexToCesiumColor(config.outlineColor, config.outlineColorAlpha) : Cesium.Color.BLUE;
    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.RectangleGeometry({
          rectangle: rectangle,
          height: 0,
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(fillColor) },
      }),
      appearance: new Cesium.PerInstanceColorAppearance({ translucent: fillColor.alpha < 1.0, closed: true }),
      asynchronous: false,
    });
    (primitive as any)._id = `rectangle-${Date.now()}`;
    (primitive as any)._type = 'rectangle';
    (primitive as any)._rectangle = rectangle;
    const result = this.layerStore.createPrimitiveInLayer(layerId, primitive);

    if (config?.showBorder ?? config?.outline ?? true) {
      const southwest = Cesium.Cartesian3.fromRadians(rectangle.west, rectangle.south, 0);
      const southeast = Cesium.Cartesian3.fromRadians(rectangle.east, rectangle.south, 0);
      const northeast = Cesium.Cartesian3.fromRadians(rectangle.east, rectangle.north, 0);
      const northwest = Cesium.Cartesian3.fromRadians(rectangle.west, rectangle.north, 0);
      const outlinePositions = [southwest, southeast, northeast, northwest, southwest];
      const outlinePrimitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolylineGeometry({
            positions: outlinePositions,
            width: config?.outlineWidth ?? 2,
            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
          }),
          attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(outlineColor) },
        }),
        appearance: new Cesium.PolylineColorAppearance(),
        asynchronous: false,
      });
      (outlinePrimitive as any)._id = `rectangle-outline-${Date.now()}`;
      (outlinePrimitive as any)._parentId = (primitive as any)._id;
      this.layerStore.attachPrimitive(layerId, outlinePrimitive);
      this.viewer.scene.primitives.add(outlinePrimitive);
      outlinePrimitive.show = this.layerStore.layers[layerId]?.visible ?? true;
    }
    return result;
  }

  private updateRectanglePreview(rectangle: Cesium.Rectangle) {
    if (this.previewPrimitive) {
      this.viewer.scene.primitives.remove(this.previewPrimitive);
      this.previewPrimitive = null;
    }
    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.RectangleGeometry({
          rectangle: rectangle,
          height: 0,
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW.withAlpha(0.6)) },
      }),
      appearance: new Cesium.PerInstanceColorAppearance({ translucent: true, closed: true }),
      asynchronous: false,
    });
    this.viewer.scene.primitives.add(primitive);
    this.previewPrimitive = primitive;
  }

  private startCircleDrawing(): void {
    this.handler?.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (cartesian && !this.startPosition) this.startPosition = cartesian;
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.handler?.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (this.startPosition) {
        const cartesian = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (cartesian) {
          const radius = Cesium.Cartesian3.distance(this.startPosition, cartesian);
          this.previewCircleRadius = radius;
          this.updateCirclePreview(radius);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.handler?.setInputAction(() => {
      if (this.startPosition && this.previewCircleRadius !== null) {
        if (this.previewPrimitive) {
          this.viewer.scene.primitives.remove(this.previewPrimitive);
          this.previewPrimitive = null;
        }
        this.drawCircle(this.currentLayerId, this.startPosition, this.previewCircleRadius, this.currentConfig);
        this.emit('draw-end', { type: 'circle', center: this.startPosition, radius: this.previewCircleRadius });
      }
      this.stop();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  private drawCircle(layerId: string, center: Cesium.Cartesian3, radius: number, config?: DrawingConfig) {
    const fillColor = config?.fillColor ? hexToCesiumColor(config.fillColor, config.fillColorAlpha ?? 0.5) : Cesium.Color.GREEN.withAlpha(0.5);
    const outlineColor = config?.outlineColor ? hexToCesiumColor(config.outlineColor, config.outlineColorAlpha) : Cesium.Color.GREEN;
    const cartographic = Cesium.Cartographic.fromCartesian(center);
    const positions: Cesium.Cartesian3[] = [];
    const numPoints = 64;
    const normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(center, new Cesium.Cartesian3());
    const east = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(Cesium.Cartesian3.UNIT_Z, normal, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    const north = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(normal, east, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Cesium.Math.TWO_PI;
      const point = Cesium.Cartesian3.add(center, Cesium.Cartesian3.add(Cesium.Cartesian3.multiplyByScalar(east, radius * Math.cos(angle), new Cesium.Cartesian3()), Cesium.Cartesian3.multiplyByScalar(north, radius * Math.sin(angle), new Cesium.Cartesian3()), new Cesium.Cartesian3()), new Cesium.Cartesian3());
      const cartPoint = Cesium.Cartographic.fromCartesian(point);
      positions.push(Cesium.Cartesian3.fromRadians(cartPoint.longitude, cartPoint.latitude, cartographic.height));
    }
    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(positions),
          height: 0,
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(fillColor) },
      }),
      appearance: new Cesium.PerInstanceColorAppearance({ translucent: fillColor.alpha < 1.0, closed: true }),
      asynchronous: false,
    });
    (primitive as any)._id = `circle-${Date.now()}`;
    (primitive as any)._type = 'circle';
    (primitive as any)._center = center;
    (primitive as any)._radius = radius;
    const result = this.layerStore.createPrimitiveInLayer(layerId, primitive);

    if (config?.showBorder ?? config?.outline ?? true) {
      const outlinePositions = [...positions, positions[0]];
      const outlinePrimitive = new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.PolylineGeometry({
            positions: outlinePositions,
            width: config?.outlineWidth ?? 2,
            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
          }),
          attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(outlineColor) },
        }),
        appearance: new Cesium.PolylineColorAppearance(),
        asynchronous: false,
      });
      (outlinePrimitive as any)._id = `circle-outline-${Date.now()}`;
      (outlinePrimitive as any)._parentId = (primitive as any)._id;
      this.layerStore.attachPrimitive(layerId, outlinePrimitive);
      this.viewer.scene.primitives.add(outlinePrimitive);
      outlinePrimitive.show = this.layerStore.layers[layerId]?.visible ?? true;
    }
    return result;
  }

  private updateCirclePreview(radius: number) {
    if (this.previewPrimitive) {
      this.viewer.scene.primitives.remove(this.previewPrimitive);
      this.previewPrimitive = null;
    }
    if (!this.startPosition) return;
    const center = this.startPosition;
    const cartographic = Cesium.Cartographic.fromCartesian(center);
    const positions: Cesium.Cartesian3[] = [];
    const numPoints = 64;
    const normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(center, new Cesium.Cartesian3());
    const east = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(Cesium.Cartesian3.UNIT_Z, normal, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    const north = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(normal, east, new Cesium.Cartesian3()), new Cesium.Cartesian3());
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Cesium.Math.TWO_PI;
      const point = Cesium.Cartesian3.add(center, Cesium.Cartesian3.add(Cesium.Cartesian3.multiplyByScalar(east, radius * Math.cos(angle), new Cesium.Cartesian3()), Cesium.Cartesian3.multiplyByScalar(north, radius * Math.sin(angle), new Cesium.Cartesian3()), new Cesium.Cartesian3()), new Cesium.Cartesian3());
      const cartPoint = Cesium.Cartographic.fromCartesian(point);
      positions.push(Cesium.Cartesian3.fromRadians(cartPoint.longitude, cartPoint.latitude, cartographic.height));
    }
    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.PolygonGeometry({
          polygonHierarchy: new Cesium.PolygonHierarchy(positions),
          height: 0,
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: { color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.GREEN.withAlpha(0.5)) },
      }),
      appearance: new Cesium.PerInstanceColorAppearance({ translucent: true, closed: true }),
      asynchronous: false,
    });
    this.viewer.scene.primitives.add(primitive);
    this.previewPrimitive = primitive;
  }
}
