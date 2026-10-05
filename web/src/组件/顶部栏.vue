<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { fn发送请求 } from "../工具/请求";

const ref_Nginx版本 = ref("");
const ref_Nginx运行状态 = ref("待获取");

const fn获取版本号 = async () => {
  const 请求结果 = await fn发送请求("get", "/nginx/version");
  if (请求结果.状态) {
    ref_Nginx版本.value = 请求结果.内容;
    return 请求结果.内容;
  }
  ref_Nginx版本.value = "-";
  return "-";
};
fn获取版本号();

const fn获取运行状态 = async () => {
  const 请求结果 = await fn发送请求("get", "/nginx/status");
  if (!请求结果.状态) {
    ref_Nginx运行状态.value = "获取失败";
    return "获取失败";
  }

  if (请求结果.内容?.状态) {
    ref_Nginx运行状态.value = "运行中";
    return "运行中";
  }

  ref_Nginx运行状态.value = "已停止";
  return "已停止";
};

const fn启动Nginx = async () => {
  const 请求结果 = await fn发送请求("get", "/nginx/start");

  if (!请求结果.状态) return;

  if (!请求结果.内容?.状态) {
    ElMessage.error({
      message: `启动失败: ${请求结果.信息 || "-"}`,
      placement: "bottom-right",
      duration: 5000,
    });
    return;
  }

  ElMessage.success({
    message: "启动成功",
    placement: "bottom-right",
    duration: 5000,
  });
};

const fn停止Nginx = async () => {
  const 请求结果 = await fn发送请求("get", "/nginx/stop");

  if (!请求结果.状态) return;

  if (请求结果.内容?.状态) {
    ElMessage.error({
      message: "停止失败",
      placement: "bottom-right",
      duration: 5000,
    });
    return;
  }

  ElMessage.success({
    message: "停止成功",
    placement: "bottom-right",
    duration: 5000,
  });
};

const fn重启Nginx = async () => {
  const 请求结果 = await fn发送请求("get", "/nginx/restart");

  if (!请求结果.状态) return;

  if (请求结果.内容?.状态) {
    ElMessage.success({
      message: "重启成功",
      placement: "bottom-right",
      duration: 5000,
    });
    return;
  }

  ElMessage.error({
    message: "重启失败",
    placement: "bottom-right",
    duration: 5000,
  });
};

const fn重载Nginx = async () => {
  const 请求结果 = await fn发送请求("get", "/nginx/reload");

  if (!请求结果.状态) return;

  if (请求结果.内容?.状态) {
    ElMessage.success({
      message: "重载成功",
      placement: "bottom-right",
      duration: 5000,
    });
    return;
  }

  ElMessage.error({
    message: "重载失败",
    placement: "bottom-right",
    duration: 5000,
  });
};

let 定时器ID: number | null = null;
onMounted(() => {
  fn获取运行状态();
  const 间隔 = import.meta.env.DEV ? 5000 : 1000;
  // 开启定时器
  定时器ID = setInterval(fn获取运行状态, 间隔);
});
onUnmounted(() => {
  // 销毁组件清除定时器
  if (定时器ID) {
    clearInterval(定时器ID);
    定时器ID = null;
  }
});
</script>

<template>
  <div id="id_顶部栏">
    <el-tag size="large">Nginx 管理器</el-tag>
    <el-tag size="large">Nginx 版本：{{ ref_Nginx版本 }}</el-tag>
    <el-tag size="large" :type="ref_Nginx运行状态 === '运行中' ? 'success' : 'danger'">
      {{ ref_Nginx运行状态 }}
    </el-tag>

    <el-button
      :type="ref_Nginx运行状态 === '运行中' ? 'danger' : 'success'"
      @click="ref_Nginx运行状态 === '运行中' ? fn停止Nginx() : fn启动Nginx()"
      plain
    >
      {{ ref_Nginx运行状态 === "运行中" ? "停止" : "启动" }}
    </el-button>
    <el-button type="warning" @click="fn重启Nginx()" plain>重启</el-button>
    <el-button type="success" @click="fn重载Nginx()" plain>重载</el-button>
  </div>
</template>

<style scoped>
#id_顶部栏 {
  width: 100%;
  height: var(--顶部栏-高度);
  margin-bottom: var(--间距);

  display: flex;
  align-items: center;
  justify-content: center;

  & > :not(:first-child) {
    margin-left: calc(var(--间距) * 2);
  }
}
</style>
