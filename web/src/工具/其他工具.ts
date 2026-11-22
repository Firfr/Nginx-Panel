import type { FormRules } from "element-plus";
import { cmp_当前文件列表_无后缀, rea_菜单内容数据, ref_账号总览, ref_配置 } from "../全局共享数据";
import type { t_菜单 } from "../类型";
import { fn发送请求 } from "./请求";
import type { t_证书信息, t_账号总览信息, t_配置 } from "@公共代码/类型";

export const fn获取配置后缀 = (文件名: string) => {
  if (!文件名) return "";

  if (文件名.endsWith(".conf.no")) return ".conf.no";

  if (文件名.endsWith(".conf")) return ".conf";

  if (文件名.endsWith(".txt")) return ".txt";

  return "";
};

export const fn获取菜单文件列表 = async (菜单: t_菜单, 刷新: boolean = false) => {
  if (菜单.名称 === "配置") {
    return rea_菜单内容数据.get("配置");
  }

  const 请求结果 = await fn发送请求<(string | t_证书信息)[]>("get", `/${菜单.路径}/file_list`);

  if (!请求结果.状态) return false;

  rea_菜单内容数据.set(菜单.名称, 请求结果.内容);

  if (刷新) {
    ElMessage.primary(`${菜单.名称} 配置列表刷新成功！`);
  } else {
    ElMessage.success(`${菜单.名称} 配置列表获取成功！`);
  }

  return 请求结果.内容;
};

export const fn获取账号总览列表 = async (刷新: boolean = false) => {
  const 请求结果 = await fn发送请求<t_账号总览信息[]>("get", `/user/list`);

  if (!请求结果.状态) return false;

  ref_账号总览.value = 请求结果.内容;

  if (刷新) {
    ElMessage.primary(`账号总览列表刷新成功！`);
  } else {
    ElMessage.success(`账号总览列表获取成功！`);
  }

  return 请求结果.内容;
};

export const fn获取配置 = async () => {
  const 请求结果 = await fn发送请求<t_配置>("get", `/config`);

  if (!请求结果.状态) return false;

  ref_配置.value = 请求结果.内容;

  return 请求结果.内容;
};

export const fn鼠标滚轮横向滚动 = (滚轮事件对象: WheelEvent): void => {
  滚轮事件对象.preventDefault();
  const 元素 = 滚轮事件对象.currentTarget as HTMLElement;
  元素.scrollBy({
    left: 滚轮事件对象.deltaY * 0.6,
    top: 0,
  });
};

