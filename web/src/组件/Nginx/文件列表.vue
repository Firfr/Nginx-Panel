<script setup lang="ts">
import { ref_选中菜单, cmp_当前文件列表, ref_选中文件 } from "../../全局共享数据";
import { fn获取菜单文件列表 } from "../../工具/其他工具";
</script>

<template>
  <div id="id_文件列表">
    <div class="提示" v-if="!ref_选中菜单">
      <el-tag>未选择分类</el-tag>
    </div>
    <template v-else>
      <div class="刷新" v-if="ref_选中菜单.名称 !== '配置'">
        <el-button type="primary" plain @click="fn获取菜单文件列表(ref_选中菜单, true)">
          刷新列表
        </el-button>
      </div>

      <div class="提示" v-if="cmp_当前文件列表.length === 0">
        <el-tag>列表为空</el-tag>
      </div>
      <div class="列表内容">
        <div
          class="菜单"
          v-for="文件 in cmp_当前文件列表"
          :class="{ 选中: ref_选中文件 === 文件 }"
          @click="ref_选中文件 = 文件"
        >
          {{ 文件 }}
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
#id_文件列表 {
  width: var(--文件列表-宽度);
  min-width: var(--文件列表-宽度);
  border-right: var(--分割栏-颜色) solid 1px;

  display: flex;
  flex-direction: column;

  .提示 {
    margin-top: var(--间距);
    height: 30px;
    width: 100%;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .刷新 {
    width: 100%;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .列表内容 {
    flex: 1;
    overflow: auto;
  }

  .菜单 {
    height: 56px;
    width: 100%;
    padding-left: var(--间距);

    display: flex;
    align-items: center;
    color: rgb(229, 234, 243);
    font-size: 14px;

    transition:
      background-color 0.3s ease,
      color 0.3s ease;

    &:hover {
      background-color: rgb(24, 34, 43);
    }
  }
  .选中 {
    color: rgb(64, 158, 255);
  }
}
</style>
