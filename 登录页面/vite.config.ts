import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  plugins: [vue(), viteSingleFile()],
});
