<template>
  <header class="app-header">
    <div class="app-header__left">
      <div class="app-header__logo">
        <span class="logo-icon">🌍</span>
        <span class="logo-text">Cesium Project</span>
      </div>
    </div>

    <nav class="app-header__nav">
      <!-- 标绘工具 -->
      <div class="nav-item" @click="openDrawingToolbar">
        <span class="nav-icon">✏️</span>
        <span class="nav-text">标绘工具</span>
      </div>

      <!-- 图层管理 -->
      <div class="nav-item" @click="openLayerManager">
        <span class="nav-icon">📁</span>
        <span class="nav-text">图层管理</span>
      </div>

      <!-- 更多功能 -->
      <div class="nav-item nav-item--dropdown" @click="toggleMoreMenu">
        <span class="nav-icon">⚙️</span>
        <span class="nav-text">更多</span>
        <span class="dropdown-arrow" :class="{ open: showMoreMenu }">▼</span>
        
        <div v-if="showMoreMenu" class="dropdown-menu" @click.stop>
          <div class="dropdown-item" @click="openBasicWidget">基础窗口</div>
          <div class="dropdown-item" @click="openWidgetWithProps">带属性窗口</div>
          <div class="dropdown-item" @click="openWidgetWithEvents">带事件窗口</div>
          <div class="dropdown-item" @click="openCustomSizeWidget">自定义大小窗口</div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item" @click="closeAllWidgets">关闭所有窗口</div>
        </div>
      </div>
    </nav>

    <div class="app-header__right">
      <div class="app-header__actions">
        <ThemeSwitcher />
        <button class="action-btn" @click="handleFullscreen" title="全屏">
          <span>⛶</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWidgetManager } from '../composables/useWidgetManager';
import DrawingToolbar from './DrawingToolbar.vue';
import LayerManager from './LayerManager.vue';
// import WidgetExample from './WidgetExample.vue';
import ExampleWidget from './ExampleWidget.vue';
import ThemeSwitcher from './ThemeSwitcher.vue';

const { openWidget, closeAllWidgets } = useWidgetManager();
const showMoreMenu = ref(false);

// 打开标绘工具窗口
const openDrawingToolbar = () => {
  openWidget({
    id: 'drawing-toolbar',
    component: DrawingToolbar,
    title: '标绘工具',
    width: 400,
    height: 500,
    x: 120,
    y: 120,
    minWidth: 350,
    minHeight: 400,
  });
};

// 打开图层管理窗口
const openLayerManager = () => {
  openWidget({
    component: LayerManager,
    title: '图层管理',
    width: 450,
    height: 650,
    x: window.innerWidth - 490,
    y: 120,
    minWidth: 400,
    minHeight: 500,
  });
};


// 切换更多菜单
const toggleMoreMenu = () => {
  showMoreMenu.value = !showMoreMenu.value;
};

// 点击外部关闭菜单
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.nav-item--dropdown')) {
    showMoreMenu.value = false;
  }
};

// 打开基础窗口
const openBasicWidget = () => {
  showMoreMenu.value = false;
  openWidget({
    component: ExampleWidget,
    title: '基础窗口',
    width: 400,
    height: 300,
  });
};

// 打开带属性的窗口
const openWidgetWithProps = () => {
  showMoreMenu.value = false;
  openWidget({
    component: ExampleWidget,
    title: '带属性的窗口',
    props: {
      message: '这是通过 props 传入的消息',
      initialCount: 10,
    },
    width: 450,
    height: 350,
  });
};

// 打开带事件的窗口
const openWidgetWithEvents = () => {
  showMoreMenu.value = false;
  openWidget({
    component: ExampleWidget,
    title: '带事件的窗口',
    props: {
      message: '点击按钮会触发事件',
      initialCount: 5,
    },
    events: {
      customEvent: (value: string) => {
        console.log('收到自定义事件:', value);
        alert(`收到事件: ${value}`);
      },
      countChanged: (count: number) => {
        console.log('计数变化:', count);
      },
    },
    width: 500,
    height: 400,
  });
};

// 打开自定义大小窗口
const openCustomSizeWidget = () => {
  showMoreMenu.value = false;
  openWidget({
    component: ExampleWidget,
    title: '自定义大小窗口',
    width: 600,
    height: 500,
    x: 200,
    y: 150,
    minWidth: 300,
    minHeight: 200,
  });
};

// 全屏功能
const handleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

import { onMounted, onUnmounted } from 'vue';

// 监听点击外部事件
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', handleClickOutside);
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside);
  }
});
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--color-primary-gradient);
  color: var(--color-text-inverse);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 10px var(--color-shadow-light);
  z-index: var(--z-index-header);
  backdrop-filter: blur(10px);
}

.app-header__left {
  display: flex;
  align-items: center;
}

.app-header__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  letter-spacing: 0.5px;
}

.app-header__nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  position: relative;
  font-size: 14px;
}

.nav-item:hover {
  background: var(--color-button-hover);
  transform: translateY(-1px);
}

.nav-icon {
  font-size: 18px;
  line-height: 1;
}

.nav-text {
  font-weight: 500;
}

.nav-item--dropdown {
  padding-right: 12px;
}

.dropdown-arrow {
  font-size: 10px;
  transition: transform 0.2s;
  margin-left: 4px;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  background: var(--color-backdrop);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-md);
  padding: 8px 0;
  min-width: 180px;
  box-shadow: 0 4px 20px var(--color-shadow-dark);
  z-index: calc(var(--z-index-header) + 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dropdown-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
}

.app-header__right {
  display: flex;
  align-items: center;
}

.app-header__actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--color-button-bg);
  border-radius: var(--radius-md);
  color: var(--color-text-inverse);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: var(--transition-base);
}

.action-btn:hover {
  background: var(--color-button-hover);
  transform: scale(1.05);
}

.action-btn:active {
  transform: scale(0.95);
}
</style>

