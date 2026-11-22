export type t_菜单名称 = "账号" | "配置" | "conf.d" | "stream" | "证书" | "基本认证" | "静态资源";

export interface t_菜单 {
  名称: t_菜单名称;
  路径: string;
  描述: string;
}

export type t_文件状态 = "启用" | "禁用";

export type t_无参数操作 = "刷新" | "格式化" | "保存" | "默认值" | "删除";

type t_操作方式 =
  | "整体"
  | "删除"
  | "创建"
  | "重命名"
  | "查看"
  | "编辑"
  | "格式化"
  | "保存"
  | "刷新"
  | "默认值"
  | "启用";
export type t_操作按钮状态 = {
  [K in t_操作方式]: {
    显示: boolean;
    禁用: boolean;
  };
};
