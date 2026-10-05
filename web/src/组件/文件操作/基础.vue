<script setup lang="ts">
import { ref, watch } from "vue";
import { ref_选中菜单, ref_选中文件 } from "../../工具/全局共享数据.ts";
import { fn发送请求 } from "../../工具/请求.ts";
import { fn获取菜单文件列表 } from "../../工具/其他工具.ts";
import Vue_分类提示 from "./分类提示.vue";
import Vue_编辑器 from "./编辑器.vue";
import Vue_删除 from "./操作按钮/删除.vue";
import Vue_创建配置 from "./操作按钮/创建配置.vue";
import Vue_创建账号 from "./操作按钮/创建账号.vue";
import Vue_重命名 from "./操作按钮/重命名.vue";
import Vue_编辑账号 from "./操作按钮/编辑账号.vue";
import { Refresh } from "@element-plus/icons-vue";

const ref_编辑 = ref(false);
const ref_初次打开 = ref(true);
const ref_文件内容 = ref("");

const fn获取文件内容 = async (刷新 = false) => {
  // console.log(`基础.vue ${ref_选中菜单.value?.名称} ${ref_选中文件.value} fn获取文件内容 ${刷新}`);
  if (!ref_选中菜单.value || !ref_选中文件.value) {
    // ElMessage.error({
    //   message: `未选择文件！`,
    //   grouping: true,
    //   placement: "bottom-right",
    //   duration: 5000,
    // });
    return;
  }

  const 请求结果 = await fn发送请求("get", `${ref_选中菜单.value.路径}/file/${ref_选中文件.value}`);

  if (!请求结果.状态) return;

  ref_文件内容.value = 请求结果.内容;

  if (刷新) {
    ElMessage.success({
      message: `【${ref_选中文件.value}】刷新成功！`,
      grouping: true,
      placement: "bottom-right",
      duration: 5000,
    });
  }
};
const fn格式化 = async () => {
  // console.log(`基础.vue ${ref_选中菜单.value?.名称} ${ref_选中文件.value} fn格式化`);
  if (!ref_文件内容.value) {
    ElMessage.warning({
      message: `${ref_选中文件.value} 内容为空，无需格式化！`,
      grouping: true,
      placement: "bottom-right",
      duration: 5000,
    });
    return;
  }

  const 请求结果 = await fn发送请求("post", `formatter`, ref_文件内容.value);

  if (!请求结果.状态) return;

  ref_文件内容.value = 请求结果.内容;
  ref_初次打开.value = false;

  ElMessage.success({
    message: `${ref_选中文件.value} 格式化成功，需重载后生效！`,
    grouping: true,
    placement: "bottom-right",
    duration: 5000,
  });
};
const fn保存 = async () => {
  // console.log(`基础.vue ${ref_选中菜单.value?.名称} ${ref_选中文件.value} fn保存`);
  if (!ref_选中菜单.value || !ref_选中文件.value) return;

  const 请求结果 = await fn发送请求(
    "put",
    `${ref_选中菜单.value.路径}/file/${ref_选中文件.value}`,
    ref_文件内容.value,
  );
  if (!请求结果.状态) return;

  ElMessage.success({
    message: `${ref_选中文件.value} 保存成功，需重载后生效！`,
    grouping: true,
    placement: "bottom-right",
    duration: 5000,
  });

  fn获取文件内容(true);
};
const fn默认值 = async () => {
  // console.log(`基础.vue ${ref_选中菜单.value?.名称} ${ref_选中文件.value} fn默认值`);
  if (ref_选中菜单.value?.名称 !== "配置" || !ref_选中文件.value) {
    ElMessage.warning({
      message: `未选中文件！`,
      grouping: true,
      placement: "bottom-right",
      duration: 5000,
    });
    return;
  }

  const 请求结果 = fn发送请求("post", `${ref_选中菜单.value.路径}/reset/${ref_选中文件.value}`);

  if (!(await 请求结果).状态) return;

  ElMessage.success({
    message: `【${ref_选中文件.value}】已切换为默认值，需重载后生效！`,
    grouping: true,
    placement: "bottom-right",
    duration: 5000,
  });

  fn获取文件内容();
};
const fn删除 = async () => {
  // console.log(`基础.vue ${ref_选中菜单.value?.名称} ${ref_选中文件.value} fn删除`);
  if (!ref_选中菜单.value || !ref_选中文件.value) return;

  const 请求结果 = await fn发送请求(
    "delete",
    `${ref_选中菜单.value.路径}/file/${ref_选中文件.value}`,
  );
  if (!请求结果.状态) return;

  ElMessage.success({
    message: `${ref_选中文件.value} 删除成功，需重载后生效！`,
    grouping: true,
    placement: "bottom-right",
    duration: 5000,
  });

  ref_选中文件.value = "";

  fn获取菜单文件列表(ref_选中菜单.value, true);
};

