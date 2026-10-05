import { type t_请求结果 } from "../类型";

const const_接口前缀 = "api";

type t_请求方式 = "get" | "post" | "put" | "delete" | "patch" | "head" | "options";
/**
 * 发送请求
 * @参数 请求路径 接口后缀路径（自动拼接 api 前缀）
 * @返回 统一封装结果对象
 */
export const fn发送请求 = async (
  请求方式: t_请求方式,
  请求路径: string,
  请求体?: string | object,
): Promise<t_请求结果> => {
  const 完整请求地址 = `${const_接口前缀.replace(/\/+$/, "")}/${请求路径.replace(/^\/+/, "")}`;
  const 请求头: Record<string, string> = {};

  let 请求体数据: BodyInit | undefined;
  if (请求体 !== undefined && 请求体 !== null) {
    if (typeof 请求体 === "string") {
      请求头["Content-Type"] = "text/plain;charset=UTF-8";
      请求体数据 = 请求体;
    } else {
      请求头["Content-Type"] = "application/json;charset=UTF-8";
      请求体数据 = JSON.stringify(请求体);
    }
  }

  if (["get", "head"].includes(请求方式)) {
    请求体数据 = undefined;
  }

  try {
    const 响应 = await fetch(完整请求地址, {
      method: 请求方式.toUpperCase(), // "get" -> "GET"
      headers: 请求头,
      body: 请求体数据, // undefined 时不带 body
    });
    const 响应数据 = await 响应.json();

    if (!响应.ok)
      throw new Error(`${请求方式.toUpperCase()} HTTP错误: ${响应.status} ${响应数据.信息 || ""}`);
    if (!响应数据.状态) throw new Error(响应数据.信息);

    return 响应数据;
  } catch (错误信息) {
    const 信息 = 错误信息 instanceof Error ? 错误信息.message : String(错误信息 ?? "未知错误！");

    ElMessage.error({
      message: 信息,
      grouping: true,
      placement: "bottom-right",
      duration: 5000,
    });
    return { 状态: false, 信息: 信息 };
  }
};
