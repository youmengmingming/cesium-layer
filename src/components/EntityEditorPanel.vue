<template>
  <div v-if="entityInfo" class="entity-editor-panel">
    <div class="entity-editor-panel__header">
      <h3>实体属性</h3>
      <button class="entity-editor-panel__close" type="button" @click="handleClose">
        ✕
      </button>
    </div>

    <div class="entity-editor-panel__content">
      <div class="entity-editor-panel__section">
        <label class="entity-editor-panel__label">名称</label>
        <input
          v-model="formData.name"
          class="entity-editor-panel__input"
          type="text"
          placeholder="实体名称"
        />
      </div>

      <div class="entity-editor-panel__section">
        <label class="entity-editor-panel__label">描述</label>
        <textarea
          v-model="formData.description"
          class="entity-editor-panel__textarea"
          placeholder="实体描述"
          rows="3"
        />
      </div>

      <div class="entity-editor-panel__section">
        <label class="entity-editor-panel__label">可见性</label>
        <label class="entity-editor-panel__switch">
          <input v-model="formData.show" type="checkbox" />
          <span class="slider" />
        </label>
      </div>

      <!-- 点属性 -->
      <template v-if="entityInfo.entity.point">
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">点大小</label>
          <input
            v-model.number="pointProps.pixelSize"
            class="entity-editor-panel__input"
            type="number"
            min="1"
            max="50"
          />
        </div>
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">点颜色</label>
          <input
            v-model="pointProps.color"
            class="entity-editor-panel__input"
            type="color"
          />
        </div>
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">边框颜色</label>
          <input
            v-model="pointProps.outlineColor"
            class="entity-editor-panel__input"
            type="color"
          />
        </div>
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">边框宽度</label>
          <input
            v-model.number="pointProps.outlineWidth"
            class="entity-editor-panel__input"
            type="number"
            min="0"
            max="10"
          />
        </div>
      </template>

      <!-- 折线属性 -->
      <template v-if="entityInfo.entity.polyline">
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">线宽</label>
          <input
            v-model.number="polylineProps.width"
            class="entity-editor-panel__input"
            type="number"
            min="1"
            max="20"
          />
        </div>
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">线条颜色</label>
          <input
            v-model="polylineProps.color"
            class="entity-editor-panel__input"
            type="color"
          />
        </div>
      </template>

      <!-- 多边形属性 -->
      <template v-if="entityInfo.entity.polygon">
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">填充颜色</label>
          <input
            v-model="polygonProps.materialColor"
            class="entity-editor-panel__input"
            type="color"
          />
        </div>
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">填充透明度</label>
          <input
            v-model.number="polygonProps.alpha"
            class="entity-editor-panel__input"
            type="number"
            min="0"
            max="1"
            step="0.1"
          />
        </div>
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">边框颜色</label>
          <input
            v-model="polygonProps.outlineColor"
            class="entity-editor-panel__input"
            type="color"
          />
        </div>
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">边框宽度</label>
          <input
            v-model.number="polygonProps.outlineWidth"
            class="entity-editor-panel__input"
            type="number"
            min="0"
            max="10"
          />
        </div>
      </template>

      <!-- 矩形属性 -->
      <template v-if="entityInfo.entity.rectangle">
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">填充颜色</label>
          <input
            v-model="rectangleProps.materialColor"
            class="entity-editor-panel__input"
            type="color"
          />
        </div>
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">填充透明度</label>
          <input
            v-model.number="rectangleProps.alpha"
            class="entity-editor-panel__input"
            type="number"
            min="0"
            max="1"
            step="0.1"
          />
        </div>
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">边框颜色</label>
          <input
            v-model="rectangleProps.outlineColor"
            class="entity-editor-panel__input"
            type="color"
          />
        </div>
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">边框宽度</label>
          <input
            v-model.number="rectangleProps.outlineWidth"
            class="entity-editor-panel__input"
            type="number"
            min="0"
            max="10"
          />
        </div>
      </template>

      <!-- 圆形/椭圆属性 -->
      <template v-if="entityInfo.entity.ellipse">
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">填充颜色</label>
          <input
            v-model="ellipseProps.materialColor"
            class="entity-editor-panel__input"
            type="color"
          />
        </div>
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">填充透明度</label>
          <input
            v-model.number="ellipseProps.alpha"
            class="entity-editor-panel__input"
            type="number"
            min="0"
            max="1"
            step="0.1"
          />
        </div>
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">边框颜色</label>
          <input
            v-model="ellipseProps.outlineColor"
            class="entity-editor-panel__input"
            type="color"
          />
        </div>
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">边框宽度</label>
          <input
            v-model.number="ellipseProps.outlineWidth"
            class="entity-editor-panel__input"
            type="number"
            min="0"
            max="10"
          />
        </div>
      </template>

      <div class="entity-editor-panel__actions">
        <button class="entity-editor-panel__button entity-editor-panel__button--save" @click="handleSave">
          保存
        </button>
        <button class="entity-editor-panel__button entity-editor-panel__button--delete" @click="handleDelete">
          删除
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import * as Cesium from 'cesium';
import { useCesiumStore } from '../stores/cesium';
import { useLayerStore } from '../stores/layers';
import type { EntityInfo } from '../composables/useEntitySelection';

