<script setup lang="ts">
import { reactive, ref } from "vue";
import { ref_选中文件 } from "../../../工具/全局共享数据";
import { generateApr1 } from "@se-oss/apr1";
import type { FormInstance } from "element-plus";
import { fn生成随机字符串, rul_文件名规则 } from "../../../工具/其他工具";

const ref_编辑 = defineModel<boolean>("编辑");
const ref_初次打开 = defineModel<boolean>("初次打开");
const ref_文件内容 = defineModel<string>("文件内容");

const 事件 = defineEmits<{
  编辑: [];
}>();

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

const ref_显示弹窗 = ref(false);
const ref_表单引用 = ref<FormInstance>();
const 表单 = reactive({
  用户名: "",
  密码: "",
});

const fn获取原密码 = (文件内容: string) => {
  if (typeof 文件内容 !== "string" || 文件内容 === "") return "";

  try {
    // 取第一行（兼容 \n 和 \r\n）
    const 第一行 = 文件内容.split(/\r?\n/, 1)[0];

    // 匹配 # 用户名:密码
    // 用户名、密码都不允许含空格、冒号、换行，避免误匹配
    const m = 第一行.match(/^#\s*([^\s:]+):([^\s:]+)\s*$/);
    if (!m) return "";

    return m[2];
  } catch {
    return "";
  }
};

const fn显示弹窗 = () => {
  表单.用户名 = ref_选中文件.value.replace(/\.txt$/, "");
  表单.密码 = fn获取原密码(ref_文件内容.value!);

  ref_编辑.value = true;
  ref_初次打开.value = false;
  ref_显示弹窗.value = true;
};

const fn修改密码 = async () => {
  if (!ref_表单引用.value) return;

  try {
    await ref_表单引用.value.validate();
    console.log("修改密码", 表单.用户名, 表单.密码);

    try {
      ref_文件内容.value = fn生成htpasswd(表单.用户名, 表单.密码);
      ref_编辑.value = false;
      ref_显示弹窗.value = false;
      事件("编辑");
    } catch (e) {
      ElMessage.error({
        message: `修改密码出错：${e instanceof Error ? e.message : String(e)}`,
        grouping: true,
        placement: "bottom-right",
        duration: 5000,
      });
    }
  } catch (校验失败详情) {
    // console.log("校验失败!", 校验失败详情);
  }
};

// 脚本
</script>

<template>
  <el-button
    :disabled="!(ref_选中文件 && !ref_编辑)"
    :type="ref_编辑 ? 'success' : 'primary'"
    plain
    @click="fn显示弹窗"
    size="small"
    >编辑
  </el-button>

  <el-dialog v-model="ref_显示弹窗" title="创建账号" width="400px" align-center append-to-body>
    <div
      style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin-bottom: 10px;
      "
    >
      <el-tag style="margin-bottom: 10px"> 每个文件，只存储一个账号 </el-tag>
      <el-tag style="margin-bottom: 10px"> 这里只能修改密码，账号是去掉后缀的文件名。 </el-tag>
      <el-tag> 要修改账号，直接删除文件并重建！ </el-tag>
    </div>

    <el-form
      :model="表单"
      :rules="rul_文件名规则"
      ref="ref_表单引用"
      label-width="auto"
      @submit.prevent="fn修改密码"
    >
      <el-form-item label="用户名">
        <el-input v-model="表单.用户名" placeholder="请输入用户名" disabled />
      </el-form-item>
      <el-form-item prop="密码" label="密码">
        <div style="display: flex; gap: 8px; width: 100%">
          <el-input v-model="表单.密码" placeholder="请输入密码" />
          <el-button @click="表单.密码 = fn生成随机字符串(8, 20)">随机</el-button>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="ref_显示弹窗 = false">取消</el-button>
      <el-button type="primary" @click="fn修改密码">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
/* 样式 */
</style>
