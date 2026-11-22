import { Hono } from "hono";
import { readdirSync } from "node:fs";
import fn创建日志实例 from "../../工具/日志";
import { const_配置 } from "../../启动前检测";
import { fn排序字符串列表 } from "../../工具/文件排序";

const log = fn创建日志实例("路由/static.ts");
const app = new Hono();

// 获取列表
app.get("/file_list", (c) => {
  log.info("获取静态资源目录列表");
  let 目录列表: string[] = [];
  for (const e of readdirSync(const_配置.目录路径.静态资源, {
    withFileTypes: true,
  })) {
    if (e.isDirectory()) {
      目录列表.push(e.name);
    }
  }
  return c.json(fn排序字符串列表(目录列表));
});

export default app;
