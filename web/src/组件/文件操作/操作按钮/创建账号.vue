<script setup lang="ts">
import { reactive, ref } from "vue";
import { generateApr1 } from "@se-oss/apr1";
import { DocumentAdd } from "@element-plus/icons-vue";
import type { FormInstance } from "element-plus";
import { fn生成随机字符串, rul_文件名规则 } from "../../../工具/其他工具";

const 事件 = defineEmits<{
  创建: [文件名: string, 文件内容: string];
}>();

const ref_显示弹窗 = ref(false);
const ref_表单引用 = ref<FormInstance>();
const 表单 = reactive({
  用户名: "",
  密码: "",
});

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

const fn显示弹窗 = () => {
  表单.用户名 = "";
  表单.密码 = "";
  ref_显示弹窗.value = true;
};

const fn确定创建文件 = async () => {
  if (!ref_表单引用.value) return;

  try {
    await ref_表单引用.value.validate();
    let 文件内容 = "";

    try {
      文件内容 = fn生成htpasswd(表单.用户名, 表单.密码);
    } catch (e) {
      ElMessage.error({
        message: `账号转 apr1 出错：${e instanceof Error ? e.message : String(e)}`,
        grouping: true,
        placement: "bottom-right",
        duration: 5000,
      });
      return;
    }

    ref_显示弹窗.value = false;

    事件("创建", `${表单.用户名}.txt`, 文件内容);
  } catch (校验失败详情) {
    // console.log("校验失败!", 校验失败详情);
  }
};
</script>

<template>
  <el-button type="primary" plain @click="fn显示弹窗" :icon="DocumentAdd" size="small" />

  <el-dialog v-model="ref_显示弹窗" title="创建账号" width="400px" align-center append-to-body>
    <div style="display: flex; justify-content: center; margin-bottom: 10px">
      <el-tag> 账号创建后会生成同名后缀为 txt 的文件。 </el-tag>
    </div>

    <el-form
      :model="表单"
      :rules="rul_文件名规则"
      ref="ref_表单引用"
      label-width="auto"
      @submit.prevent="fn确定创建文件"
    >
      <el-form-item prop="用户名" label="用户名">
        <div style="display: flex; gap: 8px; width: 100%">
          <el-input v-model="表单.用户名" placeholder="请输入用户名" />
          <el-button @click="表单.用户名 = fn生成随机字符串(4, 10)">随机</el-button>
        </div>
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
      <el-button type="primary" @click="fn确定创建文件">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
/* 样式 */
</style>
