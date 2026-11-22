import { Hono } from "hono";
import fn创建日志实例 from "../../../工具/日志";
import { fn账号信息 } from "../../../数据/账号";
import { HTTPException } from "hono/http-exception";
import { t_账号信息, t_账号信息_更新 } from "@公共代码/类型";
import { fn账号校验 } from "@公共代码/账号校验";

const log = fn创建日志实例("路由/api/user/info.ts");

const app = new Hono();

app.get("/:用户名", (c) => {
  const 用户名 = c.req.param("用户名");
  log.info(`查找用户【${用户名}】`);

  const 用户信息 = fn账号信息.查找(用户名);

  if (!用户信息) {
    let 信息 = `用户【${用户名}】不存在！`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  用户信息.密码 = "-";

  if (用户信息.TOTP) {
    用户信息.TOTP.密钥 = "-";
  }

  return c.json(用户信息);
});

app.post("/", async (c) => {
  log.info(`添加用户`);
  let 请求体: t_账号信息;

  try {
    请求体 = await c.req.json();
  } catch (e) {
    let 信息 = `格式错误：请求体不是 JSON 格式`;
    log.error(信息, e);
    throw new HTTPException(400, { message: 信息 });
  }

  请求体.创建时间戳 = Date.now();

  const 请求体校验结果 = fn账号校验(请求体);
  if (!请求体校验结果.状态) {
    log.warn(请求体校验结果.信息);
    throw new HTTPException(400, { message: 请求体校验结果.信息 });
  }

  if (fn账号信息.存在(请求体.用户名)) {
    let 信息 = `用户【${请求体.用户名}】已存在！`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  const 添加结果 = await fn账号信息.添加(请求体);

  if (!添加结果.状态) {
    let 信息 = `用户【${请求体.用户名}】写入失败！`;
    log.warn(信息);
    throw new HTTPException(500, { message: 信息 });
  }

  请求体.密码 = "-";
  if (请求体.TOTP) {
    请求体.TOTP.密钥 = "-";
  }

  return c.json(请求体);
});

app.put("/:用户名", async (c) => {
  const 用户名 = c.req.param("用户名");
  log.info(`更新用户【${用户名}】`);

  const 用户信息 = fn账号信息.查找(用户名);

  if (!用户信息) {
    let 信息 = `用户【${用户名}】不存在！`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  let 请求体: t_账号信息_更新;

  try {
    请求体 = await c.req.json();
  } catch (e) {
    let 信息 = `格式错误：请求体不是 JSON 格式`;
    log.error(信息, e);
    throw new HTTPException(400, { message: 信息 });
  }

  if (typeof 请求体.TOTP !== "boolean") {
    const 信息 = `格式错误：【TOTP】必须是布尔值`;
    log.error(信息);
    throw new HTTPException(402, { message: 信息 });
  }
  if (typeof 请求体.TOTP_改变 !== "boolean") {
    const 信息 = `格式错误：【TOTP_改变】必须是布尔值`;
    log.error(信息);
    throw new HTTPException(402, { message: 信息 });
  }

  if (请求体.TOTP && 请求体.TOTP_改变 && !("TOTP_密钥" in 请求体)) {
    const 信息 = `格式错误：【TOTP】【TOTP_改变】为真时必须有属性【TOTP_密钥】`;
    log.error(信息);
    throw new HTTPException(402, { message: 信息 });
  }

  let 更新数据: Partial<t_账号信息> = {};

  if ("启用" in 请求体) {
    更新数据.启用 = 请求体.启用;
  }

  if ("备注" in 请求体) {
    更新数据.备注 = 请求体.备注;
  }
  if ("密码" in 请求体) {
    更新数据.密码 = 请求体.密码;
  }
  if ("登录设备" in 请求体) {
    更新数据.登录设备 = 请求体.登录设备;
  }
  if ("登录天数" in 请求体) {
    更新数据.登录天数 = 请求体.登录天数;
  }

  if (请求体.TOTP) {
    if (请求体.TOTP_改变) {
      更新数据.TOTP = {
        密钥: 请求体.TOTP_密钥!,
        算法: "SHA1",
        位数: 6,
        周期: 30,
      };
    }
  } else {
    delete 用户信息.TOTP;
  }

  const 校验数据: t_账号信息 = { ...用户信息, ...更新数据 };

  const 校验结果 = fn账号校验(校验数据);
  if (!校验结果.状态) {
    log.warn(校验结果.信息);
    throw new HTTPException(400, { message: 校验结果.信息 });
  }

  const 更新结果 = await fn账号信息.修改(用户名, 请求体.TOTP, 更新数据);

  if (!更新结果.状态) {
    let 信息 = `用户【${用户名}】写入失败！`;
    log.warn(信息);
    throw new HTTPException(500, { message: 信息 });
  }

  校验数据.密码 = "-";
  if (校验数据.TOTP) {
    校验数据.TOTP.密钥 = "-";
  }

  return c.json(校验数据);
});

app.delete("/:用户名", async (c) => {
  const 用户名 = c.req.param("用户名");
  log.info(`删除用户【${用户名}】`);

  if (!fn账号信息.存在(用户名)) {
    let 信息 = `用户【${用户名}】不存在！`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  const 删除结果 = await fn账号信息.删除(用户名);
  if (!删除结果.状态) {
    log.warn(删除结果.信息);
    throw new HTTPException(500, { message: 删除结果.信息 });
  }

  return c.text(`用户【${用户名}】删除改成`);
});

export default app;
