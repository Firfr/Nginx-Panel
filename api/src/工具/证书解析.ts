import { t_证书信息 } from "@公共代码/类型";
import { createVerify, createSign, X509Certificate } from "node:crypto";

const fn提取PEM证书块 = (证书链: string): string[] => {
  return 证书链?.match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? [];
};

const fn是叶子证书 = (PEM证书: string): boolean => {
  try {
    const 证书 = new X509Certificate(PEM证书);
    // 自签证书：subject 和 issuer 相同
    if (证书.subject === 证书.issuer) return true;
    // 有 CA:TRUE 的一定不是叶子
    if (/basicConstraints.*CA:TRUE/i.test(证书.toString())) return false;
    return true;
  } catch {
    return false;
  }
};

const fn查找叶子证书 = (证书链: string): string | null => {
  const 证书列表 = fn提取PEM证书块(证书链);
  for (const 单张 of 证书列表) {
    if (fn是叶子证书(单张)) return 单张;
  }
  // 兜底：取第一张
  return 证书列表.length > 0 ? 证书列表[0] : null;
};

const fn格式化日期 = (日期: Date | string | number | undefined): string => {
  if (!日期) return "-";
  const 日期对象 = 日期 instanceof Date ? 日期 : new Date(日期);
  if (isNaN(日期对象.getTime())) return "-";

  // 按北京时间（UTC+8）取各字段
  const 格式化器 = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const 部件 = Object.fromEntries(格式化器.formatToParts(日期对象).map((p) => [p.type, p.value]));

  return `${部件.year}-${部件.month}-${部件.day} ${部件.hour}:${部件.minute}:${部件.second}`;
};

const fn距到期天数 = (到期时间: Date | string): number | null => {
  const 到期 = 到期时间 instanceof Date ? 到期时间 : new Date(到期时间);
  if (isNaN(到期.getTime())) return null; // 无法解析

  const 毫秒差 = 到期.getTime() - Date.now();
  return Math.round((毫秒差 / 86400000) * 10) / 10;
};

const DN属性别名: Record<string, string> = {
  CN: "2.5.4.3",
  O: "2.5.4.10",
  OU: "2.5.4.11",
  C: "2.5.4.6",
  L: "2.5.4.7",
  ST: "2.5.4.8",
};
/** 从 DN 字符串里取某个属性值，如 O、CN */
const fn取DN值 = (dn: string, 属性: string): string | undefined => {
  if (!dn) return undefined;

  // Node 的 issuer / subject 每行一个属性；
  // 属性值里若含逗号，RFC 2253 会折行到下一行，需要并回上一个值。
  const 条目列表: string[] = [];
  for (const 原始行 of dn.split("\n")) {
    const 行 = 原始行.trim();
    if (!行) continue;

    if (行.includes("=")) 条目列表.push(行);
    else if (条目列表.length > 0) 条目列表[条目列表.length - 1] += `,${行}`;
  }

  const OID = DN属性别名[属性.toUpperCase()];
  const 属性名 = OID ? `${属性}|${OID}` : 属性;
  const 正则 = new RegExp(`^(?:${属性名})\\s*=\\s*(.*)$`, "i");

  for (const 条目 of 条目列表) {
    const 匹配 = 条目.match(正则);
    if (!匹配) continue;

    const 值 = 匹配[1].trim();
    // 跳过 OU= 这类空值，避免拿到空串
    if (值) return 值;
  }

  return undefined;
};

/** 从 subjectAltName 提取域名和 IP */
const fn提取SAN = (san: string): string[] => {
  const 域名: string[] = [];
  const IP: string[] = [];
  // DNS:xxx 或 IP Address:xxx，分隔符可能是逗号或空格
  const 匹配 = san.match(/(?:DNS|IP Address):([^\s,]+)/g);
  if (匹配) {
    for (const 项 of 匹配) {
      const [类型, 值] = 项.split(":");
      if (类型?.trim() === "DNS") 域名.push(值);
      else if (类型?.trim() === "IP Address") IP.push(值);
    }
  }
  return [...域名, ...IP];
};

/**
 * 获取证书信息
 */
export const fn证书信息 = (证书链: string): t_证书信息 => {
  let 返回值: t_证书信息 = {
    文件名称: "",
    签发机构: "-",
    生效时间: "-",
    到期时间: "-",
    到期天数: null,
    域名: ["-"],
  };

  const 叶子证书Pem = fn查找叶子证书(证书链);
  if (!叶子证书Pem) return 返回值;

  try {
    const 证书 = new X509Certificate(叶子证书Pem);

    // 签发机构
    const 签发者 = 证书.issuer;

    返回值.签发机构 = fn取DN值(签发者, "O") || fn取DN值(签发者, "CN") || "-";

    返回值.生效时间 = fn格式化日期(证书.validFrom);
    返回值.到期时间 = fn格式化日期(证书.validTo);
    返回值.到期天数 = fn距到期天数(返回值.到期时间);

    // 域名 / IP：优先 SAN，没有 SAN 时回退到 Subject CN
    if (证书.subjectAltName) {
      返回值.域名 = fn提取SAN(证书.subjectAltName);
    }
    if (返回值.域名[0] === "-") {
      // 老证书可能只有 CN
      const CN值 = fn取DN值(证书.subject, "CN");
      if (CN值) 返回值.域名 = [CN值];
    }
  } catch {
    // 解析失败保持默认值
  }

  return 返回值;
};

/**
 * 校验证书和私钥是否匹配
 *
 * 原理：用私钥签名一段数据，再用证书里的公钥验签。
 * 如果私钥和证书不是一对，验签会失败。
 */
export const fn证书校验 = (证书链: string, 私钥: string): boolean => {
  try {
    const 叶子证书Pem = fn查找叶子证书(证书链);
    if (!叶子证书Pem) return false;

    const 证书 = new X509Certificate(叶子证书Pem);

    const 测试数据 = Buffer.from("cert-key-match-test");

    // 用私钥签名
    const 签名 = createSign("SHA256").update(测试数据).sign(私钥);

    // 用证书公钥验签
    return createVerify("SHA256").update(测试数据).verify(证书.publicKey, 签名);
  } catch {
    return false;
  }
};
