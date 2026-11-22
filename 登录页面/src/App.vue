<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElForm, ElFormItem, ElInput, ElInputOtp, ElButton, ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";

interface t_成功返回<T = any> {
  状态: true;
  信息?: string;
  内容: T;
}
interface 失败返回 {
  状态: false;
  信息: string;
}
type t_返回<T = any> = t_成功返回<T> | 失败返回;

const ref_表单引用 = ref<FormInstance>();
const 有验证码 = (window as any).有验证码 === true ? true : false;
const rea_表单 = reactive({
  用户名: "",
  密码: "",
  验证码内容: "",
});

const rul_规则: FormRules<typeof ref_表单引用> = {
  用户名: [
    { required: true, message: "不能为空！", trigger: "blur" },
    { whitespace: true, message: "不能输入纯空格", trigger: "blur" },
    { min: 1, max: 20, message: "长度为 3 到 20 个字符", trigger: "blur" },
    {
      pattern: /[\u4e00-\u9fa5a-zA-Z0-9_!@#.-]+/,
      message: "仅允许常见简体中文、英文字母、数字以及 _!@#.-",
      trigger: "blur",
    },
  ],
  密码: [
    { required: true, message: "不能为空！", trigger: "blur" },
    { whitespace: true, message: "不能输入纯空格", trigger: "blur" },
    { min: 3, max: 32, message: "长度为 3 到 20 个字符", trigger: "blur" },
    {
      pattern: /[a-zA-Z0-9_!@#.-]+/,
      message: "仅允许英文字母、数字以及 _!@#.-",
      trigger: "blur",
    },
  ],
  验证码内容: [
    { required: true, message: "不能为空！", trigger: "blur" },
    { whitespace: true, message: "不能输入纯空格", trigger: "blur" },
    {
      pattern: /\d+/,
      message: "仅允许数字",
      trigger: "blur",
    },
  ],
};

const fn生成盐 = (长度 = 16) => {
  const buf = new Uint8Array(长度);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const fn字符串哈希256 = (待哈希文本: string): t_返回<string> => {
  if (typeof 待哈希文本 !== "string") {
    return { 状态: false, 信息: "待哈希文本必须是字符串！" };
  }

  if (!待哈希文本) {
    return { 状态: false, 信息: "待哈希文本不能为空！" };
  }

  // 32 位整数循环右移
  const 右旋转 = (值: number, 位移量: number): number => {
    return (值 >>> 位移量) | (值 << (32 - 位移量)) | 0;
  };

  // 初始化 SHA-256 常量
  const 初始哈希值: number[] = [];
  const 轮常量表: number[] = [];
  const 合数标记表: Record<number, number> = {};
  let 素数计数器 = 0;

  for (let 候选数 = 2; 素数计数器 < 64; 候选数++) {
    if (!合数标记表[候选数]) {
      for (let 标记索引 = 0; 标记索引 < 313; 标记索引 += 候选数) {
        合数标记表[标记索引] = 候选数;
      }

      if (素数计数器 < 8) {
        初始哈希值[素数计数器] = (Math.pow(候选数, 0.5) * 0x100000000) | 0;
      }

      轮常量表[素数计数器++] = (Math.pow(候选数, 1 / 3) * 0x100000000) | 0;
    }
  }

  // 字符串先按 UTF-8 转成字节数组
  const 字节数组: number[] = Array.from(new TextEncoder().encode(待哈希文本));

  const 原始位长: number = 字节数组.length * 8;

  // 消息填充
  const 填充字节: number[] = 字节数组.slice();
  填充字节.push(0x80);

  while (填充字节.length % 64 !== 56) {
    填充字节.push(0);
  }

  const 高位: number = Math.floor(原始位长 / 0x100000000);
  const 低位: number = 原始位长 >>> 0;

  填充字节.push(
    (高位 >>> 24) & 0xff,
    (高位 >>> 16) & 0xff,
    (高位 >>> 8) & 0xff,
    高位 & 0xff,
    (低位 >>> 24) & 0xff,
    (低位 >>> 16) & 0xff,
    (低位 >>> 8) & 0xff,
    低位 & 0xff,
  );

  let 哈希工作值: number[] = 初始哈希值.slice(0, 8);

  // 每 64 字节一个块
  for (let 块起始 = 0; 块起始 < 填充字节.length; 块起始 += 64) {
    const 当前块字: number[] = [];

    for (let i = 0; i < 16; i++) {
      const j = 块起始 + i * 4;

      当前块字[i] =
        (填充字节[j] << 24) |
        (填充字节[j + 1] << 16) |
        (填充字节[j + 2] << 8) |
        填充字节[j + 3] |
        0;
    }

    for (let i = 16; i < 64; i++) {
      const 字减十五: number = 当前块字[i - 15];
      const 字减二: number = 当前块字[i - 2];

      const s0: number = 右旋转(字减十五, 7) ^ 右旋转(字减十五, 18) ^ (字减十五 >>> 3);

      const s1: number = 右旋转(字减二, 17) ^ 右旋转(字减二, 19) ^ (字减二 >>> 10);

      当前块字[i] = (当前块字[i - 16] + s0 + 当前块字[i - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, h] = 哈希工作值;

    for (let i = 0; i < 64; i++) {
      const S1: number = 右旋转(e, 6) ^ 右旋转(e, 11) ^ 右旋转(e, 25);

      const ch: number = (e & f) ^ (~e & g);

      const temp1: number = (h + S1 + ch + 轮常量表[i] + 当前块字[i]) | 0;

      const S0: number = 右旋转(a, 2) ^ 右旋转(a, 13) ^ 右旋转(a, 22);

      const maj: number = (a & b) ^ (a & c) ^ (b & c);

      const temp2: number = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    哈希工作值 = [
      (哈希工作值[0] + a) | 0,
      (哈希工作值[1] + b) | 0,
      (哈希工作值[2] + c) | 0,
      (哈希工作值[3] + d) | 0,
      (哈希工作值[4] + e) | 0,
      (哈希工作值[5] + f) | 0,
      (哈希工作值[6] + g) | 0,
      (哈希工作值[7] + h) | 0,
    ];
  }

  let 十六进制结果: string = "";

  for (let i = 0; i < 8; i++) {
    for (let 字节偏移 = 3; 字节偏移 >= 0; 字节偏移--) {
      const 字节值: number = (哈希工作值[i] >> (字节偏移 * 8)) & 255;

      十六进制结果 += (字节值 < 16 ? "0" : "") + 字节值.toString(16);
    }
  }

  return { 状态: true, 内容: 十六进制结果 };
};

const fn登录 = async () => {
  if (!ref_表单引用.value) return;

  try {
    await ref_表单引用.value.validate();

    const 盐 = fn生成盐();
    let 请求体: any = {
      盐: 盐,
      用户名: rea_表单.用户名,
    };
    const 密码加盐 = fn字符串哈希256(`${rea_表单.用户名}:${rea_表单.密码}:${盐}`);
    if (!密码加盐.状态) {
      ElMessage.error(`哈希计算出错!`);
      console.error("哈希计算出错", 密码加盐.信息);
      return;
    }
    请求体.密码 = 密码加盐.内容;
    if (有验证码) {
      请求体.验证码 = rea_表单.验证码内容;
    }
    try {
      const 响应 = await fetch(window.location.href, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify(请求体),
      });

      const 响应数据 = await 响应.json();

      if (!响应.ok) throw new Error(`登录错误: ${响应.status} ${响应数据.信息 || ""}`);
      if (!响应数据.状态) throw new Error(响应数据.信息);

      location.replace("../");
    } catch (e) {
      let 信息 = e instanceof Error ? e.message : String(e ?? "未知错误！");

      if (信息.includes("Unexpected end of JSON input")) {
        console.error("JSON 解析失败，服务器返回内容可能为空或格式错误", "原始错误:", e);
        信息 = "登录失败，服务端错误!";
      }

      ElMessage.error(信息);
      return;
    }
  } catch (校验失败详情) {
    // console.log("校验失败!", 校验失败详情);
  }
};
</script>

<template>
  <div id="id_登录">
    <el-form
      :model="rea_表单"
      :rules="rul_规则"
      ref="ref_表单引用"
      label-width="auto"
      @submit.prevent="fn登录"
      class="表单"
    >
      <el-form-item label="用户名" prop="用户名">
        <el-input v-model="rea_表单.用户名" placeholder="请输入用户名" clearable />
      </el-form-item>

      <el-form-item label="密码" prop="密码">
        <el-input v-model="rea_表单.密码" placeholder="请输入密码" clearable />
      </el-form-item>

      <el-form-item v-if="有验证码" label="验证码" prop="验证码内容" class="一行">
        <el-input-otp v-model="rea_表单.验证码内容" @finish="fn登录" />
      </el-form-item>

      <div style="display: flex; justify-content: center">
        <el-button type="success" @click="fn登录"> 添加 </el-button>
      </div>
    </el-form>
  </div>
</template>

<style>
#id_登录 {
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--间距);
  padding: var(--间距);
  max-width: 96%;
  overflow: auto;

  .表单 {
    width: 300px;
    .一行 .el-form-item__content {
      display: flex;
      justify-content: center;
    }
  }
}
</style>
