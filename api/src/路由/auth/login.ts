import { Hono } from "hono";
import fn创建日志实例 from "../../工具/日志";
import { fn账号信息 } from "../../数据/账号";
import { HTTPException } from "hono/http-exception";
import { fn计算哈希256 } from "../../工具/哈希256";
import { verify } from "otplib";
import { setCookie } from "hono/cookie";
import { fn账号凭据 } from "../../数据/账号凭据";
import { fn令牌名称 } from "../../工具/令牌名称";
import { sign } from "hono/jwt";

const log = fn创建日志实例("路由/auth/login.ts");

const app = new Hono();

const 登录页路径 = `${import.meta.dir}/login.html`;
const 登录页文件 = Bun.file(登录页路径);

app.get("/", async (c) => {
  const 用户名 = c.req.header("user") || "";
  log.info(`用户【${用户名}】获取登录页面`);

  const 用户信息 = fn账号信息.查找(用户名);
  if (!用户信息) {
    let 信息 = `用户【${用户名}】不存在！Nginx 配置错误`;
    log.warn(信息);
    throw new HTTPException(500, { message: 信息 });
  }

  if (!用户信息.启用) {
    let 信息 = `用户【${用户名}】已禁用！`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  if (!(await 登录页文件.exists())) {
    return c.text("登录页不存在", 500);
  }

  let 页面内容 = await 登录页文件.text();
  页面内容 = 页面内容.replaceAll('"有验证码"', "TOTP" in 用户信息 ? "true" : "false");

  c.set("中间件_跳过格式化", true);
  return c.html(页面内容);
});

const fn校验验证码 = async (
  配置: { 密钥: string; 算法: string; 位数: number; 周期: number },
  验证码: string,
) => {
  return (
    await verify({
      epochTolerance: 10,
      secret: 配置.密钥,
      token: 验证码,
      algorithm: 配置.算法.toLowerCase() as "sha1",
      digits: 配置.位数,
      period: 配置.周期,
    })
  ).valid;
};
app.post("/", async (c) => {
  const 用户名 = c.req.header("user") || "";
  log.info(`用户【${用户名}】登录`);

  let 请求体: { 用户名: string; 密码: string; 盐: string; 验证码?: string };

  try {
    请求体 = await c.req.json();
  } catch (e) {
    const 信息 = `格式错误：请求体不是 JSON 格式`;
    log.error(信息, e);
    throw new HTTPException(400, { message: 信息 });
  }

  if (typeof 请求体.用户名 !== "string") {
    const 信息 = `格式错误：请求体缺少字符串字段【用户名】`;
    log.error(信息);
    throw new HTTPException(400, { message: 信息 });
  }
  if (typeof 请求体.密码 !== "string") {
    const 信息 = `格式错误：请求体缺少字符串字段【密码】`;
    log.error(信息);
    throw new HTTPException(400, { message: 信息 });
  }
  if (typeof 请求体.盐 !== "string") {
    const 信息 = `格式错误：请求体缺少字符串字段【盐】`;
    log.error(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  const 用户信息 = fn账号信息.查找(用户名);
  if (!用户信息) {
    let 信息 = `用户【${用户名}】不存在！Nginx 配置错误`;
    log.warn(信息);
    throw new HTTPException(401, { message: 信息 });
  }

  if (!用户信息.启用) {
    let 信息 = `用户【${用户名}】已禁用！`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  if (用户信息.TOTP) {
    if (typeof 请求体.验证码 !== "string") {
      const 信息 = `格式错误：请求体缺少字符串字段【验证码】`;
      log.error(信息);
      throw new HTTPException(400, { message: 信息 });
    }
    if (!/^\d{6}$/.test(请求体.验证码)) {
      const 信息 = `格式错误：【验证码】必须是6位数字正常的字符串`;
      log.error(信息);
      throw new HTTPException(400, { message: 信息 });
    }
  }

  if (用户名 !== 请求体.用户名) {
    const 信息 = `用户名错误！`;
    log.error(信息);
    throw new HTTPException(401, { message: 信息 });
  }

  const 密码加盐 = fn计算哈希256(`${用户信息.用户名}:${用户信息.密码}:${请求体.盐}`);
  if (密码加盐 !== 请求体.密码) {
    const 信息 = `密码错误！`;
    log.trace({
      请求体: 请求体,
      用户信息: 用户信息,
      密码加盐: 密码加盐,
    });
    log.error(信息);
    throw new HTTPException(401, { message: 信息 });
  }

  if (用户信息.TOTP && !(await fn校验验证码(用户信息.TOTP, 请求体.验证码 || ""))) {
    const 信息 = `验证码错误！`;
    log.error(信息);
    throw new HTTPException(401, { message: 信息 });
  }

  const 认证令牌 = await sign(
    {
      用户名: 用户信息.用户名,
      exp: Math.floor(Date.now() / 1000) + 用户信息.登录天数 * 24 * 60 * 60,
    },
    fn计算哈希256(用户信息.密码.padEnd(32, 用户信息.用户名)),
    "HS256",
  );

  const 凭据添加结果 = await fn账号凭据.添加(用户名, 认证令牌);
  if (!凭据添加结果.状态) {
    const 信息 = 凭据添加结果.信息;
    log.error(信息);
    throw new HTTPException(401, { message: 信息 });
  }

  setCookie(c, fn令牌名称(用户名), 认证令牌, {
    path: "/",
    httpOnly: true,
    maxAge: 86400 * 用户信息.登录天数,
  });

  return c.text("登录成功");
});

export default app;