export const rul_文件名规则: FormRules = {
  文件名: [
    { required: true, message: "内容不能为空！", trigger: "blur" },
    { whitespace: true, message: "不能输入纯空格", trigger: "blur" },
    { min: 1, max: 20, message: "文件名长度为 3 到 20 个字符", trigger: "blur" },
    {
      validator: (_规则, 值: string, 回调) => {
        if (!值) return 回调(); // 空值交给 required 处理

        if (值.startsWith(".")) {
          return 回调(new Error("文件名不能以 . 开头"));
        }

        if (!/^[A-Za-z0-9\p{Script=Han}\-_\.+]+$/u.test(值)) {
          return 回调(new Error("文件名只能包含英文、数字、中文及 - _ . +"));
        }

        if (cmp_当前文件列表_无后缀.value.has(值)) {
          return 回调(new Error(`文件【${值}】已存在！`));
        }

        回调();
      },
      trigger: "blur",
    },
  ],
  用户名: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { whitespace: true, message: "不能输入纯空格", trigger: "blur" },
    { min: 3, max: 20, message: "用户名长度为 3 到 20 个字符", trigger: "blur" },
    {
      pattern: /^[A-Za-z0-9_\-]+$/,
      message: "用户名只能包含字母、数字、下划线、减号",
      trigger: "blur",
    },
    {
      validator: (_规则, 值: string, 回调) => {
        if (!值) return 回调(); // 空值交给 required 处理

        if (cmp_当前文件列表_无后缀.value.has(值)) {
          return 回调(new Error(`账号【${值}】已存在！`));
        }

        回调();
      },
      trigger: "blur",
    },
  ],
  密码: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { whitespace: true, message: "不能输入纯空格", trigger: "blur" },
    { min: 6, max: 32, message: "密码长度为 6 到 32 个字符", trigger: "blur" },
    {
      pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=\.`]+$/,
      message: "密码只能包含 A-Za-z0-9!@#$%^&*()_+-=.",
      trigger: "blur",
    },
  ],
};

export const rul_账号规则: FormRules = {
  启用: [
    { required: true, message: "请设置账号启用状态", trigger: "blur" },
    { type: "boolean", message: "只能是布尔值", trigger: "blur" },
  ],
  用户名: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { whitespace: true, message: "不能输入纯空格", trigger: "blur" },
    { min: 3, max: 20, message: "用户名长度为 3 到 20 个字符", trigger: "blur" },
    {
      pattern: /[\u4e00-\u9fa5a-zA-Z0-9_!@#.-]+/,
      message: "仅允许常见简体中文、英文字母、数字以及 _!@#.-",
      trigger: "blur",
    },
    {
      validator: (_规则, 值: string, 回调) => {
        if (!值) return 回调(); // 空值交给 required 处理

        if (ref_账号总览.value?.some((账号) => 账号.用户名 === 值)) {
          return 回调(new Error(`用户【${值}】已存在！`));
        }

        回调();
      },
      trigger: "blur",
    },
  ],
  备注: [
    { whitespace: true, message: "不能输入纯空格", trigger: "blur" },
    { min: 0, max: 200, message: "备注长度不能超过 200 个字符", trigger: "blur" },
    {
      pattern: /^\S|\S$/,
      message: "开头和结尾不可以空白",
      trigger: "blur",
    },
  ],
  密码: [
    { whitespace: true, message: "不能输入纯空格", trigger: "blur" },
    { min: 3, max: 20, message: "密码长度为 3 到 20 个字符", trigger: "blur" },
    {
      pattern: /[a-zA-Z0-9_!@#.-]+/,
      message: "仅允许英文字母、数字以及 _!@#.-",
      trigger: "blur",
    },
  ],
  登录设备: [
    { required: true, message: "请输入同时登录设备数量", trigger: "blur" },
    { type: "integer", message: "只能是正整数", trigger: "blur" },
  ],
  登录天数: [
    { required: true, message: "请输入登录天数", trigger: "blur" },
    { type: "number", min: 0.02, message: "只能是大于等于 0.02 的数字", trigger: "blur" },
    {
      pattern: /^\d+(\.\d{1,2})?$/,
      message: "小数最多两位",
      trigger: "blur",
    },
  ],
  TOTP: [
    { required: true, message: "请设置 TOTP 是否开启", trigger: "blur" },
    { type: "boolean", message: "只能是布尔值", trigger: "blur" },
  ],
  密钥: [
    { required: true, message: "请输入 TOTP 密钥", trigger: "blur" },
    { whitespace: true, message: "不能输入纯空格", trigger: "blur" },
    {
      pattern: /^[A-Z2-7]{32}$/,
      message: "只能是 32 位的 Base32 字符串",
      trigger: "blur",
    },
  ],
};

/** 字符池：大小写字母 + 数字 + 符号，已排除 0oO1iIlLq9g */
const 字符池: string = "abcdefhjkmnprstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ2345678-_!@#.";

/**
 * 生成随机字符串
 * @param 最小长度 最小字符数，默认 5
 * @param 最大长度 最大字符数，默认 32
 * @returns 随机字符串
 */
export const fn生成随机字符串 = (最小长度: number = 5, 最大长度: number = 32): string => {
  let 最小: number = Math.max(1, Math.floor(最小长度));
  let 最大: number = Math.max(1, Math.floor(最大长度));
  if (最小 > 最大) [最小, 最大] = [最大, 最小];

  const 长度: number = 最小 + Math.floor(Math.random() * (最大 - 最小 + 1));

  let 结果: string = "";
  for (let i = 0; i < 长度; i++) {
    结果 += 字符池.charAt(Math.floor(Math.random() * 字符池.length));
  }
  return 结果;
};
