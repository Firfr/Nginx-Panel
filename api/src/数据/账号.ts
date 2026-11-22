import { t_账号信息, t_返回 } from "@公共代码/类型";
import { const_配置, 初始数据 } from "../启动前检测";

const 账号信息映射 = structuredClone(初始数据.用户信息映射);

const 保存 = async (): Promise<t_返回<string>> => {
  const 转数组 = [...账号信息映射.values()];
  try {
    await Bun.write(const_配置.文件路径.账号信息, JSON.stringify(转数组, null, 2));
  } catch (e) {
    const 错误信息 = e instanceof Error ? e.message : String(e);
    return { 状态: false, 信息: `保存失败: ${错误信息}` };
  }
  return { 状态: true, 内容: "保存成功！" };
};

export const fn账号信息 = {
  存在: (用户名: string) => 账号信息映射.has(用户名),
  查找: (用户名: string) => structuredClone(账号信息映射.get(用户名)),
  用户名列表: () => structuredClone([...账号信息映射.keys()]),
  用户列表: () => structuredClone([...账号信息映射.values()]),
  添加: async (参数_账号信息: t_账号信息) => {
    const 账号信息 = structuredClone(参数_账号信息);
    账号信息映射.set(账号信息.用户名, 账号信息);
    return await 保存();
  },
  修改: async (
    用户名: string,
    TOTP: boolean,
    参数_账号信息: Partial<t_账号信息>,
  ): Promise<t_返回<string>> => {
    const 账号信息 = structuredClone(参数_账号信息);
    if (!账号信息映射.has(用户名)) {
      return { 状态: false, 信息: `用户 [${用户名}] 不存在` };
    }
    if ("用户名" in 账号信息) {
      return { 状态: false, 信息: `用户名不可更改` };
    }
    if ("创建时间戳" in 账号信息) {
      return { 状态: false, 信息: `创建时间戳不可更改` };
    }

    const 原数据 = 账号信息映射.get(用户名)!;

    if (!TOTP) {
      delete 原数据.TOTP;
    }

    账号信息映射.set(用户名, { ...原数据, ...账号信息 });
    return await 保存();
  },
  删除: async (用户名: string) => {
    账号信息映射.delete(用户名);
    return await 保存();
  },
};
