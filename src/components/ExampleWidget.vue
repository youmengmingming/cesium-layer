<template>
  <div class="example-widget">
    <h3>示例窗口组件</h3>
    <p>这是一个示例窗口组件，展示如何通过 openWidget 函数打开窗口。</p>
    
    <div class="content">
      <div class="info-item">
        <label>传入的属性值：</label>
        <span>{{ message }}</span>
      </div>
      
      <div class="info-item">
        <label>计数：</label>
        <span>{{ count }}</span>
      </div>
      
      <div class="actions">
        <button @click="handleIncrement">增加计数</button>
        <button @click="handleEmitEvent">触发事件</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  message?: string;
  initialCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  message: '默认消息',
  initialCount: 0,
});

const emit = defineEmits<{
  customEvent: [value: string];
  countChanged: [count: number];
}>();

const count = ref(props.initialCount);

const handleIncrement = () => {
  count.value++;
  emit('countChanged', count.value);
};

const handleEmitEvent = () => {
  emit('customEvent', `当前计数: ${count.value}`);
};
</script>

<style scoped>
.example-widget {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

h3 {
  margin-bottom: 16px;
  color: #333;
}

p {
  margin-bottom: 20px;
  color: #666;
  line-height: 1.6;
}

.content {
  flex: 1;
}

.info-item {
  margin-bottom: 12px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.info-item label {
  font-weight: 500;
  margin-right: 8px;
  color: #555;
}

.info-item span {
  color: #333;
}

.actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

button {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

button:hover {
  background: #5568d3;
}

button:active {
  background: #4457c1;
}
</style>

