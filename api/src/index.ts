import "./启动前检测";

import { $, serve, Server } from "bun";
import { Hono } from "hono";
import { serveStatic } from "@hono/bun";
import 中间件_响应格式化 from "./中间件/响应内容格式化";
import 中间件_错误处理 from "./中间件/统一错误处理";
import 路由_api from "./路由/api";
import 路由_auth from "./路由/auth";
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
    中间件_跳过格式化: boolean;
  }
}

app.route("/api", 路由_api);
app.route("/auth", 路由_auth);

// 兜底响应：处理所有未匹配的路由
app.notFound((c) => {
  const 信息 = `接口不存在或路径错误：${c.req.method} ${c.req.path}`;
  log.warn(信息);
  return c.json({ 状态: false, 信息: 信息 }, 404);
});

const 端口 = Number(Bun.env.PORT) || 5193;
const 监听地址 = Bun.env.HOST;
console.log();

let 服务实例: Server<undefined> | null = null;

if (监听地址) {
  try {
    服务实例 = serve({ port: 端口, hostname: 监听地址, fetch: app.fetch });
    log.info(`服务启动成功，监听地址：${监听地址} ，端口：${端口}`);
  } catch (error) {
    log.fatal(`服务启动失败，监听地址：${监听地址} ，端口：${端口}`);
    log.fatal(error);
    process.exit(1);
  }
} else {
  try {
    服务实例 = serve({ port: 端口, hostname: "::", fetch: app.fetch });
    log.info(`服务启动成功，已开启 IPv4/IPv6 双栈监听，端口：${端口}`);
  } catch (error) {
    log.warn("IPv6 部分监听失败！尝试监听纯 IPv4 地址 0.0.0.0");
    try {
      服务实例 = serve({ port: 端口, hostname: "0.0.0.0", fetch: app.fetch });
      log.info(`服务启动成功，已开启纯 IPv4 监听，端口：${端口}`);
    } catch (error) {
      log.fatal(`服务启动失败，监听地址：0.0.0.0 ，端口：${端口}`);
      log.fatal(error);
      process.exit(1);
    }
  }
}

// 处理 容器 SIGTERM 和 SIGINT 信号
let 关闭提示 = true;
const fn停止运行 = async (信号: "SIGTERM" | "SIGINT") => {
  if (关闭提示) log.info(`收到 ${信号}，正在关闭服务...`);
  关闭提示 = false;

  $`nginx -s stop`.nothrow().quiet();

  try {
    if (服务实例) {
      // 最多等 3 秒，避免长连接把关闭流程挂住
      await Promise.race([
        服务实例.stop(), // 停止接受新连接，等待进行中请求完成
        new Promise((r) => setTimeout(r, 3000)),
      ]);
    }
  } catch (err) {
    log.error("关闭服务器时出错:", err);
  } finally {
    log.info("服务已关闭");
    process.exit(0);
  }
};
process.on("SIGTERM", () => fn停止运行("SIGTERM"));
process.on("SIGINT", () => fn停止运行("SIGINT"));
