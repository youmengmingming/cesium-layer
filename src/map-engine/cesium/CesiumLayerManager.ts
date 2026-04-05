import * as Cesium from 'cesium';
import type { ILayerManager, ILayer } from '../core/interfaces';
import { useLayerStore } from '../../stores/layers';

export class CesiumLayerManager implements ILayerManager {
  private viewer: Cesium.Viewer;
  private layerStore = useLayerStore();

  constructor(viewer: Cesium.Viewer) {
    this.viewer = viewer;
  }

  addLayer(name: string, options?: { visible?: boolean; id?: string }): ILayer {
    const layer = this.layerStore.createLayer({
      name,
      visible: options?.visible,
      id: options?.id,
    });

    return {
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      type: 'cesium-layer',
    };
  }

  removeLayer(id: string): void {
    this.layerStore.removeLayerWithViewer(id);
  }

  setVisibility(id: string, visible: boolean): void {
    this.layerStore.setLayerVisibilityWithViewer(id, visible);
  }

  getLayers(): ILayer[] {
    return this.layerStore.layerList.map((layer) => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      type: 'cesium-layer',
    }));
  }
}
