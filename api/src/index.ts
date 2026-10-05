import "./启动前检测";

import { serve } from "bun";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import 中间件_响应格式化 from "./中间件/响应内容格式化";
import 中间件_错误处理 from "./中间件/统一错误处理";
import 路由_api from "./路由/api";
import fn创建日志实例 from "./工具/日志";

const log = fn创建日志实例("index.ts");

const app = new Hono();

// 静态文件服务
app.use(
  "/*",
  // 当前目录下的 web
  serveStatic({ root: `${import.meta.dir}/web` }),
);

app.onError(中间件_错误处理);

app.use(中间件_响应格式化);

declare module "hono" {
  interface ContextVariableMap {
    信息: any; // 也可以改成具体类型
  }
}

app.route("/api", 路由_api);

// 兜底响应：处理所有未匹配的路由
app.notFound((c) => {
  const 信息 = `接口不存在或路径错误：${c.req.method} ${c.req.path}`;
  log.warn(信息);
  return c.json({ 状态: false, 信息: 信息 }, 404);
});

const let_端口 = Number(Bun.env.PORT) || 1235;
const let_监听地址 = Bun.env.HOST;

if (let_监听地址) {
  try {
    serve({ port: let_端口, hostname: let_监听地址, fetch: app.fetch });
    log.info(`服务启动成功，监听地址：${let_监听地址} ，端口：${let_端口}`);
  } catch (error) {
    log.fatal(`服务启动失败，监听地址：${let_监听地址} ，端口：${let_端口}`);
    log.fatal(error);
    process.exit(1);
  }
} else {
  try {
    serve({ port: let_端口, hostname: "::", fetch: app.fetch });
    log.info(`服务启动成功，已开启 IPv4/IPv6 双栈监听，端口：${let_端口}`);
  } catch (error) {
    log.warn("IPv6 部分监听失败！尝试监听纯 IPv4 地址 0.0.0.0");
    try {
      serve({ port: let_端口, hostname: "0.0.0.0", fetch: app.fetch });
      log.info(`服务启动成功，已开启纯 IPv4 监听，端口：${let_端口}`);
    } catch (error) {
      log.fatal(`服务启动失败，监听地址：0.0.0.0 ，端口：${let_端口}`);
      log.fatal(error);
      process.exit(1);
    }
  }
}
