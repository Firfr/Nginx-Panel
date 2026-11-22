import { Hono } from "hono";
import fn创建日志实例 from "../../工具/日志";
import { HTTPException } from "hono/http-exception";
import { fn账号信息 } from "../../数据/账号";
import { getCookie } from "hono/cookie";
import { fn计算哈希256 } from "../../工具/哈希256";
import { fn令牌名称 } from "../../工具/令牌名称";
import { verify } from "hono/jwt";
import { JwtTokenExpired } from "hono/utils/jwt/types";
import { fn账号凭据 } from "../../数据/账号凭据";

const log = fn创建日志实例("路由/auth/verify.ts");

const app = new Hono();

app.all("/", async (c) => {
  const 用户名 = c.req.header("user") || "";
  log.trace(`用户【${用户名}】登录状态验证`);

  const 用户信息 = fn账号信息.查找(用户名);
  if (!用户信息) {
    const 信息 = `用户【${用户名}】不存在！检查 Nginx 配置`;
    log.trace(信息);
    throw new HTTPException(401, { message: 信息 });
  }

  const 令牌 = getCookie(c, fn令牌名称(用户名));
  if (!令牌) {
    const 信息 = `用户【${用户名}】的令牌不存在！`;
    log.trace(信息);
    throw new HTTPException(401, { message: 信息 });
  }

  try {
    const 令牌解码 = await verify(
      令牌,
      fn计算哈希256(用户信息.密码.padEnd(32, 用户信息.用户名)),
      "HS256",
    );

    log.trace(
      `用户名: ${令牌解码.用户名}`,
      `签发时间: ${令牌解码.iat}`,
      `过期时间: ${令牌解码.exp}`,
    );
  } catch (e: any) {
    if (e instanceof JwtTokenExpired) {
      const 信息 = "登录已过期";
      log.trace(信息);
      throw new HTTPException(401, { message: 信息 });
    }
    const 信息 = "无效的令牌";
    log.trace(信息);
    throw new HTTPException(401, { message: 信息 });
  }

  const 令牌查找结果 = fn账号凭据.存在(用户信息.用户名, 令牌);
  if (!令牌查找结果) {
    const 信息 = "未找到登录信息";
    log.trace(信息);
    throw new HTTPException(401, { message: 信息 });
  }

  log.trace(`用户【${用户名}】已登录`);
  return c.text(`用户【${用户名}】已登录`);
});

export default app;
