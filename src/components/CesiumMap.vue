<template>
  <div class="cesium-map-wrapper">
    <div class="cesium-map-container" ref="mapContainerRef"></div>
    <!-- <div class="window-bridge-panel">
      <div class="window-bridge-row">
        <span>当前窗口：{{ roleLabel }}</span>
      </div>
      <div class="window-bridge-row">
        <span>连接状态：{{ connectionLabel }}</span>
        <button
          v-if="isPrimary"
          class="bridge-button"
          type="button"
          @click="handleOpenSecondary"
        >
          {{ connectionState === 'connected' ? '重新打开副窗口' : '打开副窗口' }}
        </button>
      </div>
      <p class="window-bridge-hint" v-if="isPrimary && connectionState !== 'connected'">
        打开副窗口后，两端会自动同步镜头视角。
      </p>
      <p class="window-bridge-hint" v-else>
        副窗口会实时接收主窗口的视角同步信息。
      </p>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRef, watch } from 'vue';
import * as Cesium from 'cesium';
import type { CesiumConfig } from '../config/cesium.config';
import { useWindowBridge } from '../composables/useWindowBridge';
import { useCesiumViewer } from '../composables/useCesiumViewer';
import { useEntitySelection } from '../composables/useEntitySelection';
import { useWidgetManager } from '../composables/useWidgetManager';
import { useWidgetStore } from '../stores/widgets';
import { useLayerStore } from '../stores/layers';
import type { MapEngineType } from '../map-engine/core/types';
import EntityEditorPanel from './EntityEditorPanel.vue';

interface Props {
  config?: Partial<CesiumConfig>;
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
});

const configRef = toRef(props, 'config');

const {
  init: initWindowBridge,
  role: bridgeRole,
  connectionState,
  openSecondaryWindow,
} = useWindowBridge();

const {
  containerRef: mapContainerRef,
  engine,
  initViewer,
  destroyViewer,
} = useCesiumViewer();

const viewer = computed(() => engine.value?.getOriginalViewer() as Cesium.Viewer | null);

const {
  selectedEntity,
  initEntitySelection,
  deselectEntity,
  selectEntity,
  selectPrimitive,
} = useEntitySelection();

const { openWidget, closeWidget } = useWidgetManager();
const editorWindowId = ref<string | null>(null);
let selectionHandler: Cesium.ScreenSpaceEventHandler | null = null;
let doubleClickHandler: ((event: any) => void) | null = null;

const isPrimary = computed(() => bridgeRole.value === 'primary');
const roleLabel = computed(() => (isPrimary.value ? '主窗口' : '副窗口'));
const connectionLabel = computed(() => {
  if (connectionState.value === 'connected') {
    return '已连接';
  }
  if (connectionState.value === 'connecting') {
    return '连接中...';
  }
  return '单窗口模式';
});

