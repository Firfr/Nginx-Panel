<script setup lang="ts">
import { reactive, ref } from "vue";
import { ref_选中文件, ref_选中菜单 } from "../../../工具/全局共享数据";
import type { FormInstance } from "element-plus";
import { fn获取配置后缀, rul_文件名规则 } from "../../../工具/其他工具";

const 事件 = defineEmits<{
  重命名: [新文件名: string];
}>();

const ref_显示弹窗 = ref(false);
const ref_表单引用 = ref<FormInstance>();
const 表单 = reactive({
  文件名: "",
});

const fn显示弹窗 = () => {
  表单.文件名 = ref_选中文件.value.replace(/\.conf\.no$|\.conf$|\.txt$/, "");
  ref_显示弹窗.value = true;
};

const fn文件重命名 = async () => {
  if (!ref_表单引用.value) return;

  try {
    await ref_表单引用.value.validate();

    ref_显示弹窗.value = false;

    事件("重命名", `${表单.文件名}${fn获取配置后缀(ref_选中文件.value)}`);
  } catch (校验失败详情) {
    // console.log("校验失败!", 校验失败详情);
  }
};
</script>

<template>
  <el-button :disabled="!ref_选中文件" type="primary" plain @click="fn显示弹窗" size="small"
    >重命名
  </el-button>

  <el-dialog
    v-model="ref_显示弹窗"
    :title="`重命名配置【${ref_选中文件}】`"
    width="400px"
    align-center
    append-to-body
  >
    <div style="display: flex; justify-content: center; margin-bottom: 10px">
      <el-tag> 这里只设置文件名，不改变后缀。 </el-tag>
    </div>

    <el-form
      :model="表单"
      :rules="rul_文件名规则"
      ref="ref_表单引用"
      @submit.prevent="fn文件重命名"
    >
      <el-form-item prop="文件名" label="文件名">
        <el-input v-model="表单.文件名" placeholder="请输入文件名">
          <template #append> {{ fn获取配置后缀(ref_选中文件) }} </template>
        </el-input>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="ref_显示弹窗 = false">取消</el-button>
      <el-button type="primary" @click="fn文件重命名">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
/* 样式 */
</style>
