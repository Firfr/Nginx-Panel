<script setup lang="ts">
import { DocumentAdd } from "@element-plus/icons-vue";
import { parseCertificatePem } from "micro509";
import { computed, reactive, ref } from "vue";
import { cmp_当前文件列表 } from "../../../工具/全局共享数据";

const 事件 = defineEmits<{
  创建: [文件名: string, 证书链: string, 私钥: string];
}>();

const ref_显示弹窗 = ref(false);
const ref_选中域名 = ref("");
const 表单 = reactive({
  证书链: "",
  私钥: "",
  目录名: "",
});

const fn显示弹窗 = () => {
  表单.证书链 = "";
  表单.私钥 = "";
  表单.目录名 = "";
  ref_选中域名.value = "";
  ref_显示弹窗.value = true;
};

const fn提取证书列表 = (内容: string): string[] =>
  内容?.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? [];

const fn提取私钥列表 = (内容: string): string[] =>
  内容?.match(
    /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g,
  ) ?? [];

/** 检测证书链，返回 null 表示通过，否则返回错误原因 */
const fn检测证书链 = (内容: string): string | null => {
  const 证书列表 = fn提取证书列表(内容);
  if (证书列表.length === 0) return "证书链文件中没有一个证书！";

  const 错误下标 = 证书列表.findIndex((单张) => !parseCertificatePem(单张).ok);
  if (错误下标 !== -1) {
    return `证书链文件中第 ${错误下标 + 1} 个证书格式错误`;
  }

  return null;
};

/** 检测私钥，返回 null 表示通过，否则返回错误原因 */
const fn检测私钥 = (内容: string): string | null => {
  const 私钥列表 = fn提取私钥列表(内容);
  if (私钥列表.length !== 1) return "私钥内容不符合私钥格式";
  return null;
};

const fn上传证书链 = () => {
  const 输入框 = document.createElement("input");
  输入框.type = "file";
  输入框.accept = ".pem,.crt,.cer,.txt";

  输入框.onchange = async () => {
    const 文件 = 输入框.files?.[0];
    if (!文件) return;

    try {
      const 内容 = await 文件.text();

      const 错误 = fn检测证书链(内容);
      if (错误) {
        ElMessage.error({
          message: 错误,
          grouping: true,
          placement: "bottom-right",
          duration: 5000,
        });
        return;
      }

      表单.证书链 = 内容;
      ElMessage.success({
        message: "证书链读取成功",
        grouping: true,
        placement: "bottom-right",
        duration: 5000,
      });
    } catch {
      ElMessage.error({
        message: "文件读取失败",
        grouping: true,
        placement: "bottom-right",
        duration: 5000,
      });
    }
  };

  输入框.click();
};

const fn上传私钥 = () => {
  const 输入框 = document.createElement("input");
  输入框.type = "file";
  输入框.accept = ".pem,.key,.txt";

  输入框.onchange = async () => {
    const 文件 = 输入框.files?.[0];
    if (!文件) return;

    try {
      const 内容 = await 文件.text();

      const 错误 = fn检测私钥(内容);
      if (错误) {
        ElMessage.error({
          message: 错误,
          grouping: true,
          placement: "bottom-right",
          duration: 5000,
        });
        return;
      }

      表单.私钥 = 内容;
      ElMessage.success({
        message: "私钥读取成功",
        grouping: true,
        placement: "bottom-right",
        duration: 5000,
      });
    } catch {
      ElMessage.error({
        message: "文件读取失败",
        grouping: true,
        placement: "bottom-right",
        duration: 5000,
      });
    }
  };

  输入框.click();
};

const cmp_证书检测结果 = computed<{ 状态: boolean; 信息: string }>(() => {
  if (!表单.证书链 && !表单.私钥) return { 状态: false, 信息: "证书链 / 私钥 未添加！" };
  if (!表单.证书链) return { 状态: false, 信息: "证书链未添加！" };
  if (!表单.私钥) return { 状态: false, 信息: "私钥未添加！" };

  const 证书错误 = fn检测证书链(表单.证书链);
  if (证书错误) return { 状态: false, 信息: 证书错误 };

  const 私钥错误 = fn检测私钥(表单.私钥);
  if (私钥错误) return { 状态: false, 信息: 私钥错误 };

  return { 状态: true, 信息: "证书链与私钥匹配。" };
});

