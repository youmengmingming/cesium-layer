# 主题系统使用说明

## 概述

本系统实现了一套完整的主题切换功能，支持多个预设主题，并统一管理系统的样式。

## 功能特性

- ✅ 多主题支持（浅色、深色、蓝色、绿色等）
- ✅ 主题持久化（自动保存到 localStorage）
- ✅ CSS 变量系统统一管理样式
- ✅ 主题切换组件（UI 界面）
- ✅ 响应式主题应用

## 文件结构

```
src/
├── config/
│   ├── theme.config.ts      # 主题配置文件
│   └── THEME_README.md      # 本说明文档
├── stores/
│   └── theme.ts             # 主题状态管理（Pinia Store）
├── styles/
│   └── theme.css            # 全局主题样式（CSS 变量定义）
└── components/
    └── ThemeSwitcher.vue    # 主题切换组件
```

## 使用方法

### 1. 在组件中使用主题

所有主题颜色都通过 CSS 变量暴露，可以直接在样式中使用：

```vue
<style scoped>
.my-component {
  background: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.my-button {
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.my-button:hover {
  background: var(--color-primary-dark);
}
</style>
```

### 2. 在 JavaScript 中切换主题

```typescript
import { useThemeStore } from '@/stores/theme';

const themeStore = useThemeStore();

// 切换主题
themeStore.setTheme('dark');

// 获取当前主题
const currentTheme = themeStore.getCurrentTheme();

// 获取所有可用主题
const availableThemes = themeStore.getAvailableThemes();
```

### 3. 添加新主题

在 `src/config/theme.config.ts` 中添加新主题：

```typescript
export const themes: Record<string, Theme> = {
  // ... 现有主题
  
  custom: {
    name: 'custom',
    displayName: '自定义主题',
    colors: {
      primary: '#your-color',
      // ... 其他颜色配置
    },
  },
};
```

## 可用的 CSS 变量

### 主色调
- `--color-primary`: 主色
- `--color-primary-light`: 主色（浅）
- `--color-primary-dark`: 主色（深）
- `--color-primary-gradient`: 主色渐变

### 背景色
- `--color-background`: 主背景
- `--color-background-secondary`: 次要背景
- `--color-background-tertiary`: 第三级背景

### 文本色
- `--color-text`: 主文本
- `--color-text-secondary`: 次要文本
- `--color-text-tertiary`: 第三级文本
- `--color-text-inverse`: 反色文本（用于深色背景）

### 边框色
- `--color-border`: 主边框
- `--color-border-light`: 浅边框
- `--color-border-dark`: 深边框

### 状态色
- `--color-success`: 成功
- `--color-warning`: 警告
- `--color-error`: 错误
- `--color-info`: 信息

### UI 元素
- `--color-window-bg`: 窗口背景
- `--color-window-header-bg`: 窗口标题栏背景
- `--color-window-header-text`: 窗口标题栏文本
- `--color-button-bg`: 按钮背景
- `--color-button-hover`: 按钮悬停背景
- `--color-button-text`: 按钮文本

### 阴影
- `--color-shadow`: 主阴影
- `--color-shadow-light`: 浅阴影
- `--color-shadow-dark`: 深阴影

### 其他
- `--color-overlay`: 遮罩层
- `--color-backdrop`: 背景模糊层

## 预设主题

### Light（浅色主题）
- 默认主题
- 适合日间使用
- 白色背景，深色文本

### Dark（深色主题）
- 适合夜间使用
- 深色背景，浅色文本
- 护眼设计

### Blue（蓝色主题）
- 蓝色系配色
- 专业商务风格

### Green（绿色主题）
- 绿色系配色
- 清新自然风格

## 最佳实践

1. **始终使用 CSS 变量**：不要硬编码颜色值，使用 CSS 变量确保主题一致性
2. **语义化命名**：使用语义化的变量名（如 `--color-text` 而不是 `--color-black`）
3. **测试所有主题**：确保组件在所有主题下都能正常显示
4. **保持对比度**：确保文本和背景有足够的对比度，保证可读性

## 注意事项

- 主题切换会立即应用到整个应用
- 用户选择的主题会自动保存到 localStorage
- 刷新页面后会自动恢复上次选择的主题
- CSS 变量在 `:root` 上定义，全局可用

