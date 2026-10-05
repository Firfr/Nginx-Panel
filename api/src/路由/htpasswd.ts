import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { renameSync, readdirSync } from "node:fs";
import fn创建日志实例 from "../工具/日志";
import { HTTP认证目录 } from "../启动前检测";
import { fn排序字符串列表 } from "../工具/文件排序";
import { fn可创建 } from "../工具/文件名检测";

const log = fn创建日志实例("路由/htpasswd.ts");

const app = new Hono();
let 信息 = "";

const 账号集合 = new Set<string>();
const fn获取账号列表 = () => {
  账号集合.clear();
  let 目录列表: string[] = [];
  for (const e of readdirSync(HTTP认证目录, { withFileTypes: true })) {
    if (e.isFile() && e.name.endsWith(".txt")) {
      目录列表.push(e.name);
      账号集合.add(e.name);
    }
  }
  return fn排序字符串列表(目录列表);
};

// 获取列表
app.get("/file_list", (c) => {
  log.info("获取 HTTP 认证文件列表");

  return c.json(fn获取账号列表());
});

// 获取文件内容
app.get("/file/:账号", async (c) => {
  const 账号 = c.req.param("账号");
  log.info(`获取 HTTP 认证文件【${账号 || ""}】内容`);

  if (!账号集合.has(账号)) {
    信息 = `账号【${账号}】文件不存在或重新获取配置列表刷新状态。`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  const 本地文件 = Bun.file(`${HTTP认证目录}/${账号}`);
  const 本地文件检测结果 = await 本地文件.exists();
  if (!本地文件检测结果) {
    信息 = `账号文件【${账号}】不存在`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  return c.text(await 本地文件.text());
});

// 写入文件
app.put("/file/:账号", async (c) => {
  const 账号 = c.req.param("账号");
  log.info(`写入 HTTP 认证文件【${账号}】`);
  const 账号内容 = await c.req.text();

  if (!fn可创建(HTTP认证目录, 账号)) {
    信息 = `账号文件名【${账号}】不合规！`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  if (!账号.endsWith(".txt")) {
    信息 = "后缀错误，只允许创建后缀为 .txt 的文件";
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  try {
    await Bun.write(`${HTTP认证目录}/${账号}`, 账号内容);
    信息 = `账号文件【${账号}】写入成功`;
    log.debug(信息);
    fn获取账号列表();
    return c.text(信息);
  } catch (e) {
    信息 = `账号文件【${账号}】写入失败：${e}`;
    log.warn(信息);
    throw new HTTPException(500, { message: 信息 });
  }
});

// 删除文件
app.delete("/file/:账号", async (c) => {
  const 账号 = c.req.param("账号");
  log.info(`删除 HTTP 认证文件【${账号}】`);

  if (!账号集合.has(账号)) {
    信息 = `账号【${账号}】文件不存在或重新获取配置列表刷新状态。`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  try {
    await Bun.file(`${HTTP认证目录}/${账号}`).delete();
    信息 = `账号文件【${账号}】删除成功`;
    log.debug(信息);
    fn获取账号列表();
    return c.text(信息);
  } catch (e) {
    信息 = `账号文件【${账号}】删除失败：${e}`;
    log.warn(信息);
    throw new HTTPException(500, { message: 信息 });
  }
});

// 重命名
app.patch("/file/:账号/:新账号", async (c) => {
  const 账号 = c.req.param("账号");
  const 新账号 = c.req.param("新账号");
  log.info(`重命名账号文件【${账号}】=>【${新账号}】`);

  if (!账号集合.has(账号)) {
    信息 = `账号【${账号}】文件不存在或重新获取配置列表刷新状态。`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  if (!fn可创建(HTTP认证目录, 新账号)) {
    信息 = `新账号文件名称【${新账号}】不合规！`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  if (!新账号.endsWith(".txt")) {
    信息 = "后缀错误，只允许重命名后缀为 .txt 的文件";
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  try {
    renameSync(`${HTTP认证目录}/${账号}`, `${HTTP认证目录}/${新账号}`);
    信息 = `账号【${账号}】重命名成功：【${新账号}】`;
    log.debug(信息);
    fn获取账号列表();
    return c.text(信息);
  } catch (e) {
    信息 = `账号【${账号}】重命名失败：${e}`;
    log.warn(信息);
    throw new HTTPException(500, { message: 信息 });
  }
});

export default app;
