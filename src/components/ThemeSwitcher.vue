<template>
  <div class="theme-switcher">
    <button
      class="theme-switcher__trigger"
      @click="toggleMenu"
      :title="`当前主题: ${currentTheme.displayName}`"
    >
      <span class="theme-switcher__icon">🎨</span>
      <span class="theme-switcher__text">{{ currentTheme.displayName }}</span>
      <span class="theme-switcher__arrow" :class="{ open: showMenu }">▼</span>
    </button>
    
    <Transition name="dropdown">
      <div v-if="showMenu" class="theme-switcher__menu" @click.stop>
        <div
          v-for="theme in availableThemes"
          :key="theme.name"
          class="theme-switcher__item"
          :class="{ active: theme.name === currentTheme.name }"
          @click="selectTheme(theme.name)"
        >
          <span class="theme-switcher__item-icon">
            <span
              class="theme-switcher__color-preview"
              :style="{ background: theme.colors.primary }"
            ></span>
          </span>
          <span class="theme-switcher__item-name">{{ theme.displayName }}</span>
          <span v-if="theme.name === currentTheme.name" class="theme-switcher__item-check">✓</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useThemeStore } from '../stores/theme';

const themeStore = useThemeStore();
const showMenu = ref(false);

const currentTheme = computed(() => themeStore.getCurrentTheme());
const availableThemes = computed(() => themeStore.getAvailableThemes());

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};

const selectTheme = (themeName: string) => {
  themeStore.setTheme(themeName);
  showMenu.value = false;
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.theme-switcher')) {
    showMenu.value = false;
  }
};

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
.theme-switcher {
  position: relative;
}

.theme-switcher__trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
  user-select: none;
  font-size: var(--font-size-sm);
  background: var(--color-button-bg);
  color: var(--color-text-inverse);
  border: none;
}

.theme-switcher__trigger:hover {
  background: var(--color-button-hover);
  transform: translateY(-1px);
}

.theme-switcher__icon {
  font-size: 18px;
  line-height: 1;
}

.theme-switcher__text {
  font-weight: 500;
}

.theme-switcher__arrow {
  font-size: 10px;
  transition: transform 0.2s;
  margin-left: 4px;
}

.theme-switcher__arrow.open {
  transform: rotate(180deg);
}

.theme-switcher__menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--color-backdrop);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-md);
  padding: 8px 0;
  min-width: 200px;
  box-shadow: 0 4px 20px var(--color-shadow-dark);
  z-index: var(--z-index-dropdown);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.theme-switcher__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: var(--transition-base);
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.9);
}

.theme-switcher__item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.theme-switcher__item.active {
  background: rgba(255, 255, 255, 0.15);
  color: var(--color-text-inverse);
}

.theme-switcher__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-switcher__color-preview {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.theme-switcher__item-name {
  flex: 1;
  font-weight: 500;
}

.theme-switcher__item-check {
  color: var(--color-primary-light);
  font-weight: bold;
  font-size: 16px;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

