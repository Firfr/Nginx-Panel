<script setup lang="ts">
import { computed, ref } from "vue";
import { const_示例, const_菜单列表对象, ref_账号总览, ref_选中菜单 } from "../../全局共享数据";
import { fn获取账号总览列表, fn鼠标滚轮横向滚动 } from "../../工具/其他工具";
import { CopyDocument, Delete, Edit } from "@element-plus/icons-vue";
import { fn发送请求 } from "../../工具/请求";
import Vue_添加账号 from "./添加账号.vue";
import Vue_更新账号 from "./更新账号.vue";

const ref_显示示例 = ref(false);
const ref_渲染添加组件 = ref(false);
const ref_渲染更新组件 = ref(false);
const ref_渲染删除弹窗 = ref(false);

const ref_选中用户名 = ref("");

if (!ref_账号总览.value) fn获取账号总览列表();

const cmp_账号汇总 = computed(() => {
  let 返回值: { 数量: number | string; TOTP: number | string } = {
    数量: "-",
    TOTP: "-",
  };

  if (!ref_账号总览.value) {
    return 返回值;
  }
  返回值.TOTP = 0;
  返回值.数量 = ref_账号总览.value.length;

  for (let 索引 = 0; 索引 < ref_账号总览.value.length; 索引++) {
    if (ref_账号总览.value[索引].TOTP) {
      返回值.TOTP += 1;
    }
  }

  return 返回值;
});

const fn秒时间戳转换 = (毫秒时间戳: number) => {
  const date = new Date(毫秒时间戳 + 8 * 3600 * 1000);
  const 年 = date.getUTCFullYear();
  const 月 = String(date.getUTCMonth() + 1).padStart(2, "0");
  const 日 = String(date.getUTCDate()).padStart(2, "0");
  // const 时 = String(date.getUTCHours()).padStart(2, "0");
  // const 分 = String(date.getUTCMinutes()).padStart(2, "0");
  // const 秒 = String(date.getUTCSeconds()).padStart(2, "0");

  // return `${年}年${月}月${日}日 ${时}:${分}:${秒}`;
  return `${年}年${月}月${日}日`;
};

const fn渲染更新组件 = (用户名: string) => {
  ref_选中用户名.value = 用户名;
  ref_渲染更新组件.value = true;
};

const fn显示删除弹窗 = (用户名: string) => {
  ref_选中用户名.value = 用户名;
  ref_渲染删除弹窗.value = true;
};
const fn删除 = async () => {
  if (ref_选中菜单.value?.名称 !== "账号" || !ref_选中用户名.value) return;

  const 请求结果 = await fn发送请求(
    "delete",
    `${const_菜单列表对象.账号.路径}/info/${ref_选中用户名.value}`,
  );
  if (!请求结果.状态) return;

  ElMessage.success(`账号 ${ref_选中用户名.value} 删除成功！`);

  ref_选中用户名.value = "";
  ref_渲染删除弹窗.value = false;

  fn获取账号总览列表();
};
</script>

<template>
  <div class="账号-总览 分类内容 卡片容器父级">
    <div class="标题" @wheel="fn鼠标滚轮横向滚动">
      <div>
        <el-tag>账号: {{ cmp_账号汇总.数量 }} 个</el-tag>
        <el-tag>TOTP: {{ cmp_账号汇总.TOTP }} 个</el-tag>
        <el-tooltip effect="dark" placement="top">
          <el-tag>说明</el-tag>
          <template #content>
            通过 nginx 代理给一个没有账号的站点添加一个账号。<br />
            操作流程：在此处添加账号 => Nginx 添加代理转发
          </template>
        </el-tooltip>
        <el-button @click="ref_显示示例 = true" type="success" size="small">示例</el-button>
        <el-button @click="fn获取账号总览列表(true)" type="primary" size="small">刷新</el-button>
        <el-button @click="ref_渲染添加组件 = true" type="success" size="small">添加</el-button>
      </div>
    </div>

    <div v-if="!ref_账号总览"></div>
    <div v-else class="卡片容器">
      <div class="卡片" v-for="账号 in ref_账号总览">
        <div class="用户名">
          <div style="margin-right: auto">{{ 账号.用户名 }}</div>
          <el-tag v-if="账号.TOTP" size="small">TOTP</el-tag>
          <el-tag v-if="账号.启用" type="success" size="small">启用</el-tag>
          <el-tag v-else type="danger" size="small">禁用</el-tag>
        </div>
        <div class="信息">
          <el-tag>{{ fn秒时间戳转换(账号.创建时间) }}</el-tag>
          <el-tag>{{ 账号.登录设备 }} 台</el-tag>
          <el-tag>{{ 账号.登录天数 }} 天</el-tag>
        </div>
        <div class="备注">{{ 账号.备注 }}</div>
        <div class="操作">
          <el-button class="小边距" @click="fn显示删除弹窗(账号.用户名)" type="danger" size="small">
            删除&nbsp;
            <el-icon><Delete /></el-icon>
          </el-button>

          <el-button
            class="小边距"
            @click="fn渲染更新组件(账号.用户名)"
            type="primary"
            size="small"
          >
            修改&nbsp;
            <el-icon><Edit /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>

  <el-dialog v-model="ref_显示示例" title="配置示例" align-center append-to-body class="示例弹窗">
    <template #header="{ titleId, titleClass }">
      <div :id="titleId" :class="titleClass" style="display: flex; justify-content: space-between">
        示例内容
        <el-button @click="fn剪切板写入(const_示例.独立账号('用户名'))" :icon="CopyDocument" />
      </div>
    </template>
    <pre>{{ const_示例.独立账号("用户名") }}</pre>
  </el-dialog>

  <el-dialog
    v-model="ref_渲染删除弹窗"
    :title="`确定要删除用户 ${ref_选中用户名} 吗？`"
    align-center
    append-to-body
    class="不换行"
  >
    <div style="display: flex; flex-direction: column; align-items: center">
      <div>用户被删除后如果还在使用会无法登录！</div>

      <el-button @click="fn删除" type="danger"> 确定删除 </el-button>
    </div>
  </el-dialog>

  <Vue_添加账号 v-if="ref_渲染添加组件" v-model="ref_渲染添加组件" />
  <Vue_更新账号 v-if="ref_渲染更新组件" v-model="ref_渲染更新组件" :用户名="ref_选中用户名" />
</template>

<style scoped>
.账号-总览 {
  .卡片容器 .卡片 {
    .用户名 {
      display: flex;
      gap: var(--间距);
      align-items: center;
    }
    .信息,
    .操作 {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .备注 {
      font-size: 0.8rem;
    }
  }
}
</style>
