import { Hono } from "hono";
import fn创建日志实例 from "../../../工具/日志";
import { fn账号信息 } from "../../../数据/账号";
import { t_账号总览信息 } from "@公共代码/类型";

const log = fn创建日志实例("路由/api/user/list.ts");

const app = new Hono();

app.get("/", (c) => {
  const 用户列表 = fn账号信息.用户列表();
  const 返回值: t_账号总览信息[] = [];

  for (let 索引 = 0; 索引 < 用户列表.length; 索引++) {
    const 用户 = 用户列表[索引];
    返回值.push({
      启用: 用户.启用,
      用户名: 用户.用户名,
      备注: 用户.备注,
      登录设备: 用户.登录设备,
      登录天数: 用户.登录天数,
      创建时间: 用户.创建时间戳,
      TOTP: "TOTP" in 用户,
    });
  }

  return c.json(返回值);
});

export default app;
