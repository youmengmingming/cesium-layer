<template>
  <div class="entity-editor-panel">
    <!-- Primitive 编辑模式 -->
    <div v-if="props.isPrimitive && primitiveInfo">
      <div class="entity-editor-panel__header">
        <h3>标绘属性</h3>
    </div>

      <div class="entity-editor-panel__content">
        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">名称</label>
          <input
            v-model="primitiveFormData.name"
            class="entity-editor-panel__input"
            type="text"
            placeholder="标绘名称"
          />
        </div>

        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">类型</label>
          <input
            :value="primitiveInfo.type"
            class="entity-editor-panel__input"
            type="text"
            disabled
          />
        </div>

        <div class="entity-editor-panel__section">
          <label class="entity-editor-panel__label">可见性</label>
          <label class="entity-editor-panel__switch">
            <input v-model="primitiveFormData.show" type="checkbox" />
            <span class="slider" />
          </label>
        </div>

        <!-- 点属性 -->
        <template v-if="primitiveInfo.type === 'point'">
          <div class="entity-editor-panel__section">
            <label class="entity-editor-panel__label">点大小</label>
            <input
              v-model.number="primitivePointProps.pixelSize"
              class="entity-editor-panel__input"
              type="number"
              min="1"
              max="50"
            />
          </div>
          <div class="entity-editor-panel__section">
            <label class="entity-editor-panel__label">点颜色</label>
            <input
              v-model="primitivePointProps.color"
              class="entity-editor-panel__input"
              type="color"
            />
          </div>
          <div class="entity-editor-panel__section">
            <label class="entity-editor-panel__label">边框颜色</label>
            <input
              v-model="primitivePointProps.outlineColor"
              class="entity-editor-panel__input"
              type="color"
            />
          </div>
          <div class="entity-editor-panel__section">
            <label class="entity-editor-panel__label">边框宽度</label>
            <input
              v-model.number="primitivePointProps.outlineWidth"
              class="entity-editor-panel__input"
              type="number"
              min="0"
              max="10"
            />
          </div>
        </template>

        <!-- 折线属性 -->
        <template v-if="primitiveInfo.type === 'polyline'">
          <div class="entity-editor-panel__section">
            <label class="entity-editor-panel__label">线宽</label>
            <input
              v-model.number="primitivePolylineProps.width"
              class="entity-editor-panel__input"
              type="number"
              min="1"
              max="20"
            />
          </div>
          <div class="entity-editor-panel__section">
            <label class="entity-editor-panel__label">线条颜色</label>
            <input
              v-model="primitivePolylineProps.color"
              class="entity-editor-panel__input"
              type="color"
            />
          </div>
        </template>

        <!-- 多边形/圆形属性 -->
        <template v-if="primitiveInfo.type === 'polygon' || primitiveInfo.type === 'circle'">
          <div class="entity-editor-panel__section">
            <label class="entity-editor-panel__label">填充颜色</label>
            <input
              v-model="primitivePolygonProps.materialColor"
              class="entity-editor-panel__input"
              type="color"
            />
          </div>
          <div class="entity-editor-panel__section">
            <label class="entity-editor-panel__label">填充透明度</label>
            <input
              v-model.number="primitivePolygonProps.alpha"
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
              v-model="primitivePolygonProps.outlineColor"
              class="entity-editor-panel__input"
              type="color"
            />
          </div>
          <div class="entity-editor-panel__section">
            <label class="entity-editor-panel__label">边框宽度</label>
            <input
              v-model.number="primitivePolygonProps.outlineWidth"
              class="entity-editor-panel__input"
              type="number"
              min="0"
              max="10"
            />
          </div>
        </template>

        <!-- 矩形属性 -->
        <template v-if="primitiveInfo.type === 'rectangle'">
          <div class="entity-editor-panel__section">
            <label class="entity-editor-panel__label">填充颜色</label>
            <input
              v-model="primitiveRectangleProps.materialColor"
              class="entity-editor-panel__input"
              type="color"
            />
          </div>
          <div class="entity-editor-panel__section">
            <label class="entity-editor-panel__label">填充透明度</label>
            <input
              v-model.number="primitiveRectangleProps.alpha"
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
              v-model="primitiveRectangleProps.outlineColor"
              class="entity-editor-panel__input"
              type="color"
            />
          </div>
          <div class="entity-editor-panel__section">
            <label class="entity-editor-panel__label">边框宽度</label>
            <input
              v-model.number="primitiveRectangleProps.outlineWidth"
              class="entity-editor-panel__input"
              type="number"
              min="0"
              max="10"
            />
          </div>
        </template>

        <div class="entity-editor-panel__actions">
          <button class="entity-editor-panel__button entity-editor-panel__button--save" @click="handleSavePrimitive">
            保存
          </button>
          <button class="entity-editor-panel__button entity-editor-panel__button--delete" @click="handleDeletePrimitive">
            删除
          </button>
        </div>
      </div>
    </div>
    <!-- Entity 编辑模式 -->
    <div v-else-if="!props.isPrimitive && entityInfo && entityInfo.entity">
    <div class="entity-editor-panel__header">
      <h3>实体属性</h3>
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
    <!-- 错误状态 -->
    <div v-else class="entity-editor-panel__error">
      <p>无法加载对象信息</p>
      <p v-if="props.isPrimitive">Primitive ID: {{ props.primitiveId || '未提供' }}</p>
      <p v-else>Entity ID: {{ props.entityId || '未提供' }}</p>
      <p>图层 ID: {{ props.layerId || '未提供' }}</p>
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
  entityInfo?: EntityInfo | null;
  // 新的 props：通过 ID 传递
  entityId?: string;
  layerId?: string | null;
  entityName?: string;
  // Primitive 相关 props
  primitiveId?: string;
  isPrimitive?: boolean;
  primitiveType?: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'delete', entity: Cesium.Entity): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 初始化 stores（必须在函数定义之前）
