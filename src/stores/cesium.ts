import { defineStore } from 'pinia';
import * as Cesium from 'cesium';
import type { CesiumConfig } from '../config/cesium.config';

interface CesiumState {
  viewer: Cesium.Viewer | null;
  isInitialized: boolean;
  config: CesiumConfig | null;
}

export const useCesiumStore = defineStore('cesium', {
  state: (): CesiumState => ({
    viewer: null,
    isInitialized: false,
    config: null,
  }),

  getters: {
    /**
     * 获取 Cesium Viewer 实例
     */
    getViewer: (state): Cesium.Viewer | null => {
      return state.viewer;
    },

    /**
     * 检查是否已初始化
     */
    getIsInitialized: (state): boolean => {
      return state.isInitialized;
    },

    /**
     * 获取当前配置
     */
    getConfig: (state): CesiumConfig | null => {
      return state.config;
    },
  },

  actions: {
    /**
     * 设置 Viewer 实例
     * @param viewer Cesium Viewer 实例
     */
    setViewer(viewer: Cesium.Viewer | null) {
      this.viewer = viewer;
      this.isInitialized = viewer !== null;
    },

    /**
     * 设置配置
     * @param config Cesium 配置
     */
    setConfig(config: CesiumConfig) {
      this.config = config;
    },

    /**
     * 销毁 Viewer 实例
     */
    destroyViewer() {
      if (this.viewer) {
        this.viewer.destroy();
        this.viewer = null;
        this.isInitialized = false;
      }
    },

    /**
     * 重置 Store 状态
     */
    reset() {
      this.destroyViewer();
      this.config = null;
    },
  },
});

