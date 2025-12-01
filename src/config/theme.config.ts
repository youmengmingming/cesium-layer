/**
 * 主题配置
 * 定义系统中所有可用的主题及其样式变量
 */

export interface ThemeColors {
  // 主色调
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGradient: string;
  
  // 背景色
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // 文本色
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  
  // 边框色
  border: string;
  borderLight: string;
  borderDark: string;
  
  // 状态色
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // UI元素
  windowBg: string;
  windowHeaderBg: string;
  windowHeaderText: string;
  buttonBg: string;
  buttonHover: string;
  buttonText: string;
  
  // 阴影
  shadow: string;
  shadowLight: string;
  shadowDark: string;
  
  // 遮罩
  overlay: string;
  backdrop: string;
}

export interface Theme {
  name: string;
  displayName: string;
  colors: ThemeColors;
}

/**
 * 默认主题配置
 */
export const themes: Record<string, Theme> = {
  light: {
    name: 'light',
    displayName: '浅色主题',
    colors: {
      primary: '#667eea',
      primaryLight: '#8b9ef5',
      primaryDark: '#4c63d2',
      primaryGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      
      background: '#ffffff',
      backgroundSecondary: '#f5f5f5',
      backgroundTertiary: '#f0f0f0',
      
      text: '#333333',
      textSecondary: '#666666',
      textTertiary: '#999999',
      textInverse: '#ffffff',
      
      border: '#e0e0e0',
      borderLight: '#f0f0f0',
      borderDark: '#d0d0d0',
      
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      
      windowBg: '#ffffff',
      windowHeaderBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      windowHeaderText: '#ffffff',
      buttonBg: 'rgba(255, 255, 255, 0.15)',
      buttonHover: 'rgba(255, 255, 255, 0.25)',
      buttonText: '#ffffff',
      
      shadow: 'rgba(0, 0, 0, 0.15)',
      shadowLight: 'rgba(0, 0, 0, 0.1)',
      shadowDark: 'rgba(0, 0, 0, 0.3)',
      
      overlay: 'rgba(0, 0, 0, 0.5)',
      backdrop: 'rgba(17, 24, 39, 0.95)',
    },
  },
  
  dark: {
    name: 'dark',
    displayName: '深色主题',
    colors: {
      primary: '#818cf8',
      primaryLight: '#a5b4fc',
      primaryDark: '#6366f1',
      primaryGradient: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
      
      background: '#1a1a1a',
      backgroundSecondary: '#2d2d2d',
      backgroundTertiary: '#3a3a3a',
      
      text: '#e5e5e5',
      textSecondary: '#b0b0b0',
      textTertiary: '#808080',
      textInverse: '#1a1a1a',
      
      border: '#404040',
      borderLight: '#2d2d2d',
      borderDark: '#505050',
      
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
      
      windowBg: '#2d2d2d',
      windowHeaderBg: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
      windowHeaderText: '#ffffff',
      buttonBg: 'rgba(255, 255, 255, 0.1)',
      buttonHover: 'rgba(255, 255, 255, 0.2)',
      buttonText: '#ffffff',
      
      shadow: 'rgba(0, 0, 0, 0.5)',
      shadowLight: 'rgba(0, 0, 0, 0.3)',
      shadowDark: 'rgba(0, 0, 0, 0.7)',
      
      overlay: 'rgba(0, 0, 0, 0.7)',
      backdrop: 'rgba(17, 24, 39, 0.98)',
    },
  },
  
  blue: {
    name: 'blue',
    displayName: '蓝色主题',
    colors: {
      primary: '#3b82f6',
      primaryLight: '#60a5fa',
      primaryDark: '#2563eb',
      primaryGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      
      background: '#f0f4f8',
      backgroundSecondary: '#e0e7ef',
      backgroundTertiary: '#d1dae3',
      
      text: '#1e293b',
      textSecondary: '#475569',
      textTertiary: '#64748b',
      textInverse: '#ffffff',
      
      border: '#cbd5e1',
      borderLight: '#e2e8f0',
      borderDark: '#94a3b8',
      
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      
      windowBg: '#ffffff',
      windowHeaderBg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      windowHeaderText: '#ffffff',
      buttonBg: 'rgba(255, 255, 255, 0.15)',
      buttonHover: 'rgba(255, 255, 255, 0.25)',
      buttonText: '#ffffff',
      
      shadow: 'rgba(59, 130, 246, 0.2)',
      shadowLight: 'rgba(59, 130, 246, 0.1)',
      shadowDark: 'rgba(59, 130, 246, 0.3)',
      
      overlay: 'rgba(30, 41, 59, 0.5)',
      backdrop: 'rgba(15, 23, 42, 0.95)',
    },
  },
  
  green: {
    name: 'green',
    displayName: '绿色主题',
    colors: {
      primary: '#10b981',
      primaryLight: '#34d399',
      primaryDark: '#059669',
      primaryGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      
      background: '#f0fdf4',
      backgroundSecondary: '#dcfce7',
      backgroundTertiary: '#bbf7d0',
      
      text: '#14532d',
      textSecondary: '#166534',
      textTertiary: '#15803d',
      textInverse: '#ffffff',
      
      border: '#bbf7d0',
      borderLight: '#dcfce7',
      borderDark: '#86efac',
      
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      
      windowBg: '#ffffff',
      windowHeaderBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      windowHeaderText: '#ffffff',
      buttonBg: 'rgba(255, 255, 255, 0.15)',
      buttonHover: 'rgba(255, 255, 255, 0.25)',
      buttonText: '#ffffff',
      
      shadow: 'rgba(16, 185, 129, 0.2)',
      shadowLight: 'rgba(16, 185, 129, 0.1)',
      shadowDark: 'rgba(16, 185, 129, 0.3)',
      
      overlay: 'rgba(20, 83, 45, 0.5)',
      backdrop: 'rgba(5, 150, 105, 0.95)',
    },
  },
};

/**
 * 默认主题
 */
export const defaultTheme = 'light';

/**
 * 获取主题列表
 */
export function getThemeList(): Theme[] {
  return Object.values(themes);
}

/**
 * 获取主题
 */
export function getTheme(name: string): Theme {
  return themes[name] || themes[defaultTheme];
}