const cesiumStore = useCesiumStore();
const layerStore = useLayerStore();

// 从 viewer 中获取实体或 Primitive 的响应式引用
const entityInfo = ref<EntityInfo | null>(null);
const primitiveInfo = ref<{
  primitive: Cesium.Primitive | Cesium.PointPrimitiveCollection;
  layerId: string | null;
  primitiveId: string;
  type: string;
} | null>(null);

// 调试：检查 props
console.log('EntityEditorPanel: defineProps called');
console.log('EntityEditorPanel: props:', props);
console.log('EntityEditorPanel: props.entityInfo:', props.entityInfo);
console.log('EntityEditorPanel: props.entityId:', props.entityId);
console.log('EntityEditorPanel: props.layerId:', props.layerId);

/**
 * 通过 Primitive ID 从图层中获取 Primitive
 */
const loadPrimitiveById = () => {
  if (!props.primitiveId) {
    primitiveInfo.value = null;
    return;
  }

  console.log('EntityEditorPanel: Loading primitive by ID:', props.primitiveId);
  
  // 从图层中查找 Primitive
  let primitive: Cesium.Primitive | Cesium.PointPrimitiveCollection | undefined;
  let foundLayerId: string | null = null;
  
  if (props.layerId) {
    const layer = layerStore.layers[props.layerId];
    if (layer && layer.primitives[props.primitiveId]) {
      primitive = layer.primitives[props.primitiveId];
      foundLayerId = props.layerId;
    }
  } else {
    // 遍历所有图层查找
    for (const layerId in layerStore.layers) {
      const layer = layerStore.layers[layerId];
      if (layer.primitives[props.primitiveId]) {
        primitive = layer.primitives[props.primitiveId];
        foundLayerId = layerId;
        break;
      }
    }
  }
  
  if (primitive) {
    const primitiveType = (primitive as any)._type || props.primitiveType || 'unknown';
    primitiveInfo.value = {
      primitive,
      layerId: foundLayerId,
      primitiveId: props.primitiveId,
      type: primitiveType,
    };
    console.log('EntityEditorPanel: Primitive loaded successfully:', primitive);
  } else {
    console.error('EntityEditorPanel: Primitive not found with ID:', props.primitiveId);
    primitiveInfo.value = null;
  }
};

/**
 * 通过实体 ID 从 viewer 中获取实体
 */
