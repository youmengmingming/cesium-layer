import { ref } from 'vue';
import * as Cesium from 'cesium';
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { useCesiumStore } from '../stores/cesium';
import { useLayerStore } from '../stores/layers';
import { mapProvider } from '../map-engine/MapProvider';

export interface GeoJsonLoaderResult {
  layerId: string;
  layerName: string;
  featureCount: number;
}

export interface GeoJsonLoaderOptions {
  layerName?: string;
  clampToGround?: boolean;
  lineColor?: string;
  fillColor?: string;
  lineWidth?: number;
  pointSize?: number;
}

const defaultOptions: Required<GeoJsonLoaderOptions> = {
  layerName: 'GeoJSON 图层',
  clampToGround: true,
  lineColor: '#ff5500',
  fillColor: '#ffcc33',
  lineWidth: 2,
  pointSize: 8,
};

function parseCssColor(value: string, fallback: Cesium.Color): Cesium.Color {
  if (!value) {
    return fallback;
  }
  try {
    return Cesium.Color.fromCssColorString(value) || fallback;
  } catch (error) {
    return fallback;
  }
}

function toCartesianPositions(coordinates: number[][]): Cesium.Cartesian3[] {
  return coordinates.map((coord) => Cesium.Cartesian3.fromDegrees(coord[0], coord[1]));
}

function buildRectangleFromCoordinates(coordinates: number[][], rect: { minLng: number; minLat: number; maxLng: number; maxLat: number }) {
  coordinates.forEach((coord) => {
    const [lng, lat] = coord;
    if (lng < rect.minLng) rect.minLng = lng;
    if (lng > rect.maxLng) rect.maxLng = lng;
    if (lat < rect.minLat) rect.minLat = lat;
    if (lat > rect.maxLat) rect.maxLat = lat;
  });
}

function updateExtentFromGeometry(geometry: Geometry, extent: { minLng: number; minLat: number; maxLng: number; maxLat: number }) {
  if (!geometry) return;

  switch (geometry.type) {
    case 'Point':
      buildRectangleFromCoordinates([geometry.coordinates as number[]], extent);
      break;
    case 'MultiPoint':
    case 'LineString':
      buildRectangleFromCoordinates(geometry.coordinates as number[][], extent);
      break;
    case 'MultiLineString':
    case 'Polygon':
      (geometry.coordinates as number[][][]).forEach((ring) => buildRectangleFromCoordinates(ring, extent));
      break;
    case 'MultiPolygon':
      (geometry.coordinates as number[][][][]).forEach((polygon) => polygon.forEach((ring) => buildRectangleFromCoordinates(ring, extent)));
      break;
    default:
      break;
  }
}

function getGeometryStyle(feature: Feature, defaultStyle: Required<GeoJsonLoaderOptions>) {
  const properties = feature.properties ?? {};
  const lineColor = parseCssColor((properties.stroke as string) || defaultStyle.lineColor, Cesium.Color.fromCssColorString(defaultStyle.lineColor));
  const fillColor = parseCssColor((properties.fill as string) || defaultStyle.fillColor, Cesium.Color.fromCssColorString(defaultStyle.fillColor)).withAlpha(properties['fill-opacity'] ? Number(properties['fill-opacity']) : 0.4);
  const width = Number(properties['stroke-width'] ?? defaultStyle.lineWidth) || defaultStyle.lineWidth;
  const pointSize = Number(properties['marker-size'] ?? defaultStyle.pointSize) || defaultStyle.pointSize;
  return { lineColor, fillColor, width, pointSize };
}

