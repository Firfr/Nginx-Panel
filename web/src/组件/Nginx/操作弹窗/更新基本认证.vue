<script setup lang="ts">
import { reactive, ref } from "vue";
import { fn生成随机字符串, fn获取菜单文件列表, rul_文件名规则 } from "../../../工具/其他工具";
import type { FormInstance } from "element-plus";
import { const_菜单列表对象, ref_选中菜单 } from "../../../全局共享数据";
import { fn发送请求 } from "../../../工具/请求";
import { generateApr1 } from "@se-oss/apr1";

const ref_渲染本组件 = defineModel<boolean>();
const 参数 = withDefaults(
  defineProps<{
    文件名: string;
  }>(),
  {
    文件名: "",
  },
);

const ref_显示组件 = ref(true);
const ref_表单引用 = ref<FormInstance>();
const fn组件关闭后 = () => {
  ref_渲染本组件.value = false;
};

const 表单 = reactive({
  用户名: "",
  密码: "",
});

const fn获取账号 = async () => {
  if (ref_选中菜单.value?.名称 !== "基本认证" || !参数.文件名) {
    ElMessage.warning("请选择 基本认证 分类 中的具体文件！");
    return;
  }

  const 请求结果 = await fn发送请求<string>(
    "get",
    `${const_菜单列表对象.基本认证.路径}/file/${参数.文件名}`,
  );

  if (!请求结果.状态) {
    ref_显示组件.value = false;
    return;
  }

  const 首行 = 请求结果.内容.split("\n")[0];
  const 有效内容 = 首行.startsWith("# ") ? 首行.slice(2).trim() : 首行.trim();

  const 冒号位置 = 有效内容.indexOf(":");
  if (冒号位置 === -1) {
    ElMessage.warning(`服务端格式错误，直接重置`);
    表单.用户名 = 参数.文件名.replace(/\.txt$/, "");
    return;
  }

  const 用户名 = 有效内容.slice(0, 冒号位置);
  const 密码 = 有效内容.slice(冒号位置 + 1);

  if (用户名 !== 参数.文件名.replace(/\.txt$/, "")) {
    ElMessage.warning(`服务端格式错误，用户名不存在，直接重置`);
    表单.用户名 = 参数.文件名.replace(/\.txt$/, "");
    return;
  }
  表单.用户名 = 参数.文件名.replace(/\.txt$/, "");
  if (!密码) {
    ElMessage.warning(`服务端格式错误，密码不存在，直接重置`);
    return;
  }

  表单.密码 = 密码;
};
fn获取账号();

const fn生成htpasswd = (用户名: string, 密码: string) => {
  if (!用户名 || !密码) {
    throw new Error("用户名和密码不能为空");
  }
  if (用户名.includes(":")) {
    throw new Error("用户名不能包含冒号");
  }

  const hash = generateApr1(密码);
  return `# ${用户名}:${密码}\n${用户名}:${hash}\n`;
};

const fn更新 = async () => {
  if (!ref_表单引用.value) return;

  try {
    await ref_表单引用.value.validate();
    let 文件内容 = "";

    try {
      文件内容 = fn生成htpasswd(表单.用户名, 表单.密码);
    } catch (e) {
      ElMessage.error(`账号转 apr1 出错：${e instanceof Error ? e.message : String(e)}`);
      return;
    }

    const 请求结果 = await fn发送请求(
      "put",
      `${const_菜单列表对象.基本认证.路径}/file/${表单.用户名}.txt`,
      文件内容,
    );
    if (!请求结果.状态) return;

    ElMessage.success(`账号 ${表单.用户名} 更新成功`);

    fn获取菜单文件列表(ref_选中菜单.value!, true);

    ref_显示组件.value = false;
  } catch (校验失败详情) {
    // console.log("校验失败!", 校验失败详情);
  }
};
</script>

<template>
  <el-dialog
    v-model="ref_显示组件"
    :title="`更新基本认证 ${文件名}`"
    @closed="fn组件关闭后"
    align-center
    append-to-body
    class="弹窗"
  >
    <div
      style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: var(--间距);
      "
    >
      <el-tag> 每个文件，只存储一个账号 </el-tag>
      <el-tag> 这里只能修改密码，账号是去掉后缀的文件名。 </el-tag>
      <el-tag> 要修改账号，直接删除文件并重建！ </el-tag>
    </div>

    <el-form
      :model="表单"
      :rules="rul_文件名规则"
      ref="ref_表单引用"
      label-width="auto"
      @submit.prevent="fn更新"
    >
      <el-form-item label="用户名">
        <el-input v-model="表单.用户名" placeholder="请输入用户名" disabled />
      </el-form-item>
      <el-form-item prop="密码" label="密码">
        <div style="display: flex; gap: 8px; width: 100%">
          <el-input v-model="表单.密码" placeholder="请输入密码" clearable />
          <el-button @click="表单.密码 = fn生成随机字符串(8, 20)">随机</el-button>
        </div>
      </el-form-item>
    </el-form>

    <div class="内容居中">
      <el-button @click="ref_显示组件 = false">取消</el-button>
      <el-button type="primary" @click="fn更新">确定</el-button>
    </div>
  </el-dialog>
</template>