interface Props {
  entityInfo: EntityInfo | null;
}

interface Emits {
  (e: 'close'): void;
  (e: 'delete', entity: Cesium.Entity): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const cesiumStore = useCesiumStore();
const layerStore = useLayerStore();

const formData = ref({
  name: '',
  description: '',
  show: true,
});

const pointProps = ref({
  pixelSize: 10,
  color: '#ffff00',
  outlineColor: '#000000',
  outlineWidth: 2,
});

const polylineProps = ref({
  width: 3,
  color: '#00ffff',
});

const polygonProps = ref({
  materialColor: '#00ffff',
  alpha: 0.5,
  outlineColor: '#00ffff',
  outlineWidth: 2,
});

const rectangleProps = ref({
  materialColor: '#0000ff',
  alpha: 0.5,
  outlineColor: '#0000ff',
  outlineWidth: 2,
});

const ellipseProps = ref({
  materialColor: '#00ff00',
  alpha: 0.5,
  outlineColor: '#00ff00',
  outlineWidth: 2,
});

/**
 * 颜色值转 Cesium Color
 */
const colorToCesium = (color: string, alpha?: number): Cesium.Color => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return Cesium.Color.fromBytes(r, g, b, alpha ? Math.round(alpha * 255) : 255);
};

/**
 * Cesium Color 转颜色值
 */
const cesiumToColor = (color: Cesium.Color): string => {
  const r = color.red * 255;
  const g = color.green * 255;
  const b = color.blue * 255;
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g)
    .toString(16)
    .padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
};

/**
 * 加载实体属性到表单
 */
