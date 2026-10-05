/**
 * 对配置文件名称列表进行排序。
 *
 * 排序规则：
 * 1. 数字优先，按数字从小到大排序；
 *    无数字的项排在有数字的项之后。
 * 2. 其余部分按字母排序：先按字母（忽略大小写）排序，
 *    同一字母时小写在前、大写在后。
 *
 * 支持的扩展名：`.conf` 和 `.conf.no`，排序时会先去掉它们再比较。
 *
 * @param 目录列表 待排序的字符串数组（通常是文件名列表）
 * @returns 排好序的新数组，不会修改原数组
 */
export function fn排序字符串列表(目录列表: string[]): string[] {
  type t_拆分结果 = { 数字: number; 其余: string };

  const 拆分部分 = (字符串: string): t_拆分结果 => {
    const 主体: string = 字符串.replace(/\.conf(\.no)?$/, "");
    const 匹配: RegExpMatchArray | null = 主体.match(/^(\d*)(.*)$/);
    if (!匹配) {
      return { 数字: -1, 其余: 主体 };
    }
    return {
      数字: 匹配[1] ? parseInt(匹配[1], 10) : -1, // 无数字的排在有数字的后面
      其余: 匹配[2] || "",
    };
  };

  const 中文Collator = new Intl.Collator("zh-CN", {
    sensitivity: "base",
  });

  const fn是否汉字 = (c: string): boolean => {
    return /[\u4e00-\u9fa5]/.test(c);
  };

  // 字母排序：a, A, b, B, c, C ...
  //    即先按字母（忽略大小写）排序，同字母时小写在前、大写在后
  const 比较字母 = (串一: string, 串二: string): number => {
    const 长度: number = Math.min(串一.length, 串二.length);
    for (let 位置: number = 0; 位置 < 长度; 位置++) {
      const 字符一: string = 串一[位置];
      const 字符二: string = 串二[位置];
      if (字符一 === 字符二) continue;

      const 甲是汉字 = fn是否汉字(字符一);
      const 乙是汉字 = fn是否汉字(字符二);

      // 两个都是中文汉字 → 使用拼音比较
      if (甲是汉字 && 乙是汉字) {
        return 中文Collator.compare(字符一, 字符二);
      }

      // 其中一个是汉字，另一个不是：汉字排在普通字母后面
      if (甲是汉字) return 1;
      if (乙是汉字) return -1;

      const 小写一: string = 字符一.toLowerCase();
      const 小写二: string = 字符二.toLowerCase();

      // 不同字母：按 a-z 顺序（忽略大小写）
      if (小写一 !== 小写二) {
        return 小写一 < 小写二 ? -1 : 1;
      }

      // 相同字母：小写在前，大写在后
      const 是大写一: boolean = 字符一 >= "A" && 字符一 <= "Z";
      return 是大写一 ? 1 : -1;
    }
    return 串一.length - 串二.length;
  };

  return [...目录列表].sort((甲: string, 乙: string): number => {
    const 部分甲: t_拆分结果 = 拆分部分(甲);
    const 部分乙: t_拆分结果 = 拆分部分(乙);

    // 数字优先，从小到大
    if (部分甲.数字 !== 部分乙.数字) {
      if (部分甲.数字 === -1) return 1;
      if (部分乙.数字 === -1) return -1;
      return 部分甲.数字 - 部分乙.数字;
    }

    return 比较字母(部分甲.其余, 部分乙.其余);
  });
}
