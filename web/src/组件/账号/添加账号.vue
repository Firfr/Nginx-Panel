<script setup lang="ts">
import type { FormInstance } from "element-plus";
import { reactive, ref } from "vue";
import { fn生成随机字符串, fn获取账号总览列表, rul_账号规则 } from "../../工具/其他工具";
import type { t_账号信息, t_账号信息_表单 } from "@公共代码/类型";
import { generateSecret, verify } from "otplib";
import { QRCode } from "qrcode-toolkit-vue";
import { fn发送请求 } from "../../工具/请求";
import { const_菜单列表对象 } from "../../全局共享数据";

const ref_渲染本组件 = defineModel<boolean>();

const ref_显示组件 = ref(true);
const ref_表单引用 = ref<FormInstance>();
const fn组件关闭后 = () => {
  ref_渲染本组件.value = false;
};

const rea_表单 = reactive<t_账号信息_表单>({
  创建时间戳: 0,
  启用: true,
  用户名: "",
  备注: "",
  密码: "",
  登录设备: 1,
  登录天数: 1,
  TOTP: false,
  密钥: "",
  算法: "SHA1",
  位数: 6,
  周期: 30,
});

const rea_TOTP = reactive({
  链接: "",
  输入验证码: "",
  验证状态: false,
});

const fn生成TOTP链接 = () => {
  const 服务商名称 = "秦曱凧";
  const 用户名 = rea_表单.用户名?.trim() || "用户名";
  const 密钥 = rea_表单.密钥?.trim();

  rea_TOTP.输入验证码 = "";
  rea_TOTP.验证状态 = false;

  if (!用户名 || !密钥) {
    rea_TOTP.链接 = "";
    return;
  }

  const 标签段 = `${encodeURIComponent(服务商名称)}:${encodeURIComponent(用户名)}`;
  const 参数 = new URLSearchParams({
    secret: 密钥,
    issuer: 服务商名称,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  rea_TOTP.链接 = `otpauth://totp/${标签段}?${参数.toString()}`;
};

const fn校验验证码 = async () => {
  rea_TOTP.验证状态 = (
    await verify({
      secret: rea_表单.密钥,
      token: rea_TOTP.输入验证码,
      algorithm: rea_表单.算法.toLowerCase() as "sha1",
      digits: rea_表单.位数,
      period: rea_表单.周期,
    })
  ).valid;
};

const fn添加 = async () => {
  if (!ref_表单引用.value) return;

  try {
    await ref_表单引用.value.validate();

    if (rea_表单.TOTP && !rea_TOTP.验证状态) {
      ElMessage.warning("TOTP 待验证！");
      return;
    }

    const 发送数据: t_账号信息 = {
      创建时间戳: 0,
      启用: rea_表单.启用,
      用户名: rea_表单.用户名,
      备注: rea_表单.备注,
      密码: rea_表单.密码,
      登录设备: rea_表单.登录设备,
      登录天数: rea_表单.登录天数,
    };

    if (rea_表单.TOTP) {
      发送数据.TOTP = {
        密钥: rea_表单.密钥,
        算法: "SHA1",
        位数: 6,
        周期: 30,
      };
    }

    const 请求结果 = await fn发送请求("post", `${const_菜单列表对象.账号.路径}/info`, 发送数据);

    if (!请求结果.状态) {
      ref_显示组件.value = false;
      return;
    }

    ElMessage.success(`用户【${rea_表单.用户名}】添加成功`);
    fn获取账号总览列表();
    ref_显示组件.value = false;
  } catch (校验失败详情) {
    // console.log("校验失败!", 校验失败详情);
  }
};
</script>

<template>
  <el-dialog
    v-model="ref_显示组件"
    title="添加账号"
    @closed="fn组件关闭后"
    align-center
    append-to-body
    class="弹窗"
  >
    <el-form
      :model="rea_表单"
      :rules="rul_账号规则"
      ref="ref_表单引用"
      label-width="auto"
      @submit.prevent="fn添加"
      class="表单"
    >
      <el-form-item label="用户名" prop="用户名" class="不换行">
        <el-input v-model="rea_表单.用户名" placeholder="请输入用户名" clearable />
        <el-button @click="rea_表单.用户名 = fn生成随机字符串(4, 10)">随机</el-button>
      </el-form-item>

      <el-form-item
        label="密码"
        prop="密码"
        :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]"
        class="不换行"
      >
        <el-input v-model="rea_表单.密码" placeholder="请输入密码" clearable />
        <el-button @click="rea_表单.密码 = fn生成随机字符串(6, 24)">随机</el-button>
      </el-form-item>

      <el-form-item label="备注" prop="备注">
        <el-input v-model="rea_表单.备注" placeholder="请输入备注" clearable />
      </el-form-item>

      <div style="display: flex; justify-content: space-between; justify-content: space-between">
        <el-form-item label="登录设备" prop="登录设备">
          <el-input-number
            v-model="rea_表单.登录设备"
            :min="1"
            :max="10"
            :precision="0"
            controls-position="right"
            style="width: 120px"
          />
        </el-form-item>

        <el-form-item label="登录天数" prop="登录天数">
          <el-input-number
            v-model="rea_表单.登录天数"
            :min="0.2"
            :max="10"
            :precision="2"
            controls-position="right"
            style="width: 120px"
          />
        </el-form-item>
      </div>

      <div style="display: flex; justify-content: space-between; justify-content: space-between">
        <el-form-item label="启用" prop="启用">
          <el-switch v-model="rea_表单.启用" inline-prompt active-text="是" inactive-text="否" />
        </el-form-item>

        <el-form-item label="TOTP" prop="TOTP">
          <el-switch v-model="rea_表单.TOTP" inline-prompt active-text="是" inactive-text="否" />
        </el-form-item>
      </div>

      <template v-if="rea_表单.TOTP">
        <el-form-item label="密钥" prop="密钥" class="不换行">
          <el-input
            v-model="rea_表单.密钥"
            readonly
            placeholder="请输入 TOTP 密钥"
            class="小边距"
            @click="fn剪切板写入(rea_表单.密钥)"
          />
          <el-button
            @click="
              rea_表单.密钥 = generateSecret();
              fn生成TOTP链接();
            "
            >随机</el-button
          >
        </el-form-item>

        <div v-if="rea_表单.密钥" class="内容居中" style="flex-direction: column">
          <el-tag>请输入 6 位验证码进行验证</el-tag>
          <el-input-otp v-model="rea_TOTP.输入验证码" @finish="fn校验验证码" />
          <el-tag v-if="rea_TOTP.验证状态" type="success">验证通过</el-tag>
          <el-tag v-else type="warning">等待验证</el-tag>
          <QRCode :value="rea_TOTP.链接" />
        </div>
      </template>

      <div class="内容居中" style="margin-top: 20px">
        <el-button type="success" @click="fn添加"> 添加 </el-button>
      </div>
    </el-form>
  </el-dialog>
</template>

<style scoped>
/* 样式 */
</style>
