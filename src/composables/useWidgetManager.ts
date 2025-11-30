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
    
    // 确保 props 被正确保存（深拷贝以避免响应式问题）
    // 使用 JSON 序列化/反序列化确保可序列化
    const propsToStore = config.props ? JSON.parse(JSON.stringify(config.props)) : {};
    
    // 调试：检查 props
    console.log('useWidgetManager: openWidget called');
    console.log('useWidgetManager: config.props:', config.props);
    console.log('useWidgetManager: propsToStore:', propsToStore);
    console.log('useWidgetManager: entityId:', propsToStore.entityId);
    console.log('useWidgetManager: layerId:', propsToStore.layerId);
    console.log('useWidgetManager: entityName:', propsToStore.entityName);
    
    const widgetConfig: WidgetConfig = {
      id,
      component: config.component,
      title: config.title,
      props: propsToStore,
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

    console.log('useWidgetManager: widgetConfig before addWidget:', widgetConfig);
    console.log('useWidgetManager: widgetConfig.props:', widgetConfig.props);
    widgetStore.addWidget(widgetConfig);
    
    // 验证保存后的配置
    const savedWidget = widgetStore.getWidgetById(id);
    console.log('useWidgetManager: widgetConfig after addWidget:', savedWidget);
    console.log('useWidgetManager: savedWidget.props:', savedWidget?.props);
    if (savedWidget?.props) {
      console.log('useWidgetManager: savedWidget.props.entityId:', savedWidget.props.entityId);
      console.log('useWidgetManager: savedWidget.props.layerId:', savedWidget.props.layerId);
      console.log('useWidgetManager: savedWidget.props.entityName:', savedWidget.props.entityName);
    } else {
      console.error('useWidgetManager: props is missing in saved widget!');
    }
    
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

