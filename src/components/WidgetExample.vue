<template>
  <div class="widget-example">
    <div class="demo-panel">
      <h2>窗口管理器示例</h2>
      <p>点击下面的按钮来打开不同类型的窗口</p>
      
      <div class="button-group">
        <button @click="openBasicWidget">打开基础窗口</button>
        <button @click="openWidgetWithProps">打开带属性的窗口</button>
        <button @click="openWidgetWithEvents">打开带事件的窗口</button>
        <button @click="openCustomSizeWidget">打开自定义大小窗口</button>
        <button @click="closeAllWidgets">关闭所有窗口</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWidgetManager } from '../composables/useWidgetManager';
import ExampleWidget from './ExampleWidget.vue';

const { openWidget, closeAllWidgets } = useWidgetManager();

// 打开基础窗口
const openBasicWidget = () => {
  openWidget({
    component: ExampleWidget,
    title: '基础窗口',
    width: 400,
    height: 300,
  });
};

// 打开带属性的窗口
const openWidgetWithProps = () => {
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
</script>

<style scoped>
.widget-example {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 999;
}

.demo-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  min-width: 300px;
}

h2 {
  margin-bottom: 12px;
  color: #333;
  font-size: 20px;
}

p {
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

button {
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

button:active {
  transform: translateY(0);
}
</style>

