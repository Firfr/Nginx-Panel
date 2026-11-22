import {
  existsSync,
  accessSync,
  constants,
  writeFileSync,
  statSync,
  mkdirSync,
  Stats,
} from "node:fs";
import path from "node:path";
import { t_返回 } from "@公共代码/类型";

const fn提取错误消息 = (错误: unknown): string =>
  错误 instanceof Error ? 错误.message : String(错误);

const fn提取错误码 = (错误: unknown): string =>
  错误 && typeof 错误 === "object" && "code" in 错误
    ? String((错误 as NodeJS.ErrnoException).code)
    : "";

const fn确保目录存在 = (作用: string, 路径: string): string | null => {
  try {
    mkdirSync(路径, { recursive: true, mode: 0o755 });
    return null;
  } catch (错误) {
    const 代码 = fn提取错误码(错误);
    if (代码 === "EEXIST" || 代码 === "ENOTDIR") {
      return `❌ ${作用} 不是目录：${路径}`;
    }
    return `❌ ${作用} ${路径} 创建目录失败: ${fn提取错误消息(错误)}`;
  }
};

const fn校验目录存在 = (作用: string, 路径: string): string | null => {
  let 目录状态: Stats;
  try {
    目录状态 = statSync(路径);
  } catch (错误) {
    const 代码 = fn提取错误码(错误);
    return 代码 === "ENOENT"
      ? `❌ ${作用} 不存在：${路径}`
      : `❌ ${作用} 无法访问：${fn提取错误消息(错误)}`;
  }

  return 目录状态.isDirectory() ? null : `❌ ${作用} 不是目录：${路径}`;
};

const fn确保文件存在 = (作用: string, 路径: string, 默认内容: string = ""): string | null => {
  try {
    const 父目录 = path.dirname(路径);
    if (父目录 && !existsSync(父目录)) {
      mkdirSync(父目录, { recursive: true, mode: 0o755 });
    }

    writeFileSync(路径, 默认内容, { flag: "wx", mode: 0o644 });
    return null;
  } catch (错误) {
    const 代码 = fn提取错误码(错误);

    if (代码 === "EEXIST") {
      return null;
    }
    if (代码 === "EISDIR") {
      return `❌ ${作用} 是目录而非文件：${路径}`;
    }
    return `❌ ${作用} ${路径} 创建文件失败: ${fn提取错误消息(错误)}`;
  }
};

const fn校验文件存在 = (作用: string, 路径: string): string | null => {
  let 文件状态: Stats;
  try {
    文件状态 = statSync(路径);
  } catch (错误) {
    const 代码 = fn提取错误码(错误);
    return 代码 === "ENOENT"
      ? `❌ ${作用} 不存在：${路径}`
      : `❌ ${作用} 无法访问：${fn提取错误消息(错误)}`;
  }

  return 文件状态.isFile() ? null : `❌ ${作用} 不是文件：${路径}`;
};

export const fn目录权限检测 = (
  作用: string,
  路径: string,
  自动创建: boolean = false,
): t_返回<string> => {
  if (!path.isAbsolute(路径)) {
    return { 状态: false, 信息: `❌ ${作用} 必须是绝对路径：${路径}` };
  }

  const 存在性错误 = 自动创建 ? fn确保目录存在(作用, 路径) : fn校验目录存在(作用, 路径);

  if (存在性错误) {
    return { 状态: false, 信息: 存在性错误 };
  }

  try {
    accessSync(路径, constants.R_OK | constants.W_OK | constants.X_OK);
  } catch (错误) {
    const 代码 = fn提取错误码(错误);
    return {
      状态: false,
      信息: `❌ ${作用} 权限不足 (需要可读写可进入): ${路径} (${代码 || fn提取错误消息(错误)})`,
    };
  }

  return { 状态: true, 内容: `✅ ${作用} ${路径} 存在且权限无误` };
};

export const fn文件权限检测 = (
  作用: string,
  路径: string,
  自动创建: boolean = false,
  默认内容: string = "",
): t_返回<string> => {
  if (!path.isAbsolute(路径)) {
    return { 状态: false, 信息: ` ${作用} 必须是绝对路径：${路径}` };
  }

  const 存在性错误 = 自动创建 ? fn确保文件存在(作用, 路径, 默认内容) : fn校验文件存在(作用, 路径);

  if (存在性错误) {
    return { 状态: false, 信息: 存在性错误 };
  }

  try {
    accessSync(路径, constants.R_OK | constants.W_OK);
  } catch (错误) {
    const 代码 = fn提取错误码(错误);
    return {
      状态: false,
      信息: `❌ ${作用} 权限不足（需要可读写）：${路径} (${代码 || fn提取错误消息(错误)})`,
    };
  }

  return { 状态: true, 内容: `✅ ${作用} ${路径} 存在且权限无误` };
};
