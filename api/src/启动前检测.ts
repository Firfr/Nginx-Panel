import { $ } from "bun";
import fn创建日志实例 from "./工具/日志";
import { 默认主配置, 默认MIME类型 } from "./工具/默认配置";
import { fn文件权限检测, fn目录权限检测 } from "./工具/文件检测";
import { fn账号列表校验 } from "@公共代码/账号校验";
import { t_账号信息, t_配置 } from "@公共代码/类型";

const 配置: t_配置 = { 端口: 5193 };

const 环境变量_端口 = Number(Bun.env.PORT);
if (Number.isInteger(环境变量_端口) && 环境变量_端口 > 0) {
  配置.端口 = 环境变量_端口;
}

if (process.env.PANEL_NAME) {
  if (!("面板" in 配置)) 配置.面板 = {};
  配置.面板!.名称 = process.env.PANEL_NAME;
}
if (process.env.PANEL_URL) {
  const url = process.env.PANEL_URL.trim();
  if (!("面板" in 配置)) 配置.面板 = {};

  // 判断是否包含协议（http:// 或 https://）或 IP/域名
  // 含协议 或 形如 ip/域名开头（非纯数字端口）的视为完整地址
  const isFullAddress = /^https?:\/\//i.test(url) || /^[\w.-]+\.[a-z]{2,}/i.test(url);

  if (isFullAddress) {
    配置.面板!.完整地址 = url;
  } else {
    // 端口及后面部分，如 1234/panel 或 1234
    配置.面板!.路径 = url;
  }
}

if (process.env.EDIT_NAME) {
  if (!("编辑" in 配置)) 配置.编辑 = {};
  配置.编辑!.名称 = process.env.EDIT_NAME;
}

if (process.env.EDIT_URL) {
  const url = process.env.EDIT_URL.trim();
  if (!("编辑" in 配置)) 配置.编辑 = {};

  // 判断是否包含协议（http:// 或 https://）或 IP/域名
  // 含协议 或 形如 ip/域名开头（非纯数字端口）的视为完整地址
  const isFullAddress = /^https?:\/\//i.test(url) || /^[\w.-]+\.[a-z]{2,}/i.test(url);

  if (isFullAddress) {
    配置.编辑!.完整地址 = url;
  } else {
    // 端口及后面部分，如 1234/panel 或 1234
    配置.编辑!.路径 = url;
  }
}

const NginxPID文件目录 = "/run";
export const const_配置 = Object.freeze({
  目录路径: Object.freeze({
    数据: "/data",
    HTTP转发: "/data/conf.d",
    非HTTP转发: "/data/stream",
    静态资源: "/data/static",
    证书: "/data/ssl",
    HTTP认证: "/data/htpasswd",
  }),
  文件路径: Object.freeze({
    Nginx进程PID: `${NginxPID文件目录}/nginx.pid`,
    主配置: "/data/nginx.conf",
    默认MIME类型: "/data/mime.types",
    账号信息: "/data/账号信息.json",
    账号凭据: "/data/账号凭据.json",
    格式化软件: "/usr/local/bin/ncf",
  }),
  配置: Object.freeze({ ...配置 }),
});

const log = fn创建日志实例("启动前检测.ts");

log.info(`设置 PID 目录权限 【${NginxPID文件目录}】`);
await $`chmod -R 777 ${NginxPID文件目录}`;

for (const 目录名称 in const_配置.目录路径) {
  if (!Object.hasOwn(const_配置.目录路径, 目录名称)) continue;
  // prettier-ignore
  const 路径 = const_配置.目录路径[目录名称 as keyof typeof const_配置.目录路径];
  log.info(`检测并自动创建${目录名称}目录 ${路径}`);
  const 目录检测结果 = fn目录权限检测(`${路径}目录`, 路径, true);
  if (!目录检测结果.状态) {
    log.fatal(目录检测结果.信息);
    process.exit(1);
  }
}

