import { ref, computed, onUnmounted } from 'vue';
import * as Cesium from 'cesium';
import { useCesiumStore } from '../stores/cesium';
import {
  type LengthUnit,
  type AreaUnit,
  type ElevationUnit,
  convertLength,
  convertArea,
  convertElevation,
  formatLength,
  formatArea,
  formatElevation,
  getLengthUnitLabel,
  getAreaUnitLabel,
  getElevationUnitLabel,
} from '../utils/unitConverter';

export type MeasurementType = 'point' | 'distance' | 'area' | null;

interface MeasurementState {
  activeType: MeasurementType;
  isMeasuring: boolean;
  handler: Cesium.ScreenSpaceEventHandler | null;
  positions: Cesium.Cartesian3[];
  entities: Cesium.Entity[];
  labels: Cesium.Entity[];
  currentMeasurement: {
    distance?: number;
    totalDistance?: number;
    area?: number;
    elevation?: number;
    longitude?: number;
    latitude?: number;
    bearing?: number;
  };
  lengthUnit: LengthUnit;
  areaUnit: AreaUnit;
  elevationUnit: ElevationUnit;
}

export function useMeasurement() {
  const cesiumStore = useCesiumStore();

  const state = ref<MeasurementState>({
    activeType: null,
    isMeasuring: false,
    handler: null,
    positions: [],
    entities: [],
    labels: [],
    currentMeasurement: {},
    lengthUnit: 'meter',
    areaUnit: 'square-meter',
    elevationUnit: 'meter',
  });

  const activeType = computed(() => state.value.activeType);
  const isMeasuring = computed(() => state.value.isMeasuring);
  const currentMeasurement = computed(() => state.value.currentMeasurement);
  const lengthUnit = computed(() => state.value.lengthUnit);
  const areaUnit = computed(() => state.value.areaUnit);
  const elevationUnit = computed(() => state.value.elevationUnit);

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
   * 清理所有测量实体
   */
  const cleanupEntities = () => {
    const viewer = getViewer();
    state.value.entities.forEach((entity) => {
      viewer.entities.remove(entity);
    });
    state.value.labels.forEach((label) => {
      viewer.entities.remove(label);
    });
    state.value.entities = [];
    state.value.labels = [];
  };

  /**
   * 清理测量状态
   */
  const cleanup = () => {
    if (state.value.handler) {
      state.value.handler.destroy();
      state.value.handler = null;
    }
    cleanupEntities();
    state.value.positions = [];
    state.value.currentMeasurement = {};
    state.value.isMeasuring = false;
  };

  /**
   * 停止测量
   */
  const stopMeasurement = () => {
    cleanup();
    state.value.activeType = null;
  };

  /**
   * 获取点的海拔高度
   */
  const getElevation = async (position: Cesium.Cartesian3): Promise<number> => {
    const viewer = getViewer();
    try {
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      // 使用 sampleHeightMostDetailed 获取精确的地形高度
      const height = await Cesium.sampleTerrainMostDetailed(
        viewer.terrainProvider,
        [cartographic]
      );
      return height[0]?.height ?? cartographic.height;
    } catch (error) {
      // 如果获取失败，使用椭球高度
      const cartographic = Cesium.Cartographic.fromCartesian(position);
      return cartographic.height;
    }
  };

  /**
   * 计算两点之间的距离
   */
  const calculateDistance = (pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3): number => {
    const cartographic1 = Cesium.Cartographic.fromCartesian(pos1);
    const cartographic2 = Cesium.Cartographic.fromCartesian(pos2);
    
    // 使用椭球面距离计算（更准确）
    const distance = Cesium.Cartesian3.distance(pos1, pos2);
    return distance;
  };

  /**
   * 计算方位角（从 pos1 指向 pos2）
   */
  const calculateBearing = (pos1: Cesium.Cartesian3, pos2: Cesium.Cartesian3): number => {
    const cartographic1 = Cesium.Cartographic.fromCartesian(pos1);
    const cartographic2 = Cesium.Cartographic.fromCartesian(pos2);

    const lon1 = Cesium.Math.toRadians(Cesium.Math.toDegrees(cartographic1.longitude));
    const lat1 = Cesium.Math.toRadians(Cesium.Math.toDegrees(cartographic1.latitude));
    const lon2 = Cesium.Math.toRadians(Cesium.Math.toDegrees(cartographic2.longitude));
    const lat2 = Cesium.Math.toRadians(Cesium.Math.toDegrees(cartographic2.latitude));

    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let bearing = Math.atan2(y, x);
    bearing = Cesium.Math.toDegrees(bearing);
    bearing = (bearing + 360) % 360; // 转换为 0-360 度

    return bearing;
  };

  /**
   * 计算多边形面积（使用椭球面）
   */
  const calculateArea = (positions: Cesium.Cartesian3[]): number => {
    if (positions.length < 3) {
      return 0;
    }

    // 确保多边形闭合
    const closedPositions = [...positions];
    if (
      closedPositions.length === 0 ||
      !Cesium.Cartesian3.equals(
        closedPositions[0],
        closedPositions[closedPositions.length - 1]
      )
    ) {
      closedPositions.push(closedPositions[0]);
    }

    // 使用球面多边形面积计算方法
    // 将多边形分解为球面三角形并计算面积
    const ellipsoid = Cesium.Ellipsoid.WGS84;
    let area = 0;

    // 将第一个点作为所有三角形的公共顶点
    for (let i = 1; i < closedPositions.length - 1; i++) {
      const cart1 = Cesium.Cartographic.fromCartesian(closedPositions[0]);
      const cart2 = Cesium.Cartographic.fromCartesian(closedPositions[i]);
      const cart3 = Cesium.Cartographic.fromCartesian(closedPositions[i + 1]);

      // 计算三个点的单位向量
      const v1 = Cesium.Cartesian3.normalize(
        ellipsoid.cartographicToCartesian(cart1),
        new Cesium.Cartesian3()
      );
      const v2 = Cesium.Cartesian3.normalize(
        ellipsoid.cartographicToCartesian(cart2),
        new Cesium.Cartesian3()
      );
      const v3 = Cesium.Cartesian3.normalize(
        ellipsoid.cartographicToCartesian(cart3),
        new Cesium.Cartesian3()
      );

      // 计算球面三角形的边长（角度）
      const dot12 = Math.max(-1, Math.min(1, Cesium.Cartesian3.dot(v1, v2)));
      const dot13 = Math.max(-1, Math.min(1, Cesium.Cartesian3.dot(v1, v3)));
      const dot23 = Math.max(-1, Math.min(1, Cesium.Cartesian3.dot(v2, v3)));
      
      const a = Math.acos(dot23);
      const b = Math.acos(dot13);
      const c = Math.acos(dot12);

      // 使用 L'Huilier 公式计算球面三角形面积
      const s = (a + b + c) / 2;
      const tanHalfS = Math.tan(s / 2);
      const tanHalfSA = Math.tan((s - a) / 2);
      const tanHalfSB = Math.tan((s - b) / 2);
      const tanHalfSC = Math.tan((s - c) / 2);
      
      // 避免数值问题
      if (tanHalfS > 0 && tanHalfSA > 0 && tanHalfSB > 0 && tanHalfSC > 0) {
        const excess = 4 * Math.atan(
          Math.sqrt(tanHalfS * tanHalfSA * tanHalfSB * tanHalfSC)
        );

        // 转换为平方米（使用椭球半径的平方）
        area += excess * ellipsoid.radiiSquared.x;
      }
    }

    return Math.abs(area);
  };

  /**
   * 更新点测量信息显示
   */
  const updatePointMeasurement = async (position: Cesium.Cartesian3) => {
    const viewer = getViewer();
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    
    // 先使用椭球高度作为初始值，然后异步获取地形高度
    let elevation = cartographic.height;
    
    // 更新当前测量信息（先显示椭球高度）
    state.value.currentMeasurement = {
      longitude,
      latitude,
      elevation,
    };

    // 清理之前的实体
    cleanupEntities();
    
    // 添加点（先显示，后面会更新海拔）
    const point = viewer.entities.add({
      position: position,
      point: {
        pixelSize: 10,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
    state.value.entities.push(point);

    // 先显示初始标签（使用椭球高度）
    const elevationInUnitInitial = convertElevation(elevation, 'meter', state.value.elevationUnit);
    const labelTextInitial = `经度: ${longitude.toFixed(6)}°\n纬度: ${latitude.toFixed(6)}°\n海拔: ${formatElevation(elevationInUnitInitial, state.value.elevationUnit)}`;

    const label = viewer.entities.add({
      position: position,
      label: {
        text: labelTextInitial,
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
      },
    });
    state.value.entities.push(label);
    state.value.labels.push(label);

    // 异步获取精确的地形高度，然后更新标签
    try {
      elevation = await getElevation(position);
      const elevationInUnit = convertElevation(elevation, 'meter', state.value.elevationUnit);
      const labelText = `经度: ${longitude.toFixed(6)}°\n纬度: ${latitude.toFixed(6)}°\n海拔: ${formatElevation(elevationInUnit, state.value.elevationUnit)}`;
      
      // 更新测量信息
      state.value.currentMeasurement = {
        longitude,
        latitude,
        elevation,
      };
      
      // 更新标签文本
      label.label!.text = labelText;
    } catch (error) {
      console.warn('Failed to get terrain elevation:', error);
      // 如果获取失败，保持使用椭球高度
    }
  };

  /**
   * 更新距离测量信息显示
   */
  const updateDistanceMeasurement = (currentPosition?: Cesium.Cartesian3) => {
    const viewer = getViewer();
    const positions = [...state.value.positions];
    if (currentPosition && positions.length > 0) {
      positions.push(currentPosition);
    }

    if (positions.length < 2) {
      return;
    }

    // 计算总距离
    let totalDistance = 0;
    for (let i = 0; i < positions.length - 1; i++) {
      const dist = calculateDistance(positions[i], positions[i + 1]);
      totalDistance += dist;
    }

    // 计算最后一段的距离和方位
    let distance = 0;
    let bearing = 0;
    if (positions.length >= 2) {
      const lastPos = positions[positions.length - 1];
      const prevPos = positions[positions.length - 2];
      distance = calculateDistance(prevPos, lastPos);
      bearing = calculateBearing(prevPos, lastPos);
    }

    const distanceInUnit = convertLength(totalDistance, 'meter', state.value.lengthUnit);
    state.value.currentMeasurement = {
      distance,
      totalDistance,
      bearing,
    };

    // 更新显示
    cleanupEntities();

    // 绘制线段
    if (positions.length >= 2) {
      const polyline = viewer.entities.add({
        polyline: {
          positions: positions,
          width: 3,
          material: Cesium.Color.CYAN,
          clampToGround: true,
        },
      });
      state.value.entities.push(polyline);

      // 在每个点处显示距离标签
      for (let i = 0; i < positions.length; i++) {
        const point = viewer.entities.add({
          position: positions[i],
          point: {
            pixelSize: 8,
            color: Cesium.Color.CYAN,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
        state.value.entities.push(point);

        // 在最后一段显示距离和方位
        if (i === positions.length - 1 && positions.length >= 2) {
          const segmentDist = convertLength(distance, 'meter', state.value.lengthUnit);
          const labelText = `距离: ${formatLength(segmentDist, state.value.lengthUnit)}\n方位: ${bearing.toFixed(1)}°\n总距离: ${formatLength(distanceInUnit, state.value.lengthUnit)}`;

          const label = viewer.entities.add({
            position: positions[i],
            label: {
              text: labelText,
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
            },
          });
          state.value.labels.push(label);
          state.value.entities.push(label);
        }
      }
    }
  };

  /**
   * 更新面积测量信息显示
   */
  const updateAreaMeasurement = (currentPosition?: Cesium.Cartesian2) => {
    const viewer = getViewer();
    const positions = [...state.value.positions];

    if (currentPosition) {
      const cartesian = viewer.camera.pickEllipsoid(
        currentPosition,
        viewer.scene.globe.ellipsoid
      );
      if (cartesian) {
        positions.push(cartesian);
      }
    }

    if (positions.length < 3) {
      return;
    }

    const area = calculateArea(positions);
    const areaInUnit = convertArea(area, 'square-meter', state.value.areaUnit);
    state.value.currentMeasurement = {
      area,
    };

    // 更新显示
    cleanupEntities();

    // 绘制多边形
    const closedPositions = [...positions];
    if (
      !Cesium.Cartesian3.equals(
        closedPositions[0],
        closedPositions[closedPositions.length - 1]
      )
    ) {
      closedPositions.push(closedPositions[0]);
    }

    const polygon = viewer.entities.add({
      polygon: {
        hierarchy: closedPositions,
        material: Cesium.Color.YELLOW.withAlpha(0.5),
        outline: true,
        outlineColor: Cesium.Color.YELLOW,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    });
    state.value.entities.push(polygon);

    // 绘制点和线段
    for (let i = 0; i < positions.length; i++) {
      const point = viewer.entities.add({
        position: positions[i],
        point: {
          pixelSize: 8,
          color: Cesium.Color.YELLOW,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      state.value.entities.push(point);
    }

    // 在多边形中心显示面积标签
    if (positions.length >= 3) {
      const center = Cesium.BoundingSphere.fromPoints(positions).center;
      const labelText = `面积: ${formatArea(areaInUnit, state.value.areaUnit)}`;

      const label = viewer.entities.add({
        position: center,
        label: {
          text: labelText,
          font: '16px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          showBackground: true,
          backgroundColor: new Cesium.Color(0, 0, 0, 0.7),
          backgroundPadding: new Cesium.Cartesian2(8, 4),
        },
      });
      state.value.labels.push(label);
      state.value.entities.push(label);
    }
  };

  /**
   * 开始点测量
   */
  const startPointMeasurement = () => {
    stopMeasurement();
    const viewer = getViewer();
    state.value.activeType = 'point';
    state.value.isMeasuring = true;
    state.value.positions = [];

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    state.value.handler = handler;

    // 点击时计算并显示测量结果
    handler.setInputAction(async (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      // 尝试多种方法获取精确的地面位置
      let cartesian = viewer.scene.pickPosition(click.position);
      
      // 如果 pickPosition 失败，回退到椭球面
      if (!cartesian) {
        cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      }
      
      // 如果还是失败，使用 globe.pick
      if (!cartesian) {
        const ray = viewer.camera.getPickRay(click.position);
        if (ray) {
          cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
      }

      if (cartesian) {
        state.value.positions = [cartesian];
        await updatePointMeasurement(cartesian);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动时只改变光标样式，不进行计算
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      // 可以在这里改变光标样式，但不进行测量计算
      // 这样用户体验更好，也不会产生抖动
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  };

  /**
   * 开始距离测量
   */
  const startDistanceMeasurement = () => {
    stopMeasurement();
    const viewer = getViewer();
    state.value.activeType = 'distance';
    state.value.isMeasuring = true;
    state.value.positions = [];

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    state.value.handler = handler;

    // 左键点击添加点
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        state.value.positions.push(cartesian);
        updateDistanceMeasurement();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动时实时更新
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (state.value.positions.length > 0) {
        const cartesian = viewer.camera.pickEllipsoid(
          movement.endPosition,
          viewer.scene.globe.ellipsoid
        );
        if (cartesian) {
          updateDistanceMeasurement(cartesian);
        }
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 右键结束
    handler.setInputAction(() => {
      stopMeasurement();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  };

  /**
   * 开始面积测量
   */
  const startAreaMeasurement = () => {
    stopMeasurement();
    const viewer = getViewer();
    state.value.activeType = 'area';
    state.value.isMeasuring = true;
    state.value.positions = [];

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    state.value.handler = handler;

    // 左键点击添加点
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        state.value.positions.push(cartesian);
        updateAreaMeasurement();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 鼠标移动时实时更新
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      if (state.value.positions.length > 0) {
        updateAreaMeasurement(movement.endPosition);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // 右键结束
    handler.setInputAction(() => {
      stopMeasurement();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  };

  /**
   * 开始测量（统一入口）
   */
  const startMeasurement = (type: MeasurementType) => {
    switch (type) {
      case 'point':
        startPointMeasurement();
        break;
      case 'distance':
        startDistanceMeasurement();
        break;
      case 'area':
        startAreaMeasurement();
        break;
      default:
        stopMeasurement();
    }
  };

  /**
   * 设置长度单位
   */
  const setLengthUnit = (unit: LengthUnit) => {
    state.value.lengthUnit = unit;
    if (state.value.activeType === 'distance' && state.value.positions.length > 0) {
      updateDistanceMeasurement();
    }
  };

  /**
   * 设置面积单位
   */
  const setAreaUnit = (unit: AreaUnit) => {
    state.value.areaUnit = unit;
    if (state.value.activeType === 'area' && state.value.positions.length > 0) {
      updateAreaMeasurement();
    }
  };

  /**
   * 设置海拔单位
   */
  const setElevationUnit = (unit: ElevationUnit) => {
    state.value.elevationUnit = unit;
    // 如果正在测量点，重新更新显示
    if (state.value.activeType === 'point' && state.value.positions.length > 0) {
      updatePointMeasurement(state.value.positions[0]);
    }
  };

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup();
  });

  return {
    activeType,
    isMeasuring,
    currentMeasurement,
    lengthUnit,
    areaUnit,
    elevationUnit,
    startMeasurement,
    stopMeasurement,
    setLengthUnit,
    setAreaUnit,
    setElevationUnit,
    getLengthUnitLabel,
    getAreaUnitLabel,
    getElevationUnitLabel,
  };
}

