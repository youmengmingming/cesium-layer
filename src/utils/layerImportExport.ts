import * as Cesium from 'cesium';
import { LayerRecord } from '../stores/layers';

/**
 * 实体配置接口
 */
export interface EntityConfig {
  // 样式配置
  lineWidth?: number;
  lineColor?: string;
  lineColorAlpha?: number;
  fillColor?: string;
  fillColorAlpha?: number;
  outlineColor?: string;
  outlineColorAlpha?: number;
  outlineWidth?: number;
  outline?: boolean;
  // 功能配置
  draggable?: boolean;
  showLengthInfo?: boolean; // 显示边长信息
  showBorder?: boolean; // 显示边框
  showPropertyName?: boolean; // 显示属性名称
  propertyName?: string; // 属性名称
}

/**
 * 序列化的Entity数据接口
 */
export interface SerializedEntity {
  id: string;
  name?: string;
  description?: string;
  show?: boolean;
  config?: EntityConfig; // 实体配置
  position?: {
    longitude: number;
    latitude: number;
    height?: number;
  };
  point?: {
    pixelSize?: number;
    color?: string;
    colorAlpha?: number;
    outlineColor?: string;
    outlineColorAlpha?: number;
    outlineWidth?: number;
    heightReference?: string;
  };
  polyline?: {
    positions: Array<{ longitude: number; latitude: number; height?: number }>;
    width?: number;
    color?: string;
    colorAlpha?: number;
    clampToGround?: boolean;
  };
  polygon?: {
    hierarchy: Array<{ longitude: number; latitude: number; height?: number }>;
    materialColor?: string;
    alpha?: number;
    outline?: boolean;
    outlineColor?: string;
    outlineColorAlpha?: number;
    outlineWidth?: number;
    heightReference?: string;
  };
  rectangle?: {
    west: number;
    south: number;
    east: number;
    north: number;
    materialColor?: string;
    alpha?: number;
    outline?: boolean;
    outlineColor?: string;
    outlineColorAlpha?: number;
    outlineWidth?: number;
    heightReference?: string;
  };
  ellipse?: {
    center: { longitude: number; latitude: number; height?: number };
    semiMajorAxis: number;
    semiMinorAxis: number;
    materialColor?: string;
    alpha?: number;
    outline?: boolean;
    outlineColor?: string;
    outlineColorAlpha?: number;
    outlineWidth?: number;
    heightReference?: string;
  };
  label?: {
    text?: string;
    font?: string;
    fillColor?: string;
    fillColorAlpha?: number;
    outlineColor?: string;
    outlineColorAlpha?: number;
    outlineWidth?: number;
    style?: string;
    verticalOrigin?: string;
    pixelOffset?: { x: number; y: number };
  };
}

/**
 * 序列化的Primitive数据接口
 */
export interface SerializedPrimitive {
  id: string;
  type: string;
  // 可以根据需要扩展更多primitive类型
  [key: string]: any;
}

/**
 * 序列化的图层数据接口
 */
export interface SerializedLayer {
  id: string;
  name: string;
  visible: boolean;
  createdAt: number;
  entities: SerializedEntity[];
  primitives: SerializedPrimitive[];
}

/**
 * 导出的图层数据格式
 */
export interface LayerExportData {
  version: string;
  exportDate: string;
  layers: SerializedLayer[];
}

/**
 * 将Cartesian3转换为经纬度坐标
 */
function cartesian3ToLonLat(cartesian: Cesium.Cartesian3): {
  longitude: number;
  latitude: number;
  height?: number;
} {
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    longitude: Cesium.Math.toDegrees(cartographic.longitude),
    latitude: Cesium.Math.toDegrees(cartographic.latitude),
    height: cartographic.height,
  };
}

/**
 * 将经纬度坐标转换为Cartesian3
 */
function lonLatToCartesian3(
  lonLat: { longitude: number; latitude: number; height?: number }
): Cesium.Cartesian3 {
  return Cesium.Cartesian3.fromDegrees(
    lonLat.longitude,
    lonLat.latitude,
    lonLat.height
  );
}

/**
 * 将Cesium Color转换为十六进制字符串（包含alpha通道）
 */