for (const 文件名称 in const_配置.文件路径) {
  if (!Object.hasOwn(const_配置.文件路径, 文件名称)) continue;
  // prettier-ignore
  const 路径 = const_配置.文件路径[文件名称 as keyof typeof const_配置.文件路径];
  let 文件检测结果;
  switch (文件名称) {
    case "Nginx进程PID":
      continue;
    case "主配置":
      文件检测结果 = fn文件权限检测(`${路径}文件`, 路径, true, 默认主配置);
      break;
    case "默认MIME类型":
      文件检测结果 = fn文件权限检测(`${路径}文件`, 路径, true, 默认MIME类型);
      break;
    case "账号信息":
      文件检测结果 = fn文件权限检测(`${路径}文件`, 路径, true, "[]");
      break;
    case "账号凭据":
      文件检测结果 = fn文件权限检测(`${路径}文件`, 路径, true, "{}");
      break;

    default:
      文件检测结果 = fn文件权限检测(`${路径}文件`, 路径);
      break;
  }
  if (!文件检测结果.状态) {
    log.fatal(文件检测结果.信息);
    process.exit(1);
  }
}

log.info(`校验账号信息`);
let 本地账号内容: t_账号信息[];
try {
  本地账号内容 = await Bun.file(const_配置.文件路径.账号信息).json();
} catch (e) {
  log.fatal(`❌ 本地账号信息文件读取或解析失败：不是合法的 JSON 数组`, e);
  process.exit(1);
}
if (!Array.isArray(本地账号内容)) {
  log.fatal(`❌ 本地账号信息文件不是 JSON 数组，实际类型为：${typeof 本地账号内容}`);
  process.exit(1);
}
const 账号信息检验结果 = fn账号列表校验(本地账号内容);
if (!账号信息检验结果.状态) {
  log.fatal(`❌ 本地账号信息校验出错`, 账号信息检验结果.信息);
  process.exit(1);
}

log.info(`校验账号凭据`);
let 本地凭据内容: { [k: string]: string[] };
try {
  本地凭据内容 = await Bun.file(const_配置.文件路径.账号凭据).json();
} catch (e) {
  log.warn(`⚠️ 本地账号凭据文件读取或解析失败：初始为空值`);
  本地凭据内容 = {};
}
if (Object.prototype.toString.call(本地凭据内容) !== "[object Object]") {
  本地凭据内容 = {};
}

const 账号凭据 = new Map<string, string[]>();
for (let 索引 = 0; 索引 < 本地账号内容.length; 索引++) {
  const 账号 = 本地账号内容[索引];
  if (!Array.isArray(本地凭据内容[账号.用户名])) {
    账号凭据.set(
      账号.用户名,
      Array.from({ length: 账号.登录设备 }, () => ""),
    );
    continue;
  }

  const 当前用户凭据: string[] = [];

  for (let 下标 = 0; 下标 < 账号.登录设备; 下标++) {
    const 元素 = 本地凭据内容[账号.用户名][下标];
    当前用户凭据.push(typeof 元素 === "string" ? 元素 : "");
  }

  账号凭据.set(账号.用户名, 当前用户凭据);
}

export const 初始数据 = {
  用户信息映射: new Map<string, t_账号信息>(
    (本地账号内容 as t_账号信息[]).map((账号) => [账号.用户名, 账号]),
  ),
  账号凭据: 账号凭据,
};

log.info(`检测格式化软件 ncf (soulteary/nginx-formatter)`);
try {
  await $`chmod +x ${const_配置.文件路径.格式化软件}`;
} catch (e) {
  const err = e as { stderr?: Buffer; message?: string };
  log.warn(`❌ ncf 命令权限设置失败: ${err.stderr?.toString() || err.message}`);
}
try {
  await $`ncf -h`.quiet();
  log.info(`  ncf 命令可用`);
} catch (e) {
  const err = e as { stderr?: Buffer; message?: string };
  log.fatal(`❌ ncf 命令不可用: ${err.stderr?.toString() || err.message}`);
  process.exit(1);
}

log.info("启动 Nginx");
try {
  await Bun.file(const_配置.文件路径.Nginx进程PID).text();
  log.info("  Nginx 已启动");
} catch (e) {
  const res = await $`nginx -c ${const_配置.文件路径.主配置}`.nothrow().quiet();
  if (res.exitCode !== 0) {
    log.warn("启动失败：", res.stderr.toString().trim());
  } else {
    // log.info("Nginx 启动成功");
  }
}