const loadEntityProperties = () => {
  if (!props.entityInfo) {
    return;
  }

  const entity = props.entityInfo.entity;
  const viewer = cesiumStore.getViewer;
  if (!viewer) {
    return;
  }

  try {
    formData.value.name = entity.name || '';
    
    // 安全地读取 description
    try {
      const description = entity.description;
      if (description) {
        if (typeof description === 'string') {
          formData.value.description = description;
        } else if (typeof description.getValue === 'function') {
          formData.value.description = description.getValue(viewer.clock.currentTime) || '';
        } else {
          formData.value.description = '';
        }
      } else {
        formData.value.description = '';
      }
    } catch (e) {
      formData.value.description = '';
    }

    // 安全地读取 show
    try {
      const show = entity.show;
      if (show !== undefined) {
        if (typeof show === 'boolean') {
          formData.value.show = show;
        } else if (typeof show.getValue === 'function') {
          formData.value.show = show.getValue(viewer.clock.currentTime) ?? true;
        } else {
          formData.value.show = true;
        }
      } else {
        formData.value.show = true;
      }
    } catch (e) {
      formData.value.show = true;
    }
  } catch (e) {
    console.error('Error loading entity properties:', e);
  }

  // 加载点属性
  try {
    if (entity.point) {
      const point = entity.point;
      try {
        const pixelSize = point.pixelSize;
        pointProps.value.pixelSize =
          typeof pixelSize === 'number'
            ? pixelSize
            : (pixelSize?.getValue?.(viewer.clock.currentTime) as number) || 10;
      } catch (e) {
        pointProps.value.pixelSize = 10;
      }

      try {
        const color = point.color;
        if (color) {
          const colorValue =
            color instanceof Cesium.Color
              ? color
              : (color.getValue?.(viewer.clock.currentTime) as Cesium.Color);
          if (colorValue) {
            pointProps.value.color = cesiumToColor(colorValue);
          }
        }
      } catch (e) {
        // 使用默认颜色
      }

      try {
        const outlineColor = point.outlineColor;
        if (outlineColor) {
          const outlineColorValue =
            outlineColor instanceof Cesium.Color
              ? outlineColor
              : (outlineColor.getValue?.(viewer.clock.currentTime) as Cesium.Color);
          if (outlineColorValue) {
            pointProps.value.outlineColor = cesiumToColor(outlineColorValue);
          }
        }
      } catch (e) {
        // 使用默认颜色
      }

      try {
        const outlineWidth = point.outlineWidth;
        pointProps.value.outlineWidth =
          typeof outlineWidth === 'number'
            ? outlineWidth
            : (outlineWidth?.getValue?.(viewer.clock.currentTime) as number) || 2;
      } catch (e) {
        pointProps.value.outlineWidth = 2;
      }
    }
  } catch (e) {
    console.error('Error loading point properties:', e);
  }

  // 加载折线属性
  try {
    if (entity.polyline) {
      const polyline = entity.polyline;
      try {
        const width = polyline.width;
        polylineProps.value.width =
          typeof width === 'number' ? width : (width?.getValue?.(viewer.clock.currentTime) as number) || 3;
      } catch (e) {
        polylineProps.value.width = 3;
      }

      try {
        const material = polyline.material;
        if (material) {
          const materialValue =
            material instanceof Cesium.Color
              ? material
              : (material.getValue?.(viewer.clock.currentTime) as Cesium.Color);
          if (materialValue) {
            polylineProps.value.color = cesiumToColor(materialValue);
          }
        }
      } catch (e) {
        // 使用默认颜色
      }
    }
  } catch (e) {
    console.error('Error loading polyline properties:', e);
  }

  // 加载多边形属性
  try {
    if (entity.polygon) {
      const polygon = entity.polygon;
      try {
        const material = polygon.material;
        if (material) {
          const materialValue =
            material instanceof Cesium.Color
              ? material
              : (material.getValue?.(viewer.clock.currentTime) as Cesium.Color);
          if (materialValue) {
            polygonProps.value.materialColor = cesiumToColor(materialValue);
            polygonProps.value.alpha = materialValue.alpha;
          }
        }
      } catch (e) {
        // 使用默认值
      }

      try {
        const outlineColor = polygon.outlineColor;
        if (outlineColor) {
          const outlineColorValue =
            outlineColor instanceof Cesium.Color
              ? outlineColor
              : (outlineColor.getValue?.(viewer.clock.currentTime) as Cesium.Color);
          if (outlineColorValue) {
            polygonProps.value.outlineColor = cesiumToColor(outlineColorValue);
          }
        }
      } catch (e) {
        // 使用默认颜色
      }

      try {
        const outlineWidth = polygon.outlineWidth;
        polygonProps.value.outlineWidth =
          typeof outlineWidth === 'number'
            ? outlineWidth
            : (outlineWidth?.getValue?.(viewer.clock.currentTime) as number) || 2;
      } catch (e) {
        polygonProps.value.outlineWidth = 2;
      }
    }
  } catch (e) {
    console.error('Error loading polygon properties:', e);
  }

  // 加载矩形属性
  try {
    if (entity.rectangle) {
      const rectangle = entity.rectangle;
      try {
        const material = rectangle.material;
        if (material) {
          const materialValue =
            material instanceof Cesium.Color
              ? material
              : (material.getValue?.(viewer.clock.currentTime) as Cesium.Color);
          if (materialValue) {
            rectangleProps.value.materialColor = cesiumToColor(materialValue);
            rectangleProps.value.alpha = materialValue.alpha;
          }
        }
      } catch (e) {
        // 使用默认值
      }

      try {
        const outlineColor = rectangle.outlineColor;
        if (outlineColor) {
          const outlineColorValue =
            outlineColor instanceof Cesium.Color
              ? outlineColor
              : (outlineColor.getValue?.(viewer.clock.currentTime) as Cesium.Color);
          if (outlineColorValue) {
            rectangleProps.value.outlineColor = cesiumToColor(outlineColorValue);
          }
        }
      } catch (e) {
        // 使用默认颜色
      }

      try {
        const outlineWidth = rectangle.outlineWidth;
        rectangleProps.value.outlineWidth =
          typeof outlineWidth === 'number'
            ? outlineWidth
            : (outlineWidth?.getValue?.(viewer.clock.currentTime) as number) || 2;
      } catch (e) {
        rectangleProps.value.outlineWidth = 2;
      }
    }
  } catch (e) {
    console.error('Error loading rectangle properties:', e);
  }

  // 加载椭圆属性
  try {
    if (entity.ellipse) {
      const ellipse = entity.ellipse;
      try {
        const material = ellipse.material;
        if (material) {
          const materialValue =
            material instanceof Cesium.Color
              ? material
              : (material.getValue?.(viewer.clock.currentTime) as Cesium.Color);
          if (materialValue) {
            ellipseProps.value.materialColor = cesiumToColor(materialValue);
            ellipseProps.value.alpha = materialValue.alpha;
          }
        }
      } catch (e) {
        // 使用默认值
      }

      try {
        const outlineColor = ellipse.outlineColor;
        if (outlineColor) {
          const outlineColorValue =
            outlineColor instanceof Cesium.Color
              ? outlineColor
              : (outlineColor.getValue?.(viewer.clock.currentTime) as Cesium.Color);
          if (outlineColorValue) {
            ellipseProps.value.outlineColor = cesiumToColor(outlineColorValue);
          }
        }
      } catch (e) {
        // 使用默认颜色
      }

      try {
        const outlineWidth = ellipse.outlineWidth;
        ellipseProps.value.outlineWidth =
          typeof outlineWidth === 'number'
            ? outlineWidth
            : (outlineWidth?.getValue?.(viewer.clock.currentTime) as number) || 2;
      } catch (e) {
        ellipseProps.value.outlineWidth = 2;
      }
    }
  } catch (e) {
    console.error('Error loading ellipse properties:', e);
  }
};

