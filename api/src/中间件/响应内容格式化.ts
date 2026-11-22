import type { Context, Next } from "hono";
import fn创建日志实例 from "../工具/日志";
import { t_返回 } from "@公共代码/类型";

const log = fn创建日志实例("中间件/响应内容格式化.ts");

function fn返回内容(文本: string): unknown {
  try {
    return JSON.parse(文本);
  } catch {
    return 文本;
  }
}

const fn响应格式化 = async (c: Context, next: Next) => {
  await next();

  if (c.get("中间件_跳过格式化") === true) return c.res;

  // 非 2xx 直接返回，交给 onError / 后续处理
  if (c.res.status < 200 || c.res.status >= 300) return c.res;

  // 克隆并读取原始 Body
  const 原响应文本 = await c.res.clone().text();

  const 返回内容: t_返回 = {
    状态: true,
    内容: fn返回内容(原响应文本),
  };

  if (c.get("信息")) 返回内容.信息 = c.get("信息");

  // 合并原响应头，再覆盖 Content-Type
  const 新响应头 = new Headers(c.res.headers);
  新响应头.set("Content-Type", "application/json; charset=utf-8");

  c.res = new Response(JSON.stringify(返回内容), {
    status: c.res.status,
    headers: 新响应头,
  });

  log.trace(`【${c.req.path}】响应内容格式化完成`);

  return c.res;
};

export default fn响应格式化;
