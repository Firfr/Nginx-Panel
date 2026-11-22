import { Hono } from "hono";
import fn创建日志实例 from "../工具/日志";
import { HTTPException } from "hono/http-exception";
import nginx from "./api/nginx";
import http from "./api/http";
import stream from "./api/stream";
import 证书 from "./api/ssl";
import htpasswd from "./api/htpasswd";
import 静态资源 from "./api/static";
import 用户 from "./api/user/入口";
import { const_配置 } from "../启动前检测";

const log = fn创建日志实例("路由/api.ts");

const Router = new Hono();

Router.post("/formatter", async (c) => {
  log.info("格式化配置文件");
  const 待格式化内容 = await c.req.text();
  let 信息 = "";

  try {
    const 格式化进程 = Bun.spawn({
      cmd: ["ncf", "format", "-i", "-", "-n", "2", "-c", "space"],
      stdin: new Response(待格式化内容).body,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 5000,
    });

    const 退出码 = await 格式化进程.exited;

    if (退出码 !== 0) {
      const 软件错误信息 = await new Response(格式化进程.stderr).text();
      // 软件自身报错，直接抛出包含具体信息的普通 Error
      throw new Error(软件错误信息.trim());
    }

    const 格式化后内容 = await new Response(格式化进程.stdout).text();
    return c.text(格式化后内容);
  } catch (err) {
    if (err instanceof Error && "code" in err) {
      const 信息 = `Bun执行环境错误: ${err.message}`;
      log.error(信息, err);
      throw new HTTPException(500, { message: 信息 });
    }

    const 软件错误信息 = err instanceof Error ? err.message : String(err);
    log.warn(`格式化软件报错: ${软件错误信息}`);
    throw new HTTPException(422, { message: 软件错误信息 });
  }
});

Router.get("/config", (c) => {
  return c.json(const_配置.配置);
});

Router.route("/nginx", nginx);
Router.route("/http", http);
Router.route("/stream", stream);
Router.route("/ssl", 证书);
Router.route("/htpasswd", htpasswd);
Router.route("/static", 静态资源);
Router.route("/user", 用户);

export default Router;
