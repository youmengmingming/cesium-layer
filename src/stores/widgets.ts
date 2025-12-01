import { defineStore } from 'pinia';
import { ref, type Component } from 'vue';

/**
 * 组件懒加载类型
 * - Component: 直接传入组件（立即加载）
 * - () => Promise<Component>: 返回组件 Promise 的函数（懒加载）
 * - string: 组件路径字符串，用于动态导入（懒加载）
 */
export type LazyComponent = Component | (() => Promise<Component>) | string;

export interface WidgetConfig {
  id: string;
  component: LazyComponent;
  title: string;
  props?: Record<string, any>;
  events?: Record<string, (...args: any[]) => void>;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  closable?: boolean;
  zIndex?: number;
}

interface WidgetState {
  widgets: Record<string, WidgetConfig>;
  maxZIndex: number;
}

export const useWidgetStore = defineStore('widgets', {
  state: (): WidgetState => ({
    widgets: {},
    maxZIndex: 1000,
  }),

  getters: {
    getWidgets: (state): WidgetConfig[] => {
      return Object.values(state.widgets);
    },

    getWidgetById: (state) => {
      return (id: string): WidgetConfig | undefined => {
        return state.widgets[id];
      };
    },
  },

  actions: {
    /**
     * 添加窗口
     */
    addWidget(config: WidgetConfig) {
      // 如果窗口已存在，更新它
      if (this.widgets[config.id]) {
        this.widgets[config.id] = {
          ...this.widgets[config.id],
          ...config,
          zIndex: this.maxZIndex++,
        };
      } else {
        this.widgets[config.id] = {
          ...config,
          zIndex: this.maxZIndex++,
        };
      }
    },

    /**
     * 移除窗口
     */
    removeWidget(id: string) {
      delete this.widgets[id];
    },

    /**
     * 更新窗口配置
     */
    updateWidget(id: string, updates: Partial<WidgetConfig>) {
      const widget = this.widgets[id];
      if (widget) {
        this.widgets[id] = { ...widget, ...updates };
      }
    },

    /**
     * 设置窗口 z-index（用于置顶）
     */
    bringToFront(id: string) {
      const widget = this.widgets[id];
      if (widget) {
        this.widgets[id] = {
          ...widget,
          zIndex: this.maxZIndex++,
        };
      }
    },

    /**
     * 清除所有窗口
     */
    clearAll() {
      this.widgets = {};
      this.maxZIndex = 1000;
    },
  },
});

