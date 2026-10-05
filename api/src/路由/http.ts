import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { readdirSync, renameSync } from "node:fs";
import fn创建日志实例 from "../工具/日志";
import { HTTP转发目录 } from "../启动前检测";
import { fn排序字符串列表 } from "../工具/文件排序";
import { fn可创建 } from "../工具/文件名检测";

const log = fn创建日志实例("路由/http.ts");

const app = new Hono();
let 信息 = "";

const 配置集合 = new Set<string>();
const fn获取配置列表 = () => {
  配置集合.clear();
  let 目录列表: string[] = [];
  for (const e of readdirSync(HTTP转发目录, { withFileTypes: true })) {
    if (e.isFile() && (e.name.endsWith(".conf.no") || e.name.endsWith(".conf"))) {
      目录列表.push(e.name);
      配置集合.add(e.name);
    }
  }
  return fn排序字符串列表(目录列表);
};

// 获取列表
app.get("/file_list", (c) => {
  log.info("获取 http 配置文件列表");
  return c.json(fn获取配置列表());
});

// 获取文件内容
app.get("/file/:文件名", async (c) => {
  const 文件名称 = c.req.param("文件名");
  log.info(`获取 http 配置文件【${文件名称 || ""}】内容`);

  if (!配置集合.has(文件名称)) {
    信息 = `配置【${文件名称}】不存在或重新获取配置列表刷新状态。`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  const 文件路径 = `${HTTP转发目录}/${文件名称}`;
  const 本地文件 = Bun.file(文件路径);
  const 本地文件检测结果 = await 本地文件.exists();
  if (!本地文件检测结果) {
    信息 = `文件【${文件路径}】不存在`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  return c.text(await 本地文件.text());
});

// 写入文件
app.put("/file/:文件名", async (c) => {
  const 文件名称 = c.req.param("文件名");
  log.info(`写入 http 配置【${文件名称}】`);
  const 文件内容 = await c.req.text();

  if (!fn可创建(HTTP转发目录, 文件名称)) {
    信息 = `配置名称【${文件名称}】不合规！`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  if (!文件名称.endsWith(".conf.no") && !文件名称.endsWith(".conf")) {
    信息 = "后缀错误，只允许创建后缀为 .conf 或 .conf.no 的文件";
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  const 文件路径 = `${HTTP转发目录}/${文件名称}`;

  try {
    await Bun.write(文件路径, 文件内容);
    信息 = `文件【${文件名称}】写入成功`;
    log.debug(信息);
    fn获取配置列表();
    return c.text(信息);
  } catch (e) {
    信息 = `文件【${文件路径}】写入失败：${e}`;
    log.warn(信息);
    throw new HTTPException(500, { message: 信息 });
  }
});

// 删除文件
app.delete("/file/:文件名", async (c) => {
  const 文件名称 = c.req.param("文件名");
  log.info(`删除 http 配置【${文件名称}】`);

  if (!配置集合.has(文件名称)) {
    信息 = `配置【${文件名称}】不存在或重新获取配置列表刷新状态。`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  const 文件路径 = `${HTTP转发目录}/${文件名称}`;
  const 本地文件 = Bun.file(文件路径);

  try {
    await 本地文件.delete();
    信息 = `文件【${文件名称}】删除成功`;
    log.debug(信息);
    fn获取配置列表();
    return c.text(信息);
  } catch (e) {
    信息 = `文件【${文件路径}】删除失败：${e}`;
    log.warn(信息);
    throw new HTTPException(500, { message: 信息 });
  }
});

// 重命名
app.patch("/file/:文件名/:新文件名", (c) => {
  const 文件名称 = c.req.param("文件名");
  const 新文件名 = c.req.param("新文件名");
  log.info(`重命名 http 配置文件【${文件名称}】=>【${新文件名}】`);

  if (!配置集合.has(文件名称)) {
    信息 = `配置【${文件名称}】不存在或重新获取配置列表刷新状态。`;
    log.warn(信息);
    throw new HTTPException(404, { message: 信息 });
  }

  if (!fn可创建(HTTP转发目录, 文件名称)) {
    信息 = `新文件名【${新文件名}】不合规！`;
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  if (!新文件名.endsWith(".conf.no") && !新文件名.endsWith(".conf")) {
    信息 = "后缀错误，新文件名中后缀只能是 .conf 或 .conf.no";
    log.warn(信息);
    throw new HTTPException(400, { message: 信息 });
  }

  const 文件路径 = `${HTTP转发目录}/${文件名称}`;
  const 新文件路径 = `${HTTP转发目录}/${新文件名}`;

  try {
    renameSync(文件路径, 新文件路径);
    信息 = `文件【${文件名称}】重命名成功：【${新文件名}】`;
    log.debug(信息);
    fn获取配置列表();
    return c.text(信息);
  } catch (e) {
    信息 = `文件【${文件名称}】重命名失败：${e}`;
    log.warn(信息);
    throw new HTTPException(500, { message: 信息 });
  }
});

export default app;
