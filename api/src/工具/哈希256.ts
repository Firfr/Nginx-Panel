export const fn计算哈希256 = (输入文本: string): string => {
  const 哈希器 = new Bun.CryptoHasher("sha256");
  哈希器.update(输入文本);
  return 哈希器.digest("hex");
};
