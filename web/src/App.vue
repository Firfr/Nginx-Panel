<script setup lang="ts">
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { ref_选中菜单 } from "./全局共享数据.ts";
import Vue_顶部栏 from "./组件/顶部栏.vue";
import Vue_分类菜单 from "./组件/分类菜单.vue";
import Vue_总览 from "./组件/账号/总览.vue";
import Vue_配置 from "./组件/Nginx/配置.vue";
import Vue_转发 from "./组件/Nginx/转发.vue";
import Vue_证书 from "./组件/Nginx/证书.vue";
import Vue_基本认证 from "./组件/Nginx/基本认证.vue";
import Vue_静态资源 from "./组件/Nginx/静态资源.vue";
</script>

<template>
  <el-config-provider
    :locale="zhCn"
    :message="{
      showClose: true,
      grouping: true,
      placement: 'bottom-right',
      duration: 5000,
    }"
  >
    <Vue_顶部栏 />
    <div id="id_内容">
      <Vue_分类菜单 />
      <div v-if="!ref_选中菜单">请选择功能</div>
      <Vue_总览 v-else-if="ref_选中菜单.名称 === '账号'" />
      <Vue_配置 v-else-if="ref_选中菜单.名称 === '配置'" />
      <Vue_转发 v-else-if="ref_选中菜单.名称 === 'conf.d' || ref_选中菜单.名称 === 'stream'" />
      <Vue_证书 v-else-if="ref_选中菜单.名称 === '证书'" />
      <Vue_基本认证 v-else-if="ref_选中菜单.名称 === '基本认证'" />
      <Vue_静态资源 v-else-if="ref_选中菜单.名称 === '静态资源'" />
    </div>
  </el-config-provider>
</template>

<style>
#id_app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: var(--间距);
  background-color: var(--背景-颜色);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--文字-颜色);

  & > div {
    width: 100%;
  }

  #id_内容 {
    flex: 1;
    overflow: hidden;
    display: flex;
    gap: var(--间距);
  }
}
</style>