const bootViewer = async (type: MapEngineType = 'cesium') => {
  await initViewer(type, configRef.value || {});
  
  if (type !== 'cesium') {
    // 如果是非 Cesium 引擎，目前跳过 Cesium 特有的初始化逻辑
    return;
  }
  
  // 等待 viewer 完全初始化后再设置实体选择
  // 增加重试机制，确保 viewer 已初始化
  let retries = 0;
  while (!viewer.value && retries < 10) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    retries++;
  }
  
  if (!viewer.value) {
    console.error('Failed to initialize Cesium viewer');
    return;
  }
  
  // 使用 nextTick 确保 viewer 完全准备好
  await new Promise((resolve) => setTimeout(resolve, 200));
  
  // 禁用 Cesium 默认的选中行为
  try {
    if (viewer.value) {
      viewer.value.selectedEntity = undefined;
    }
  } catch (e) {
    console.warn('Failed to set selectedEntity:', e);
  }
  
  // 清理之前的 handler
  if (selectionHandler) {
    selectionHandler.destroy();
    selectionHandler = null;
  }
  
  // 初始化自定义实体选择
  try {
    selectionHandler = initEntitySelection();
  } catch (e) {
    console.error('Failed to initialize entity selection:', e);
    return;
  }
  
  // 监听双击事件
  if (viewer.value && viewer.value.cesiumWidget && viewer.value.cesiumWidget.canvas) {
    const canvas = viewer.value.cesiumWidget.canvas;
    
    // 移除旧的事件监听器
    if (doubleClickHandler) {
      canvas.removeEventListener('entity-double-click', doubleClickHandler);
    }
    
    doubleClickHandler = (event: any) => {
      console.log('Double click event received:', event);
      console.log('Event type:', event.type);
      console.log('Event detail:', event.detail);
      
      if (event.type === 'primitive-double-click' && event.detail?.primitive) {
        const primitive = event.detail.primitive;
        console.log('Double clicked primitive:', primitive);
        
        // 确保 Primitive 已被选择
        selectPrimitive(primitive);
        
        // 等待 selectedEntity 更新，确保 primitive 信息已设置
        setTimeout(() => {
          console.log('Selected primitive:', selectedEntity.value);
          // 确保使用最新的 primitive 对象
          const currentPrimitive = selectedEntity.value?.primitive || primitive;
          if (currentPrimitive) {
            openEntityEditor({ primitive: currentPrimitive });
          } else {
            console.warn('Primitive not found in selectedEntity, using original primitive');
            openEntityEditor({ primitive });
          }
        }, 50);
      } else if (event.type === 'entity-double-click' && event.detail?.entity) {
        const entity = event.detail.entity;
        console.log('Double clicked entity:', entity);
        
        // 确保实体已被选择，这样 selectedEntity 会有正确的值
        selectEntity(entity);
        
        // 等待 selectedEntity 更新
        setTimeout(() => {
          console.log('Selected entity:', selectedEntity.value);
          openEntityEditor({ entity });
        }, 100);
      } else {
        console.warn('Double click event missing entity or primitive:', event);
      }
    };
    canvas.addEventListener('entity-double-click', doubleClickHandler);
    canvas.addEventListener('primitive-double-click', doubleClickHandler);
  }
};

const handleOpenSecondary = () => {
  if (isPrimary.value) {
    openSecondaryWindow();
  }
};

const handleResize = () => {
  if (!viewer.value) return
  if (typeof (viewer.value as any).updateSize === 'function') {
    (viewer.value as any).updateSize()
  } else if (typeof (viewer.value as any).resize === 'function') {
    (viewer.value as any).resize()
  }
}

const handleMapSwitch = async (event: any) => {
  const type = event.detail as MapEngineType;
  await bootViewer(type);
};

onMounted(async () => {
  initWindowBridge();
  await bootViewer();
  
  // 监听全屏变化和窗口大小变化
  document.addEventListener('fullscreenchange', handleResize);
  document.addEventListener('webkitfullscreenchange', handleResize);
  document.addEventListener('mozfullscreenchange', handleResize);
  document.addEventListener('MSFullscreenChange', handleResize);
  window.addEventListener('resize', handleResize);
  window.addEventListener('map-engine-switch', handleMapSwitch);
});

