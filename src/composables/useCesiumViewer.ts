import { ref } from 'vue';
import * as Cesium from 'cesium';
import { cesiumConfig, type CesiumConfig } from '../config/cesium.config';
import { useCesiumStore } from '../stores/cesium';
import { useLayerStore } from '../stores/layers';

type ImageryProviderFactory = (config: CesiumConfig) => Promise<Cesium.ImageryProvider | undefined>;
type TerrainProviderFactory = (config: CesiumConfig) => Promise<Cesium.TerrainProvider>;

const isCustomToken = (token?: string) => {
  if (!token) {
    return false;
  }
  return token !== cesiumConfig.token;
};

const createImageryProvider: ImageryProviderFactory = async (config) => {
  const imageryConfig = config.imageryProvider;

  if (!imageryConfig) {
    return undefined;
  }

  if (imageryConfig.useIonImagery) {
    try {
      return new Cesium.IonImageryProvider({ assetId: 2 });
    } catch (error) {
      console.warn('Cesium Ion imagery failed, fallback to OSM:', error);
      return new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/',
      });
    }
  }

  if (imageryConfig.type === 'osm') {
    return new Cesium.OpenStreetMapImageryProvider({
      url: 'https://a.tile.openstreetmap.org/',
    });
  }

  if (imageryConfig.type === 'bing') {
    return new Cesium.BingMapsImageryProvider({
      url: 'https://dev.virtualearth.net',
      key: imageryConfig.options?.key || '',
      mapStyle: imageryConfig.options?.mapStyle || Cesium.BingMapsStyle.AERIAL,
    });
  }

  if (imageryConfig.type === 'arcgis') {
    return new Cesium.ArcGisMapServerImageryProvider({
      url: imageryConfig.customImageryUrl || 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    });
  }

  if (imageryConfig.type === 'mapbox') {
    return new Cesium.MapboxImageryProvider({
      mapId: imageryConfig.options?.mapId || '',
      accessToken: imageryConfig.options?.accessToken || '',
    });
  }

  if (imageryConfig.type === 'custom' && imageryConfig.customImageryUrl) {
    return new Cesium.UrlTemplateImageryProvider({
      url: imageryConfig.customImageryUrl,
      ...imageryConfig.options,
    });
  }

  return undefined;
};

const createTerrainProvider: TerrainProviderFactory = async (config) => {
  const terrainConfig = config.terrainProvider;

  if (!terrainConfig) {
    return new Cesium.EllipsoidTerrainProvider();
  }

  if (terrainConfig.useIonTerrain) {
    try {
      return await Cesium.createWorldTerrainAsync();
    } catch (error) {
      console.warn('Cesium Ion terrain failed, fallback to Ellipsoid:', error);
      return new Cesium.EllipsoidTerrainProvider();
    }
  }

  if (terrainConfig.customTerrainUrl) {
    return new Cesium.EllipsoidTerrainProvider();
  }

  return new Cesium.EllipsoidTerrainProvider();
};

export function useCesiumViewer() {
  const containerRef = ref<HTMLDivElement | null>(null);
  const viewer = ref<Cesium.Viewer | null>(null);
  const store = useCesiumStore();
  const layerStore = useLayerStore();

  const mergeConfig = (overrides?: Partial<CesiumConfig>): CesiumConfig => {
    return {
      token: overrides?.token || cesiumConfig.token,
      imageryProvider: {
        ...cesiumConfig.imageryProvider,
        ...overrides?.imageryProvider,
      },
      terrainProvider: {
        ...cesiumConfig.terrainProvider,
        ...overrides?.terrainProvider,
      },
    };
  };

  const disposeViewer = () => {
    if (store.viewer) {
      store.destroyViewer();
    }
    layerStore.reset();
    viewer.value = null;
  };

  const hideAttribution = () => {
    const container = containerRef.value?.querySelector('.cesium-viewer-bottom');
    if (container) {
      (container as HTMLElement).style.display = 'none';
    }
  };

  const initViewer = async (overrides?: Partial<CesiumConfig>) => {
    if (!containerRef.value) {
      return;
    }

    const config = mergeConfig(overrides);

    if (isCustomToken(config.token)) {
      Cesium.Ion.defaultAccessToken = config.token as string;
    }

    disposeViewer();

    const [imageryProvider, terrainProvider] = await Promise.all([
      createImageryProvider(config),
      createTerrainProvider(config),
    ]);

    const instance = new Cesium.Viewer(containerRef.value, {
      imageryProvider: imageryProvider,
      terrainProvider: terrainProvider,
      baseLayerPicker: true,
      geocoder: true,
      homeButton: true,
      sceneModePicker: true,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      selectionIndicator: false, // 禁用默认的选择指示器，我们使用自定义高亮
      infoBox: false, // 禁用 infoBox，避免显示默认的实体信息对话框
      shadows: false,
      shouldAnimate: false,
    });

    store.setViewer(instance);
    store.setConfig(config);

    viewer.value = instance;
    hideAttribution();

    if (imageryProvider && instance.imageryLayers.length > 0) {
      const baseLayer = instance.imageryLayers.get(0);
      
      // 调整影像图层的颜色参数，使地图更鲜艳
      const layerSettings = config.imageryProvider?.layerSettings;
      if (baseLayer && layerSettings) {
        // 应用配置的亮度值（如果未配置则使用默认值 1.0）
        if (layerSettings.brightness !== undefined) {
          baseLayer.brightness = layerSettings.brightness;
        }
        // 应用配置的对比度值
        if (layerSettings.contrast !== undefined) {
          baseLayer.contrast = layerSettings.contrast;
        }
        // 应用配置的饱和度值（这是使颜色更鲜艳的关键参数）
        if (layerSettings.saturation !== undefined) {
          baseLayer.saturation = layerSettings.saturation;
        }
        // 应用配置的 gamma 值
        if (layerSettings.gamma !== undefined) {
          baseLayer.gamma = layerSettings.gamma;
        }
      }
      
      baseLayer?.imageryProvider?.errorEvent.addEventListener((error: any) => {
        console.warn('Imagery provider failed, fallback to OSM:', error);
        try {
          const osmProvider = new Cesium.OpenStreetMapImageryProvider({
            url: 'https://a.tile.openstreetmap.org/',
          });
          if (baseLayer) {
            instance.imageryLayers.remove(baseLayer);
          }
          const fallbackLayer = instance.imageryLayers.addImageryProvider(osmProvider);
          // 对新添加的图层也应用相同的颜色调整
          const layerSettings = config.imageryProvider?.layerSettings;
          if (fallbackLayer && layerSettings) {
            if (layerSettings.brightness !== undefined) {
              fallbackLayer.brightness = layerSettings.brightness;
            }
            if (layerSettings.contrast !== undefined) {
              fallbackLayer.contrast = layerSettings.contrast;
            }
            if (layerSettings.saturation !== undefined) {
              fallbackLayer.saturation = layerSettings.saturation;
            }
            if (layerSettings.gamma !== undefined) {
              fallbackLayer.gamma = layerSettings.gamma;
            }
          }
        } catch (fallbackError) {
          console.error('Fallback to OSM failed:', fallbackError);
        }
      });
    }

    instance.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(116.3974, 39.9093, 10000000),
    });
  };

  return {
    containerRef,
    viewer,
    initViewer,
    destroyViewer: disposeViewer,
  };
}

