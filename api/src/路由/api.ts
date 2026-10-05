import { Hono } from "hono";
import fn创建日志实例 from "../工具/日志";
import { HTTPException } from "hono/http-exception";
import nginx from "./nginx";
import http from "./http";
import stream from "./stream";
import 证书 from "./ssl";
import htpasswd from "./htpasswd";
import 静态资源 from "./static";

const log = fn创建日志实例("路由/api.ts");

const Router = new Hono();

let 信息 = "";
Router.post("/formatter", async (c) => {
  log.info("格式化配置文件");
  const 文件内容 = await c.req.text();

  const 临时文件路径 = `/tmp/http-${crypto.randomUUID()}.conf`;

  try {
    await Bun.write(临时文件路径, 文件内容);

    const 格式化 = Bun.spawn(["ncf", "-s", "2", 临时文件路径], {
      stderr: "pipe", // 捕获错误输出
      stdout: "pipe", // 捕获标准输出
      timeout: 5000, // 5秒超时，防止卡死
    });

    const 退出码 = await 格式化.exited;

    if (退出码 !== 0) {
      const 错误信息 = await new Response(格式化.stderr).text();
      信息 = `格式化失败 (退出代码 ${退出码}): ${错误信息}`;
      log.warn(信息);
      throw new HTTPException(500, { message: 信息 });
    }

    const 格式化后内容 = await Bun.file(临时文件路径).text();

    return c.text(格式化后内容);
  } catch (err) {
    if (err instanceof Error) {
      信息 = `格式化出错: ${err.message}`;
      log.warn(信息);
      throw new HTTPException(500, { message: 信息 });
    }

    信息 = `格式化出错: ${String(err)}`;
    log.warn(信息);
    throw new HTTPException(500, { message: 信息 });
  } finally {
    // 统一清理：无论成功失败都尝试删除临时文件
    try {
      await Bun.file(临时文件路径).delete();
    } catch (_) {
      // 文件不存在或删除失败，忽略
    }
  }
});

Router.get("/panel", (c) => {
  const 面板信息: {
    名称?: string;
    完整地址?: string;
    路径?: string;
  } = {};

  if (process.env.PANEL_NAME) {
    面板信息.名称 = process.env.PANEL_NAME;
  }

  if (process.env.PANEL_URL) {
    const url = process.env.PANEL_URL.trim();

    // 判断是否包含协议（http:// 或 https://）或 IP/域名
    // 含协议 或 形如 ip/域名开头（非纯数字端口）的视为完整地址
    const isFullAddress = /^https?:\/\//i.test(url) || /^[\w.-]+\.[a-z]{2,}/i.test(url);

    if (isFullAddress) {
      面板信息.完整地址 = url;
    } else {
      // 端口及后面部分，如 1234/panel 或 1234
      面板信息.路径 = url;
    }
  }

  return c.json(面板信息);
});

Router.get("/edit", (c) => {
  const 面板信息: {
    名称?: string;
    完整地址?: string;
    路径?: string;
  } = {};

  if (process.env.EDIT_NAME) {
    面板信息.名称 = process.env.EDIT_NAME;
  }

  if (process.env.EDIT_URL) {
    const url = process.env.EDIT_URL.trim();

    // 判断是否包含协议（http:// 或 https://）或 IP/域名
    // 含协议 或 形如 ip/域名开头（非纯数字端口）的视为完整地址
    const isFullAddress = /^https?:\/\//i.test(url) || /^[\w.-]+\.[a-z]{2,}/i.test(url);

    if (isFullAddress) {
      面板信息.完整地址 = url;
    } else {
      // 端口及后面部分，如 1234/panel 或 1234
      面板信息.路径 = url;
    }
  }

  return c.json(面板信息);
});

Router.route("/nginx", nginx);
Router.route("/http", http);
Router.route("/stream", stream);
Router.route("/ssl", 证书);
Router.route("/htpasswd", htpasswd);
Router.route("/static", 静态资源);

export default Router;
