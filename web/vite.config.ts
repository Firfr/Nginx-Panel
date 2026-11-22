import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import path from "path";

import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

// https://vite.dev/config/
export default defineConfig({
  // 项目基础路径，打包后资源使用相对路径（./）
  base: "./",
  resolve: {
    alias: [
      {
        find: "@公共代码",
        replacement: path.resolve(__dirname, "../公共代码"),
      },
    ],
  },

  // 开发服务器配置（vite 时生效）
  // 监听的 IP 和端口，端口占用，会自动加一，直到可用
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 1234,
    // 设置路径转发
    proxy: {
      "/api": {
        target: "http://127.0.0.1:1235",
        changeOrigin: true,
        secure: false,
      },
      "/auth": {
        target: "http://127.0.0.1:1235",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  plugins: [
    vue(),
    AutoImport({
      // 自动导入 Element Plus 组件/方法
      resolvers: [ElementPlusResolver()],
      // 生成 TS 类型声明（解决 VSCode 爆红）
      dts: true,
      // 在 Vue 模板里也能使用自动导入
      vueTemplate: true,
    }),
    // 自动导入组件（<el-button> 这类）
    Components({
      resolvers: [ElementPlusResolver()],
      dts: true,
    }),
  ],
});
