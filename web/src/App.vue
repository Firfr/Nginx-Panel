<script setup lang="ts">
import zhCn from "element-plus/es/locale/lang/zh-cn";
import Vue_顶部栏 from "./组件/顶部栏.vue";
import Vue_分类菜单 from "./组件/分类菜单.vue";
import Vue_文件列表 from "./组件/文件列表.vue";
import Vue_文件操作 from "./组件/文件操作.vue";
</script>

<template>
  <el-config-provider :locale="zhCn">
    <Vue_顶部栏 />
    <div id="id_内容">
      <Vue_分类菜单 />
      <Vue_文件列表 />
      <Vue_文件操作 />
    </div>
  </el-config-provider>
</template>

<style>
#id_app {
  width: 100%;
  min-width: 750px;
  height: 100%;
  padding: var(--间距) var(--间距) var(--间距) 0;
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
  }
}
</style>
