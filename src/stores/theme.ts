import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { themes, defaultTheme, type Theme } from '../config/theme.config';

/**
 * 主题Store
 * 管理当前主题状态，并提供主题切换功能
 */
export const useThemeStore = defineStore('theme', () => {
  // 当前主题名称
  const currentTheme = ref<string>(defaultTheme);
  
  // 从localStorage加载保存的主题
  const loadTheme = () => {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme && themes[savedTheme]) {
      currentTheme.value = savedTheme;
    }
    applyTheme(currentTheme.value);
  };
  
  // 保存主题到localStorage
  const saveTheme = (themeName: string) => {
    localStorage.setItem('app-theme', themeName);
  };
  
  // 应用主题到DOM
  const applyTheme = (themeName: string) => {
    const theme = themes[themeName] || themes[defaultTheme];
    const root = document.documentElement;
    const colors = theme.colors;
    
    // 设置CSS变量
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-light', colors.primaryLight);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-primary-gradient', colors.primaryGradient);
    
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-background-secondary', colors.backgroundSecondary);
    root.style.setProperty('--color-background-tertiary', colors.backgroundTertiary);
    
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-text-tertiary', colors.textTertiary);
    root.style.setProperty('--color-text-inverse', colors.textInverse);
    
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-border-light', colors.borderLight);
    root.style.setProperty('--color-border-dark', colors.borderDark);
    
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--color-info', colors.info);
    
    root.style.setProperty('--color-window-bg', colors.windowBg);
    root.style.setProperty('--color-window-header-bg', colors.windowHeaderBg);
    root.style.setProperty('--color-window-header-text', colors.windowHeaderText);
    root.style.setProperty('--color-button-bg', colors.buttonBg);
    root.style.setProperty('--color-button-hover', colors.buttonHover);
    root.style.setProperty('--color-button-text', colors.buttonText);
    
    root.style.setProperty('--color-shadow', colors.shadow);
    root.style.setProperty('--color-shadow-light', colors.shadowLight);
    root.style.setProperty('--color-shadow-dark', colors.shadowDark);
    
    root.style.setProperty('--color-overlay', colors.overlay);
    root.style.setProperty('--color-backdrop', colors.backdrop);
    
    // 添加主题类名到body，方便特定主题的样式定制
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.body.classList.add(`theme-${themeName}`);
  };
  
  // 切换主题
  const setTheme = (themeName: string) => {
    if (!themes[themeName]) {
      console.warn(`Theme "${themeName}" not found, using default theme`);
      themeName = defaultTheme;
    }
    currentTheme.value = themeName;
    applyTheme(themeName);
    saveTheme(themeName);
  };
  
  // 获取当前主题对象
  const getCurrentTheme = (): Theme => {
    return themes[currentTheme.value] || themes[defaultTheme];
  };
  
  // 获取所有可用主题
  const getAvailableThemes = (): Theme[] => {
    return Object.values(themes);
  };
  
  // 初始化时加载主题
  if (typeof window !== 'undefined') {
    loadTheme();
  }
  
  return {
    currentTheme,
    setTheme,
    getCurrentTheme,
    getAvailableThemes,
    applyTheme,
  };
});