const cmp_证书域名列表 = computed<string[]>(() => {
  // 直接复用检测结果，未通过就不解析
  if (!cmp_证书检测结果.value.状态) return [];

  const 证书列表 = fn提取证书列表(表单.证书链);

  // 找 ca === false 的叶子证书，不依赖位置
  const 叶子证书Pem = 证书列表.find((单张) => {
    const 解析结果 = parseCertificatePem(单张);
    // return 解析结果.ok && 解析结果.value.basicConstraints?.ca === false;
    return 解析结果.ok && (解析结果.value.subjectAltNames ?? []).length > 0;
  });

  if (!叶子证书Pem) return [];

  const 解析结果 = parseCertificatePem(叶子证书Pem);
  if (!解析结果.ok) return [];

  // const 域名列表 = (解析结果.value.subjectAltNames ?? [])
  //   .filter((项) => 项.type === "dns")
  //   .map((项) => 项.value);

  // 同时提取 dns 和 ip
  const 域名列表 = (解析结果.value.subjectAltNames ?? [])
    .filter((项) => 项.type === "dns" || 项.type === "ip")
    .map((项) => 项.value);

  return [...new Set(域名列表)];
});

const fn选择域名 = (值: string) => {
  表单.目录名 = 值.replace(/\*/g, "_");
};

const fn确定创建证书 = async () => {
  if (cmp_当前文件列表.value.includes(表单.目录名)) {
    ElMessage.error({
      message: `证书 ${表单.目录名} 已存在！`,
      grouping: true,
      placement: "bottom-right",
      duration: 5000,
    });
    return;
  }

  事件("创建", 表单.目录名, 表单.证书链, 表单.私钥);
  ref_显示弹窗.value = false;
};
</script>

<template>
  <el-button type="primary" plain @click="fn显示弹窗" :icon="DocumentAdd" size="small" />

  <el-dialog v-model="ref_显示弹窗" title="创建证书" width="400px" align-center append-to-body>
    <div v-if="cmp_证书检测结果.状态" style="display: flex; align-items: center; gap: var(--间距)">
      <el-tag style="width: 200px">{{ 表单.目录名 }}</el-tag>
      <el-select
        v-model="ref_选中域名"
        placeholder="请选择域名作为文件名！"
        clearable
        :disabled="cmp_证书域名列表.length === 0"
        @change="fn选择域名"
      >
        <el-option v-for="域名 in cmp_证书域名列表" :key="域名" :label="域名" :value="域名" />
      </el-select>
    </div>
    <div v-else style="display: flex; justify-content: center">
      {{ cmp_证书检测结果.信息 }}
    </div>

    <div style="margin: var(--间距) 0">
      <div style="margin-bottom: var(--间距)">
        证书链 (fullchain.pem)
        <el-button size="small" @click="fn上传证书链">上传</el-button>
      </div>
      <el-input
        v-model="表单.证书链"
        style="width: 100%"
        :rows="4"
        type="textarea"
        clearable
        placeholder="请输入或上传证书链！"
      />
    </div>

    <div>
      <div style="margin-bottom: var(--间距)">
        私钥 (privkey.pem)
        <el-button size="small" @click="fn上传私钥">上传</el-button>
      </div>
      <el-input
        v-model="表单.私钥"
        style="width: 100%"
        :rows="4"
        type="textarea"
        clearable
        placeholder="请输入或上传私钥！"
      />
    </div>

    <template #footer>
      <el-button @click="ref_显示弹窗 = false">取消</el-button>
      <el-button
        type="primary"
        :disabled="!cmp_证书检测结果.状态 || !表单.目录名"
        @click="fn确定创建证书"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
/* 样式 */
</style>