const fn创建 = async (文件名: string) => {
  // console.log(`基础.vue ${ref_选中菜单.value?.名称} ${ref_选中文件.value} fn创建 ${文件名}`);
  if (!ref_选中菜单.value) return;

  const 请求结果 = await fn发送请求(
    "put",
    `${ref_选中菜单.value.路径}/file/${文件名}`,
    `# ${文件名}\n`,
  );
  if (!请求结果.状态) return;

  ElMessage.success({
    message: `${ref_选中文件.value} 创建成功，需重载后生效！`,
    grouping: true,
    placement: "bottom-right",
    duration: 5000,
  });

  ref_选中文件.value = 文件名;

  fn获取菜单文件列表(ref_选中菜单.value, true);
};
const fn创建账号 = async (文件名: string, 文件内容: string) => {
  // console.log(`基础.vue ${ref_选中菜单.value?.名称} ${ref_选中文件.value} fn创建账号 ${文件名} ${文件内容}`);
  if (ref_选中菜单.value?.名称 !== "基本认证") return;

  const 请求结果 = await fn发送请求("put", `${ref_选中菜单.value.路径}/file/${文件名}`, 文件内容);
  if (!请求结果.状态) return;

  ElMessage.success({
    message: `账号 ${ref_选中文件.value} 创建成功`,
    grouping: true,
    placement: "bottom-right",
    duration: 5000,
  });

  ref_选中文件.value = 文件名;

  fn获取菜单文件列表(ref_选中菜单.value, true);
};
const fn重命名 = async (新文件名: string) => {
  // console.log(`基础.vue ${ref_选中菜单.value?.名称} ${ref_选中文件.value} fn重命名 ${新文件名}`);
  if (!ref_选中菜单.value || !ref_选中文件.value) return;

  if (ref_选中菜单.value.名称 === "配置" || ref_选中菜单.value.名称 === "静态资源") {
    ElMessage.error({
      message: `${ref_选中菜单.value.名称} 配置不支持重命名！`,
      grouping: true,
      placement: "bottom-right",
      duration: 5000,
    });
    return;
  }

  const 请求结果 = await fn发送请求(
    "patch",
    `${ref_选中菜单.value.路径}/file/${ref_选中文件.value}/${新文件名}`,
  );

  if (!请求结果.状态) return;

  ElMessage.success({
    message: `${ref_选中文件.value} 已重命名为 ${新文件名}，需重载后生效！`,
    grouping: true,
    placement: "bottom-right",
    duration: 5000,
  });

  ref_选中文件.value = 新文件名;

  fn获取菜单文件列表(ref_选中菜单.value);
};
const ref_配置状态 = ref(ref_选中文件.value.endsWith(".conf.no") ? "禁用" : "启用");
const fn状态切换 = async () => {
  // console.log(
  //   `基础.vue ${ref_选中菜单.value?.名称} ${ref_选中文件.value} fn状态切换 ${ref_配置状态.value}`,
  // );
  if (!ref_选中菜单.value || ref_选中菜单.value?.名称 === "配置" || !ref_选中文件.value) return;

  let 新文件名 = "";
  if (ref_配置状态.value === "启用" && ref_选中文件.value.endsWith(".conf.no")) {
    新文件名 = ref_选中文件.value.replace(/\.no$/, "");
  } else if (ref_配置状态.value === "禁用" && ref_选中文件.value.endsWith(".conf")) {
    新文件名 = `${ref_选中文件.value}.no`;
  } else {
    ElMessage.error({
      message: `【${ref_选中文件.value}】无法切换为【${ref_配置状态.value}】`,
      placement: "bottom-right",
      duration: 5000,
    });
    return;
  }

  const 请求结果 = await fn发送请求(
    "patch",
    `${ref_选中菜单.value.路径}/file/${ref_选中文件.value}/${新文件名}`,
  );

  if (!请求结果.状态) return;

  ElMessage.success({
    message: `${ref_选中文件.value} 已 ${ref_配置状态.value}，需重载后生效！`,
    grouping: true,
    placement: "bottom-right",
    duration: 5000,
  });

  ref_选中文件.value = 新文件名;

  fn获取菜单文件列表(ref_选中菜单.value);
};