function createEntityForFeature(layerId: string, feature: Feature, options: Required<GeoJsonLoaderOptions>) {
  const layerStore = useLayerStore();
  const geometry = feature.geometry;
  const style = getGeometryStyle(feature, options);
  const name = feature.properties?.name ?? feature.properties?.title ?? options.layerName;

  if (!geometry) {
    return [];
  }

  const entities: Cesium.Entity[] = [];

  const properties = (feature.properties ?? {}) as Record<string, any>;

  switch (geometry.type) {
    case 'Point': {
      const [lng, lat] = geometry.coordinates as number[];
      const entity = layerStore.createEntityInLayer(layerId, {
        name,
        position: Cesium.Cartesian3.fromDegrees(lng, lat),
        point: {
          pixelSize: style.pointSize,
          color: style.lineColor,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: options.clampToGround ? Cesium.HeightReference.CLAMP_TO_GROUND : Cesium.HeightReference.NONE,
        },
        properties,
      });
      if (entity) entities.push(entity);
      break;
    }
    case 'MultiPoint': {
      (geometry.coordinates as number[][]).forEach((coord) => {
        const [lng, lat] = coord;
        const entity = layerStore.createEntityInLayer(layerId, {
          name,
          position: Cesium.Cartesian3.fromDegrees(lng, lat),
          point: {
            pixelSize: style.pointSize,
            color: style.lineColor,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
            heightReference: options.clampToGround ? Cesium.HeightReference.CLAMP_TO_GROUND : Cesium.HeightReference.NONE,
          },
          properties,
        });
        if (entity) entities.push(entity);
      });
      break;
    }
    case 'LineString': {
      const positions = toCartesianPositions(geometry.coordinates as number[][]);
      const entity = layerStore.createEntityInLayer(layerId, {
        name,
        polyline: {
          positions,
          width: style.width,
          material: style.lineColor,
          clampToGround: options.clampToGround,
        },
        properties,
      });
      if (entity) entities.push(entity);
      break;
    }
    case 'MultiLineString': {
      (geometry.coordinates as number[][][]).forEach((coords) => {
        const positions = toCartesianPositions(coords);
        const entity = layerStore.createEntityInLayer(layerId, {
          name,
          polyline: {
            positions,
            width: style.width,
            material: style.lineColor,
            clampToGround: options.clampToGround,
          },
          properties,
        });
        if (entity) entities.push(entity);
      });
      break;
    }
    case 'Polygon': {
      const hierarchy = (geometry.coordinates as number[][][]).map((ring) => toCartesianPositions(ring));
      if (hierarchy.length === 0) break;
      const entity = layerStore.createEntityInLayer(layerId, {
        name,
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(hierarchy[0], hierarchy.slice(1).map((ring) => new Cesium.PolygonHierarchy(ring))),
          material: style.fillColor,
          outline: true,
          outlineColor: style.lineColor,
          outlineWidth: style.width,
          perPositionHeight: false,
          classificationType: Cesium.ClassificationType.TERRAIN,
        },
        properties,
      });
      if (entity) entities.push(entity);
      break;
    }
    case 'MultiPolygon': {
      (geometry.coordinates as number[][][][]).forEach((polygon) => {
        if (!polygon.length) return;
        const hierarchy = polygon.map((ring) => toCartesianPositions(ring));
        const entity = layerStore.createEntityInLayer(layerId, {
          name,
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy(hierarchy[0], hierarchy.slice(1).map((ring) => new Cesium.PolygonHierarchy(ring))),
            material: style.fillColor,
            outline: true,
            outlineColor: style.lineColor,
            outlineWidth: style.width,
            perPositionHeight: false,
            classificationType: Cesium.ClassificationType.TERRAIN,
          },
          properties,
        });
        if (entity) entities.push(entity);
      });
      break;
    }
    default:
      console.warn('Unsupported GeoJSON geometry type:', geometry.type);
  }

  return entities;
}

function createLayerName(baseName?: string) {
  return baseName ? `${baseName}` : defaultOptions.layerName;
}

export function useGeoJsonLoader() {
  const isLoading = ref(false);

  const loadGeoJsonFromObject = async (
    geojson: FeatureCollection | Feature,
    options?: GeoJsonLoaderOptions,
  ): Promise<GeoJsonLoaderResult> => {
    const finalOptions = { ...defaultOptions, ...options };
    const cesiumStore = useCesiumStore();
    const viewer = cesiumStore.getViewer ?? mapProvider.engine?.getOriginalViewer();

    if (!viewer) {
      throw new Error('Cesium Viewer not available.');
    }

    const features: Feature[] = geojson.type === 'FeatureCollection' ? geojson.features : [geojson];
    const layerStore = useLayerStore();
    const layerName = createLayerName(finalOptions.layerName);
    const layer = layerStore.createLayer({ name: layerName, visible: true });
    const extent = { minLng: 180, minLat: 90, maxLng: -180, maxLat: -90 };

    features.forEach((feature) => {
      if (!feature.geometry) {
        return;
      }
      updateExtentFromGeometry(feature.geometry, extent);
      createEntityForFeature(layer.id, feature, finalOptions);
    });

    const hasExtent = extent.minLng <= extent.maxLng && extent.minLat <= extent.maxLat;
    if (hasExtent) {
      viewer.camera.flyTo({
        destination: Cesium.Rectangle.fromDegrees(extent.minLng, extent.minLat, extent.maxLng, extent.maxLat),
      });
    }

    return {
      layerId: layer.id,
      layerName,
      featureCount: features.length,
    };
  };

  const loadGeoJsonFromFile = async (file: File, options?: GeoJsonLoaderOptions) => {
    isLoading.value = true;
    try {
      const text = await file.text();
      const geojson = JSON.parse(text) as FeatureCollection | Feature;
      return await loadGeoJsonFromObject(geojson, options);
    } finally {
      isLoading.value = false;
    }
  };

  const loadGeoJsonFromUrl = async (url: string, options?: GeoJsonLoaderOptions) => {
    isLoading.value = true;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load GeoJSON: ${response.status} ${response.statusText}`);
      }
      const geojson = (await response.json()) as FeatureCollection | Feature;
      return await loadGeoJsonFromObject(geojson, options);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    loadGeoJsonFromFile,
    loadGeoJsonFromUrl,
    loadGeoJsonFromObject,
  };
}
