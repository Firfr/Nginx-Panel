<script setup lang="ts">
import { ref_选中菜单 } from "../工具/全局共享数据";
import Vue_基础 from "./文件操作/基础.vue";
import Vue_证书 from "./文件操作/证书.vue";
import Vue_基本认证 from "./文件操作/基本认证.vue";
import Vue_静态资源 from "./文件操作/静态资源.vue";
</script>

<template>
  <div id="id_文件操作">
    <div v-if="!ref_选中菜单" style="display: flex; justify-content: center; align-items: center">
      <el-tag size="large" type="warning">未选择分类</el-tag>
    </div>
    <Vue_证书 v-else-if="ref_选中菜单.名称 === '证书'" />
    <!-- <Vue_基本认证 v-else-if="ref_选中菜单.名称 === '基本认证'" /> -->
    <Vue_静态资源 v-else-if="ref_选中菜单.名称 === '静态资源'" />
    <Vue_基础 v-else />
  </div>
</template>

<style scoped>
#id_文件操作 {
  flex: 1;
  height: 100%;
  padding-left: var(--间距);
  min-width: 510px;
  display: flex;
  flex-direction: column;
}
</style>
