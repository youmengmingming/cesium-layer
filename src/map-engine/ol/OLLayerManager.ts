import type { ILayerManager, ILayer } from '../core/interfaces';
import { useLayerStore } from '../../stores/layers';
import Map from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

export class OLLayerManager implements ILayerManager {
  private map: Map;
  private layerStore = useLayerStore();
  private olLayers: Record<string, VectorLayer<VectorSource>> = {};

  constructor(map: Map) {
    this.map = map;
    this.syncLayersFromStore();
  }

  private syncLayersFromStore(): void {
    // 每次引擎初始化时，将 store 中已有的图层同步到新的地图实例
    this.layerStore.layerList.forEach((layer) => {
      if (!this.olLayers[layer.id]) {
        const olLayer = new VectorLayer({
          source: new VectorSource(),
          visible: layer.visible,
        });
        olLayer.set('id', layer.id);
        this.olLayers[layer.id] = olLayer;
        this.map.addLayer(olLayer);
      }
    });
  }

  private getOrCreateOLLayer(id: string): VectorLayer<VectorSource> | undefined {
    if (this.olLayers[id]) return this.olLayers[id];

    const layer = this.layerStore.layers[id];
    if (layer) {
      const olLayer = new VectorLayer({
        source: new VectorSource(),
        visible: layer.visible,
      });
      olLayer.set('id', id);
      this.olLayers[id] = olLayer;
      this.map.addLayer(olLayer);
      return olLayer;
    }
    return undefined;
  }

  addLayer(name: string, options?: { visible?: boolean; id?: string }): ILayer {
    const layer = this.layerStore.createLayer({
      name,
      visible: options?.visible,
      id: options?.id,
    });

    const olLayer = this.getOrCreateOLLayer(layer.id);
    if (olLayer) {
      olLayer.setVisible(options?.visible ?? true);
    }

    return {
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      type: 'ol-layer',
    };
  }

  removeLayer(id: string): void {
    const olLayer = this.olLayers[id];
    if (olLayer) {
      this.map.removeLayer(olLayer);
      delete this.olLayers[id];
    }
    this.layerStore.removeLayer(id);
  }

  setVisibility(id: string, visible: boolean): void {
    const olLayer = this.getOrCreateOLLayer(id);
    if (olLayer) {
      olLayer.setVisible(visible);
    }
    this.layerStore.setLayerVisibility(id, visible);
  }

  getLayers(): ILayer[] {
    return this.layerStore.layerList.map((layer) => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      type: 'ol-layer',
      entityCount: Object.keys(layer.entities).length,
      primitiveCount: Object.keys(layer.primitives).length,
    }));
  }

  getLayerInstance(id: string): VectorLayer<VectorSource> | undefined {
    return this.getOrCreateOLLayer(id);
  }
}
