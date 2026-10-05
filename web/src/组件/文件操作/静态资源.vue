<script setup lang="ts">
import { computed, reactive } from "vue";
import { fn发送请求 } from "../../工具/请求.ts";
import Vue_分类提示 from "./分类提示.vue";

interface t_信息 {
  名称?: string;
  完整地址?: string;
  路径?: string;
}
const rea_面板信息 = reactive<t_信息>({});
const rea_编辑器信息 = reactive<t_信息>({});

const fn获取面板信息 = async () => {
  const 请求结果 = await fn发送请求("get", "panel");
  if (!请求结果.状态) {
    rea_面板信息.名称 = undefined;
    rea_面板信息.完整地址 = undefined;
    rea_面板信息.路径 = undefined;
    return;
  }

  rea_面板信息.名称 = 请求结果.内容?.名称 || rea_面板信息.名称;
  rea_面板信息.完整地址 = 请求结果.内容?.完整地址 || rea_面板信息.完整地址;
  rea_面板信息.路径 = 请求结果.内容?.路径 || rea_面板信息.路径;
};
fn获取面板信息();

const cmp_面板链接 = computed(() => {
  if (rea_面板信息.完整地址) {
    return rea_面板信息.完整地址;
  }

  if (rea_面板信息.路径) {
    return `${window.location.protocol}//${window.location.hostname}:${rea_面板信息.路径}`;
  }

  return "";
});

const fn获取编辑器信息 = async () => {
  const 请求结果 = await fn发送请求("get", "edit");
  if (!请求结果.状态) {
    rea_编辑器信息.名称 = undefined;
    rea_编辑器信息.完整地址 = undefined;
    rea_编辑器信息.路径 = undefined;
    return;
  }

  rea_编辑器信息.名称 = 请求结果.内容?.名称 || rea_编辑器信息.名称;
  rea_编辑器信息.完整地址 = 请求结果.内容?.完整地址 || rea_编辑器信息.完整地址;
  rea_编辑器信息.路径 = 请求结果.内容?.路径 || rea_编辑器信息.路径;
};
fn获取编辑器信息();

const cmp_编辑器链接 = computed(() => {
  if (rea_编辑器信息.完整地址) {
    return rea_编辑器信息.完整地址;
  }

  if (rea_编辑器信息.路径) {
    return `${window.location.protocol}//${window.location.hostname}:${rea_编辑器信息.路径}`;
  }

  return "";
});
</script>

<template>
  <Vue_分类提示 />

  <div style="display: flex; flex-direction: column; align-items: center; gap: var(--间距)">
    <div
      v-if="rea_面板信息.完整地址 || rea_面板信息.路径"
      style="display: flex; align-items: center; gap: var(--间距)"
    >
      <el-tag>服务器面板：{{ rea_面板信息.名称 }}</el-tag>
      <el-link type="primary" target="_blank" :href="cmp_面板链接">
        {{ cmp_面板链接 }}
      </el-link>
    </div>
    <div
      v-if="rea_编辑器信息.完整地址 || rea_编辑器信息.路径"
      style="display: flex; align-items: center; gap: var(--间距)"
    >
      <el-tag>服务器编辑器：{{ rea_编辑器信息.名称 }}</el-tag>
      <el-link type="primary" target="_blank" :href="cmp_编辑器链接">
        {{ cmp_编辑器链接 }}
      </el-link>
    </div>
  </div>
</template>

<style scoped>
/* 样式 */
</style>
