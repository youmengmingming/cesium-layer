import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/theme.css'
import { useThemeStore } from './stores/theme'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// 初始化主题（在挂载前应用主题）
const themeStore = useThemeStore()
themeStore.applyTheme(themeStore.currentTheme)

app.mount('#app')