const loadEntityById = () => {
  const viewer = cesiumStore.getViewer;
  if (!viewer) {
    console.warn('EntityEditorPanel: viewer is not available');
    return;
  }

  // 优先使用新的 props 方式（通过 ID）
  if (props.entityId) {
    console.log('EntityEditorPanel: Loading entity by ID:', props.entityId);
    
    // 从 viewer.entities 中查找实体
    let entity: Cesium.Entity | undefined;
    
    // 方法1：通过 ID 查找
    viewer.entities.values.forEach((e) => {
      if (e.id === props.entityId) {
        entity = e;
      }
    });
    
    // 方法2：如果找不到，尝试从图层中查找
    if (!entity && props.layerId) {
      const layer = layerStore.layers[props.layerId];
      if (layer && layer.entities[props.entityId]) {
        entity = layer.entities[props.entityId];
      }
    }
    
    if (entity) {
      entityInfo.value = {
        entity: entity,
        layerId: props.layerId || null,
        entityId: props.entityId,
      };
      console.log('EntityEditorPanel: Entity loaded successfully:', entity);
      console.log('EntityEditorPanel: entityInfo:', entityInfo.value);
    } else {
      console.error('EntityEditorPanel: Entity not found with ID:', props.entityId);
      entityInfo.value = null;
    }
  } 
  // 兼容旧的 props 方式（直接传递 entityInfo）
  else if (props.entityInfo && props.entityInfo.entity) {
    console.log('EntityEditorPanel: Using entityInfo from props');
    entityInfo.value = props.entityInfo;
  } else {
    console.warn('EntityEditorPanel: No valid entity info provided');
    entityInfo.value = null;
  }
};

// 监听 props 变化
watch(
  () => [props.entityId, props.entityInfo, props.primitiveId, props.isPrimitive],
  () => {
    // 明确检查 isPrimitive 标志，如果为 true 且 primitiveId 存在，则加载 Primitive
    if (props.isPrimitive === true && props.primitiveId) {
      loadPrimitiveById();
    } else if (props.isPrimitive !== true && (props.entityId || props.entityInfo)) {
      // 只有当明确不是 Primitive 时才加载 Entity
      loadEntityById();
    }
  },
  { immediate: true }
);

// 监听 viewer 初始化
watch(
  () => cesiumStore.getViewer,
  (viewer) => {
    if (viewer) {
      // 明确检查 isPrimitive 标志
      if (props.isPrimitive === true && props.primitiveId) {
        loadPrimitiveById();
      } else if (props.isPrimitive !== true && (props.entityId || props.entityInfo)) {
        loadEntityById();
      }
    }
  },
  { immediate: true }
);

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

// Primitive 表单数据
const primitiveFormData = ref({
  name: '',
  show: true,
});

const primitivePointProps = ref({
  pixelSize: 10,
  color: '#ffff00',
  outlineColor: '#000000',
  outlineWidth: 2,
});

const primitivePolylineProps = ref({
  width: 3,
  color: '#00ffff',
});

const primitivePolygonProps = ref({
  materialColor: '#00ffff',
  alpha: 0.5,
  outlineColor: '#00ffff',
  outlineWidth: 2,
});

