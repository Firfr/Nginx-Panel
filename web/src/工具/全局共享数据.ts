import { computed, reactive, ref } from "vue";
import type { t_菜单, t_菜单名称 } from "../类型";
import { fn获取菜单文件列表 } from "./其他工具";

export const const_菜单列表: t_菜单[] = [
  { 名称: "配置", 路径: "nginx", 描述: "" },
  { 名称: "conf.d", 路径: "http", 描述: "" },
  { 名称: "stream", 路径: "stream", 描述: "" },
  { 名称: "证书", 路径: "ssl", 描述: "" },
  { 名称: "基本认证", 路径: "htpasswd", 描述: "" },
  { 名称: "静态资源", 路径: "static", 描述: "仅可查看目录，不可操作" },
];
export const map_菜单列表 = new Map(const_菜单列表.map((item) => [item.名称, item]));
export const ref_选中菜单 = ref<t_菜单 | null>(null);

export const rea_菜单内容数据 = reactive(
  new Map<t_菜单名称, string[]>([["配置", ["nginx.conf", "mime.types"]]]),
);

export const cmp_当前文件列表 = computed<string[]>(() => {
  if (!ref_选中菜单.value) return [];

  if (!rea_菜单内容数据.has(ref_选中菜单.value.名称)) {
    fn获取菜单文件列表(ref_选中菜单.value);
    return [];
  }

  return rea_菜单内容数据.get(ref_选中菜单.value.名称) as string[];
});

export const cmp_当前文件列表_无后缀 = computed<Set<string>>(() => {
  const 返回值 = new Set<string>();
  for (let 索引 = 0; 索引 < cmp_当前文件列表.value.length; 索引++) {
    const 文件名 = cmp_当前文件列表.value[索引];
    返回值.add(文件名.replace(/\.(conf\.no|conf|txt)$/, ""));
  }
  return 返回值;
});

export const ref_选中文件 = ref<string>("");
