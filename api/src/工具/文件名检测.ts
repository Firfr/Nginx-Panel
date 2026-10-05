import path from "node:path";

/**
 * 校验名字是否可以安全地在指定根目录下创建。
 *
 * 规则：
 * 1. 必须是字符串，且长度在 1 到 255 字节（UTF-8）之间；
 * 2. 不能包含任何空白字符（空格、制表符、换行、全角空格等）；
 * 3. 不能包含空字节（\0）；
 * 4. 拼接并解析后的最终路径，其父目录必须正好是指定的根目录。
 *
 * 第 4 条用于防止路径穿越（如 `..`、绝对路径、多层路径等），
 * 即使名字里含有路径分隔符或特殊字符，只要最终父目录不在根目录下，一律拒绝。
 *
 * @param 根目录 允许创建子目录的根目录（相对或绝对路径均可，内部会 resolve）
 * @param 名字   待校验的名字（通常是用户输入，会被当作根目录下的一级子目录名）
 * @returns      合法返回 true，否则返回 false
 *
 * @example
 * 可创建("/data/certs", "example.com")   // true
 * 可创建("/data/certs", "a b")           // false，含空格
 * 可创建("/data/certs", "../etc")        // false，穿越
 * 可创建("/data/certs", "a/b")           // false，多层
 */
export const fn可创建 = (根目录: string, 名字: string): boolean => {
  if (typeof 名字 !== "string" || 名字.length === 0) return false;
  if (Buffer.byteLength(名字, "utf8") > 255) return false;

  // 含任意空白字符直接拒绝（空格、\t、\n、全角空格等）
  if (/\s/.test(名字)) return false;

  // 含空字节直接拒绝
  if (名字.includes("\0")) return false;

  // 最终父目录必须正好是根目录
  const 根 = path.resolve(根目录);
  const 完整路径 = path.resolve(根, 名字);
  if (path.dirname(完整路径) !== 根) return false;

  return true;
};
