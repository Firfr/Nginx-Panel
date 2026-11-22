<script setup lang="ts">
import { ref, watch } from "vue";
import {
  cmp_基本认证列表,
  cmp_证书列表,
  const_示例,
  ref_账号总览,
  ref_选中文件,
  ref_选中菜单,
} from "../../全局共享数据.ts";
import Vue_删除 from "./操作按钮/删除.vue";
import Vue_创建转发 from "./操作按钮/创建转发.vue";
import Vue_重命名 from "./操作按钮/重命名.vue";
import Vue_文件列表 from "./文件列表.vue";
import Vue_编辑器 from "../编辑器.vue";
import { fn发送请求 } from "../../工具/请求.ts";
import { fn获取菜单文件列表, fn获取账号总览列表, fn鼠标滚轮横向滚动 } from "../../工具/其他工具.ts";
import { CopyDocument, Refresh } from "@element-plus/icons-vue";

const ref_编辑 = ref(false);
const ref_初次打开 = ref(true);
const ref_文件内容 = ref("");
const ref_配置状态 = ref(ref_选中文件.value.endsWith(".conf.no") ? "禁用" : "启用");
const ref_选中证书名称 = ref("");
const ref_选中基本认证名称 = ref("");
const ref_选中独立账号用户名 = ref("");
const ref_显示示例 = ref(false);
const ref_示例文本 = ref("");

if (!ref_账号总览.value) fn获取账号总览列表();

const fn获取文件内容 = async (刷新 = false) => {
  if (!ref_选中菜单.value || !ref_选中文件.value) {
    // ElMessage.error(`未选择文件！`);
    console.debug("未选择文件！");
    return;
  }

  const 请求结果 = await fn发送请求("get", `${ref_选中菜单.value.路径}/file/${ref_选中文件.value}`);

  if (!请求结果.状态) return;

  ref_文件内容.value = 请求结果.内容;

  if (刷新) {
    ElMessage.success(`${ref_选中文件.value} 刷新成功！`);
  }
};

const fn删除 = async () => {
  if (!ref_选中菜单.value || !ref_选中文件.value) return;

  const 请求结果 = await fn发送请求(
    "delete",
    `${ref_选中菜单.value.路径}/file/${ref_选中文件.value}`,
  );
  if (!请求结果.状态) return;

  ElMessage.success(`${ref_选中文件.value} 删除成功，需重载后生效！`);

  ref_选中文件.value = "";

  fn获取菜单文件列表(ref_选中菜单.value, true);
};

const fn创建 = async (文件名: string) => {
  if (!ref_选中菜单.value) return;

  const 请求结果 = await fn发送请求(
    "put",
    `${ref_选中菜单.value.路径}/file/${文件名}`,
    `# ${文件名}\n`,
  );
  if (!请求结果.状态) return;

  ElMessage.success(`${ref_选中文件.value} 创建成功，需重载后生效！`);

  ref_选中文件.value = 文件名;

  fn获取菜单文件列表(ref_选中菜单.value, true);
};

const fn重命名 = async (新文件名: string) => {
  if (!ref_选中菜单.value || !ref_选中文件.value) return;

  if (ref_选中菜单.value.名称 === "配置" || ref_选中菜单.value.名称 === "静态资源") {
    ElMessage.error(`${ref_选中菜单.value.名称} 配置不支持重命名！`);
    return;
  }

  const 请求结果 = await fn发送请求(
    "patch",
    `${ref_选中菜单.value.路径}/file/${ref_选中文件.value}/${新文件名}`,
  );

  if (!请求结果.状态) return;

  ElMessage.success(`${ref_选中文件.value} 已重命名为 ${新文件名}，需重载后生效！`);

  ref_选中文件.value = 新文件名;

  fn获取菜单文件列表(ref_选中菜单.value);
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
    `${ref_选中菜单.value.路径}/file/${ref_选中文件.value}`,
    ref_文件内容.value,
  );
  if (!请求结果.状态) return;

  ElMessage.success(`${ref_选中文件.value} 保存成功，需重载后生效！`);

  fn获取文件内容(true);
};

