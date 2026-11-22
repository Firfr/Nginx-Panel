<script setup lang="ts">
import { parseCertificatePem } from "micro509";
import { computed, reactive, ref } from "vue";
import { fn发送请求 } from "../../../工具/请求";
import { const_菜单列表对象, ref_选中菜单 } from "../../../全局共享数据";
import { fn获取菜单文件列表 } from "../../../工具/其他工具";

const ref_渲染本组件 = defineModel<boolean>();
const 参数 = withDefaults(
  defineProps<{
    证书文件名: string;
  }>(),
  {
    证书文件名: "",
  },
);

const ref_显示组件 = ref(true);
const fn组件关闭后 = () => {
  ref_渲染本组件.value = false;
};

const 表单 = reactive({
  证书链: "",
  私钥: "",
});

const fn获取证书内容 = async () => {
  if (ref_选中菜单.value?.名称 !== "证书" || !参数.证书文件名) {
    ElMessage.warning("请选择 证书 分类 中的具体证书");
    return;
  }
  const 请求结果 = await fn发送请求<{
    证书: string;
    私钥: string;
  }>("get", `${const_菜单列表对象.证书.路径}/file/${参数.证书文件名}`);

  if (!请求结果.状态) {
    ref_显示组件.value = false;
    return;
  }

  表单.证书链 = 请求结果.内容.证书;
  表单.私钥 = 请求结果.内容.私钥;
};
fn获取证书内容();

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
        ElMessage.error(错误);
        return;
      }

      表单.证书链 = 内容;
      ElMessage.success("证书链读取成功");
    } catch {
      ElMessage.error("文件读取失败");
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
        ElMessage.error(错误);
        return;
      }

      表单.私钥 = 内容;
      ElMessage.success("私钥读取成功");
    } catch {
      ElMessage.error("文件读取失败");
    }
  };

  输入框.click();
};

const cmp_证书域名列表 = computed<string[]>(() => {
  if (!表单.证书链 || !表单.私钥) return [];

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

const cmp_证书检测结果 = computed<{ 状态: boolean; 信息: string }>(() => {
  if (!表单.证书链 && !表单.私钥) return { 状态: false, 信息: "证书链 / 私钥 未添加！" };
  if (!表单.证书链) return { 状态: false, 信息: "证书链未添加！" };
  if (!表单.私钥) return { 状态: false, 信息: "私钥未添加！" };

  const 证书错误 = fn检测证书链(表单.证书链);
  if (证书错误) return { 状态: false, 信息: 证书错误 };

  const 私钥错误 = fn检测私钥(表单.私钥);
  if (私钥错误) return { 状态: false, 信息: 私钥错误 };

  if (!cmp_证书域名列表.value.includes(参数.证书文件名.replace(/_/g, "*"))) {
    return { 状态: false, 信息: `上传的不是 ${参数.证书文件名.replace(/_/g, "*")} 的证书！` };
  }

  return { 状态: true, 信息: "证书链与私钥匹配。" };
});

const fn更新 = async () => {
  if (ref_选中菜单.value?.名称 !== "证书") {
    ElMessage.warning("请选择 证书 分类");
    return;
  }

  if (!表单.证书链) {
    ElMessage.warning("请选择 证书链");
    return;
  }
  if (!表单.私钥) {
    ElMessage.warning("请选择 私钥");
    return;
  }
  if (!cmp_证书检测结果.value.信息) {
    ElMessage.warning(cmp_证书检测结果.value.信息);
    return;
  }

  const 上传结果 = await fn发送请求<string>(
    "put",
    `${const_菜单列表对象.证书.路径}/file/${参数.证书文件名}`,
    {
      证书: 表单.证书链,
      私钥: 表单.私钥,
    },
  );

  if (!上传结果.状态) {
    ref_显示组件.value = false;
    return;
  }

  ElMessage.success(`证书 [${参数.证书文件名}] 更新成功`);

  fn获取菜单文件列表(ref_选中菜单.value, true);

  ref_显示组件.value = false;
};
</script>

<template>
  <el-dialog
    v-model="ref_显示组件"
    :title="`更新证书 ${证书文件名}`"
    @closed="fn组件关闭后"
    align-center
    append-to-body
    class="弹窗"
  >
    <div class="内容居中">
      {{ cmp_证书检测结果.信息 }}
    </div>

    <hr />
    <div class="内容左右贴边">
      证书链 (fullchain.pem)
      <el-button type="primary" size="small" @click="fn上传证书链">上传</el-button>
    </div>

    <el-input
      v-model="表单.证书链"
      :rows="4"
      type="textarea"
      clearable
      placeholder="请输入或上传证书链！"
    />

    <hr />
    <div class="内容左右贴边">
      私钥 (privkey.pem)
      <el-button type="primary" size="small" @click="fn上传私钥">上传</el-button>
    </div>
    <el-input
      v-model="表单.私钥"
      :rows="4"
      type="textarea"
      clearable
      placeholder="请输入或上传私钥！"
    />

    <hr />
    <div class="内容居中">
      <el-button @click="ref_显示组件 = false">取消</el-button>
      <el-button type="primary" :disabled="!cmp_证书检测结果.状态" @click="fn更新">
        确定
      </el-button>
    </div>
  </el-dialog>
</template>
