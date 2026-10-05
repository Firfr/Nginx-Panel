<script setup lang="ts">
import { computed, ref } from "vue";
import { Delete } from "@element-plus/icons-vue";
import { ref_选中文件, ref_选中菜单 } from "../../../工具/全局共享数据";

const 事件 = defineEmits<{
  删除: [];
}>();

const ref_显示确定确认弹窗 = ref(false);
const fn删除 = () => {
  ref_显示确定确认弹窗.value = false;
  事件("删除");
};
</script>

<template>
  <el-button
    :disabled="!ref_选中文件"
    type="danger"
    plain
    @click="ref_显示确定确认弹窗 = true"
    :icon="Delete"
    size="small"
    style="margin-right: 20px"
  />

  <el-dialog
    v-model="ref_显示确定确认弹窗"
    :title="`确定要删除 ${ref_选中菜单?.名称}【${ref_选中文件}】吗？`"
    width="400px"
    align-center
    append-to-body
  >
    <template #footer>
      <el-button @click="ref_显示确定确认弹窗 = false">取消</el-button>
      <el-button type="danger" @click="fn删除">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
/* 样式 */
</style>