const fn状态切换 = async () => {
  if (!ref_选中菜单.value || !ref_选中文件.value) return;

  let 新文件名 = "";
  if (ref_配置状态.value === "启用" && ref_选中文件.value.endsWith(".conf.no")) {
    新文件名 = ref_选中文件.value.replace(/\.no$/, "");
  } else if (ref_配置状态.value === "禁用" && ref_选中文件.value.endsWith(".conf")) {
    新文件名 = `${ref_选中文件.value}.no`;
  } else {
    ElMessage.error(`【${ref_选中文件.value}】无法切换为【${ref_配置状态.value}】`);
    return;
  }

  const 请求结果 = await fn发送请求(
    "patch",
    `${ref_选中菜单.value.路径}/file/${ref_选中文件.value}/${新文件名}`,
  );

  if (!请求结果.状态) return;

  ElMessage.success(`${ref_选中文件.value} 已 ${ref_配置状态.value}，需重载后生效！`);

  ref_选中文件.value = 新文件名;

  fn获取菜单文件列表(ref_选中菜单.value);
};

const fn显示示例 = (类型: "静态" | "转发" | "独立账号" | "证书" | "基本认证" | "TCP" | "UDP") => {
  switch (类型) {
    case "静态":
      ref_示例文本.value = const_示例.静态;
      ref_显示示例.value = true;
      break;
    case "转发":
      ref_示例文本.value = const_示例.转发;
      ref_显示示例.value = true;
      break;
    case "独立账号":
      if (!ref_选中独立账号用户名.value) {
        ElMessage.warning("请先选择要使用的独立账号！");
        return;
      }
      ref_示例文本.value = const_示例.独立账号(ref_选中独立账号用户名.value);
      ref_显示示例.value = true;
      break;
    case "证书":
      if (!ref_选中证书名称.value) {
        ElMessage.warning("请先选择要使用的证书！");
        return;
      }
      ref_示例文本.value = const_示例.证书(ref_选中证书名称.value);
      ref_显示示例.value = true;
      break;
    case "基本认证":
      if (!ref_选中基本认证名称.value) {
        ElMessage.warning("请先选择要使用的基本认证！");
        return;
      }
      ref_示例文本.value = const_示例.基本认证(ref_选中基本认证名称.value);
      ref_显示示例.value = true;
      break;
    case "TCP":
      ref_示例文本.value = const_示例.TCP;
      ref_显示示例.value = true;
      break;
    case "UDP":
      ref_示例文本.value = const_示例.UDP;
      ref_显示示例.value = true;
      break;

    default:
      break;
  }
};

watch([() => ref_选中菜单.value?.名称, () => ref_选中文件.value], async () => {
  ref_编辑.value = false;
  ref_初次打开.value = true;
  ref_配置状态.value = ref_选中文件.value.endsWith(".conf.no") ? "禁用" : "启用";
  await fn获取文件内容();
});
</script>

