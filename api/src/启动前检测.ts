import { $ } from "bun";
import { mkdir } from "node:fs/promises";
import fn创建日志实例 from "./工具/日志";
import { 默认主配置, 默认MIME类型 } from "./工具/默认配置";

const log = fn创建日志实例("启动前检测.ts");

const NginxPID文件目录 = "/run";
log.info(`设置 PID 目录权限 【${NginxPID文件目录}】`);
export const NginxPID文件路径 = `${NginxPID文件目录}/nginx.pid`;
await $`chmod -R 777 ${NginxPID文件目录}`;

export const 主配置文件路径 = "/data/nginx.conf";
log.info(`检测 Nginx 主配置文件 【${主配置文件路径}】`);
const 本地配置文件 = Bun.file(主配置文件路径);
const 本地配置文件检测结果 = await 本地配置文件.exists();
if (!本地配置文件检测结果) {
  log.info("文件不存在，写入默认内容");
  await Bun.write(本地配置文件, 默认主配置);
}

export const 默认MIME类型文件路径 = "/data/mime.types";
log.info(`检测默认 MIME 类型文件 【${默认MIME类型文件路径}】`);
const 本地MIME类型文件 = Bun.file(默认MIME类型文件路径);
const 本地MIME类型文件检测结果 = await 本地MIME类型文件.exists();
if (!本地MIME类型文件检测结果) {
  log.info("文件不存在，写入默认内容");
  await Bun.write(默认MIME类型文件路径, 默认MIME类型);
}

export const HTTP转发目录 = "/data/conf.d";
log.info(`确保 HTTP 转发配置目录存在 【${HTTP转发目录}】`);
await mkdir(HTTP转发目录, { recursive: true });

export const 非HTTP转发目录 = "/data/stream";
log.info(`确保非 HTTP 转发配置目录存在 【${非HTTP转发目录}】`);
await mkdir(非HTTP转发目录, { recursive: true });

export const 静态资源目录 = "/data/static";
log.info(`确保"静态资源目录"存在 【${静态资源目录}】`);
await mkdir(静态资源目录, { recursive: true });

export const 证书目录 = "/data/ssl";
log.info(`确保"证书目录"存在 【${证书目录}】`);
await mkdir(证书目录, { recursive: true });

export const HTTP认证目录 = "/data/htpasswd";
log.info(`确保"HTTP认证目录"存在 【${HTTP认证目录}】`);
await mkdir(HTTP认证目录, { recursive: true });

log.info(`检测格式化软件 ncf (nginxconfigformattergo)`);
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
  await Bun.file(NginxPID文件路径).text();
  log.info("  Nginx 已启动");
} catch (e) {
  const res = await $`nginx -c ${主配置文件路径}`.nothrow().quiet();
  if (res.exitCode !== 0) {
    log.warn("启动失败：", res.stderr.toString().trim());
  } else {
    // log.info("Nginx 启动成功");
  }
}
