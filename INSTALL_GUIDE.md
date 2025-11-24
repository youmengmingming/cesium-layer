# 安装 Pinia 解决方案

## ✅ 最终解决方案（已成功解决）

### 问题根源
依赖冲突主要是由于：
1. **Vite 版本不匹配**：项目使用 `vite@7.2.4`，但 `@vitejs/plugin-vue@1.6.1` 只支持 `vite@^2.5.10`
2. **Pinia 安装**：需要与 Vue 3.2+ 兼容

### 解决步骤

1. **更新 @vitejs/plugin-vue 版本**（已修复）
   - 从 `^1.6.1` 更新到 `^5.2.1`（兼容 Vite 7）
   
2. **使用 --legacy-peer-deps 标志安装**
   ```bash
   npm install --legacy-peer-deps
   ```

### ✅ 方案 1：使用 --legacy-peer-deps（推荐，已成功）

```bash
npm install pinia --legacy-peer-deps
```

或安装所有依赖：
```bash
npm install --legacy-peer-deps
```

这个标志告诉 npm 使用旧的依赖解析算法，忽略 peer dependency 冲突。

**优点**：通常能解决大部分依赖冲突问题  
**适用场景**：当依赖版本不匹配时

## 解决方案 2：使用 --force

如果 `--legacy-peer-deps` 不起作用，可以尝试：

```bash
npm install pinia --force
```

**注意**：`--force` 会强制安装，可能会覆盖一些依赖版本。

## 解决方案 3：清理后重新安装

如果上述方法都不行，可以清理后重新安装：

```bash
# 删除 node_modules 和 package-lock.json
rm -rf node_modules
rm package-lock.json

# 重新安装所有依赖（包括 pinia）
npm install --legacy-peer-deps
```

**Windows PowerShell 命令**：
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install --legacy-peer-deps
```

## 解决方案 4：修改 package.json

如果依赖冲突持续存在，可以：

1. 检查并统一依赖版本
2. 移除重复的依赖（如 cesium 在 dependencies 和 devDependencies 中都有）

## 为什么会冲突？

依赖冲突通常由以下原因引起：

1. **Vue 版本**：Pinia 需要 Vue 3.2+，确保 Vue 版本兼容
2. **Vite 版本**：vite-plugin-cesium 可能与某些 Vite 版本不兼容
3. **Peer Dependencies**：npm 严格检查 peer dependencies 的版本匹配

## 验证安装

安装完成后，验证是否成功：

```bash
npm list pinia
```

或在代码中测试：

```typescript
import { createPinia } from 'pinia'
// 如果没有报错，说明安装成功
```

## 长期解决方案

如果项目经常遇到依赖冲突，可以：

1. 在 `.npmrc` 文件中设置默认行为：
   ```
   legacy-peer-deps=true
   ```

2. 或者在 `package.json` 中添加 `overrides` 字段（npm 8.3+）：
   ```json
   {
     "overrides": {
       "pinia": "^2.1.0"
     }
   }
   ```

