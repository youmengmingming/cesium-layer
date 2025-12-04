/**
 * Cesium 配置文件
 * 可以在这里配置 Cesium Token 和地图数据源
 */

export interface CesiumConfig {
  // Cesium Ion Token
  token: string;
  
  // 地图数据源配置
  imageryProvider?: {
    // 使用 Cesium Ion 的默认影像
    useIonImagery?: boolean;
    
    // 或者使用自定义影像提供商 URL
    customImageryUrl?: string;
    
    // 影像提供商类型: 'osm' | 'bing' | 'arcgis' | 'mapbox' | 'custom'
    type?: 'osm' | 'bing' | 'arcgis' | 'mapbox' | 'custom';
    
    // 其他配置参数
    options?: Record<string, any>;
    
    // 影像图层颜色调整参数（使地图更鲜艳）
    layerSettings?: {
      // 亮度 (默认 1.0，推荐范围 0.8-1.5)
      brightness?: number;
      // 对比度 (默认 1.0，推荐范围 0.8-2.0)
      contrast?: number;
      // 饱和度 (默认 1.0，推荐范围 0.0-3.0，值越大颜色越鲜艳)
      saturation?: number;
      // Gamma 值 (默认 1.0，推荐范围 0.5-2.0，降低可增加亮度和对比度)
      gamma?: number;
    };
  };
  
  // Terrain 地形配置
  terrainProvider?: {
    // 使用 Cesium Ion 的默认地形
    useIonTerrain?: boolean;
    
    // 或者使用自定义地形提供商 URL
    customTerrainUrl?: string;
  };
}

// 默认配置
export const defaultConfig: CesiumConfig = {
  // 请在此处填入您的 Cesium Ion Token
  // 获取 Token: https://cesium.com/ion/tokens
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZTQ4M2MzYS02YjI0LTRkN2YtYTcxNC1lZGNiZDUzNmVlNGEiLCJpZCI6MzYzMzI3LCJpYXQiOjE3NjM5ODEyODV9.cvweDrQKtp3UaWrVYjiAleWk3jwwxPKSH98ES40AN6U',
  
  imageryProvider: {
    useIonImagery: false, // 使用 Cesium Ion 默认影像（assetId 2 可能使用 Bing Maps，在某些地区可能访问失败）
    type: 'osm', // 默认使用 OSM，更可靠
    // 影像图层颜色调整参数，使地图更鲜艳
    layerSettings: {
      brightness: 1.15,   // 增加亮度
      contrast: 1.2,      // 增加对比度
      saturation: 1.8,    // 增加饱和度，使颜色更鲜艳
      gamma: 0.85,        // 降低 gamma，增加整体亮度和对比度
    },
  },
  
  terrainProvider: {
    useIonTerrain: true, // 使用 Cesium Ion 默认地形
  },
};

// 导出配置
export const cesiumConfig: CesiumConfig = {
  ...defaultConfig,
  // 可以从环境变量或外部配置文件加载
  token: import.meta.env.VITE_CESIUM_TOKEN || defaultConfig.token,
};

