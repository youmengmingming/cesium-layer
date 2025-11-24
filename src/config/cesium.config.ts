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
    useIonImagery: true, // 使用 Cesium Ion 默认影像
    type: 'osm', // 如果不使用 Ion，可以使用 OSM
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

