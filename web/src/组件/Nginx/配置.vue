<script setup lang="ts">
import { ref } from "vue";
import { const_菜单列表对象, ref_选中文件, ref_选中菜单 } from "../../全局共享数据";
import { fn发送请求 } from "../../工具/请求";
import { Refresh } from "@element-plus/icons-vue";
import Vue_编辑器 from "../编辑器.vue";
import { fn鼠标滚轮横向滚动 } from "../../工具/其他工具.ts";

const ref_编辑 = ref(false);
const ref_初次打开 = ref(true);
const ref_文件内容 = ref("");

const fn获取文件内容 = async (刷新 = false) => {
  if (!ref_选中菜单.value || !ref_选中文件.value) {
    ElMessage.error(`未选择文件！`);
    return;
  }

  const 请求结果 = await fn发送请求(
    "get",
    `${const_菜单列表对象.配置.路径}/file/${ref_选中文件.value}`,
  );

  if (!请求结果.状态) return;

  ref_文件内容.value = 请求结果.内容;

  if (刷新) {
    ElMessage.success(`${ref_选中文件.value} 刷新成功！`);
  }
};

const fn格式化 = async () => {
  if (!ref_文件内容.value) {
    ElMessage.warning(`内容为空，无需格式化！`);
    return;
  }

  const 请求结果 = await fn发送请求<string>("post", `formatter`, ref_文件内容.value);

  if (!请求结果.状态) return { 状态: false, 信息: "格式化失败！" };

  ElMessage.success(`${ref_选中文件.value} 格式化成功，保存并重载后生效！`);
  return (ref_文件内容.value = 请求结果.内容);
};

const fn保存 = async () => {
  if (!ref_选中菜单.value || !ref_选中文件.value) return;

  const 请求结果 = await fn发送请求(
    "put",
    `${const_菜单列表对象.配置.路径}/file/${ref_选中文件.value}`,
    ref_文件内容.value,
  );
  if (!请求结果.状态) return;

  ElMessage.success(`${ref_选中文件.value} 保存成功，需重载后生效！`);

  fn获取文件内容(true);
};

const fn默认值 = async () => {
  if (!ref_选中菜单.value) {
    ElMessage.warning(`未选中文件！`);
    return;
  }

  const 请求结果 = fn发送请求(
    "post",
    `${const_菜单列表对象.配置.路径}/reset/${ref_选中文件.value}`,
  );

  if (!(await 请求结果).状态) return;

  ElMessage.success(`【${ref_选中文件.value}】已切换为默认值，需重载后生效！`);

  // fn获取文件内容();
};
</script>

<template>
  <div class="转发 分类内容">
    <div class="标题" @wheel="fn鼠标滚轮横向滚动">
      <div>
        <el-radio-group
          v-model="ref_选中文件"
          @change="fn获取文件内容()"
          size="small"
          class="小边距"
          style="flex-direction: row; flex-wrap: nowrap"
        >
          <el-radio-button label="nginx.conf" value="nginx.conf" />
          <el-radio-button label="mime.types" value="mime.types" />
        </el-radio-group>

        <el-button-group
          style="height: 24px; display: flex; flex-direction: row; flex-wrap: nowrap"
        >
          <el-button
            :disabled="ref_选中文件 === '' || !ref_编辑"
            :type="!ref_编辑 ? 'success' : 'primary'"
            plain
            @click="ref_编辑 = false"
            size="small"
            >查看
          </el-button>

          <el-button
            :disabled="!(ref_选中文件 && !ref_编辑)"
            :type="ref_编辑 ? 'success' : 'primary'"
            plain
            @click="
              ref_编辑 = true;
              ref_初次打开 = false;
            "
            size="small"
            >编辑
          </el-button>

          <el-button
            :disabled="ref_选中文件 === ''"
            type="primary"
            plain
            @click="fn格式化"
            size="small"
            >格式化
          </el-button>

          <el-button :disabled="ref_初次打开" type="primary" plain @click="fn保存" size="small"
            >保存
          </el-button>

          <el-button
            :disabled="ref_选中文件 === ''"
            type="primary"
            plain
            @click="fn获取文件内容(true)"
            size="small"
            :icon="Refresh"
          />

          <el-tooltip effect="dark" placement="top" content="主配置文件，谨慎修改，防止出意外！">
            <el-tag>说明</el-tag>
          </el-tooltip>
        </el-button-group>

        <el-button
          :disabled="ref_选中文件 === ''"
          type="primary"
          plain
          @click="fn默认值"
          size="small"
          style="margin-left: 10px; height: 24px"
          >默认值
        </el-button>
      </div>
    </div>

    <div style="flex: 1; overflow: hidden">
      <Vue_编辑器 v-if="ref_选中文件" v-model:是否编辑="ref_编辑" v-model:文件内容="ref_文件内容" />
      <div v-else style="display: flex; justify-content: center">
        <el-tag size="large" type="warning">未选择文件！</el-tag>
      </div>
    </div>
  </div>
</template>
