<script setup lang="ts">
import { const_菜单列表, ref_选中文件, ref_选中菜单 } from "../工具/全局共享数据";
import type { t_菜单 } from "../类型";

const fn是否选中 = (菜单: t_菜单) => ref_选中菜单.value && ref_选中菜单.value.名称 === 菜单.名称;
</script>

<template>
  <div id="id_分类菜单">
    <div
      class="菜单"
      v-for="菜单 in const_菜单列表"
      :class="{ 选中: fn是否选中(菜单) }"
      @click="
        ref_选中菜单 = 菜单;
        ref_选中文件 = '';
      "
    >
      {{ 菜单.名称 }}
    </div>
  </div>
</template>

<style scoped>
#id_分类菜单 {
  width: var(--菜单-宽度);
  min-width: var(--菜单-宽度);
  border-right: var(--分割栏-颜色) solid 1px;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;

  .菜单 {
    height: 56px;
    width: 100%;
    padding-left: var(--间距);

    display: flex;
    align-items: center;
    color: rgb(229, 234, 243);
    font-size: 14px;

    transition:
      background-color 0.3s ease,
      color 0.3s ease;

    &:hover {
      background-color: rgb(24, 34, 43);
    }
  }
  .选中 {
    color: rgb(64, 158, 255);
  }
}
</style>