<template>
  <div class="转发 分类内容">
    <div class="标题" @wheel="fn鼠标滚轮横向滚动">
      <div>
        <Vue_删除 @删除="fn删除" />

        <el-button-group
          style="height: 24px; display: flex; flex-direction: row; flex-wrap: nowrap"
        >
          <Vue_创建转发 @创建="fn创建" />

          <Vue_重命名 @重命名="fn重命名" />

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

          <el-tooltip effect="dark" placement="top">
            <el-tag>说明</el-tag>
            <template #content>
              <template v-if="ref_选中菜单?.名称 === 'conf.d'">
                HTTP / HTTPS 端口转发配置！<br />
                所有文件位于目录 /data/conf.d 目录下，位置固定！ <br />
                文件后缀 .conf 为正常文件，后缀为 .conf.no 的为禁用文件。 <br />
                新创建或重命名的文件名在去除后缀后不可重复！
              </template>
              <template v-else>
                TCP / UDP 端口转发配置！<br />
                所有文件位于目录 /data/stream 目录下，位置固定！ <br />
                文件后缀 .conf 为正常文件，后缀为 .conf.no 的为禁用文件。 <br />
                新创建或重命名的文件名在去除后缀后不可重复！
              </template>
            </template>
          </el-tooltip>
        </el-button-group>

        <el-segmented
          :disabled="ref_选中文件 === ''"
          v-model="ref_配置状态"
          :options="['启用', '禁用']"
          size="small"
          @change="fn状态切换"
          style="margin-left: 20px; height: 24px"
        />
      </div>
    </div>

    <div class="文件">
      <Vue_文件列表 />

      <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column">
        <div class="示例" @wheel="fn鼠标滚轮横向滚动">
          <div v-if="ref_选中菜单?.名称 === 'conf.d'">
            <el-button class="小边距" @click="fn显示示例('静态')">静态示例</el-button>
            <el-button class="小边距 无间距" @click="fn显示示例('转发')">转发示例</el-button>

            <el-select
              v-model="ref_选中独立账号用户名"
              placeholder="请选择独立账号！"
              style="width: 200px"
            >
              <template #prefix>
                <el-button @click.stop="fn显示示例('独立账号')" style="display: contents">
                  独立账号
                </el-button>
              </template>
              <el-option
                v-for="账号 in ref_账号总览 || []"
                :key="账号.用户名"
                :label="`${账号.用户名}${账号.TOTP ? ' • TOTP' : ''}${账号.备注 ? ' • ' + 账号.备注 : ''}`"
                :value="账号.用户名"
              />
            </el-select>

            <el-select v-model="ref_选中证书名称" placeholder="请选择证书！" style="width: 200px">
              <template #prefix>
                <el-button @click.stop="fn显示示例('证书')" style="display: contents">
                  证书示例
                </el-button>
              </template>
              <el-option
                v-for="证书 in cmp_证书列表"
                :key="证书.文件名称"
                :label="证书.文件名称"
                :value="证书.文件名称"
              />
            </el-select>

            <el-select
              v-model="ref_选中基本认证名称"
              placeholder="请选择基本认证！"
              style="width: 200px"
            >
              <template #prefix>
                <el-button @click.stop="fn显示示例('基本认证')" style="display: contents">
                  基本认证
                </el-button>
              </template>
              <el-option
                v-for="基本认证 in cmp_基本认证列表"
                :key="基本认证"
                :label="基本认证.replace(/\.txt$/, '')"
                :value="基本认证"
              />
            </el-select>
          </div>

          <div v-else>
            <el-button class="小边距" @click="fn显示示例('TCP')">TCP</el-button>
            <el-button class="小边距 无间距" @click="fn显示示例('UDP')">UDP</el-button>
          </div>
        </div>

        <div style="flex: 1; overflow: hidden">
          <Vue_编辑器
            v-if="ref_选中文件"
            v-model:是否编辑="ref_编辑"
            v-model:文件内容="ref_文件内容"
          />
          <div v-else style="flex: 1; display: flex; justify-content: center">
            <el-tag size="large" type="warning">未选择文件！</el-tag>
          </div>
        </div>
      </div>
    </div>
  </div>

  <el-dialog v-model="ref_显示示例" title="配置" align-center append-to-body class="示例弹窗">
    <template #header="{ titleId, titleClass }">
      <div :id="titleId" :class="titleClass" style="display: flex; justify-content: space-between">
        示例内容
        <el-button @click="fn剪切板写入(ref_示例文本)" :icon="CopyDocument" />
      </div>
    </template>
    <pre>{{ ref_示例文本 }}</pre>
  </el-dialog>
</template>

<style scoped>
.转发 {
  .文件 {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .示例 {
    overflow-x: scroll;
    overflow-y: hidden;

    padding: 0 10px;
    display: flex;
    gap: var(--间距);
    align-items: center;

    & > div {
      margin: auto;
      padding-bottom: var(--间距);
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      gap: var(--间距);
    }
  }
}
</style>
