import { $ } from "bun";
import { existsSync } from "node:fs";
import { t_Nginx状态, t_返回 } from "@公共代码/类型";
import { const_配置 } from "../启动前检测";
import fn创建日志实例 from "./日志";

const log = fn创建日志实例("工具/Nginx.ts");

export let Nginx_PID: null | number = null;

const fn获取PID路径 = async (配置文件路径 = const_配置.文件路径.主配置) => {
  try {
    const 配置 = await Bun.file(配置文件路径).text();
    // 正则说明：
    // ^\s*          行首空白
    // (?!#)         负向先行断言：本行开头不能是 #，排除注释行
    // pid\s+        pid关键字 + 空白
    // ([^;#]+?)     捕获路径：遇到 ; 或 # 停止
    // \s*;          分号，允许分号前空格
    // [^\n]*        分号后面所有行尾内容（注释）丢弃
    const 匹配 = 配置.match(/^\s*(?!#)pid\s+([^;#]+?)\s*;[^\n]*/m);
    if (匹配) return 匹配[1].trim();
  } catch (e) {
    return "";
  }
};

export const fnNginx_获取运行状态 = async (): Promise<t_Nginx状态> => {
  let PID文件内容: string;
  let 信息 = "";
  Nginx_PID = null;

  // 读取PID文件
  try {
    PID文件内容 = await Bun.file(const_配置.文件路径.Nginx进程PID).text();
  } catch (err) {
    信息 = `读取PID文件失败，原因：${(err as Error).message}`;
    log.trace(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  const pid = Number(PID文件内容.trim());
  // 校验PID数值合法性
  if (!Number.isInteger(pid) || pid <= 0) {
    信息 = `PID文件内容无效，解析得到非正整数：${PID文件内容.trim()}`;
    log.trace(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  // 探测进程存活
  if (!existsSync(`/proc/${pid}`)) {
    信息 = `PID(${pid})探测失败`;
    log.warn(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  // 全部校验通过
  Nginx_PID = pid;
  信息 = `进程 ${pid} 存在且可访问，服务正在运行`;
  log.trace(信息);
  return { 状态: true, pid, 信息: 信息 };
};

const fn等待停止 = async (): Promise<boolean> => {
  let 运行状态: boolean;
  for (let i = 0; i < 5; i++) {
    运行状态 = (await fnNginx_获取运行状态()).状态;
    if (!运行状态) return false;

    Bun.sleepSync(100);
  }
  运行状态 = (await fnNginx_获取运行状态()).状态;
  return 运行状态;
};

const fn等待启动 = async (): Promise<boolean> => {
  for (let i = 0; i < 50; i++) {
    if ((await fnNginx_获取运行状态()).状态) return true;
    await Bun.sleep(100);
  }
  return (await fnNginx_获取运行状态()).状态;
};

export const fnNginx_启动 = async (): Promise<t_Nginx状态> => {
  let 运行状态 = await fnNginx_获取运行状态();
  let 信息 = "";

  if (运行状态.状态) {
    信息 = "Nginx 已在运行，无需启动";
    log.debug(信息);
    return { 状态: true, pid: 运行状态.pid, 信息: 信息 };
  }

  const 配置文件中PID路径 = await fn获取PID路径();

  if (配置文件中PID路径 !== const_配置.文件路径.Nginx进程PID) {
    信息 = `配置文件错误，文件中必须包含 "pid ${const_配置.文件路径.Nginx进程PID};"，\n当前文件中路径："${配置文件中PID路径 || "无"}"`;
    log.debug(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  const 启动结果 = await $`nginx -c ${const_配置.文件路径.主配置}`.nothrow().quiet();

  if (启动结果.exitCode !== 0) {
    信息 = 启动结果.stderr.toString().trim() || "启动失败";
    log.debug(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  if (!(await fn等待启动())) {
    信息 = "Nginx 启动后未就绪";
    log.debug(信息);
    return { 状态: false, pid: null, 信息: 信息 };
  }

  信息 = "Nginx 已启动";
  log.debug(信息);
  return { 状态: true, pid: Nginx_PID, 信息: 信息 };
};

export const fnNginx_停止 = async (): Promise<t_返回<t_Nginx状态>> => {
  let 信息 = "";
  if (!(await fnNginx_获取运行状态()).状态) {
    信息 = "Nginx 本就未运行，无需停止";
    log.debug(信息);
    return { 状态: true, 内容: { 状态: false, pid: null, 信息: 信息 } };
  }

  const 停止结果 = await $`nginx -s stop`.nothrow().quiet();

  // if (停止结果.exitCode !== 0) {
  //   信息 = 停止结果.stderr.toString().trim() || "停止失败";
  //   log.debug(信息);
  //   return { 状态: false, pid: null, 信息: 信息 };
  // }

  const 等待停止 = await fn等待停止();
  if (等待停止) {
    信息 = "Nginx 未能停止";
    log.debug(信息);
    return { 状态: false, 信息: 信息 };
  }

  信息 = "Nginx 已停止";
  log.debug(信息);
  return { 状态: false, 信息: 信息 };
};
