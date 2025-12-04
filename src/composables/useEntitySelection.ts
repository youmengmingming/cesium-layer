import { ref, computed, onUnmounted } from 'vue';
import * as Cesium from 'cesium';
import { useCesiumStore } from '../stores/cesium';
import { useLayerStore } from '../stores/layers';

export interface EntityInfo {
  entity?: Cesium.Entity;
  primitive?: Cesium.Primitive | Cesium.PointPrimitiveCollection;
  layerId: string | null;
  entityId: string;
  primitiveId?: string;
  isPrimitive?: boolean;
}

export function useEntitySelection() {
  const cesiumStore = useCesiumStore();
  const layerStore = useLayerStore();

  const selectedEntity = ref<EntityInfo | null>(null);
  const highlightedEntity = ref<Cesium.Entity | null>(null);
  const highlightedPrimitive = ref<Cesium.Primitive | Cesium.PointPrimitiveCollection | null>(null);
  const highlightOutline: Cesium.Entity[] = [];

  const isEntitySelected = computed(() => selectedEntity.value !== null);

  /**
   * 获取当前 viewer
   */
  const getViewer = (): Cesium.Viewer => {
    const viewer = cesiumStore.getViewer;
    if (!viewer) {
      throw new Error('Cesium Viewer 尚未初始化');
    }
    return viewer;
  };

  /**
   * 查找实体所属的图层
   */
  const findEntityLayer = (entity: Cesium.Entity): { layerId: string; entityId: string } | null => {
    for (const layerId in layerStore.layers) {
      const layer = layerStore.layers[layerId];
      for (const entityId in layer.entities) {
        if (layer.entities[entityId] === entity) {
          return { layerId, entityId };
        }
      }
    }
    return null;
  };

  /**
   * 查找 Primitive 所属的图层
   */
  const findPrimitiveLayer = (primitive: Cesium.Primitive | Cesium.PointPrimitiveCollection): { layerId: string; primitiveId: string } | null => {
    const primitiveId = (primitive as any)._id;
    if (!primitiveId) {
      return null;
    }
    
    for (const layerId in layerStore.layers) {
      const layer = layerStore.layers[layerId];
      if (layer.primitives[primitiveId] === primitive) {
        return { layerId, primitiveId };
      }
    }
    return null;
  };

  /**
   * 清除高亮
   */
  const clearHighlight = () => {
    const viewer = getViewer();
    highlightOutline.forEach((outline) => {
      viewer.entities.remove(outline);
    });
    highlightOutline.length = 0;
    highlightedEntity.value = null;
    highlightedPrimitive.value = null;
  };

  /**
   * 高亮 Primitive
   */
  const highlightPrimitive = (primitive: Cesium.Primitive | Cesium.PointPrimitiveCollection) => {
    const viewer = getViewer();
    
    // 清除之前的高亮
    clearHighlight();
    
    if (!primitive) {
      return;
    }
    
    highlightedPrimitive.value = primitive;
    
    // 获取 Primitive 的类型和位置信息
    const primitiveType = (primitive as any)._type;
    const config = (primitive as any)._config;
    
    // 根据 Primitive 类型创建高亮轮廓
    if (primitiveType === 'point') {
      // 点：从存储的位置信息中获取
      const storedPosition = (primitive as any)._position;
      if (storedPosition) {
        const outline = viewer.entities.add({
          position: storedPosition,
          point: {
            pixelSize: 20,
            color: Cesium.Color.TRANSPARENT,
            outlineColor: Cesium.Color.YELLOW,
            outlineWidth: 3,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
        highlightOutline.push(outline);
      }
    } else if (primitiveType === 'polyline' && primitive instanceof Cesium.Primitive) {
      // 折线：从存储的位置信息中获取
      const storedPositions = (primitive as any)._positions;
      if (storedPositions && storedPositions.length > 0) {
        const outline = viewer.entities.add({
          polyline: {
            positions: storedPositions,
            width: 6,
            material: Cesium.Color.YELLOW.withAlpha(0.8),
            clampToGround: true,
          },
        });
        highlightOutline.push(outline);
      }
    } else if (primitiveType === 'polygon' && primitive instanceof Cesium.Primitive) {
      // 多边形：从存储的位置信息中获取
      const storedPositions = (primitive as any)._positions;
      if (storedPositions && storedPositions.length > 0) {
        const closedPositions = [...storedPositions, storedPositions[0]]; // 闭合
        const outline = viewer.entities.add({
          polyline: {
            positions: closedPositions,
            width: 4,
            material: Cesium.Color.YELLOW,
            clampToGround: true,
          },
        });
        highlightOutline.push(outline);
      }
    } else if (primitiveType === 'circle' && primitive instanceof Cesium.Primitive) {
      // 圆形：从存储的位置信息中获取
      const storedPositions = (primitive as any)._positions;
      if (storedPositions && storedPositions.length > 0) {
        const closedPositions = [...storedPositions, storedPositions[0]]; // 闭合
        const outline = viewer.entities.add({
          polyline: {
            positions: closedPositions,
            width: 4,
            material: Cesium.Color.YELLOW,
            clampToGround: true,
          },
        });
        highlightOutline.push(outline);
      }
    } else if (primitiveType === 'rectangle' && primitive instanceof Cesium.Primitive) {
      // 矩形：从存储的矩形信息中获取
      const storedRectangle = (primitive as any)._rectangle;
      if (storedRectangle) {
        const southwest = Cesium.Cartesian3.fromRadians(storedRectangle.west, storedRectangle.south, 0);
        const southeast = Cesium.Cartesian3.fromRadians(storedRectangle.east, storedRectangle.south, 0);
        const northeast = Cesium.Cartesian3.fromRadians(storedRectangle.east, storedRectangle.north, 0);
        const northwest = Cesium.Cartesian3.fromRadians(storedRectangle.west, storedRectangle.north, 0);
        const positions = [southwest, southeast, northeast, northwest, southwest];
        const outline = viewer.entities.add({
          polyline: {
            positions: positions,
            width: 4,
            material: Cesium.Color.YELLOW,
            clampToGround: true,
          },
        });
        highlightOutline.push(outline);
      }
    }
  };

  /**
   * 高亮实体
   */
  const highlightEntity = (entity: Cesium.Entity) => {
    const viewer = getViewer();

    // 清除之前的高亮
    clearHighlight();

    if (!entity) {
      return;
    }

    highlightedEntity.value = entity;

    // 根据实体类型创建高亮轮廓
    const position = entity.position?.getValue(viewer.clock.currentTime) as Cesium.Cartesian3;
    if (!position) {
      return;
    }

    // 为不同类型的实体创建高亮效果
    if (entity.point) {
      // 点：创建外圈
      const outline = viewer.entities.add({
        position: position,
        point: {
          pixelSize: 20,
          color: Cesium.Color.TRANSPARENT,
          outlineColor: Cesium.Color.YELLOW,
          outlineWidth: 3,
          heightReference: entity.point.heightReference,
        },
      });
      highlightOutline.push(outline);
    } else if (entity.polyline) {
      // 折线：创建加粗轮廓
      const positions = entity.polyline.positions?.getValue(
        viewer.clock.currentTime
      ) as Cesium.Cartesian3[];
      if (positions) {
        const outline = viewer.entities.add({
          polyline: {
            positions: positions,
            width: (entity.polyline.width?.getValue(viewer.clock.currentTime) as number) || 3 + 4,
            material: Cesium.Color.YELLOW.withAlpha(0.8),
            clampToGround: entity.polyline.clampToGround,
          },
        });
        highlightOutline.push(outline);
      }
    } else if (entity.polygon) {
      // 多边形：创建加粗边框
      const hierarchy = entity.polygon.hierarchy?.getValue(
        viewer.clock.currentTime
      ) as Cesium.PolygonHierarchy;
      if (hierarchy) {
        const outline = viewer.entities.add({
          polyline: {
            positions: hierarchy.positions,
            width: 4,
            material: Cesium.Color.YELLOW,
            clampToGround: true,
          },
        });
        highlightOutline.push(outline);
      }
    } else if (entity.rectangle) {
      // 矩形：创建加粗边框
      const rectangle = entity.rectangle.coordinates?.getValue(
        viewer.clock.currentTime
      ) as Cesium.Rectangle;
      if (rectangle) {
        const positions = [
          Cesium.Cartesian3.fromRadians(
            Cesium.Rectangle.northwest(rectangle).longitude,
            Cesium.Rectangle.northwest(rectangle).latitude
          ),
          Cesium.Cartesian3.fromRadians(
            Cesium.Rectangle.northeast(rectangle).longitude,
            Cesium.Rectangle.northeast(rectangle).latitude
          ),
          Cesium.Cartesian3.fromRadians(
            Cesium.Rectangle.southeast(rectangle).longitude,
            Cesium.Rectangle.southeast(rectangle).latitude
          ),
          Cesium.Cartesian3.fromRadians(
            Cesium.Rectangle.southwest(rectangle).longitude,
            Cesium.Rectangle.southwest(rectangle).latitude
          ),
          Cesium.Cartesian3.fromRadians(
            Cesium.Rectangle.northwest(rectangle).longitude,
            Cesium.Rectangle.northwest(rectangle).latitude
          ),
        ];
        const outline = viewer.entities.add({
          polyline: {
            positions: positions,
            width: 4,
            material: Cesium.Color.YELLOW,
            clampToGround: true,
          },
        });
        highlightOutline.push(outline);
      }
    } else if (entity.ellipse) {
      // 圆形/椭圆：创建加粗边框
      const center = entity.position?.getValue(viewer.clock.currentTime) as Cesium.Cartesian3;
      const semiMajorAxis =
        (entity.ellipse.semiMajorAxis?.getValue(viewer.clock.currentTime) as number) || 0;
      const semiMinorAxis =
        (entity.ellipse.semiMinorAxis?.getValue(viewer.clock.currentTime) as number) || 0;
      if (center && semiMajorAxis > 0) {
        // 创建圆形轮廓
        const positions: Cesium.Cartesian3[] = [];
        for (let i = 0; i <= 64; i++) {
          const angle = (i / 64) * Cesium.Math.TWO_PI;
          const cartographic = Cesium.Cartographic.fromCartesian(center);
          const lat = Cesium.Math.toRadians(
            Cesium.Math.toDegrees(cartographic.latitude) +
              (semiMajorAxis / 6378137) * Math.cos(angle) * (180 / Math.PI)
          );
          const lon =
            cartographic.longitude +
            (semiMinorAxis / 6378137) * Math.sin(angle) / Math.cos(cartographic.latitude);
          positions.push(Cesium.Cartographic.toCartesian(new Cesium.Cartographic(lon, lat)));
        }
        const outline = viewer.entities.add({
          polyline: {
            positions: positions,
            width: 4,
            material: Cesium.Color.YELLOW,
            clampToGround: true,
          },
        });
        highlightOutline.push(outline);
      }
    }
  };

  /**
   * 选择 Primitive
   */
  const selectPrimitive = (primitive: Cesium.Primitive | Cesium.PointPrimitiveCollection | null) => {
    if (primitive) {
      const layerInfo = findPrimitiveLayer(primitive);
      const primitiveId = (primitive as any)._id || '';
      
      if (layerInfo) {
        selectedEntity.value = {
          primitive,
          layerId: layerInfo.layerId,
          entityId: primitiveId,
          primitiveId: primitiveId,
          isPrimitive: true,
        };
        highlightPrimitive(primitive);
      } else {
        // Primitive 不在任何图层中，但仍然可以选择
        selectedEntity.value = {
          primitive,
          layerId: null,
          entityId: primitiveId,
          primitiveId: primitiveId,
          isPrimitive: true,
        };
        highlightPrimitive(primitive);
      }
    } else {
      selectedEntity.value = null;
      clearHighlight();
    }
  };

  /**
   * 选择实体
   */
  const selectEntity = (entity: Cesium.Entity | null) => {
    if (entity) {
      const layerInfo = findEntityLayer(entity);
      if (layerInfo) {
        selectedEntity.value = {
          entity,
          layerId: layerInfo.layerId,
          entityId: layerInfo.entityId,
          isPrimitive: false,
        };
        highlightEntity(entity);
      } else {
        // 实体不在任何图层中，但仍然可以选择
        selectedEntity.value = {
          entity,
          layerId: null,
          entityId: entity.id || '',
          isPrimitive: false,
        };
        highlightEntity(entity);
      }
    } else {
      selectedEntity.value = null;
      clearHighlight();
    }
  };

  /**
   * 取消选择
   */
  const deselectEntity = () => {
    selectedEntity.value = null;
    clearHighlight();
  };

  /**
   * 初始化实体选择事件处理
   */
  const initEntitySelection = () => {
    const viewer = getViewer();

    // 禁用 Cesium 默认的点击选择行为
    viewer.selectedEntity = undefined;
    
    // 禁用 Cesium 默认的双击行为（focus camera on object）
    // 移除 viewer 默认的双击事件处理器
    try {
      viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    } catch (e) {
      // 如果移除失败，说明可能没有默认的双击处理器，继续执行
    }

    let clickTimeout: number | null = null;
    let lastClickTime = 0;
    let lastClickEntity: Cesium.Entity | null = null;

    // 重写左键点击事件
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      // 使用多种方式尝试拾取对象
      let pickedObject: any = undefined;
      let pickedPrimitive: Cesium.Primitive | Cesium.PointPrimitiveCollection | null = null;
      
      try {
        pickedObject = viewer.scene.pick(click.position);
      } catch (e) {
        console.warn('Scene pick failed:', e);
      }
      
      // 检查是否拾取到 Primitive
      if (pickedObject && pickedObject.primitive) {
        let primitive = pickedObject.primitive;
        
        // 如果拾取到的是边框 primitive（有 _parentId），需要找到对应的主 primitive
        if ((primitive as any)._parentId && (primitive as any)._parentId) {
          const parentId = (primitive as any)._parentId;
          // 遍历场景中的所有 primitives 查找主 primitive
          const primitives = viewer.scene.primitives;
          for (let i = 0; i < primitives.length; i++) {
            const p = primitives.get(i);
            if ((p as any)._id === parentId && (p as any)._type) {
              primitive = p;
              break;
            }
          }
        }
        
        // 检查是否是我们的标绘 Primitive（有 _id 和 _type 属性）
        // 对于 PointPrimitiveCollection，需要检查集合本身
        if ((primitive as any)._id && (primitive as any)._type && !(primitive as any)._parentId) {
          pickedPrimitive = primitive;
        }
        // 如果拾取到的是 PointPrimitive，需要找到它所属的 PointPrimitiveCollection
        else if (primitive instanceof Cesium.PointPrimitive) {
          // 遍历场景中的所有 primitives 查找包含此点的 PointPrimitiveCollection
          const primitives = viewer.scene.primitives;
          for (let i = 0; i < primitives.length; i++) {
            const p = primitives.get(i);
            if (p instanceof Cesium.PointPrimitiveCollection && (p as any)._id && (p as any)._type) {
              // 检查这个集合是否包含被拾取的点
              for (let j = 0; j < p.length; j++) {
                const point = p.get(j);
                if (point === primitive) {
                  pickedPrimitive = p;
                  break;
                }
              }
              if (pickedPrimitive) break;
            }
          }
        }
      }
      
      // 如果直接拾取失败，尝试使用 drillPick（可以拾取被遮挡的对象）
      if (!pickedObject || (!(pickedObject.id instanceof Cesium.Entity) && !pickedPrimitive)) {
        try {
          const objects = viewer.scene.drillPick(click.position);
          if (objects && objects.length > 0) {
            // 优先查找 Primitive
            for (const obj of objects) {
              if (obj && obj.primitive) {
                let primitive = obj.primitive;
                
                // 如果拾取到的是边框 primitive（有 _parentId），需要找到对应的主 primitive
                if ((primitive as any)._parentId) {
                  const parentId = (primitive as any)._parentId;
                  const primitives = viewer.scene.primitives;
                  for (let i = 0; i < primitives.length; i++) {
                    const p = primitives.get(i);
                    if ((p as any)._id === parentId && (p as any)._type) {
                      primitive = p;
                      break;
                    }
                  }
                }
                
                // 检查是否是我们的标绘 Primitive
                if ((primitive as any)._id && (primitive as any)._type && !(primitive as any)._parentId) {
                  pickedPrimitive = primitive;
                  pickedObject = obj;
                  break;
                }
                // 如果拾取到的是 PointPrimitive，需要找到它所属的 PointPrimitiveCollection
                else if (primitive instanceof Cesium.PointPrimitive) {
                  const primitives = viewer.scene.primitives;
                  for (let i = 0; i < primitives.length; i++) {
                    const p = primitives.get(i);
                    if (p instanceof Cesium.PointPrimitiveCollection && (p as any)._id && (p as any)._type) {
                      for (let j = 0; j < p.length; j++) {
                        const point = p.get(j);
                        if (point === primitive) {
                          pickedPrimitive = p;
                          pickedObject = obj;
                          break;
                        }
                      }
                      if (pickedPrimitive) break;
                    }
                  }
                  if (pickedPrimitive) break;
                }
              }
            }
            // 如果没有找到 Primitive，查找 Entity
            if (!pickedPrimitive) {
              for (const obj of objects) {
                if (obj && obj.id instanceof Cesium.Entity) {
                  pickedObject = obj;
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.warn('Drill pick failed:', e);
        }
      }

      // 处理 Primitive 选择
      if (pickedPrimitive) {
        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - lastClickTime;
        const lastPickedPrimitive = lastClickEntity as any as Cesium.Primitive | Cesium.PointPrimitiveCollection | null;

        // 检测双击（增加时间窗口到 500ms，减少单击延迟到 150ms）
        if (
          pickedPrimitive === lastPickedPrimitive &&
          timeSinceLastClick < 500 &&
          clickTimeout !== null
        ) {
          // 双击事件
          clearTimeout(clickTimeout);
          clickTimeout = null;
          lastClickTime = 0;
          lastClickEntity = null;

          // 触发双击事件
          selectPrimitive(pickedPrimitive);
          // 触发自定义双击事件
          viewer.cesiumWidget.canvas.dispatchEvent(
            new CustomEvent('primitive-double-click', { detail: { primitive: pickedPrimitive } })
          );
        } else {
          // 单击事件
          lastClickEntity = pickedPrimitive as any;
          lastClickTime = currentTime;

          clickTimeout = window.setTimeout(() => {
            // 单击：选择并高亮 Primitive
            selectPrimitive(pickedPrimitive);
            clickTimeout = null;
          }, 150);
        }
      }
      // 处理 Entity 选择
      else if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity) {
        const entity = pickedObject.id;

        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - lastClickTime;

        // 检测双击
        if (
          entity === lastClickEntity &&
          timeSinceLastClick < 300 &&
          clickTimeout !== null
        ) {
          // 双击事件
          clearTimeout(clickTimeout);
          clickTimeout = null;
          lastClickTime = 0;
          lastClickEntity = null;

          // 触发双击事件（通过选择实体来触发，组件会监听并打开编辑面板）
          selectEntity(entity);
          // 触发自定义双击事件
          viewer.cesiumWidget.canvas.dispatchEvent(
            new CustomEvent('entity-double-click', { detail: { entity } })
          );
        } else {
          // 单击事件
          lastClickEntity = entity;
          lastClickTime = currentTime;

          clickTimeout = window.setTimeout(() => {
            // 单击：选择并高亮实体
            selectEntity(entity);
            clickTimeout = null;
          }, 200);
        }
      } else {
        // 点击空白处，取消选择
        if (clickTimeout) {
          clearTimeout(clickTimeout);
          clickTimeout = null;
        }
        deselectEntity();
        lastClickTime = 0;
        lastClickEntity = null;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // 拦截并禁用 Cesium 默认的双击事件
    handler.setInputAction(() => {
      // 完全阻止 Cesium 默认的双击行为（focus camera on object）
      // 我们的双击逻辑已经在单击事件中通过时间间隔检测处理了
      // 这里只需要阻止默认行为即可，不做任何处理
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    // 右键事件保留原生行为（不做处理，让 Cesium 自己处理）

    return handler;
  };

  // 组件卸载时清理
  onUnmounted(() => {
    clearHighlight();
  });

  return {
    selectedEntity,
    isEntitySelected,
    highlightEntity,
    highlightPrimitive,
    selectEntity,
    selectPrimitive,
    deselectEntity,
    clearHighlight,
    initEntitySelection,
  };
}

