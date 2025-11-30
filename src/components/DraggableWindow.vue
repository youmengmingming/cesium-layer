<template>
  <Teleport to="body">
    <div
      v-if="!isMinimized"
      :class="['draggable-window', { maximized: isMaximized }]"
      :style="windowStyle"
      @mousedown="handleMouseDown"
    >
      <!-- 窗口标题栏 -->
      <div
        class="window-header"
        :class="{ dragging: isDragging }"
        @mousedown.stop="startDrag"
      >
        <div class="window-title">{{ title }}</div>
        <div class="window-controls">
          <button
            v-if="minimizable"
            class="control-btn minimize-btn"
            @click="minimize"
            title="最小化"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </button>
          <button
            v-if="maximizable"
            class="control-btn maximize-btn"
            @click="toggleMaximize"
            :title="isMaximized ? '还原' : '最大化'"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect
                v-if="!isMaximized"
                x="1"
                y="1"
                width="10"
                height="10"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              />
              <template v-else>
                <rect x="2" y="3" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5" />
                <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5" />
              </template>
            </svg>
          </button>
          <button
            v-if="closable"
            class="control-btn close-btn"
            @click="close"
            title="关闭"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1.5" />
              <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 窗口内容 -->
      <div class="window-content" :style="contentStyle">
        <component
          :is="component"
          v-bind="props.props || {}"
          v-on="props.events || {}"
        />
      </div>
    </div>

    <!-- 最小化后的任务栏图标 -->
    <div
      v-if="isMinimized"
      class="minimized-window"
      :style="{ zIndex: zIndex }"
      @click="restore"
      :title="title"
    >
      <div class="minimized-title">{{ title }}</div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Component } from 'vue';
import { useWidgetStore } from '../stores/widgets';

interface Props {
  id: string;
  component: Component;
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

const props = withDefaults(defineProps<Props>(), {
  width: 400,
  height: 300,
  x: 100,
  y: 100,
  minWidth: 200,
  minHeight: 150,
  resizable: true,
  minimizable: true,
  maximizable: true,
  closable: true,
  zIndex: 1000,
  props: () => ({}),
  events: () => ({}),
});

const widgetStore = useWidgetStore();

// 窗口状态
const isDragging = ref(false);
const isMaximized = ref(false);
const isMinimized = ref(false);
const position = ref({ x: props.x, y: props.y });
const size = ref({ width: props.width, height: props.height });
const dragOffset = ref({ x: 0, y: 0 });

// 标题栏高度常量
const HEADER_HEIGHT = 60;

// 计算样式
const windowStyle = computed(() => {
  if (isMaximized.value) {
    return {
      position: 'fixed',
      top: `${HEADER_HEIGHT}px`,
      left: '0',
      width: '100vw',
      height: `calc(100vh - ${HEADER_HEIGHT}px)`,
      zIndex: props.zIndex,
    };
  }
  return {
    position: 'fixed',
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    width: `${size.value.width}px`,
    height: `${size.value.height}px`,
    zIndex: props.zIndex,
  };
});

const contentStyle = computed(() => {
  if (isMaximized.value) {
    return {
      height: `calc(100vh - ${HEADER_HEIGHT}px - 40px)`, // 减去标题栏高度和窗口标题栏高度
      minHeight: `calc(100vh - ${HEADER_HEIGHT}px - 40px)`,
    };
  }
  return {
    height: `${size.value.height - 40}px`,
    minHeight: `${size.value.height - 40}px`,
  };
});

// 拖拽处理
const startDrag = (e: MouseEvent) => {
  if (isMaximized.value) return;
  isDragging.value = true;
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  };
  widgetStore.bringToFront(props.id);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  position.value = {
    x: e.clientX - dragOffset.value.x,
    y: e.clientY - dragOffset.value.y,
  };
  // 限制在视口内，考虑标题栏高度
  position.value.x = Math.max(0, Math.min(position.value.x, window.innerWidth - size.value.width));
  position.value.y = Math.max(HEADER_HEIGHT, Math.min(position.value.y, window.innerHeight - 40));
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopDrag);
};

const handleMouseDown = () => {
  widgetStore.bringToFront(props.id);
};

// 窗口控制
const minimize = () => {
  isMinimized.value = true;
  isMaximized.value = false;
};

const restore = () => {
  isMinimized.value = false;
  widgetStore.bringToFront(props.id);
};

const toggleMaximize = () => {
  if (isMaximized.value) {
    isMaximized.value = false;
  } else {
    isMaximized.value = true;
    isMinimized.value = false;
  }
  widgetStore.bringToFront(props.id);
};

const close = () => {
  widgetStore.removeWidget(props.id);
};

// 监听窗口大小变化
const handleResize = () => {
  if (isMaximized.value) return;
  position.value.x = Math.max(0, Math.min(position.value.x, window.innerWidth - size.value.width));
  position.value.y = Math.max(HEADER_HEIGHT, Math.min(position.value.y, window.innerHeight - 40));
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  // 更新 store 中的 zIndex
  widgetStore.updateWidget(props.id, { zIndex: props.zIndex });
  // 调试：检查 props 传递
  console.log('DraggableWindow mounted:', {
    id: props.id,
    title: props.title,
    props: props.props,
    'props.entityId': props.props?.entityId,
    'props.layerId': props.props?.layerId,
    'props.entityName': props.props?.entityName,
    component: props.component,
  });
  
  // 验证 props 是否正确传递
  if (!props.props) {
    console.error('DraggableWindow: props.props is missing!');
  } else {
    console.log('DraggableWindow: props.props.entityId:', props.props.entityId);
    console.log('DraggableWindow: props.props.layerId:', props.props.layerId);
    console.log('DraggableWindow: props.props.entityName:', props.props.entityName);
    
    if (!props.props.entityId) {
      console.warn('DraggableWindow: entityId is missing in props!');
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped>
.draggable-window {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

.draggable-window.maximized {
  border-radius: 0;
}

.window-header {
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  cursor: move;
  flex-shrink: 0;
}

.window-header.dragging {
  cursor: grabbing;
}

.window-title {
  font-size: 14px;
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.control-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  padding: 0;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.close-btn:hover {
  background: rgba(255, 0, 0, 0.8);
}

.window-content {
  flex: 1;
  overflow: hidden;
  padding: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

.minimized-window {
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;
  max-width: 200px;
}

.minimized-window:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.minimized-title {
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

