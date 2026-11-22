import { Hono } from "hono";
import fn创建日志实例 from "../../工具/日志";
import { HTTPException } from "hono/http-exception";
import { JwtTokenExpired } from "hono/utils/jwt/types";
import { fn账号凭据 } from "../../数据/账号凭据";
import { verify } from "hono/jwt";
import { fn计算哈希256 } from "../../工具/哈希256";
import { deleteCookie, getCookie } from "hono/cookie";
import { fn账号信息 } from "../../数据/账号";
import { fn令牌名称 } from "../../工具/令牌名称";

const log = fn创建日志实例("路由/auth/logout.ts");

const app = new Hono();

app.all("/", async (c) => {
  const 用户名 = c.req.header("user") || "";
  log.trace(`用户【${用户名}】退出`);

  const 用户信息 = fn账号信息.查找(用户名);
  if (!用户信息) {
    const 信息 = `用户【${用户名}】不存在！检查 Nginx 配置`;
    log.trace(信息);
    throw new HTTPException(401, { message: 信息 });
  }

  const 令牌名称 = fn令牌名称(用户名);
  const 令牌 = getCookie(c, 令牌名称);
  if (!令牌) {
    const 信息 = `用户【${用户名}】的令牌不存在！`;
    log.trace(信息);
    throw new HTTPException(401, { message: 信息 });
  }

  const 令牌查找结果 = fn账号凭据.删除(用户信息.用户名, 令牌);
  if (!令牌查找结果) {
    const 信息 = "未找到登录信息";
    log.trace(信息);
    throw new HTTPException(401, { message: 信息 });
  }

  log.trace(`用户【${用户名}】已退出`);

  c.set("中间件_跳过格式化", true);
  deleteCookie(c, 令牌名称, {
    path: "/",
  });
  return c.redirect("../");
});

export default app;