const openEntityEditor = (eventDetail: any) => {
  // 如果编辑器窗口已打开，先关闭
  if (editorWindowId.value) {
    closeWidget(editorWindowId.value);
  }
  
  // 获取实体或 Primitive 信息
  const entity = eventDetail?.entity;
  const primitive = eventDetail?.primitive;
  
  // 处理 Primitive
  if (primitive) {
    const primitiveId = (primitive as any)._id || `primitive-${Date.now()}`;
    const primitiveName = (primitive as any)._name || '标绘对象';
    const primitiveType = (primitive as any)._type || 'unknown';
    
    // 尝试从 selectedEntity 获取图层信息
    let layerId: string | null = null;
    const currentSelected = selectedEntity.value;
    
    if (currentSelected && currentSelected.primitive === primitive) {
      layerId = currentSelected.layerId;
    } else {
      // 尝试查找 Primitive 所属的图层（通过对象引用比较，更可靠）
      const layerStore = useLayerStore();
      for (const lid in layerStore.layers) {
        const layer = layerStore.layers[lid];
        // 遍历所有 primitives，通过对象引用比较
        for (const pid in layer.primitives) {
          if (layer.primitives[pid] === primitive) {
            layerId = lid;
            break;
          }
        }
        if (layerId) break;
      }
    }
    
    console.log('Opening editor for primitive:', primitive);
    console.log('Primitive ID:', primitiveId);
    console.log('Primitive type:', primitiveType);
    console.log('Layer ID:', layerId);
    
    // 打开新的编辑器窗口
    const widgetId = openWidget({
      component: EntityEditorPanel,
      title: `标绘属性编辑器 - ${primitiveName}`,
      props: {
        primitiveId: primitiveId,
        layerId: layerId,
        entityName: primitiveName,
        isPrimitive: true,
        primitiveType: primitiveType,
      },
      events: {
        close: () => {
          editorWindowId.value = null;
          deselectEntity();
        },
        delete: () => {
          editorWindowId.value = null;
          deselectEntity();
        },
      },
      width: 450,
      height: 700,
      x: (window.innerWidth - 450) / 2,
      y: 100,
    });
    
    editorWindowId.value = widgetId;
    return;
  }
  
  // 处理 Entity（原有逻辑）
  if (!entity) {
    console.warn('openEntityEditor: entity is missing', eventDetail);
    return;
  }
  
  console.log('Opening editor for entity:', entity);
  console.log('Entity ID (before):', entity.id);
  console.log('Entity name:', entity.name);
  
  // 确保实体有 ID
  let entityId = entity.id;
  if (!entityId) {
    // 生成一个唯一的 ID
    entityId = `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    entity.id = entityId;
    console.log('Generated new entity ID:', entityId);
  }
  
  // 尝试从 selectedEntity 获取图层信息
  let layerId: string | null = null;
  const currentSelected = selectedEntity.value;
  
  if (currentSelected && currentSelected.entity === entity) {
    // 使用已选择的实体信息
    layerId = currentSelected.layerId;
    console.log('Using layerId from selectedEntity:', layerId);
  } else {
    // 尝试查找实体所属的图层
    const layerStore = useLayerStore();
    for (const lid in layerStore.layers) {
      const layer = layerStore.layers[lid];
      for (const eid in layer.entities) {
        if (layer.entities[eid] === entity) {
          layerId = lid;
          console.log('Found entity in layer:', layerId);
          break;
        }
      }
      if (layerId) break;
    }
    
    if (!layerId) {
      console.log('Entity not found in any layer, layerId will be null');
    }
  }
  
  console.log('Final entityId:', entityId);
  console.log('Final layerId:', layerId);
  console.log('Entity properties:', {
    point: !!entity.point,
    polyline: !!entity.polyline,
    polygon: !!entity.polygon,
    rectangle: !!entity.rectangle,
    ellipse: !!entity.ellipse,
  });
  
  // 打开新的编辑器窗口，只传递可序列化的数据
  const widgetId = openWidget({
    component: EntityEditorPanel,
    title: `实体属性编辑器 - ${entity.name || entityId || '未命名'}`,
    props: {
      // 只传递可序列化的数据，不传递 Cesium.Entity 对象
      entityId: entityId,
      layerId: layerId,
      entityName: entity.name,
    },
    events: {
      close: () => {
        editorWindowId.value = null;
        deselectEntity();
      },
      delete: (entity: Cesium.Entity) => {
        editorWindowId.value = null;
        deselectEntity();
      },
    },
    width: 450,
    height: 700,
    x: (window.innerWidth - 450) / 2,
    y: 100,
  });
  
  editorWindowId.value = widgetId;
  
  console.log('CesiumMap: Widget created with entityId:', entityId, 'layerId:', layerId);
};

onUnmounted(() => {
  if (selectionHandler) {
    selectionHandler.destroy();
    selectionHandler = null;
  }
  if (viewer.value && doubleClickHandler) {
    viewer.value.cesiumWidget.canvas.removeEventListener('entity-double-click', doubleClickHandler);
    doubleClickHandler = null;
  }
  
  // 移除事件监听器
  document.removeEventListener('fullscreenchange', handleResize);
  document.removeEventListener('webkitfullscreenchange', handleResize);
  document.removeEventListener('mozfullscreenchange', handleResize);
  document.removeEventListener('MSFullscreenChange', handleResize);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('map-engine-switch', handleMapSwitch);
  
  destroyViewer();
});

watch(
  configRef,
  async () => {
    await bootViewer();
  },
  { deep: true }
);
</script>

<style scoped>
.cesium-map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.cesium-map-container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  min-height: 0; /* 确保可以正确收缩 */
}

.window-bridge-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  max-width: 320px;
  backdrop-filter: blur(6px);
}

.window-bridge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bridge-button {
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  background: #3d82ff;
  color: #fff;
  transition: background 0.2s ease;
}

.bridge-button:hover {
  background: #2f6ddb;
}

.window-bridge-hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}
</style>

<style>
/* 隐藏 Cesium 的 logo 图标 */
.cesium-viewer-bottom {
  display: none !important;
}
</style>

