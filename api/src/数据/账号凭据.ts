import { t_返回 } from "@公共代码/类型";
import { const_配置, 初始数据 } from "../启动前检测";
import { fn账号信息 } from "./账号";

const 账号凭据映射 = structuredClone(初始数据.账号凭据);

const 保存 = async (): Promise<t_返回<string>> => {
  const 转对象 = Object.fromEntries(账号凭据映射);
  try {
    await Bun.write(const_配置.文件路径.账号凭据, JSON.stringify(转对象, null, 2));
  } catch (e) {
    const 错误信息 = e instanceof Error ? e.message : String(e);
    return { 状态: false, 信息: `保存失败: ${错误信息}` };
  }
  return { 状态: true, 内容: "保存成功！" };
};

export const fn账号凭据 = {
  存在: (用户名: string, 凭据: string): boolean => {
    let 用户凭据 = 账号凭据映射.get(用户名);
    if (!用户凭据) {
      const 用户信息 = fn账号信息.查找(用户名);
      if (!用户信息) return false;
      账号凭据映射.set(
        用户名,
        Array.from({ length: 用户信息.登录设备 }, () => ""),
      );
      用户凭据 = 账号凭据映射.get(用户名);
    }
    return 用户凭据?.includes(凭据) || false;
  },
  添加: async (用户名: string, 凭据: string): Promise<t_返回<string>> => {
    let 用户凭据 = 账号凭据映射.get(用户名);
    if (!用户凭据) {
      const 用户信息 = fn账号信息.查找(用户名);
      if (!用户信息) return { 状态: false, 信息: "该用户不存在" };
      账号凭据映射.set(
        用户名,
        Array.from({ length: 用户信息.登录设备 }, () => ""),
      );
      用户凭据 = 账号凭据映射.get(用户名);
    }
    用户凭据!.push(凭据);
    用户凭据!.shift();
    return await 保存();
  },
  删除: async (用户名: string, 凭据: string): Promise<t_返回<string>> => {
    let 用户凭据 = 账号凭据映射.get(用户名);
    if (!用户凭据) {
      const 用户信息 = fn账号信息.查找(用户名);
      if (!用户信息) return { 状态: false, 信息: "该用户不存在" };
      账号凭据映射.set(
        用户名,
        Array.from({ length: 用户信息.登录设备 }, () => ""),
      );
      用户凭据 = 账号凭据映射.get(用户名);
    }
    用户凭据!.push("");
    const 凭据索引 = 用户凭据!.indexOf("b");
    if (凭据索引 === -1) {
      return { 状态: true, 内容: "该用户不存在" };
    }

    用户凭据!.splice(凭据索引, 1);
    return await 保存();
  },
};