const primitiveRectangleProps = ref({
  materialColor: '#0000ff',
  alpha: 0.5,
  outlineColor: '#0000ff',
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
  if (!entityInfo.value) {
    console.warn('loadEntityProperties: entityInfo is null');
    return;
  }

  const entity = entityInfo.value.entity;
  if (!entity) {
    console.warn('loadEntityProperties: entity is missing');
    return;
  }
  
  const viewer = cesiumStore.getViewer;
  if (!viewer) {
    console.warn('loadEntityProperties: viewer is not available');
    return;
  }
  
  console.log('Loading entity properties:', entity);

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
  if (!entityInfo.value) {
    return;
  }

  const entity = entityInfo.value.entity;
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
 * 加载 Primitive 属性到表单
 */
const loadPrimitiveProperties = () => {
  if (!primitiveInfo.value) {
    return;
  }

  const primitive = primitiveInfo.value.primitive;
  const config = (primitive as any)._config || {};

  primitiveFormData.value.name = (primitive as any)._name || '';
  primitiveFormData.value.show = primitive.show !== false;

  // 加载点属性
  if (primitiveInfo.value.type === 'point') {
    if (primitive instanceof Cesium.PointPrimitiveCollection && primitive.length > 0) {
      // 尝试获取第一个点的属性
      try {
        const pointPrimitive = (primitive as any)[0];
        if (pointPrimitive) {
          primitivePointProps.value.pixelSize = pointPrimitive.pixelSize || 10;
          if (pointPrimitive.color) {
            primitivePointProps.value.color = cesiumToColor(pointPrimitive.color);
          }
          if (pointPrimitive.outlineColor) {
            primitivePointProps.value.outlineColor = cesiumToColor(pointPrimitive.outlineColor);
          }
          primitivePointProps.value.outlineWidth = pointPrimitive.outlineWidth || 2;
        }
      } catch (e) {
        // 使用配置中的值
        if (config.fillColor) {
          primitivePointProps.value.color = config.fillColor;
        }
        if (config.outlineColor) {
          primitivePointProps.value.outlineColor = config.outlineColor;
        }
        primitivePointProps.value.pixelSize = config.lineWidth || 10;
        primitivePointProps.value.outlineWidth = config.outlineWidth || 2;
      }
    }
  }

  // 加载折线属性
  if (primitiveInfo.value.type === 'polyline' && primitive instanceof Cesium.Primitive) {
    const geometryInstance = primitive.geometryInstances;
    if (geometryInstance instanceof Cesium.GeometryInstance) {
      const geometry = geometryInstance.geometry;
      if (geometry instanceof Cesium.PolylineGeometry) {
        primitivePolylineProps.value.width = (geometry as any).width || 3;
      }
    }
    // 从配置中获取颜色
    if (config.lineColor) {
      primitivePolylineProps.value.color = config.lineColor;
    }
  }

  // 加载多边形/圆形属性
  if ((primitiveInfo.value.type === 'polygon' || primitiveInfo.value.type === 'circle') && primitive instanceof Cesium.Primitive) {
    if (config.fillColor) {
      primitivePolygonProps.value.materialColor = config.fillColor;
    }
    if (config.fillColorAlpha !== undefined) {
      primitivePolygonProps.value.alpha = config.fillColorAlpha;
    }
    if (config.outlineColor) {
      primitivePolygonProps.value.outlineColor = config.outlineColor;
    }
    primitivePolygonProps.value.outlineWidth = config.outlineWidth || 2;
  }

  // 加载矩形属性
  if (primitiveInfo.value.type === 'rectangle' && primitive instanceof Cesium.Primitive) {
    if (config.fillColor) {
      primitiveRectangleProps.value.materialColor = config.fillColor;
    }
    if (config.fillColorAlpha !== undefined) {
      primitiveRectangleProps.value.alpha = config.fillColorAlpha;
    }
    if (config.outlineColor) {
      primitiveRectangleProps.value.outlineColor = config.outlineColor;
    }
    primitiveRectangleProps.value.outlineWidth = config.outlineWidth || 2;
  }
};

/**
 * 保存 Primitive 属性
 */
const handleSavePrimitive = () => {
  if (!primitiveInfo.value) {
    return;
  }

  const primitive = primitiveInfo.value.primitive;
  const viewer = cesiumStore.getViewer;
  if (!viewer) {
    return;
  }

  // 更新名称和可见性
  (primitive as any)._name = primitiveFormData.value.name;
  primitive.show = primitiveFormData.value.show;

  // 更新配置
  const config = (primitive as any)._config || {};
  
  // 更新点属性
  if (primitiveInfo.value.type === 'point' && primitive instanceof Cesium.PointPrimitiveCollection) {
    if (primitive.length > 0) {
      try {
        const pointPrimitive = (primitive as any)[0];
        if (pointPrimitive) {
          pointPrimitive.pixelSize = primitivePointProps.value.pixelSize;
          pointPrimitive.color = colorToCesium(primitivePointProps.value.color);
          pointPrimitive.outlineColor = colorToCesium(primitivePointProps.value.outlineColor);
          pointPrimitive.outlineWidth = primitivePointProps.value.outlineWidth;
        }
      } catch (e) {
        console.warn('Failed to update point primitive:', e);
      }
    }
    config.fillColor = primitivePointProps.value.color;
    config.lineWidth = primitivePointProps.value.pixelSize;
    config.outlineColor = primitivePointProps.value.outlineColor;
    config.outlineWidth = primitivePointProps.value.outlineWidth;
  }

  // 更新折线属性（需要重新创建 Primitive，因为颜色是几何属性）
  if (primitiveInfo.value.type === 'polyline' && primitive instanceof Cesium.Primitive) {
    config.lineColor = primitivePolylineProps.value.color;
    config.lineWidth = primitivePolylineProps.value.width;
    // 注意：Primitive 的颜色修改比较复杂，这里只更新配置
    // 实际的颜色修改需要重新创建 Primitive
  }

  // 更新多边形/圆形属性
  if ((primitiveInfo.value.type === 'polygon' || primitiveInfo.value.type === 'circle') && primitive instanceof Cesium.Primitive) {
    config.fillColor = primitivePolygonProps.value.materialColor;
    config.fillColorAlpha = primitivePolygonProps.value.alpha;
    config.outlineColor = primitivePolygonProps.value.outlineColor;
    config.outlineWidth = primitivePolygonProps.value.outlineWidth;
    // 注意：Primitive 的颜色修改需要重新创建，这里只更新配置
  }

  // 更新矩形属性
  if (primitiveInfo.value.type === 'rectangle' && primitive instanceof Cesium.Primitive) {
    config.fillColor = primitiveRectangleProps.value.materialColor;
    config.fillColorAlpha = primitiveRectangleProps.value.alpha;
    config.outlineColor = primitiveRectangleProps.value.outlineColor;
    config.outlineWidth = primitiveRectangleProps.value.outlineWidth;
    // 注意：Primitive 的颜色修改需要重新创建，这里只更新配置
  }

  (primitive as any)._config = config;

  emit('close');
};

/**
 * 删除 Primitive
 */
const handleDeletePrimitive = () => {
  if (!primitiveInfo.value) {
    return;
  }

  if (confirm('确定要删除这个标绘对象吗？')) {
    const viewer = cesiumStore.getViewer;
    if (viewer) {
      viewer.scene.primitives.remove(primitiveInfo.value.primitive);

      // 从图层中移除
      if (primitiveInfo.value.layerId) {
        layerStore.detachPrimitive(primitiveInfo.value.layerId, primitiveInfo.value.primitiveId);
      }
    }

    emit('close');
  }
};

/**
 * 删除实体
 */
const handleDelete = () => {
  if (!entityInfo.value) {
    return;
  }

  if (confirm('确定要删除这个实体吗？')) {
    const viewer = cesiumStore.getViewer;
    if (viewer) {
      viewer.entities.remove(entityInfo.value.entity);

      // 从图层中移除
      if (entityInfo.value.layerId) {
        layerStore.detachEntity(entityInfo.value.layerId, entityInfo.value.entityId);
      }
    }

    emit('delete', entityInfo.value.entity);
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
  () => entityInfo.value,
  (newValue) => {
    console.log('EntityInfo changed:', newValue);
    if (newValue && newValue.entity) {
      loadEntityProperties();
    } else {
      console.warn('EntityInfo is invalid:', newValue);
    }
  },
  { immediate: true, deep: true }
);

// 监听 Primitive 变化，重新加载属性
watch(
  () => primitiveInfo.value,
  (newValue) => {
    console.log('PrimitiveInfo changed:', newValue);
    if (newValue) {
      loadPrimitiveProperties();
    }
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
.entity-editor-panel {
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  background: var(--color-background-secondary);
  color: var(--color-text);
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.entity-editor-panel__header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-border-light);
  flex-shrink: 0;
}

.entity-editor-panel__header h3 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.3px;
}

.entity-editor-panel__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

.entity-editor-panel__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 4px;
}

.entity-editor-panel__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
  letter-spacing: 0.2px;
}

.entity-editor-panel__input,
.entity-editor-panel__textarea {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-dark);
  background: var(--color-background);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-family: inherit;
  transition: var(--transition-base);
}

.entity-editor-panel__input:hover,
.entity-editor-panel__textarea:hover {
  border-color: var(--color-border);
}

.entity-editor-panel__input:focus,
.entity-editor-panel__textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12);
  background: var(--color-background);
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
  background-color: #ccc;
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
  background-color: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.entity-editor-panel__actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.entity-editor-panel__button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-base);
  letter-spacing: 0.3px;
}

.entity-editor-panel__button--save {
  background: var(--color-primary-gradient);
  color: var(--color-text-inverse);
  box-shadow: 0 2px 8px var(--color-shadow);
}

.entity-editor-panel__button--save:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);
}

.entity-editor-panel__button--save:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
}

.entity-editor-panel__button--delete {
  background: var(--color-error);
  color: var(--color-text-inverse);
  box-shadow: 0 2px 8px var(--color-shadow);
}

.entity-editor-panel__button--delete:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.35);
}

.entity-editor-panel__button--delete:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);
}

.entity-editor-panel__error {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.entity-editor-panel__error p {
  margin: 8px 0;
  font-size: 14px;
}

.entity-editor-panel__error pre {
  margin-top: 20px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
  text-align: left;
  font-size: 12px;
  overflow-x: auto;
}
</style>