function colorToHex(color: Cesium.Color): string {
  const r = Math.round(color.red * 255);
  const g = Math.round(color.green * 255);
  const b = Math.round(color.blue * 255);
  const a = Math.round(color.alpha * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a.toString(16).padStart(2, '0')}`;
}

/**
 * 将Cesium Color转换为十六进制字符串（不包含alpha通道，用于向后兼容）
 */
function colorToHexRGB(color: Cesium.Color): string {
  const r = Math.round(color.red * 255);
  const g = Math.round(color.green * 255);
  const b = Math.round(color.blue * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 将十六进制字符串转换为Cesium Color（支持RGBA和RGB格式）
 */
function hexToColor(hex: string, alpha?: number): Cesium.Color {
  // 支持 #RRGGBB 和 #RRGGBBAA 格式
  const hexClean = hex.replace('#', '');
  let r: number, g: number, b: number, a: number;
  
  if (hexClean.length === 8) {
    // RGBA格式
    r = parseInt(hexClean.substring(0, 2), 16);
    g = parseInt(hexClean.substring(2, 4), 16);
    b = parseInt(hexClean.substring(4, 6), 16);
    a = parseInt(hexClean.substring(6, 8), 16);
  } else if (hexClean.length === 6) {
    // RGB格式
    r = parseInt(hexClean.substring(0, 2), 16);
    g = parseInt(hexClean.substring(2, 4), 16);
    b = parseInt(hexClean.substring(4, 6), 16);
    a = alpha !== undefined ? Math.round(alpha * 255) : 255;
  } else {
    throw new Error(`Invalid hex color format: ${hex}`);
  }
  
  return Cesium.Color.fromBytes(r, g, b, a);
}

/**
 * 序列化Entity
 */
function serializeEntity(entity: Cesium.Entity): SerializedEntity {
  const serialized: SerializedEntity = {
    id: entity.id || '',
  };

  if (entity.name) serialized.name = entity.name;
  if (entity.description) serialized.description = entity.description;
  if (entity.show !== undefined) serialized.show = entity.show;

  // 序列化配置（从实体的自定义属性中获取）
  if ((entity as any)._config) {
    serialized.config = { ...(entity as any)._config };
  }

  // 序列化position
  if (entity.position) {
    const position = entity.position.getValue(Cesium.JulianDate.now());
    if (position) {
      serialized.position = cartesian3ToLonLat(position);
    }
  }

  // 序列化point
  if (entity.point) {
    const point = entity.point;
    serialized.point = {};
    if (point.pixelSize) {
      const pixelSize = point.pixelSize.getValue(Cesium.JulianDate.now());
      if (typeof pixelSize === 'number') serialized.point.pixelSize = pixelSize;
    }
    if (point.color) {
      const color = point.color.getValue(Cesium.JulianDate.now());
      if (color) {
        serialized.point.color = colorToHexRGB(color);
        serialized.point.colorAlpha = color.alpha;
      }
    }
    if (point.outlineColor) {
      const outlineColor = point.outlineColor.getValue(Cesium.JulianDate.now());
      if (outlineColor) {
        serialized.point.outlineColor = colorToHexRGB(outlineColor);
        serialized.point.outlineColorAlpha = outlineColor.alpha;
      }
    }
    if (point.outlineWidth) {
      const outlineWidth = point.outlineWidth.getValue(Cesium.JulianDate.now());
      if (typeof outlineWidth === 'number')
        serialized.point.outlineWidth = outlineWidth;
    }
    if (point.heightReference) {
      serialized.point.heightReference = point.heightReference.getValue(
        Cesium.JulianDate.now()
      ) as string;
    }
  }

  // 序列化polyline
  if (entity.polyline) {
    const polyline = entity.polyline;
    serialized.polyline = {};
    if (polyline.positions) {
      const positions = polyline.positions.getValue(Cesium.JulianDate.now());
      if (Array.isArray(positions)) {
        serialized.polyline.positions = positions.map((pos) =>
          cartesian3ToLonLat(pos)
        );
      }
    }
    if (polyline.width) {
      const width = polyline.width.getValue(Cesium.JulianDate.now());
      if (typeof width === 'number') serialized.polyline.width = width;
    }
    if (polyline.material) {
      const material = polyline.material.getValue(Cesium.JulianDate.now());
      if (material instanceof Cesium.Color) {
        serialized.polyline.color = colorToHexRGB(material);
        serialized.polyline.colorAlpha = material.alpha;
      }
    }
    if (polyline.clampToGround !== undefined) {
      serialized.polyline.clampToGround = polyline.clampToGround.getValue(
        Cesium.JulianDate.now()
      ) as boolean;
    }
  }

  // 序列化polygon
  if (entity.polygon) {
    const polygon = entity.polygon;
    serialized.polygon = {};
    if (polygon.hierarchy) {
      const hierarchy = polygon.hierarchy.getValue(Cesium.JulianDate.now());
      if (hierarchy && hierarchy.positions) {
        serialized.polygon.hierarchy = hierarchy.positions.map((pos: Cesium.Cartesian3) =>
          cartesian3ToLonLat(pos)
        );
      }
    }
    if (polygon.material) {
      const material = polygon.material.getValue(Cesium.JulianDate.now());
      if (material instanceof Cesium.Color) {
        serialized.polygon.materialColor = colorToHexRGB(material);
        serialized.polygon.alpha = material.alpha;
      }
    }
    if (polygon.outline !== undefined) {
      serialized.polygon.outline = polygon.outline.getValue(
        Cesium.JulianDate.now()
      ) as boolean;
    }
    if (polygon.outlineColor) {
      const outlineColor = polygon.outlineColor.getValue(Cesium.JulianDate.now());
      if (outlineColor) {
        serialized.polygon.outlineColor = colorToHexRGB(outlineColor);
        serialized.polygon.outlineColorAlpha = outlineColor.alpha;
      }
    }
    if (polygon.outlineWidth) {
      const outlineWidth = polygon.outlineWidth.getValue(Cesium.JulianDate.now());
      if (typeof outlineWidth === 'number') {
        serialized.polygon.outlineWidth = outlineWidth;
      }
    }
    if (polygon.heightReference) {
      serialized.polygon.heightReference = polygon.heightReference.getValue(
        Cesium.JulianDate.now()
      ) as string;
    }
  }

  // 序列化rectangle
  if (entity.rectangle) {
    const rectangle = entity.rectangle;
    serialized.rectangle = {};
    if (rectangle.coordinates) {
      const coords = rectangle.coordinates.getValue(Cesium.JulianDate.now());
      if (coords) {
        serialized.rectangle.west = Cesium.Math.toDegrees(coords.west);
        serialized.rectangle.south = Cesium.Math.toDegrees(coords.south);
        serialized.rectangle.east = Cesium.Math.toDegrees(coords.east);
        serialized.rectangle.north = Cesium.Math.toDegrees(coords.north);
      }
    }
    if (rectangle.material) {
      const material = rectangle.material.getValue(Cesium.JulianDate.now());
      if (material instanceof Cesium.Color) {
        serialized.rectangle.materialColor = colorToHexRGB(material);
        serialized.rectangle.alpha = material.alpha;
      }
    }
    if (rectangle.outline !== undefined) {
      serialized.rectangle.outline = rectangle.outline.getValue(
        Cesium.JulianDate.now()
      ) as boolean;
    }
    if (rectangle.outlineColor) {
      const outlineColor = rectangle.outlineColor.getValue(Cesium.JulianDate.now());
      if (outlineColor) {
        serialized.rectangle.outlineColor = colorToHexRGB(outlineColor);
        serialized.rectangle.outlineColorAlpha = outlineColor.alpha;
      }
    }
    if (rectangle.outlineWidth) {
      const outlineWidth = rectangle.outlineWidth.getValue(Cesium.JulianDate.now());
      if (typeof outlineWidth === 'number') {
        serialized.rectangle.outlineWidth = outlineWidth;
      }
    }
    if (rectangle.heightReference) {
      serialized.rectangle.heightReference = rectangle.heightReference.getValue(
        Cesium.JulianDate.now()
      ) as string;
    }
  }

  // 序列化ellipse
  if (entity.ellipse) {
    const ellipse = entity.ellipse;
    serialized.ellipse = {};
    if (ellipse.semiMajorAxis) {
      const semiMajorAxis = ellipse.semiMajorAxis.getValue(Cesium.JulianDate.now());
      if (typeof semiMajorAxis === 'number') {
        serialized.ellipse.semiMajorAxis = semiMajorAxis;
      }
    }
    if (ellipse.semiMinorAxis) {
      const semiMinorAxis = ellipse.semiMinorAxis.getValue(Cesium.JulianDate.now());
      if (typeof semiMinorAxis === 'number') {
        serialized.ellipse.semiMinorAxis = semiMinorAxis;
      }
    }
    if (entity.position) {
      const position = entity.position.getValue(Cesium.JulianDate.now());
      if (position) {
        serialized.ellipse.center = cartesian3ToLonLat(position);
      }
    }
    if (ellipse.material) {
      const material = ellipse.material.getValue(Cesium.JulianDate.now());
      if (material instanceof Cesium.Color) {
        serialized.ellipse.materialColor = colorToHexRGB(material);
        serialized.ellipse.alpha = material.alpha;
      }
    }
    if (ellipse.outline !== undefined) {
      serialized.ellipse.outline = ellipse.outline.getValue(
        Cesium.JulianDate.now()
      ) as boolean;
    }
    if (ellipse.outlineColor) {
      const outlineColor = ellipse.outlineColor.getValue(Cesium.JulianDate.now());
      if (outlineColor) {
        serialized.ellipse.outlineColor = colorToHexRGB(outlineColor);
        serialized.ellipse.outlineColorAlpha = outlineColor.alpha;
      }
    }
    if (ellipse.outlineWidth) {
      const outlineWidth = ellipse.outlineWidth.getValue(Cesium.JulianDate.now());
      if (typeof outlineWidth === 'number') {
        serialized.ellipse.outlineWidth = outlineWidth;
      }
    }
    if (ellipse.heightReference) {
      serialized.ellipse.heightReference = ellipse.heightReference.getValue(
        Cesium.JulianDate.now()
      ) as string;
    }
  }

  // 序列化label
  if (entity.label) {
    const label = entity.label;
    serialized.label = {};
    if (label.text) {
      const text = label.text.getValue(Cesium.JulianDate.now());
      if (typeof text === 'string') serialized.label.text = text;
    }
    if (label.font) {
      const font = label.font.getValue(Cesium.JulianDate.now());
      if (typeof font === 'string') serialized.label.font = font;
    }
    if (label.fillColor) {
      const fillColor = label.fillColor.getValue(Cesium.JulianDate.now());
      if (fillColor) {
        serialized.label.fillColor = colorToHexRGB(fillColor);
        serialized.label.fillColorAlpha = fillColor.alpha;
      }
    }
    if (label.outlineColor) {
      const outlineColor = label.outlineColor.getValue(Cesium.JulianDate.now());
      if (outlineColor) {
        serialized.label.outlineColor = colorToHexRGB(outlineColor);
        serialized.label.outlineColorAlpha = outlineColor.alpha;
      }
    }
    if (label.outlineWidth) {
      const outlineWidth = label.outlineWidth.getValue(Cesium.JulianDate.now());
      if (typeof outlineWidth === 'number')
        serialized.label.outlineWidth = outlineWidth;
    }
    if (label.style) {
      serialized.label.style = label.style.getValue(Cesium.JulianDate.now()) as string;
    }
    if (label.verticalOrigin) {
      serialized.label.verticalOrigin = label.verticalOrigin.getValue(
        Cesium.JulianDate.now()
      ) as string;
    }
    if (label.pixelOffset) {
      const pixelOffset = label.pixelOffset.getValue(Cesium.JulianDate.now());
      if (pixelOffset) {
        serialized.label.pixelOffset = { x: pixelOffset.x, y: pixelOffset.y };
      }
    }
  }

  return serialized;
}

/**
 * 反序列化Entity
 */
function deserializeEntity(
  serialized: SerializedEntity
): Cesium.Entity.ConstructorOptions & { _config?: EntityConfig } {
  const options: Cesium.Entity.ConstructorOptions & { _config?: EntityConfig } = {
    id: serialized.id,
  };

  if (serialized.name) options.name = serialized.name;
  if (serialized.description) options.description = serialized.description;
  if (serialized.show !== undefined) options.show = serialized.show;

  // 恢复配置
  if (serialized.config) {
    options._config = { ...serialized.config };
  }

  // 反序列化position
  if (serialized.position) {
    options.position = lonLatToCartesian3(serialized.position);
  }

  // 反序列化point
  if (serialized.point) {
    options.point = {};
    if (serialized.point.pixelSize !== undefined) {
      options.point.pixelSize = serialized.point.pixelSize;
    }
    if (serialized.point.color) {
      options.point.color = hexToColor(
        serialized.point.color,
        serialized.point.colorAlpha
      );
    }
    if (serialized.point.outlineColor) {
      options.point.outlineColor = hexToColor(
        serialized.point.outlineColor,
        serialized.point.outlineColorAlpha
      );
    }
    if (serialized.point.outlineWidth !== undefined) {
      options.point.outlineWidth = serialized.point.outlineWidth;
    }
    if (serialized.point.heightReference) {
      options.point.heightReference =
        (Cesium.HeightReference as any)[serialized.point.heightReference] ||
        Cesium.HeightReference.NONE;
    }
  }

  // 反序列化polyline
  if (serialized.polyline) {
    options.polyline = {
      positions: serialized.polyline.positions.map((pos) => lonLatToCartesian3(pos)),
    };
    if (serialized.polyline.width !== undefined) {
      options.polyline.width = serialized.polyline.width;
    }
    if (serialized.polyline.color) {
      options.polyline.material = hexToColor(
        serialized.polyline.color,
        serialized.polyline.colorAlpha
      );
    }
    if (serialized.polyline.clampToGround !== undefined) {
      options.polyline.clampToGround = serialized.polyline.clampToGround;
    }
  }

  // 反序列化polygon
  if (serialized.polygon) {
    options.polygon = {
      hierarchy: serialized.polygon.hierarchy.map((pos) => lonLatToCartesian3(pos)),
    };
    if (serialized.polygon.materialColor) {
      options.polygon.material = hexToColor(
        serialized.polygon.materialColor,
        serialized.polygon.alpha
      );
    }
    if (serialized.polygon.outline !== undefined) {
      options.polygon.outline = serialized.polygon.outline;
    }
    if (serialized.polygon.outlineColor) {
      options.polygon.outlineColor = hexToColor(
        serialized.polygon.outlineColor,
        serialized.polygon.outlineColorAlpha
      );
    }
    if (serialized.polygon.outlineWidth !== undefined) {
      options.polygon.outlineWidth = serialized.polygon.outlineWidth;
    }
    if (serialized.polygon.heightReference) {
      options.polygon.heightReference =
        (Cesium.HeightReference as any)[serialized.polygon.heightReference] ||
        Cesium.HeightReference.NONE;
    }
  }

  // 反序列化rectangle
  if (serialized.rectangle) {
    options.rectangle = {
      coordinates: Cesium.Rectangle.fromDegrees(
        serialized.rectangle.west,
        serialized.rectangle.south,
        serialized.rectangle.east,
        serialized.rectangle.north
      ),
    };
    if (serialized.rectangle.materialColor) {
      options.rectangle.material = hexToColor(
        serialized.rectangle.materialColor,
        serialized.rectangle.alpha
      );
    }
    if (serialized.rectangle.outline !== undefined) {
      options.rectangle.outline = serialized.rectangle.outline;
    }
    if (serialized.rectangle.outlineColor) {
      options.rectangle.outlineColor = hexToColor(
        serialized.rectangle.outlineColor,
        serialized.rectangle.outlineColorAlpha
      );
    }
    if (serialized.rectangle.outlineWidth !== undefined) {
      options.rectangle.outlineWidth = serialized.rectangle.outlineWidth;
    }
    if (serialized.rectangle.heightReference) {
      options.rectangle.heightReference =
        (Cesium.HeightReference as any)[serialized.rectangle.heightReference] ||
        Cesium.HeightReference.NONE;
    }
  }

  // 反序列化ellipse
  if (serialized.ellipse) {
    if (serialized.ellipse.center) {
      options.position = lonLatToCartesian3(serialized.ellipse.center);
    }
    options.ellipse = {};
    if (serialized.ellipse.semiMajorAxis !== undefined) {
      options.ellipse.semiMajorAxis = serialized.ellipse.semiMajorAxis;
    }
    if (serialized.ellipse.semiMinorAxis !== undefined) {
      options.ellipse.semiMinorAxis = serialized.ellipse.semiMinorAxis;
    }
    if (serialized.ellipse.materialColor) {
      options.ellipse.material = hexToColor(
        serialized.ellipse.materialColor,
        serialized.ellipse.alpha
      );
    }
    if (serialized.ellipse.outline !== undefined) {
      options.ellipse.outline = serialized.ellipse.outline;
    }
    if (serialized.ellipse.outlineColor) {
      options.ellipse.outlineColor = hexToColor(
        serialized.ellipse.outlineColor,
        serialized.ellipse.outlineColorAlpha
      );
    }
    if (serialized.ellipse.outlineWidth !== undefined) {
      options.ellipse.outlineWidth = serialized.ellipse.outlineWidth;
    }
    if (serialized.ellipse.heightReference) {
      options.ellipse.heightReference =
        (Cesium.HeightReference as any)[serialized.ellipse.heightReference] ||
        Cesium.HeightReference.NONE;
    }
  }

  // 反序列化label
  if (serialized.label) {
    options.label = {};
    if (serialized.label.text) {
      options.label.text = serialized.label.text;
    }
    if (serialized.label.font) {
      options.label.font = serialized.label.font;
    }
    if (serialized.label.fillColor) {
      options.label.fillColor = hexToColor(
        serialized.label.fillColor,
        serialized.label.fillColorAlpha
      );
    }
    if (serialized.label.outlineColor) {
      options.label.outlineColor = hexToColor(
        serialized.label.outlineColor,
        serialized.label.outlineColorAlpha
      );
    }
    if (serialized.label.outlineWidth !== undefined) {
      options.label.outlineWidth = serialized.label.outlineWidth;
    }
    if (serialized.label.style) {
      options.label.style =
        (Cesium.LabelStyle as any)[serialized.label.style] ||
        Cesium.LabelStyle.FILL_AND_OUTLINE;
    }
    if (serialized.label.verticalOrigin) {
      options.label.verticalOrigin =
        (Cesium.VerticalOrigin as any)[serialized.label.verticalOrigin] ||
        Cesium.VerticalOrigin.CENTER;
    }
    if (serialized.label.pixelOffset) {
      options.label.pixelOffset = new Cesium.Cartesian2(
        serialized.label.pixelOffset.x,
        serialized.label.pixelOffset.y
      );
    }
  }

  return options;
}

/**
 * 导出图层数据（多个图层）
 */
export function exportLayers(layers: LayerRecord[]): LayerExportData {
  const serializedLayers: SerializedLayer[] = layers.map((layer) => {
    const entities: SerializedEntity[] = Object.values(layer.entities).map(
      (entity) => serializeEntity(entity)
    );

    // 目前primitives的序列化暂时留空，可以根据需要扩展
    const primitives: SerializedPrimitive[] = [];

    return {
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      createdAt: layer.createdAt,
      entities,
      primitives,
    };
  });

  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    layers: serializedLayers,
  };
}

/**
 * 导出单个图层数据
 */
export function exportSingleLayer(layer: LayerRecord): LayerExportData {
  const entities: SerializedEntity[] = Object.values(layer.entities).map(
    (entity) => serializeEntity(entity)
  );

  const primitives: SerializedPrimitive[] = [];

  const serializedLayer: SerializedLayer = {
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    createdAt: layer.createdAt,
    entities,
    primitives,
  };

  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    layers: [serializedLayer],
  };
}

/**
 * 导入图层数据（多个图层）
 */
export function importLayers(
  data: LayerExportData
): Array<{
  layer: Omit<SerializedLayer, 'entities' | 'primitives'>;
  entities: SerializedEntity[];
  primitives: SerializedPrimitive[];
}> {
  if (!data.layers || !Array.isArray(data.layers)) {
    throw new Error('无效的图层数据格式');
  }

  return data.layers.map((layer) => ({
    layer: {
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      createdAt: layer.createdAt,
    },
    entities: layer.entities || [],
    primitives: layer.primitives || [],
  }));
}

/**
 * 导入单个图层数据
 */
export function importSingleLayer(
  data: LayerExportData
): {
  layer: Omit<SerializedLayer, 'entities' | 'primitives'>;
  entities: SerializedEntity[];
  primitives: SerializedPrimitive[];
} | null {
  if (!data.layers || !Array.isArray(data.layers) || data.layers.length === 0) {
    throw new Error('无效的图层数据格式');
  }

  // 只导入第一个图层
  const layer = data.layers[0];
  return {
    layer: {
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      createdAt: layer.createdAt,
    },
    entities: layer.entities || [],
    primitives: layer.primitives || [],
  };
}

/**
 * 将Entity选项转换为Entity对象（用于导入时创建）
 */
export function createEntityFromOptions(
  options: Cesium.Entity.ConstructorOptions
): Cesium.Entity.ConstructorOptions {
  return options;
}

export { deserializeEntity, serializeEntity };

