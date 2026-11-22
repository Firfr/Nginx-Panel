export const fn令牌名称 = (用户名: string): string => {
  const 用户标识 = (Bun.hash.crc32(用户名) >>> 0).toString(16).padStart(8, "0");
  return `FirFe-Nginx_Panel-${用户标识}`;
};
