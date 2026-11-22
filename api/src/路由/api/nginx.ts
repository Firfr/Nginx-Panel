import { Hono } from "hono";
import { $ } from "bun";
import { const_配置 } from "../../启动前检测";
import fn创建日志实例 from "../../工具/日志";
import { HTTPException } from "hono/http-exception";
import { 默认主配置, 默认MIME类型 } from "../../工具/默认配置";
import { t_Nginx状态 } from "@公共代码/类型";
import { fnNginx_停止, fnNginx_启动, fnNginx_获取运行状态, Nginx_PID } from "../../工具/Nginx";

const log = fn创建日志实例("路由/nginx.ts");

const app = new Hono();

fnNginx_获取运行状态();

app.on("GET", ["/version", "/v"], async (c) => {
  log.info("获取 Nginx 版本");
  const 返回结果 = (await $`nginx -v 2>&1`.text()).trim().replace(/^.*nginx\//, "");
  log.debug(`Nginx 版本： ${返回结果}`);
  return c.text(返回结果);
});

app.get("/status", async (c) => {
  log.trace("获取 Nginx 运行状态");
  return c.json<t_Nginx状态>(await fnNginx_获取运行状态());
});

app.get("/start", async (c) => {
  log.info("启动 Nginx");
  const 启动结果 = await fnNginx_启动();
  if (启动结果.状态) {
    return c.json<t_Nginx状态>(启动结果);
  }

  throw new HTTPException(500, { message: 启动结果.信息 });
});

app.get("/stop", async (c) => {
  log.info("停止 Nginx");
  const 停止结果 = await fnNginx_停止();
  log.debug("停止结果", 停止结果);
  if (!停止结果.状态) {
    throw new HTTPException(500, { message: 停止结果.信息 });
  }
  return c.json<t_Nginx状态>(停止结果.内容);
});

app.get("/reload", async (c) => {
  log.info("重载 Nginx 配置");
  let 信息 = "";

  const 配置校验 = await $`nginx -t -c ${const_配置.文件路径.主配置}`.nothrow().quiet();

  if (配置校验.exitCode !== 0) {
    const 信息 = 配置校验.stderr.toString().trimEnd() || "配置语法检测失败！";
    log.warn("Nginx配置校验失败：", 信息);
    throw new HTTPException(400, { message: 信息 });
  }

  const 重载 = await $`nginx -s reload`.nothrow().quiet();
  if (重载.exitCode !== 0) {
    信息 = 重载.stderr.toString().trim() || "重载失败";
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  信息 = "配置已重载";
  log.debug(信息);
  return c.json<t_Nginx状态>({ 状态: true, pid: Nginx_PID, 信息: 信息 });
});

app.get("/restart", async (c) => {
  log.info("重启 Nginx");
  let 信息 = "";

  const 停止 = await fnNginx_停止();

  if (!停止.状态) {
    信息 = `停止失败：${停止.信息}`;
    log.debug(信息);
  }

  const 启动 = await fnNginx_启动();
  return c.json<t_Nginx状态>(启动);
});

const 可操作文件列表 = new Set(["nginx.conf", "mime.types"]);

app.get("/file/:文件名", async (c) => {
  const 文件名称 = c.req.param("文件名") || "";
  log.info(`获取文件【${文件名称}】的内容`);
  let 信息 = "";

  if (!可操作文件列表.has(文件名称)) {
    信息 = `【${文件名称}】不是主配置文件 nginx.conf 或 mime.types`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  const 文件路径 =
    文件名称 === "nginx.conf" ? const_配置.文件路径.主配置 : const_配置.文件路径.默认MIME类型;

  const 本地文件 = Bun.file(文件路径);
  return c.text(await 本地文件.text());
});

app.put("/file/:文件名", async (c) => {
  const 文件名称 = c.req.param("文件名") || "";
  log.info(`更新文件【${文件名称}】的内容`);
  const 文件内容 = await c.req.text();
  log.debug(`${文件名称} 内容：`, 文件内容);
  let 信息 = "";

  if (!可操作文件列表.has(文件名称)) {
    信息 = `【${文件名称}】不是主配置文件 nginx.conf 或 mime.types`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  const 文件路径 =
    文件名称 === "nginx.conf" ? const_配置.文件路径.主配置 : const_配置.文件路径.默认MIME类型;

  try {
    await Bun.write(文件路径, 文件内容);
    信息 = `文件【${文件名称}】写入成功`;
    log.debug(信息);
    return c.text(信息);
  } catch (e) {
    信息 = `文件【${文件路径}】写入失败：${e}`;
    log.warn(信息);
    throw new HTTPException(500, { message: 信息 });
  }
});

app.post("/reset/:文件名", async (c) => {
  const 文件名称 = c.req.param("文件名") || "";
  log.info(`更改配置【${文件名称}】的内容为默认值`);
  let 信息 = "";

  if (!可操作文件列表.has(文件名称)) {
    信息 = `【${文件名称}】不是主配置文件 nginx.conf 或 mime.types`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  const 文件路径 =
    文件名称 === "nginx.conf" ? const_配置.文件路径.主配置 : const_配置.文件路径.默认MIME类型;
  const 默认内容 = 文件名称 === "nginx.conf" ? 默认主配置 : 默认MIME类型;

  await Bun.write(文件路径, 默认内容);
  信息 = `文件【${文件名称}】写入默认内容成功`;
  log.debug(信息);
  return c.text(信息);
});

export default app;