/**
 * 保存实体属性
 */
const handleSave = () => {
  if (!props.entityInfo) {
    return;
  }

  const entity = props.entityInfo.entity;
  const viewer = cesiumStore.getViewer;
  if (!viewer) {
    return;
  }

  // 更新基本属性
  entity.name = formData.value.name;
  if (formData.value.description) {
    entity.description = formData.value.description;
  } else {
    entity.description = undefined;
  }
  entity.show = formData.value.show;

  // 更新点属性
  if (entity.point) {
    entity.point.pixelSize = pointProps.value.pixelSize;
    entity.point.color = colorToCesium(pointProps.value.color);
    entity.point.outlineColor = colorToCesium(pointProps.value.outlineColor);
    entity.point.outlineWidth = pointProps.value.outlineWidth;
  }

  // 更新折线属性
  if (entity.polyline) {
    entity.polyline.width = polylineProps.value.width;
    // polyline.material 可以是 Color 或 Material
    entity.polyline.material = colorToCesium(polylineProps.value.color);
  }

  // 更新多边形属性
  if (entity.polygon) {
    const materialColor = colorToCesium(polygonProps.value.materialColor, polygonProps.value.alpha);
    entity.polygon.material = materialColor;
    entity.polygon.outlineColor = colorToCesium(polygonProps.value.outlineColor);
    entity.polygon.outlineWidth = polygonProps.value.outlineWidth;
  }

  // 更新矩形属性
  if (entity.rectangle) {
    const materialColor = colorToCesium(rectangleProps.value.materialColor, rectangleProps.value.alpha);
    entity.rectangle.material = materialColor;
    entity.rectangle.outlineColor = colorToCesium(rectangleProps.value.outlineColor);
    entity.rectangle.outlineWidth = rectangleProps.value.outlineWidth;
  }

  // 更新椭圆属性
  if (entity.ellipse) {
    const materialColor = colorToCesium(ellipseProps.value.materialColor, ellipseProps.value.alpha);
    entity.ellipse.material = materialColor;
    entity.ellipse.outlineColor = colorToCesium(ellipseProps.value.outlineColor);
    entity.ellipse.outlineWidth = ellipseProps.value.outlineWidth;
  }

  emit('close');
};

/**
 * 删除实体
 */
const handleDelete = () => {
  if (!props.entityInfo) {
    return;
  }

  if (confirm('确定要删除这个实体吗？')) {
    const viewer = cesiumStore.getViewer;
    if (viewer) {
      viewer.entities.remove(props.entityInfo.entity);

      // 从图层中移除
      if (props.entityInfo.layerId) {
        layerStore.detachEntity(props.entityInfo.layerId, props.entityInfo.entityId);
      }
    }

    emit('delete', props.entityInfo.entity);
    emit('close');
  }
};

/**
 * 关闭面板
 */
const handleClose = () => {
  emit('close');
};

// 监听实体变化，重新加载属性
watch(
  () => props.entityInfo,
  () => {
    if (props.entityInfo) {
      loadEntityProperties();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.entity-editor-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  max-height: 80vh;
  padding: 20px;
  border-radius: 12px;
  background: rgba(17, 24, 39, 0.95);
  color: #fff;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 1000;
  overflow-y: auto;
}

.entity-editor-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.entity-editor-panel__header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.entity-editor-panel__close {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.entity-editor-panel__close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.entity-editor-panel__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.entity-editor-panel__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.entity-editor-panel__label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.entity-editor-panel__input,
.entity-editor-panel__textarea {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
  font-family: inherit;
}

.entity-editor-panel__input:focus,
.entity-editor-panel__textarea:focus {
  outline: none;
  border-color: #3d82ff;
  background: rgba(255, 255, 255, 0.15);
}

.entity-editor-panel__textarea {
  resize: vertical;
  min-height: 60px;
}

.entity-editor-panel__switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.entity-editor-panel__switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.3);
  transition: 0.2s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3d82ff;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.entity-editor-panel__actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.entity-editor-panel__button {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.entity-editor-panel__button--save {
  background: #3d82ff;
  color: #fff;
}

.entity-editor-panel__button--save:hover {
  background: #2f6ddb;
}

.entity-editor-panel__button--delete {
  background: rgba(239, 68, 68, 0.8);
  color: #fff;
}

.entity-editor-panel__button--delete:hover {
  background: rgba(239, 68, 68, 1);
}
</style>

