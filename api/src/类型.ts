export interface t_成功返回 {
  状态: true;
  信息?: string;
  内容: any;
}

// 定义失败类型（状态=false，没有 内容）
interface 失败返回 {
  状态: false;
  信息: string;
}

// 最终返回类型 = 成功 | 失败
export type t_返回 = t_成功返回 | 失败返回;

export interface t_工具返回信息 {
  状态: boolean;
  信息?: string;
}
