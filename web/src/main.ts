import { createApp } from "vue";
import "./style.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import { fn剪切板写入 } from "./工具/全局-写入剪切板.ts";
import App from "./App.vue";

const app = createApp(App);
app.config.globalProperties.fn剪切板写入 = fn剪切板写入;
app.mount("#id_app");
