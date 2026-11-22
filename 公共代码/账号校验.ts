import type { t_返回, t_账号信息 } from "./类型";

export const fn账号校验 = (账号: t_账号信息): t_返回<string> => {
  if (
    typeof 账号.创建时间戳 !== "number" ||
    !Number.isInteger(账号.创建时间戳) ||
    账号.创建时间戳 < 1e12
  ) {
    return {
      状态: false,
      信息: `创建时间戳 [${账号.创建时间戳}] 不是时间戳`,
    };
  }

  if (!("用户名" in 账号)) {
    return { 状态: false, 信息: `缺少 [用户名] 字段` };
  }
  if (typeof 账号.用户名 !== "string" || 账号.用户名.length < 3 || /\s/.test(账号.用户名)) {
    return {
      状态: false,
      信息: `用户名 [${账号.用户名}] 不是3个字符以上且不包含空白的字符串`,
    };
  }

  if (typeof 账号.启用 !== "boolean") {
    return {
      状态: false,
      信息: `启用 [${账号.启用}] 必须是布尔值`,
    };
  }

  if (!("备注" in 账号)) {
    return { 状态: false, 信息: `缺少 [备注] 字段` };
  }
  if (typeof 账号.备注 !== "string") {
    return { 状态: false, 信息: `备注 [${账号.备注}] 不是字符串` };
  }

  if (!("密码" in 账号)) {
    return { 状态: false, 信息: `缺少 [密码] 字段` };
  }
  if (typeof 账号.密码 !== "string" || 账号.密码.length < 3 || /\s/.test(账号.密码)) {
    return {
      状态: false,
      信息: `密码 [${账号.密码}] 不是3个字符以上且不包含空白的字符串`,
    };
  }

  if (!("登录设备" in 账号)) {
    return { 状态: false, 信息: `缺少 [登录设备] 字段` };
  }
  if (typeof 账号.登录设备 !== "number" || !Number.isInteger(账号.登录设备) || 账号.登录设备 < 0) {
    return {
      状态: false,
      信息: `登录设备 [${账号.登录设备}] 不是正整数`,
    };
  }

  if (!("登录天数" in 账号)) {
    return { 状态: false, 信息: `缺少 [登录天数] 字段` };
  }
  if (
    typeof 账号.登录天数 !== "number" ||
    !Number.isFinite(账号.登录天数) ||
    账号.登录天数 < 0.02 ||
    !/^\d+(\.\d{1,2})?$/.test(String(账号.登录天数))
  ) {
    return {
      状态: false,
      信息: `登录天数 [${账号.登录天数}] 不能小于 0.02 (最多两位小数)`,
    };
  }

  if (!("TOTP" in 账号)) {
    return { 状态: true, 内容: "校验完成，未开启 TOTP" };
  }

  if (typeof 账号.TOTP !== "object" || 账号.TOTP === null || Array.isArray(账号.TOTP)) {
    return {
      状态: false,
      信息: `TOTP [${账号.TOTP}] 不是对象`,
    };
  }

  const TOTP = 账号.TOTP;

  if (!("密钥" in TOTP)) {
    return { 状态: false, 信息: `属性 [TOTP] 缺少 [密钥] 字段` };
  }
  if (typeof TOTP.密钥 !== "string" || !/^[A-Z2-7]+$/i.test(TOTP.密钥)) {
    return { 状态: false, 信息: `TOTP 密钥 [${TOTP.密钥}] 不是 Base32 字符串` };
  }

  if (TOTP.算法 !== "SHA1") {
    return {
      状态: false,
      信息: `TOTP 算法 [${TOTP.算法}] 目前只支持 SHA1`,
    };
  }

  if (TOTP.位数 !== 6) {
    return { 状态: false, 信息: `TOTP 位数 [${TOTP.位数}] 当前支支持 6 位` };
  }

  if (TOTP.周期 !== 30) {
    return { 状态: false, 信息: `TOTP 周期 [${TOTP.周期}] 当前必须 30 秒` };
  }

  return { 状态: true, 内容: "校验通过" };
};

export const fn账号列表校验 = (账号列表: t_账号信息[]): t_返回<Set<string>> => {
  const 用户名列表 = new Set<string>();
  for (let 索引 = 0; 索引 < 账号列表.length; 索引++) {
    const 账号 = 账号列表[索引];
    const 检验结果 = fn账号校验(账号);
    if (!检验结果.状态) {
      return {
        状态: false,
        信息: `${索引 + 1} / ${账号列表.length} [${账号.用户名}] ${检验结果.信息}`,
      };
    }
    if (用户名列表.has(账号.用户名)) {
      return {
        状态: false,
        信息: `${索引 + 1} / ${账号列表.length} 用户 [${账号.用户名}] 重复`,
      };
    }
    用户名列表.add(账号.用户名);
  }

  return { 状态: true, 内容: 用户名列表 };
};
