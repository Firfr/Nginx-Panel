import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { rmSync, readdirSync, renameSync } from "node:fs";
import fn创建日志实例, { env_日志等级 } from "../工具/日志";
import { 证书目录 } from "../启动前检测";
import { fn排序字符串列表 } from "../工具/文件排序";
import { fn可创建 } from "../工具/文件名检测";

const log = fn创建日志实例("路由/ssl.ts");

const app = new Hono();
let 信息 = "";

const 证书集合 = new Set<string>();
const fn获取证书列表 = () => {
  证书集合.clear();
  let 目录列表: string[] = [];
  for (const e of readdirSync(证书目录, { withFileTypes: true })) {
    if (e.isDirectory()) {
      目录列表.push(e.name);
      证书集合.add(e.name);
    }
  }
  return fn排序字符串列表(目录列表);
};

// 获取列表
app.get("/file_list", (c) => {
  log.info("获取证书列表");
  return c.json(fn获取证书列表());
});

// 获取文件内容
app.get("/file/:域名", async (c) => {
  const 域名 = c.req.param("域名");
  log.info(`获取域名【${域名}】证书`);

  if (!证书集合.has(域名)) {
    信息 = `域名【${域名}】目录不存在或重新获取证书列表刷新状态。`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  const 目录路径 = `${证书目录}/${域名}`;

  const 文件 = {
    证书链: Bun.file(`${目录路径}/fullchain.pem`),
    私钥: Bun.file(`${目录路径}/privkey.pem`),
  };

  let 证书链 = "";
  let 私钥 = "";

  try {
    证书链 = await 文件.证书链.text();
  } catch (e) {
    信息 = `${域名} 的证书文件【fullchain.pem】获取失败！`;
    log.warn(信息, e);
    throw new HTTPException(404, { message: 信息 + (env_日志等级 === "debug" ? e : "") });
  }

  try {
    私钥 = await 文件.私钥.text();
  } catch (e) {
    信息 = `${域名} 的私钥文件【privkey.pem】获取失败！`;
    log.warn(信息, e);
    throw new HTTPException(404, { message: 信息 });
  }

  return c.json({
    证书: 证书链,
    私钥: 私钥,
  });
});

// 写入文件
app.put("/file/:域名", async (c) => {
  const 域名 = c.req.param("域名");
  log.info(`写入【${域名}】证书`);
  let 证书: { 证书: string; 私钥: string };

  if (!fn可创建(证书目录, 域名)) {
    信息 = `域名【${域名}】不合规！`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  try {
    证书 = await c.req.json();
  } catch (e) {
    信息 = `域名【${域名}】证书内容格式错误，请求体格式：{证书:string,私钥:string}`;
    log.warn(信息, e);
    throw new HTTPException(404, { message: 信息 + (env_日志等级 === "debug" ? e : "") });
  }

  if (typeof 证书.证书 !== "string" || typeof 证书.私钥 !== "string") {
    信息 = `域名【${域名}】证书内容格式错误，请求体格式：{证书:string,私钥:string}`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  try {
    await Bun.write(`${证书目录}/${域名}/fullchain.pem`, 证书.证书);
    log.debug(`证书链写入成功`);
  } catch (e) {
    信息 = `域名【${域名}】证书链写入失败`;
    log.warn(信息, e);
    throw new HTTPException(500, { message: 信息 + (env_日志等级 === "debug" ? e : "") });
  }

  try {
    await Bun.write(`${证书目录}/${域名}/privkey.pem`, 证书.私钥);
    log.debug(`私钥写入成功`);
  } catch (e) {
    信息 = `域名【${域名}】私钥写入失败`;
    log.warn(信息, e);
    throw new HTTPException(500, { message: 信息 + (env_日志等级 === "debug" ? e : "") });
  }

  fn获取证书列表();
  return c.text(`域名【${域名}】证书写入成功！`);
});

// 删除文件
app.delete("/file/:域名", (c) => {
  const 域名 = c.req.param("域名");
  log.info(`删除域名【${域名}】证书`);

  if (!证书集合.has(域名)) {
    信息 = `域名【${域名}】目录不存在或重新获取证书列表刷新状态。`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  try {
    rmSync(`${证书目录}/${域名}`, { recursive: true });
    fn获取证书列表();
    信息 = `域名【${域名}】证书删除成功！`;
    return c.text(信息);
  } catch (e) {
    信息 = `域名【${域名}】证书删除失败！`;
    log.warn(信息, e);
    throw new HTTPException(404, { message: 信息 + (env_日志等级 === "debug" ? e : "") });
  }
});

// 重命名
app.patch("/file/:域名/:新域名", (c) => {
  const 域名 = c.req.param("域名");
  const 新域名 = c.req.param("新域名");
  log.info(`重命名域名【${域名}】=>【${新域名}】`);

  if (!证书集合.has(域名)) {
    信息 = `域名【${域名}】目录不存在或重新获取证书列表刷新状态。`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  if (!fn可创建(证书目录, 新域名)) {
    信息 = `新域名【${新域名}】不合规！`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  try {
    renameSync(`${证书目录}/${域名}`, `${证书目录}/${新域名}`);
    信息 = `域名【${域名}】重命名成功：【${新域名}】`;
    log.debug(信息);
    fn获取证书列表();
    return c.text(信息);
  } catch (e) {
    信息 = `域名【${域名}】重命名失败：${e}`;
    log.warn(信息);
    throw new HTTPException(500, { message: 信息 });
  }
});

export default app;
