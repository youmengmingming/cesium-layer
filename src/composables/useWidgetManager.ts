import { h, type Component } from 'vue';
import { useWidgetStore, type WidgetConfig } from '../stores/widgets';
import DraggableWindow from '../components/DraggableWindow.vue';

/**
 * 窗口管理器 Composable
 * 提供 openWidget 函数来打开可拖拽窗口
 */
export function useWidgetManager() {
  const widgetStore = useWidgetStore();

  /**
   * 打开一个窗口
   * @param config 窗口配置
   * @returns 窗口 ID
   */
  const openWidget = (config: Omit<WidgetConfig, 'id'> & { id?: string }): string => {
    const id = config.id || `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 考虑标题栏高度（60px）计算初始位置
    const headerHeight = 60;
    const defaultX = config.x ?? (window.innerWidth - (config.width || 400)) / 2;
    const defaultY = config.y ?? (window.innerHeight - headerHeight - (config.height || 300)) / 2 + headerHeight;
    // 确保 y 坐标不小于标题栏高度
    const finalY = Math.max(headerHeight, defaultY);
    
    const widgetConfig: WidgetConfig = {
      id,
      component: config.component,
      title: config.title,
      props: config.props || {},
      events: config.events || {},
      width: config.width || 400,
      height: config.height || 300,
      x: defaultX,
      y: finalY,
      minWidth: config.minWidth || 200,
      minHeight: config.minHeight || 150,
      resizable: config.resizable !== false,
      minimizable: config.minimizable !== false,
      maximizable: config.maximizable !== false,
      closable: config.closable !== false,
      zIndex: widgetStore.maxZIndex + 1,
    };

    widgetStore.addWidget(widgetConfig);
    return id;
  };

  /**
   * 关闭窗口
   * @param id 窗口 ID
   */
  const closeWidget = (id: string) => {
    widgetStore.removeWidget(id);
  };

  /**
   * 关闭所有窗口
   */
  const closeAllWidgets = () => {
    widgetStore.clearAll();
  };

  /**
   * 获取窗口配置
   * @param id 窗口 ID
   */
  const getWidget = (id: string) => {
    return widgetStore.getWidgetById(id);
  };

  /**
   * 更新窗口配置
   * @param id 窗口 ID
   * @param updates 要更新的配置
   */
  const updateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    widgetStore.updateWidget(id, updates);
  };

  /**
   * 将窗口置顶
   * @param id 窗口 ID
   */
  const bringToFront = (id: string) => {
    widgetStore.bringToFront(id);
  };

  return {
    openWidget,
    closeWidget,
    closeAllWidgets,
    getWidget,
    updateWidget,
    bringToFront,
    widgets: widgetStore.getWidgets,
  };
}

