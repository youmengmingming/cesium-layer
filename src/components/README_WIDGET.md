# 可拖拽窗口组件使用指南

## 概述

这是一个功能完整的可拖拽窗口管理系统，支持通过 `openWidget` 函数动态打开窗口，窗口支持拖拽、最小化、最大化、关闭等功能。

## 核心文件

- `src/components/DraggableWindow.vue` - 可拖拽窗口组件
- `src/composables/useWidgetManager.ts` - 窗口管理 Composable
- `src/stores/widgets.ts` - 窗口状态管理 Store

## 使用方法

### 1. 基本用法

在任何 Vue 组件中，导入 `useWidgetManager` 并使用 `openWidget` 函数：

```vue
<template>
  <button @click="openMyWidget">打开窗口</button>
</template>

<script setup lang="ts">
import { useWidgetManager } from '@/composables/useWidgetManager';
import MyComponent from './MyComponent.vue';

const { openWidget } = useWidgetManager();

const openMyWidget = () => {
  openWidget({
    component: MyComponent,
    title: '我的窗口',
    width: 500,
    height: 400,
  });
};
</script>
```

### 2. 传入属性 (Props)

```typescript
openWidget({
  component: MyComponent,
  title: '带属性的窗口',
  props: {
    message: '这是传入的消息',
    count: 10,
    // 任何你组件需要的属性
  },
  width: 500,
  height: 400,
});
```

### 3. 监听事件 (Events)

```typescript
openWidget({
  component: MyComponent,
  title: '带事件的窗口',
  props: {
    // 属性
  },
  events: {
    // 监听组件 emit 的事件
    customEvent: (value: string) => {
      console.log('收到事件:', value);
    },
    countChanged: (count: number) => {
      console.log('计数变化:', count);
    },
  },
  width: 500,
  height: 400,
});
```

### 4. 完整配置选项

```typescript
const widgetId = openWidget({
  component: MyComponent,
  title: '完整配置窗口',
  
  // 窗口大小和位置
  width: 600,
  height: 500,
  x: 200,  // 初始 X 坐标（默认居中）
  y: 150,  // 初始 Y 坐标（默认居中）
  minWidth: 300,   // 最小宽度
  minHeight: 200,  // 最小高度
  
  // 功能开关
  resizable: true,    // 是否可调整大小（目前仅支持拖拽）
  minimizable: true,  // 是否可最小化
  maximizable: true,  // 是否可最大化
  closable: true,     // 是否可关闭
  
  // 组件属性
  props: {
    // 你的组件属性
  },
  
  // 组件事件
  events: {
    // 你的组件事件
  },
  
  // 自定义 ID（可选，不提供会自动生成）
  id: 'my-custom-id',
});
```

### 5. 其他管理函数

```typescript
const {
  openWidget,
  closeWidget,
  closeAllWidgets,
  getWidget,
  updateWidget,
  bringToFront,
  widgets,  // 所有窗口的响应式数组
} = useWidgetManager();

// 关闭指定窗口
closeWidget('widget-id');

// 关闭所有窗口
closeAllWidgets();

// 获取窗口配置
const widget = getWidget('widget-id');

// 更新窗口配置
updateWidget('widget-id', {
  title: '新标题',
  width: 800,
});

// 将窗口置顶
bringToFront('widget-id');
```

## 窗口功能

### 拖拽
- 点击并拖动窗口标题栏即可移动窗口
- 窗口会自动限制在视口范围内

### 最小化
- 点击最小化按钮，窗口会缩小到左下角的任务栏图标
- 点击任务栏图标可以恢复窗口

### 最大化
- 点击最大化按钮，窗口会占满整个屏幕
- 再次点击可以还原到原始大小

### 关闭
- 点击关闭按钮可以关闭窗口
- 也可以通过 `closeWidget(id)` 函数关闭

### 置顶
- 点击窗口任意位置会自动将窗口置顶（z-index 最高）
- 也可以通过 `bringToFront(id)` 函数手动置顶

## 示例组件

查看 `src/components/ExampleWidget.vue` 和 `src/components/WidgetExample.vue` 了解完整的使用示例。

## 注意事项

1. 窗口组件会自动通过 `Teleport` 渲染到 `body` 元素下，确保正确的层级关系
2. 每个窗口都有唯一的 ID，可以通过 `openWidget` 的返回值获取
3. 窗口的 z-index 会自动管理，点击窗口会自动置顶
4. 所有窗口状态都保存在 Pinia Store 中，支持响应式更新

