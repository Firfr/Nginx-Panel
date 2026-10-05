<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { parseCertificatePem, unwrap } from "micro509";
import { ref_选中文件, ref_选中菜单 } from "../../工具/全局共享数据.ts";
import { fn发送请求 } from "../../工具/请求.ts";
import { Refresh } from "@element-plus/icons-vue";
import { fn获取菜单文件列表 } from "../../工具/其他工具.ts";
import Vue_分类提示 from "./分类提示.vue";
import Vue_编辑器 from "./编辑器.vue";
import Vue_删除 from "./操作按钮/删除.vue";
import Vue_创建证书 from "./操作按钮/创建证书.vue";
import Vue_更新证书 from "./操作按钮/更新证书.vue";

const ref_编辑 = ref(false);
const ref_初次打开 = ref(true);
const rea_证书内容 = reactive({ 证书链: "", 私钥: "" });

const fn格式化日期 = (日期: Date | string | undefined): string => {
  if (!日期) return "-";
  const 日期对象 = 日期 instanceof Date ? 日期 : new Date(日期);
  if (isNaN(日期对象.getTime())) return "-";
  const 年 = 日期对象.getFullYear();
  const 月 = String(日期对象.getMonth() + 1).padStart(2, "0");
  const 日 = String(日期对象.getDate()).padStart(2, "0");
  return `${年}-${月}-${日}`;
};

const fn查找叶子证书 = (证书链: string): string | null => {
  const 证书列表 =
    证书链?.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? [];

  for (const 单张 of 证书列表) {
    const 解析结果 = parseCertificatePem(单张);
    if (解析结果.ok && 解析结果.value.basicConstraints?.ca === false) {
      return 单张;
    }
  }

  return null;
};
const cmp_证书信息 = computed(() => {
  let 返回值 = {
    签发机构: "-",
    生效时间: "-",
    到期时间: "-",
    域名: "-",
  };

  const 叶子证书Pem = fn查找叶子证书(rea_证书内容.证书链);
  if (!叶子证书Pem) {
    return 返回值;
  }

  const 解析结果 = parseCertificatePem(叶子证书Pem);

  if (!解析结果.ok) {
    return 返回值;
  }

  const 证书 = 解析结果.value;

  const 签发者信息 = 证书.issuer?.values ?? {};
  返回值.签发机构 = 签发者信息.organization || 签发者信息.commonName || "-";

  返回值.生效时间 = fn格式化日期(证书.notBefore);

  const 到期日期 = 证书.notAfter;
  if (到期日期) {
    const 到期对象 = 到期日期 instanceof Date ? 到期日期 : new Date(到期日期);
    if (!isNaN(到期对象.getTime())) {
      const 剩余天数 = Math.ceil((到期对象.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const 天数文案 = 剩余天数 >= 0 ? `还有 ${剩余天数} 天` : `已过期 ${-剩余天数} 天`;
      返回值.到期时间 = `${fn格式化日期(到期对象)} (${天数文案})`;
    }
  }

  const 域名列表 = (证书.subjectAltNames ?? [])
    .filter((项) => 项.type === "dns" || 项.type === "ip")
    .map((项) => 项.value);

  返回值.域名 = 域名列表.length > 0 ? 域名列表.join(" ") : "-";

  return 返回值;
});

const fn获取文件内容 = async (刷新 = false) => {
  // console.log(`证书.vue ${ref_选中菜单.value?.名称} ${ref_选中文件.value} fn获取文件内容 ${刷新}`);
  if (ref_选中菜单.value?.名称 !== "证书" || !ref_选中文件.value) return;

  const 请求结果 = await fn发送请求("get", `${ref_选中菜单.value.路径}/file/${ref_选中文件.value}`);

  if (!请求结果.状态) return;

  rea_证书内容.证书链 = 请求结果.内容.证书;
  rea_证书内容.私钥 = 请求结果.内容.私钥;

  if (刷新) {
    ElMessage.success({
      message: `【${ref_选中文件.value}】刷新成功！`,
      grouping: true,
      placement: "bottom-right",
      duration: 5000,
    });
  }
};
const fn删除 = async () => {
  if (ref_选中菜单.value?.名称 !== "证书" || !ref_选中文件.value) return;

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
const fn创建 = async (文件名: string, 证书链: string, 私钥: string) => {
  if (ref_选中菜单.value?.名称 !== "证书") return;

  const 请求结果 = await fn发送请求("put", `${ref_选中菜单.value.路径}/file/${文件名}`, {
    证书: 证书链,
    私钥: 私钥,
  });

  if (!请求结果.状态) return;

  ElMessage.success({
    message: `${文件名} 创建成功！`,
    grouping: true,
    placement: "bottom-right",
    duration: 5000,
  });

  ref_选中文件.value = 文件名;

  fn获取菜单文件列表(ref_选中菜单.value, true);
};
const fn保存 = async () => {
  if (ref_选中菜单.value?.名称 !== "证书" || !ref_选中文件.value) return;
};

watch(
  [ref_选中菜单, ref_选中文件],
  async () => {
    // console.log(`基础.vue ${ref_选中菜单.value?.名称} 数据发生变化！`);
    ref_编辑.value = false;
    ref_初次打开.value = true;
    rea_证书内容.证书链 = "";
    rea_证书内容.私钥 = "";
    await fn获取文件内容();
  },
  { deep: true },
);
</script>

<template>
  <div class="操作方式">
    <Vue_删除 @删除="fn删除" />
    <el-button-group style="height: 24px">
      <Vue_创建证书 @创建="fn创建" />
      <Vue_更新证书 @重命名="fn创建" />
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
  </div>

  <Vue_分类提示 />

  <div class="证书信息">
    <el-tag type="success">域名: {{ cmp_证书信息.域名 }}</el-tag>
    <el-tag type="success">到期时间: {{ cmp_证书信息.到期时间 }}</el-tag>
    <el-tag type="success">签发机构: {{ cmp_证书信息.签发机构 }}</el-tag>
  </div>

  <div v-if="ref_选中文件" class="证书展示">
    <div>
      <div class="证书操作">
        <el-tag size="large">证书链</el-tag>
      </div>
      <div class="证书内容">
        <Vue_编辑器
          v-if="ref_选中文件"
          v-model:是否编辑="ref_编辑"
          v-model:文件内容="rea_证书内容.证书链"
        />
      </div>
    </div>
    <div>
      <div class="证书操作" style="margin-top: var(--间距)">
        <el-tag size="large">私钥</el-tag>
      </div>
      <div class="证书内容">
        <Vue_编辑器
          v-if="ref_选中文件"
          v-model:是否编辑="ref_编辑"
          v-model:文件内容="rea_证书内容.私钥"
        />
      </div>
    </div>
  </div>
  <div v-else style="display: flex; justify-content: center">
    <el-tag size="large" type="warning">未选择文件！</el-tag>
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

.证书信息 {
  height: 40px;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--间距);
}

.证书展示 {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  & > * {
    width: 100%;
    height: 50%;
    min-height: 0;
    max-height: 50%;

    display: flex;
    flex-direction: column;

    --提示高度: 40px;

    .证书操作 {
      width: 100%;
      height: var(--提示高度);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--间距);
    }
    .证书内容 {
      width: 100%;
      height: calc(100% - var(--提示高度));
    }
  }
}
</style>
