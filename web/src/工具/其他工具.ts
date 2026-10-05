import type { FormRules } from "element-plus";
import { cmp_当前文件列表_无后缀, rea_菜单内容数据 } from "./全局共享数据";
import type { t_菜单 } from "../类型";
import { fn发送请求 } from "./请求";

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

  const 请求结果 = await fn发送请求("get", `/${菜单.路径}/file_list`);

  if (!请求结果.状态) return false;

  rea_菜单内容数据.set(菜单.名称, 请求结果.内容);

  if (刷新) {
    ElMessage.primary({
      message: `${菜单.名称} 配置列表刷新成功！`,
      grouping: true,
      placement: "bottom-right",
      duration: 5000,
    });
  } else {
    ElMessage.success({
      message: `${菜单.名称} 配置列表获取成功！`,
      grouping: true,
      placement: "bottom-right",
      duration: 5000,
    });
  }

  return 请求结果.内容;
};

export const rul_文件名规则: FormRules = {
  文件名: [
    { required: true, message: "内容不能为空！", trigger: "blur" },
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
    { min: 6, max: 32, message: "密码长度为 6 到 32 个字符", trigger: "blur" },
    {
      pattern: /^[A-Za-z0-9!@#$%^&*()_+\-=\.`]+$/,
      message: "密码只能包含 A-Za-z0-9!@#$%^&*()_+-=.",
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
