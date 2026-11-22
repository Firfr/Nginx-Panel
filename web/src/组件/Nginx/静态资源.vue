<script setup lang="ts">
import { computed } from "vue";
import { cmp_当前文件列表, ref_配置, ref_选中菜单 } from "../../全局共享数据";
import { fn获取菜单文件列表, fn鼠标滚轮横向滚动 } from "../../工具/其他工具";

const cmp_面板链接 = computed(() => {
  if (ref_配置.value.面板?.完整地址) {
    return ref_配置.value.面板.完整地址;
  }

  if (ref_配置.value.面板?.路径) {
    return `${window.location.protocol}//${window.location.hostname}:${ref_配置.value.面板.路径}`;
  }

  return "";
});

const cmp_编辑器链接 = computed(() => {
  if (ref_配置.value.编辑?.完整地址) {
    return ref_配置.value.编辑.完整地址;
  }

  if (ref_配置.value.编辑?.路径) {
    return `${window.location.protocol}//${window.location.hostname}:${ref_配置.value.编辑.路径}`;
  }

  return "";
});
</script>

<template>
  <div class="静态资源 分类内容 卡片容器父级">
    <div class="标题" @wheel="fn鼠标滚轮横向滚动">
      <div>
        <el-tag>静态资源: {{ cmp_当前文件列表.length }} 个</el-tag>

        <el-link
          v-if="ref_配置.面板?.完整地址 || ref_配置.面板?.路径"
          type="primary"
          target="_blank"
          :href="cmp_面板链接"
        >
          {{ ref_配置.面板?.名称 }}
        </el-link>

        <el-link
          v-if="ref_配置.编辑?.完整地址 || ref_配置.编辑?.路径"
          type="primary"
          target="_blank"
          :href="cmp_编辑器链接"
        >
          {{ ref_配置.编辑?.名称 }}
        </el-link>

        <el-tooltip effect="dark" placement="top">
          <el-tag>说明</el-tag>
          <template #content>
            仅可查看目录，不可操作。！<br />
            所有资源位于 /data/static 目录下。<br />
            资源管理需借助其他工具，例如：1Panel、SMB 等。
          </template>
        </el-tooltip>

        <el-button @click="fn获取菜单文件列表(ref_选中菜单!, true)" type="primary" size="small">
          刷新
        </el-button>

        <!-- <el-button @click="ref_渲染添加组件 = true" type="success" size="small">添加</el-button> -->
      </div>
    </div>

    <div v-if="cmp_当前文件列表.length === 0">无静态资源</div>
    <div v-else class="卡片容器">
      <div class="卡片" v-for="文件名 in cmp_当前文件列表">
        <div>{{ 文件名 }}</div>
      </div>
    </div>
  </div>
</template>
