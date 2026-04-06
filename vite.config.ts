import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import cesium from "vite-plugin-cesium";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), cesium()],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('ol')) return 'ol';
            if (id.includes('echarts')) return 'echarts';
            if (id.includes('vue') || id.includes('pinia')) return 'vendor';
            return 'libs';
          }
        }
      }
    }
  }
});
