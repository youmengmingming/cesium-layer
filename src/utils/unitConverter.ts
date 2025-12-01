/**
 * 单位转换工具
 */

export type LengthUnit = 'meter' | 'kilometer' | 'foot' | 'mile' | 'nautical-mile';
export type AreaUnit = 'square-meter' | 'square-kilometer' | 'hectare' | 'acre' | 'square-foot';
export type ElevationUnit = 'meter' | 'foot';

/**
 * 长度单位转换
 */
export function convertLength(value: number, fromUnit: LengthUnit, toUnit: LengthUnit): number {
  // 先转换为米
  let meters = value;
  switch (fromUnit) {
    case 'meter':
      meters = value;
      break;
    case 'kilometer':
      meters = value * 1000;
      break;
    case 'foot':
      meters = value * 0.3048;
      break;
    case 'mile':
      meters = value * 1609.344;
      break;
    case 'nautical-mile':
      meters = value * 1852;
      break;
  }

  // 再转换为目标单位
  switch (toUnit) {
    case 'meter':
      return meters;
    case 'kilometer':
      return meters / 1000;
    case 'foot':
      return meters / 0.3048;
    case 'mile':
      return meters / 1609.344;
    case 'nautical-mile':
      return meters / 1852;
    default:
      return meters;
  }
}

/**
 * 面积单位转换
 */
export function convertArea(value: number, fromUnit: AreaUnit, toUnit: AreaUnit): number {
  // 先转换为平方米
  let squareMeters = value;
  switch (fromUnit) {
    case 'square-meter':
      squareMeters = value;
      break;
    case 'square-kilometer':
      squareMeters = value * 1000000;
      break;
    case 'hectare':
      squareMeters = value * 10000;
      break;
    case 'acre':
      squareMeters = value * 4046.8564224;
      break;
    case 'square-foot':
      squareMeters = value * 0.09290304;
      break;
  }

  // 再转换为目标单位
  switch (toUnit) {
    case 'square-meter':
      return squareMeters;
    case 'square-kilometer':
      return squareMeters / 1000000;
    case 'hectare':
      return squareMeters / 10000;
    case 'acre':
      return squareMeters / 4046.8564224;
    case 'square-foot':
      return squareMeters / 0.09290304;
    default:
      return squareMeters;
  }
}

/**
 * 海拔单位转换
 */
export function convertElevation(value: number, fromUnit: ElevationUnit, toUnit: ElevationUnit): number {
  if (fromUnit === toUnit) {
    return value;
  }
  
  if (fromUnit === 'meter' && toUnit === 'foot') {
    return value / 0.3048;
  }
  
  if (fromUnit === 'foot' && toUnit === 'meter') {
    return value * 0.3048;
  }
  
  return value;
}

/**
 * 获取长度单位标签
 */
export function getLengthUnitLabel(unit: LengthUnit): string {
  const labels: Record<LengthUnit, string> = {
    'meter': '米',
    'kilometer': '千米',
    'foot': '英尺',
    'mile': '英里',
    'nautical-mile': '海里',
  };
  return labels[unit];
}

/**
 * 获取面积单位标签
 */
export function getAreaUnitLabel(unit: AreaUnit): string {
  const labels: Record<AreaUnit, string> = {
    'square-meter': '平方米',
    'square-kilometer': '平方千米',
    'hectare': '公顷',
    'acre': '英亩',
    'square-foot': '平方英尺',
  };
  return labels[unit];
}

/**
 * 获取海拔单位标签
 */
export function getElevationUnitLabel(unit: ElevationUnit): string {
  const labels: Record<ElevationUnit, string> = {
    'meter': '米',
    'foot': '英尺',
  };
  return labels[unit];
}

/**
 * 格式化长度值
 */
export function formatLength(value: number, unit: LengthUnit, precision: number = 2): string {
  const formatted = value.toFixed(precision);
  return `${formatted} ${getLengthUnitLabel(unit)}`;
}

/**
 * 格式化面积值
 */
export function formatArea(value: number, unit: AreaUnit, precision: number = 2): string {
  const formatted = value.toFixed(precision);
  return `${formatted} ${getAreaUnitLabel(unit)}`;
}

/**
 * 格式化海拔值
 */
export function formatElevation(value: number, unit: ElevationUnit, precision: number = 2): string {
  const formatted = value.toFixed(precision);
  return `${formatted} ${getElevationUnitLabel(unit)}`;
}

