import * as Cesium from 'cesium';
import type { IMeasurement } from '../core/interfaces';
import type { MeasurementType, MeasurementResult } from '../core/types';
import { 
  convertLength, 
  convertArea, 
  convertElevation, 
  formatLength, 
  formatArea, 
  formatElevation 
} from '../../utils/unitConverter';

export class CesiumMeasurement implements IMeasurement {
  private viewer: Cesium.Viewer;
  private activeType: MeasurementType = null;
  private isMeasuringState = false;
  private handler: Cesium.ScreenSpaceEventHandler | null = null;
  private positions: Cesium.Cartesian3[] = [];
  private entities: Cesium.Entity[] = [];
  private labels: Cesium.Entity[] = [];
  private listeners: Record<string, Function[]> = {};

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  start(type: MeasurementType): void {
    this.stop();
    this.activeType = type;
    this.isMeasuringState = true;
    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

    switch (type) {
      case 'point':
        this.startPointMeasurement();
        break;
      case 'distance':
        this.startDistanceMeasurement();
        break;
      case 'area':
        this.startAreaMeasurement();
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
    this.cleanupEntities();
  }

  isActive(): boolean {
    return this.isMeasuringState;
  }

  getActiveType(): MeasurementType {
    return this.activeType;
  }

  on(event: 'measure-change', callback: (result: MeasurementResult) => void): void {
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
    this.cleanupEntities();
    this.positions = [];
    this.isMeasuringState = false;
  }

  private cleanupEntities(): void {
    this.entities.forEach(entity => this.viewer.entities.remove(entity));
    this.labels.forEach(label => this.viewer.entities.remove(label));
    this.entities = [];
    this.labels = [];
  }

  private startPointMeasurement(): void {
    this.handler?.setInputAction(async (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      let cartesian: Cesium.Cartesian3 | undefined = this.viewer.scene.pickPosition(click.position);
      if (!cartesian) cartesian = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (!cartesian) {
        const ray = this.viewer.camera.getPickRay(click.position);
        if (ray) cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene) || undefined;
      }
      if (cartesian) {
        this.positions = [cartesian];
        await this.updatePointMeasurement(cartesian);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  private async updatePointMeasurement(position: Cesium.Cartesian3) {
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    let elevation = cartographic.height;

    this.cleanupEntities();
    const point = this.viewer.entities.add({
      position,
      point: { pixelSize: 10, color: Cesium.Color.YELLOW, outlineColor: Cesium.Color.BLACK, outlineWidth: 2, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND }
    });
    this.entities.push(point);

    const label = this.viewer.entities.add({
      position,
      label: {
        text: `经度: ${longitude.toFixed(6)}°\n纬度: ${latitude.toFixed(6)}°\n海拔: ${formatElevation(elevation, 'meter')}`,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -30),
        showBackground: true,
        backgroundColor: new Cesium.Color(0, 0, 0, 0.7),
        backgroundPadding: new Cesium.Cartesian2(8, 4),
      }
    });
    this.entities.push(label);
    this.labels.push(label);

    try {
      const terrainProvider = this.viewer.terrainProvider as any;
      const height = await Cesium.sampleTerrainMostDetailed(terrainProvider, [cartographic]);
      elevation = height[0]?.height ?? elevation;
      const labelComp = label.label as any;
      if (labelComp) {
        labelComp.text = `经度: ${longitude.toFixed(6)}°\n纬度: ${latitude.toFixed(6)}°\n海拔: ${formatElevation(elevation, 'meter')}`;
      }
    } catch (e) {}

    this.emit('measure-change', { longitude, latitude, elevation });
  }

  private startDistanceMeasurement(): void {
    this.handler?.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (cartesian) {
        this.positions.push(cartesian);
        this.updateDistanceMeasurement();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.handler?.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (this.positions.length > 0) {
        const cartesian = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (cartesian) this.updateDistanceMeasurement(cartesian);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.handler?.setInputAction(() => this.stop(), Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  private updateDistanceMeasurement(currentPosition?: Cesium.Cartesian3) {
    const positions = [...this.positions];
    if (currentPosition && positions.length > 0) positions.push(currentPosition);
    if (positions.length < 2) return;

    let totalDistance = 0;
    for (let i = 0; i < positions.length - 1; i++) {
      totalDistance += Cesium.Cartesian3.distance(positions[i], positions[i + 1]);
    }

    this.cleanupEntities();
    this.entities.push(this.viewer.entities.add({
      polyline: { positions, width: 3, material: Cesium.Color.CYAN, clampToGround: true }
    }));

    for (let i = 0; i < positions.length; i++) {
      this.entities.push(this.viewer.entities.add({
        position: positions[i],
        point: { pixelSize: 8, color: Cesium.Color.CYAN, outlineColor: Cesium.Color.BLACK, outlineWidth: 2, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND }
      }));
      if (i === positions.length - 1) {
        this.labels.push(this.viewer.entities.add({
          position: positions[i],
          label: {
            text: `总距离: ${formatLength(totalDistance, 'meter')}`,
            font: '14px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -30),
            showBackground: true,
            backgroundColor: new Cesium.Color(0, 0, 0, 0.7),
            backgroundPadding: new Cesium.Cartesian2(8, 4),
          }
        }));
      }
    }
    this.emit('measure-change', { totalDistance });
  }

  private startAreaMeasurement(): void {
    this.handler?.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = this.viewer.camera.pickEllipsoid(click.position, this.viewer.scene.globe.ellipsoid);
      if (cartesian) {
        this.positions.push(cartesian);
        this.updateAreaMeasurement();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    this.handler?.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (this.positions.length > 0) {
        const cartesian = this.viewer.camera.pickEllipsoid(movement.endPosition, this.viewer.scene.globe.ellipsoid);
        if (cartesian) this.updateAreaMeasurement(cartesian);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.handler?.setInputAction(() => this.stop(), Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  }

  private updateAreaMeasurement(currentPosition?: Cesium.Cartesian3) {
    const positions = [...this.positions];
    if (currentPosition) positions.push(currentPosition);
    if (positions.length < 3) return;

    // 简化面积计算（实际项目中可能需要更复杂的球面多边形计算，这里复用原有的逻辑思路）
    let area = 0;
    const ellipsoid = Cesium.Ellipsoid.WGS84;
    for (let i = 1; i < positions.length - 1; i++) {
      const v1 = Cesium.Cartesian3.normalize(positions[0], new Cesium.Cartesian3());
      const v2 = Cesium.Cartesian3.normalize(positions[i], new Cesium.Cartesian3());
      const v3 = Cesium.Cartesian3.normalize(positions[i + 1], new Cesium.Cartesian3());
      const a = Math.acos(Cesium.Cartesian3.dot(v2, v3));
      const b = Math.acos(Cesium.Cartesian3.dot(v1, v3));
      const c = Math.acos(Cesium.Cartesian3.dot(v1, v2));
      const s = (a + b + c) / 2;
      const excess = 4 * Math.atan(Math.sqrt(Math.max(0, Math.tan(s / 2) * Math.tan((s - a) / 2) * Math.tan((s - b) / 2) * Math.tan((s - c) / 2))));
      area += excess * ellipsoid.radiiSquared.x;
    }

    this.cleanupEntities();
    this.entities.push(this.viewer.entities.add({
      polygon: { 
        hierarchy: new Cesium.PolygonHierarchy(positions), 
        material: Cesium.Color.YELLOW.withAlpha(0.5), 
        outline: true, 
        outlineColor: Cesium.Color.YELLOW, 
        outlineWidth: 2, 
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND 
      }
    }));
    
    const center = Cesium.BoundingSphere.fromPoints(positions).center;
    this.labels.push(this.viewer.entities.add({
      position: center,
      label: {
        text: `面积: ${formatArea(area, 'square-meter')}`,
        font: '16px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        showBackground: true,
        backgroundColor: new Cesium.Color(0, 0, 0, 0.7),
        backgroundPadding: new Cesium.Cartesian2(8, 4),
      }
    }));
    this.emit('measure-change', { area });
  }
}
