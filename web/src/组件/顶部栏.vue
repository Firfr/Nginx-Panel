<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { fn发送请求 } from "../工具/请求";
import { fn鼠标滚轮横向滚动 } from "../工具/其他工具";

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
    ElMessage.error(`启动失败: ${请求结果.信息 || "-"}`);
    return;
  }

  ElMessage.success("启动成功");
};

const fn停止Nginx = async () => {
  const 请求结果 = await fn发送请求("get", "/nginx/stop");

  if (!请求结果.状态) return;

  ElMessage.success(请求结果.内容.信息);
};

const fn重启Nginx = async () => {
  const 请求结果 = await fn发送请求("get", "/nginx/restart");

  if (!请求结果.状态) return;

  if (请求结果.内容?.状态) {
    ElMessage.success("重启成功");
    return;
  }

  ElMessage.error("重启失败");
};

const fn重载Nginx = async () => {
  const 请求结果 = await fn发送请求("get", "/nginx/reload");

  if (!请求结果.状态) return;

  if (请求结果.内容?.状态) {
    ElMessage.success("重载成功");
    return;
  }

  ElMessage.error("重载失败");
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
  <div
    id="id_顶部栏"
    style="
      overflow-x: scroll;
      margin-bottom: var(--间距);
      padding: 0 var(--间距);
      height: var(--顶部栏-高度);

      display: flex;
      gap: var(--间距);
      align-items: center;
    "
    @wheel="fn鼠标滚轮横向滚动"
  >
    <div style="margin: auto; display: flex; gap: var(--间距); align-items: center">
      <el-tag size="large">Nginx 管理器</el-tag>
      <el-tag size="large">Nginx 版本：{{ ref_Nginx版本 }}</el-tag>
      <el-tag size="large" :type="ref_Nginx运行状态 === '运行中' ? 'success' : 'danger'">
        {{ ref_Nginx运行状态 }}
      </el-tag>
      <div style="width: 10px"></div>
      <el-button
        :type="ref_Nginx运行状态 === '运行中' ? 'danger' : 'success'"
        @click="ref_Nginx运行状态 === '运行中' ? fn停止Nginx() : fn启动Nginx()"
        plain
      >
        {{ ref_Nginx运行状态 === "运行中" ? "停止" : "启动" }}
      </el-button>
      <el-button class="无间距" type="warning" @click="fn重启Nginx()" plain>重启</el-button>
      <el-button class="无间距" type="success" @click="fn重载Nginx()" plain>重载</el-button>
    </div>
  </div>
</template>