watch(
  [ref_选中菜单, ref_选中文件],
  async () => {
    // console.log(`基础.vue ${ref_选中菜单.value?.名称} 数据发生变化！`);
    ref_编辑.value = false;
    ref_初次打开.value = true;
    await fn获取文件内容();
  },
  { deep: true },
);
</script>

<template>
  <div class="操作方式">
    <Vue_删除 v-if="ref_选中菜单?.名称 !== '配置' && ref_选中菜单" @删除="fn删除" />
    <el-button-group style="height: 24px">
      <Vue_创建配置
        v-if="ref_选中菜单?.名称 === 'conf.d' || ref_选中菜单?.名称 === 'stream'"
        @创建="fn创建"
      />
      <Vue_创建账号 v-if="ref_选中菜单?.名称 === '基本认证'" @创建="fn创建账号" />
      <Vue_重命名
        v-if="ref_选中菜单?.名称 !== '配置' && ref_选中菜单?.名称 !== '基本认证'"
        @重命名="fn重命名"
      />
      <el-button
        :disabled="ref_选中文件 === '' || !ref_编辑"
        :type="!ref_编辑 ? 'success' : 'primary'"
        plain
        @click="ref_编辑 = false"
        size="small"
        >查看
      </el-button>
      <Vue_编辑账号
        v-if="ref_选中菜单?.名称 === '基本认证'"
        v-model:初次打开="ref_初次打开"
        v-model:编辑="ref_编辑"
        v-model:文件内容="ref_文件内容"
        @编辑="fn保存"
      />
      <el-button
        v-else
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
        v-if="ref_选中菜单?.名称 !== '基本认证'"
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
    </el-button-group>
    <el-button
      v-if="ref_选中菜单?.名称 === '配置'"
      :disabled="ref_选中文件 === ''"
      type="primary"
      plain
      @click="fn默认值"
      size="small"
      style="margin-left: 20px; height: 24px"
      >默认值
    </el-button>
    <el-segmented
      v-if="ref_选中菜单?.名称 === 'conf.d' || ref_选中菜单?.名称 === 'stream'"
      :disabled="ref_选中文件 === ''"
      v-model="ref_配置状态"
      :options="['启用', '禁用']"
      size="small"
      @change="fn状态切换"
      style="margin-left: 20px; height: 24px"
    />
  </div>
  <Vue_分类提示 />
  <div style="flex: 1; overflow: hidden">
    <Vue_编辑器 v-if="ref_选中文件" v-model:是否编辑="ref_编辑" v-model:文件内容="ref_文件内容" />
    <div v-else style="display: flex; justify-content: center">
      <el-tag size="large" type="warning">未选择文件！</el-tag>
    </div>
  </div>
</template>

<style scoped>
.操作方式 {
  height: 40px;
  display: flex;
  justify-content: center;
  white-space: nowrap;
  margin-bottom: var(--间距);
  & > div {
    white-space: nowrap;
    display: inline;
  }
}
</style>
