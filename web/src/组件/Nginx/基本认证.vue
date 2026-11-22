<script setup lang="ts">
import { ref } from "vue";
import { cmp_当前文件列表, const_菜单列表对象, ref_选中菜单 } from "../../全局共享数据";
import { fn获取菜单文件列表, fn鼠标滚轮横向滚动 } from "../../工具/其他工具";
import { Delete, Edit } from "@element-plus/icons-vue";
import Vue_添加基本认证 from "./操作弹窗/添加基本认证.vue";
import Vue_更新基本认证 from "./操作弹窗/更新基本认证.vue";
import { fn发送请求 } from "../../工具/请求.ts";

const ref_选中文件名 = ref("");
const ref_渲染添加组件 = ref(false);
const ref_渲染更新组件 = ref(false);
const ref_渲染删除弹窗 = ref(false);

const fn更新 = (文件名: string) => {
  ref_选中文件名.value = 文件名;
  ref_渲染更新组件.value = true;
};
const fn删除弹窗 = (文件名: string) => {
  ref_选中文件名.value = 文件名;
  ref_渲染删除弹窗.value = true;
};
const fn删除 = async () => {
  if (ref_选中菜单.value?.名称 !== "基本认证" || !ref_选中文件名.value) return;

  const 请求结果 = await fn发送请求(
    "delete",
    `${const_菜单列表对象.基本认证.路径}/file/${ref_选中文件名.value}`,
  );
  if (!请求结果.状态) return;

  ElMessage.success(`基本认证 ${ref_选中文件名.value} 删除成功！`);

  ref_选中文件名.value = "";
  ref_渲染删除弹窗.value = false;

  fn获取菜单文件列表(ref_选中菜单.value, true);
};
</script>

<template>
  <div class="基本认证 分类内容 卡片容器父级">
    <div class="标题" @wheel="fn鼠标滚轮横向滚动">
      <div>
        <el-tag>账号: {{ cmp_当前文件列表.length }} 个</el-tag>

        <el-tooltip effect="dark" placement="top">
          <el-tag>说明</el-tag>
          <template #content>
            所有文件位于目录 /data/htpasswd 目录下，位置固定！<br />
            Nginx 基本认证，每个文件一个账号。<br />
            第一行注释方式展示明文账号密码：# 账号 密码！
          </template>
        </el-tooltip>

        <el-button @click="fn获取菜单文件列表(ref_选中菜单!, true)" type="primary" size="small">
          刷新
        </el-button>

        <el-button @click="ref_渲染添加组件 = true" type="success" size="small">添加</el-button>
      </div>
    </div>

    <div v-if="cmp_当前文件列表.length === 0">无基本认证</div>
    <div v-else class="卡片容器">
      <div class="卡片" v-for="文件名 in cmp_当前文件列表">
        <div>
          {{ 文件名.replace(/\.txt$/, "") }}
        </div>

        <div class="内容左右贴边">
          <el-button class="小边距" @click="fn删除弹窗(文件名)" type="danger" size="small">
            删除&nbsp;
            <el-icon><Delete /></el-icon>
          </el-button>

          <el-button class="小边距" @click="fn更新(文件名)" type="primary" size="small">
            更新&nbsp;
            <el-icon><Edit /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>

  <el-dialog
    v-model="ref_渲染删除弹窗"
    :title="`确定要删除基本认证 ${ref_选中文件名} 吗？`"
    align-center
    append-to-body
    class="不换行"
  >
    <div style="display: flex; flex-direction: column; align-items: center">
      <div>基本认证删除后如果有配置还在使用会报错！</div>

      <el-button @click="fn删除" type="danger"> 确定删除 </el-button>
    </div>
  </el-dialog>

  <Vue_添加基本认证 v-if="ref_渲染添加组件" v-model="ref_渲染添加组件" />
  <Vue_更新基本认证 v-if="ref_渲染更新组件" v-model="ref_渲染更新组件" :文件名="ref_选中文件名" />
</template>
