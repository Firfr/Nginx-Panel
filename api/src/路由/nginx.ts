import { Hono } from "hono";
import { $ } from "bun";
import { NginxPID文件路径, 主配置文件路径, 默认MIME类型文件路径 } from "../启动前检测";
import fn创建日志实例 from "../工具/日志";
import { HTTPException } from "hono/http-exception";
import { 默认主配置, 默认MIME类型 } from "../工具/默认配置";
import { existsSync } from "node:fs";

const log = fn创建日志实例("路由/nginx.ts");

let PID: null | number = null;
let 信息 = "";

const app = new Hono();

interface t_状态 {
  状态: boolean;
  pid: number | null;
  信息: string;
}

async function fn获取PID路径(配置文件路径 = 主配置文件路径) {
  try {
    const 配置 = await Bun.file(配置文件路径).text();
    // 正则说明：
    // ^\s*          行首空白
    // (?!#)         负向先行断言：本行开头不能是 #，排除注释行
    // pid\s+        pid关键字 + 空白
    // ([^;#]+?)     捕获路径：遇到 ; 或 # 停止
    // \s*;          分号，允许分号前空格
    // [^\n]*        分号后面所有行尾内容（注释）丢弃
    const 匹配 = 配置.match(/^\s*(?!#)pid\s+([^;#]+?)\s*;[^\n]*/m);
    if (匹配) return 匹配[1].trim();
  } catch {
    return "";
  }
}

async function fn获取运行状态(): Promise<t_状态> {
  let PID文件内容: string;

  PID = null;

  // 读取PID文件
  try {
    PID文件内容 = await Bun.file(NginxPID文件路径).text();
  } catch (err) {
    信息 = `读取PID文件失败，原因：${(err as Error).message}`;
    log.trace(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  const pid = Number(PID文件内容.trim());
  // 校验PID数值合法性
  if (!Number.isInteger(pid) || pid <= 0) {
    信息 = `PID文件内容无效，解析得到非正整数：${PID文件内容.trim()}`;
    log.trace(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  // 探测进程存活
  if (!existsSync(`/proc/${pid}`)) {
    信息 = `PID(${pid})探测失败`;
    log.warn(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  // 全部校验通过
  PID = pid;
  信息 = `进程 ${pid} 存在且可访问，服务正在运行`;
  log.trace(信息);
  return { 状态: true, pid, 信息: 信息 };
}
fn获取运行状态();

async function fn等待停止(): Promise<boolean> {
  let 运行状态: boolean;
  for (let i = 0; i < 5; i++) {
    运行状态 = (await fn获取运行状态()).状态;
    if (!运行状态) return false;

    Bun.sleepSync(100);
  }
  运行状态 = (await fn获取运行状态()).状态;
  return 运行状态;
}

async function fn等待启动(): Promise<boolean> {
  for (let i = 0; i < 50; i++) {
    if ((await fn获取运行状态()).状态) return true;
    await Bun.sleep(100);
  }
  return (await fn获取运行状态()).状态;
}

async function fn停止(): Promise<t_状态> {
  if (!(await fn获取运行状态()).状态) {
    信息 = "Nginx 本就未运行，无需停止";
    log.debug(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  const 停止结果 = await $`nginx -s stop`.nothrow().quiet();

  if (停止结果.exitCode !== 0) {
    信息 = 停止结果.stderr.toString().trim() || "停止失败";
    log.debug(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  const 等待停止 = await fn等待停止();
  if (等待停止) {
    信息 = "Nginx 未能停止";
    log.debug(信息);
    return { 状态: true, pid: PID, 信息: 信息 };
  }

  信息 = "Nginx 已停止";
  log.debug(信息);
  return { 状态: false, pid: null, 信息: 信息 };
}

async function fn启动(): Promise<t_状态> {
  let 运行状态 = await fn获取运行状态();

  if (运行状态.状态) {
    信息 = "Nginx 已在运行，无需启动";
    log.debug(信息);
    return { 状态: true, pid: 运行状态.pid, 信息: 信息 };
  }

  const 配置文件中PID路径 = await fn获取PID路径();

  if (配置文件中PID路径 !== NginxPID文件路径) {
    信息 = `配置文件错误，文件中必须包含 "pid ${NginxPID文件路径};"，\n当前文件中路径："${配置文件中PID路径 || "无"}"`;
    log.debug(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  const 启动结果 = await $`nginx -c ${主配置文件路径}`.nothrow().quiet();

  if (启动结果.exitCode !== 0) {
    信息 = 启动结果.stderr.toString().trim() || "启动失败";
    log.debug(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  if (!(await fn等待启动())) {
    信息 = "Nginx 启动后未就绪";
    log.debug(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  信息 = "Nginx 已启动";
  log.debug(信息);
  return { 状态: true, pid: PID, 信息: 信息 };
}

app.on("GET", ["/version", "/v"], async (c) => {
  log.info("获取 Nginx 版本");
  const 返回结果 = (await $`nginx -v 2>&1`.text()).trim().replace(/^.*nginx\//, "");
  log.debug(`Nginx 版本： ${返回结果}`);
  return c.text(返回结果);
});

app.get("/status", async (c) => {
  log.trace("获取 Nginx 运行状态");
  return c.json<t_状态>(await fn获取运行状态());
});

app.get("/start", async (c) => {
  log.info("启动 Nginx");
  const 启动结果 = await fn启动();
  if (启动结果.状态) {
    return c.json<t_状态>(启动结果);
  }

  throw new HTTPException(500, { message: 启动结果.信息 });
});

app.get("/stop", async (c) => {
  log.info("停止 Nginx");
  const 停止结果 = await fn停止();
  log.debug("停止结果", 停止结果);
  if (停止结果.状态) {
    return c.json<t_状态>(停止结果);
  }
  throw new HTTPException(500, { message: 停止结果.信息 });
});

app.get("/reload", async (c) => {
  log.info("重载 Nginx 配置");

  const 配置校验 = await $`nginx -t -c ${主配置文件路径}`.nothrow().quiet();

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
  return c.json<t_状态>({ 状态: true, pid: PID, 信息: 信息 });
});

app.get("/restart", async (c) => {
  log.info("重启 Nginx");

  const 停止 = await fn停止();

  if (停止.状态) {
    信息 = `停止失败：${停止.信息}`;
    log.debug(信息);
    return c.json<t_状态>({ 状态: false, pid: 停止.pid, 信息: 信息 });
  }

  const 启动 = await fn启动();
  if (!启动.状态) {
    return c.json<t_状态>(启动);
  }

  信息 = `重启成功：${启动.信息}`;
  log.debug(信息);
  return c.json<t_状态>({ 状态: true, pid: 启动.pid, 信息: 信息 });
});

const 可操作文件列表 = new Set(["nginx.conf", "mime.types"]);

app.get("/file/:文件名", async (c) => {
  const 文件名称 = c.req.param("文件名") || "";
  log.info(`获取文件【${文件名称}】的内容`);

  if (!可操作文件列表.has(文件名称)) {
    信息 = `【${文件名称}】不是主配置文件 nginx.conf 或 mime.types`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  const 文件路径 = 文件名称 === "nginx.conf" ? 主配置文件路径 : 默认MIME类型文件路径;

  const 本地文件 = Bun.file(文件路径);
  return c.text(await 本地文件.text());
});

app.put("/file/:文件名", async (c) => {
  const 文件名称 = c.req.param("文件名") || "";
  log.info(`更新文件【${文件名称}】的内容`);
  const 文件内容 = await c.req.text();
  log.debug(`${文件名称} 内容：`, 文件内容);

  if (!可操作文件列表.has(文件名称)) {
    信息 = `【${文件名称}】不是主配置文件 nginx.conf 或 mime.types`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  const 文件路径 = 文件名称 === "nginx.conf" ? 主配置文件路径 : 默认MIME类型文件路径;

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

  if (!可操作文件列表.has(文件名称)) {
    信息 = `【${文件名称}】不是主配置文件 nginx.conf 或 mime.types`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  const 文件路径 = 文件名称 === "nginx.conf" ? 主配置文件路径 : 默认MIME类型文件路径;
  const 默认内容 = 文件名称 === "nginx.conf" ? 默认主配置 : 默认MIME类型;

  await Bun.write(文件路径, 默认内容);
  信息 = `文件【${文件名称}】写入默认内容成功`;
  log.debug(信息);
  return c.text(信息);
});

export default app;
